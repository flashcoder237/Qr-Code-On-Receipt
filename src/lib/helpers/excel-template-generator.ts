// src/lib/helpers/excel-template-generator.ts
// Module de génération de modèles Excel pour import de données étudiantes

import ExcelJS from 'exceljs';
import {
  RELEVE_REQUIRED_COLUMNS,
  RELEVE_OPTIONAL_COLUMNS,
  ATTESTATION_REQUIRED_COLUMNS,
  ATTESTATION_OPTIONAL_COLUMNS,
  DIPLOMA_REQUIRED_COLUMNS,
  DIPLOMA_OPTIONAL_COLUMNS,
  FACULTY_REQUIRED_EN_COLUMNS,
  FACULTY_OPTIONAL_EN_COLUMNS,
  ColumnRequirement
} from '@/lib/validators/excel-columns';

// =====================================================
// TYPES ET INTERFACES
// =====================================================

export type TemplateType = 'releve' | 'attestation' | 'diploma';

export interface TemplateConfig {
  type: TemplateType;
  establishmentType?: string;
  includeInstructions?: boolean;  // Défaut: true
  includeExamples?: boolean;      // Défaut: false
  dynamicColumns?: {
    ecNames: string[];
    includeSessions?: boolean;
    sessionFormat?: string;       // Défaut: "S/"
  };
  academicYear?: string;
  configName?: string;
}

export interface TemplateColumn {
  key: string;
  displayName: string;
  required: boolean;
  category: 'identity' | 'academic' | 'scores' | 'sessions' | 'translations';
  exampleValue?: string;
  description?: string;
  backgroundColor?: string;
}

export interface TemplateGenerationResult {
  workbook: ExcelJS.Workbook;
  fileName: string;
  stats: {
    totalColumns: number;
    requiredColumns: number;
    optionalColumns: number;
    dynamicColumns: number;
    sessionColumns: number;
  };
}

// =====================================================
// FONCTION PRINCIPALE
// =====================================================

/**
 * Point d'entrée principal - Génère un workbook Excel complet
 */
export async function generateExcelTemplate(
  config: TemplateConfig
): Promise<TemplateGenerationResult> {
  const workbook = new ExcelJS.Workbook();

  // Métadonnées workbook
  workbook.creator = 'Système DIPLOMATION';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = `Modèle d'importation - ${getDocumentTypeLabel(config.type)}`;

  // 1. Obtenir toutes les colonnes
  const columns = getAllTemplateColumns(config);

  // 2. Créer feuille principale
  createTemplateDataSheet(workbook, config, columns);

  // 3. Créer feuille instructions (si demandé)
  if (config.includeInstructions !== false) {
    createInstructionsSheet(workbook, config, columns);
  }

  // 4. Créer feuille exemples (si demandé)
  if (config.includeExamples) {
    createExamplesSheet(workbook, config, columns);
  }

  // 5. Générer nom fichier
  const fileName = generateFileName(config);

  // 6. Calculer statistiques
  const stats = calculateTemplateStats(columns);

  return { workbook, fileName, stats };
}

// =====================================================
// FONCTIONS DE RÉCUPÉRATION DES COLONNES
// =====================================================

/**
 * Récupère TOUTES les colonnes (standard + dynamiques + sessions)
 */
function getAllTemplateColumns(config: TemplateConfig): TemplateColumn[] {
  // Colonnes standard selon type document
  const standardColumns = getStandardColumns(config.type, config.establishmentType);

  // Colonnes dynamiques (notes ECs) - uniquement pour les relevés
  const dynamicColumns = config.type === 'releve' ? getDynamicColumns(config) : [];

  // Colonnes sessions (si activées)
  const sessionColumns = getSessionColumns(config, dynamicColumns);

  return [...standardColumns, ...dynamicColumns, ...sessionColumns];
}

/**
 * Colonnes standard selon type de document
 * Réutilise les définitions de excel-columns.ts
 */
function getStandardColumns(
  type: TemplateType,
  establishmentType?: string
): TemplateColumn[] {

  let requiredCols: ColumnRequirement[] = [];
  let optionalCols: ColumnRequirement[] = [];

  // Import des définitions existantes
  if (type === 'releve') {
    requiredCols = RELEVE_REQUIRED_COLUMNS;
    optionalCols = RELEVE_OPTIONAL_COLUMNS;
  } else if (type === 'attestation') {
    requiredCols = ATTESTATION_REQUIRED_COLUMNS;
    optionalCols = ATTESTATION_OPTIONAL_COLUMNS;

    // Ajouter colonnes EN si Faculty
    const isFaculty = establishmentType?.toLowerCase().includes('faculty');
    if (isFaculty) {
      requiredCols = [...requiredCols, ...FACULTY_REQUIRED_EN_COLUMNS];
      optionalCols = [...optionalCols, ...FACULTY_OPTIONAL_EN_COLUMNS];
    }
  } else if (type === 'diploma') {
    requiredCols = DIPLOMA_REQUIRED_COLUMNS;
    optionalCols = DIPLOMA_OPTIONAL_COLUMNS;
  }

  return convertToTemplateColumns(requiredCols, optionalCols, true);
}

/**
 * Colonnes dynamiques (notes ECs)
 */
function getDynamicColumns(config: TemplateConfig): TemplateColumn[] {
  let ecNames: string[];

  // Mode contextuel : ECs fournis
  if (config.dynamicColumns?.ecNames && config.dynamicColumns.ecNames.length > 0) {
    ecNames = config.dynamicColumns.ecNames;
  } else {
    // Mode générique : ECs par défaut
    ecNames = [
      'Mathématiques',
      'Français',
      'Physique',
      'Informatique',
      'Anglais',
      'Histoire-Géographie'
    ];
  }

  return ecNames.map(ecName => ({
    key: ecName,
    displayName: ecName,
    required: false,
    category: 'scores',
    exampleValue: '15.5',
    description: `Note de l'EC "${ecName}" sur 20`,
    backgroundColor: 'FFFFE0FF'  // Violet clair
  }));
}

/**
 * Colonnes sessions (S/[ec_name])
 */
function getSessionColumns(
  config: TemplateConfig,
  scoreColumns: TemplateColumn[]
): TemplateColumn[] {

  if (!config.dynamicColumns?.includeSessions || config.type !== 'releve') {
    return [];
  }

  const sessionPrefix = config.dynamicColumns.sessionFormat || 'S/';

  return scoreColumns.map(scoreCol => ({
    key: `${sessionPrefix}${scoreCol.key}`,
    displayName: `${sessionPrefix}${scoreCol.displayName}`,
    required: false,
    category: 'sessions',
    exampleValue: 'N/2024-2025',
    description: `Session pour "${scoreCol.displayName}" - Format: N/année (normale) ou R/année (rattrapage)`,
    backgroundColor: 'FFFFF0E0'  // Orange clair
  }));
}

// =====================================================
// CRÉATION FEUILLE PRINCIPALE (DONNÉES)
// =====================================================

/**
 * Crée la feuille de données principale
 */
function createTemplateDataSheet(
  workbook: ExcelJS.Workbook,
  config: TemplateConfig,
  columns: TemplateColumn[]
): ExcelJS.Worksheet {

  const worksheet = workbook.addWorksheet('Modèle');

  // Configuration page
  worksheet.pageSetup = {
    paperSize: 9,  // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1
  };

  // === LIGNE 1 : Titre ===
  const titleText = `MODÈLE D'IMPORTATION - ${getDocumentTypeLabel(config.type).toUpperCase()}`;
  worksheet.addRow([titleText]);
  worksheet.mergeCells(1, 1, 1, columns.length);

  const titleCell = worksheet.getCell('A1');
  titleCell.style = {
    font: { bold: true, size: 16, color: { argb: 'FF1F497D' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thick', color: { argb: 'FF1F497D' } },
      bottom: { style: 'thick', color: { argb: 'FF1F497D' } },
      left: { style: 'thick', color: { argb: 'FF1F497D' } },
      right: { style: 'thick', color: { argb: 'FF1F497D' } }
    }
  };
  worksheet.getRow(1).height = 40;

  // === LIGNE 2 : Instructions ===
  const instructionText = 'Remplissez les colonnes selon les en-têtes ci-dessous. ' +
                          'Colonnes obligatoires en rouge, optionnelles en bleu/violet/orange.';
  worksheet.addRow([instructionText]);
  worksheet.mergeCells(2, 1, 2, columns.length);

  const instructionCell = worksheet.getCell('A2');
  instructionCell.style = {
    font: { italic: true, size: 11, color: { argb: 'FF505050' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FBFF' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      left: { style: 'thick', color: { argb: 'FF1F497D' } },
      right: { style: 'thick', color: { argb: 'FF1F497D' } },
      bottom: { style: 'thick', color: { argb: 'FF1F497D' } }
    }
  };
  worksheet.getRow(2).height = 30;

  // === LIGNE 3 : Séparation ===
  worksheet.addRow([]);
  worksheet.getRow(3).height = 10;

  // === LIGNE 4 : En-têtes de colonnes ===
  const headerRow = worksheet.addRow(columns.map(col => col.displayName));
  headerRow.height = 50;

  // Appliquer styles selon catégorie
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.style = getColumnHeaderStyle(col);

    // Ajouter commentaire pour colonnes importantes
    if (col.required && col.description) {
      cell.note = `⚠️ Colonne obligatoire\n${col.description}`;
    } else if (col.description) {
      cell.note = col.description;
    }
  });

  // === Lignes vides pour saisie (3 lignes) ===
  for (let i = 0; i < 3; i++) {
    worksheet.addRow([]);
  }

  // === Formatage final ===

  // Largeurs colonnes adaptatives
  columns.forEach((col, index) => {
    const colLetter = String.fromCharCode(65 + index); // A, B, C...
    let width = Math.max(col.displayName.length + 2, 12);

    if (col.category === 'identity') width = Math.max(width, 15);
    if (col.key === 'MATRICULE') width = 18;
    if (col.category === 'academic') width = Math.max(width, 20);
    if (col.category === 'scores') width = 15;
    if (col.category === 'sessions') width = 18;

    worksheet.getColumn(colLetter).width = width;
  });

  // Figer les 4 premières lignes
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 4,
      topLeftCell: 'A5',
      activeCell: 'A5'
    }
  ];

  // Filtres automatiques
  const lastColumn = String.fromCharCode(64 + columns.length);
  worksheet.autoFilter = {
    from: 'A4',
    to: `${lastColumn}4`
  };

  // Validation des données
  addDataValidation(worksheet, columns);

  return worksheet;
}

/**
 * Applique les styles selon la catégorie de colonne
 */
function getColumnHeaderStyle(column: TemplateColumn): Partial<ExcelJS.Style> {
  const baseStyle: Partial<ExcelJS.Style> = {
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  };

  const categoryStyles: Record<TemplateColumn['category'], Partial<ExcelJS.Style>> = {
    identity: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } },
      font: { bold: true, size: 11, color: { argb: 'FF8B0000' }, name: 'Calibri' }
    },
    academic: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F0FF' } },
      font: { bold: true, size: 11, color: { argb: 'FF00008B' }, name: 'Calibri' }
    },
    scores: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0FF' } },
      font: { bold: true, size: 11, color: { argb: 'FF8B008B' }, name: 'Calibri' }
    },
    sessions: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0E0' } },
      font: { italic: true, size: 10, color: { argb: 'FFFF8C00' }, name: 'Calibri' }
    },
    translations: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0FFE0' } },
      font: { italic: true, size: 10, color: { argb: 'FF228B22' }, name: 'Calibri' }
    }
  };

  return {
    ...baseStyle,
    ...categoryStyles[column.category]
  };
}

/**
 * Ajoute validation des données Excel natives
 */
function addDataValidation(
  worksheet: ExcelJS.Worksheet,
  columns: TemplateColumn[]
): void {

  columns.forEach((col, index) => {
    const colLetter = String.fromCharCode(65 + index);

    // Validation dates
    if (col.key.includes('DATE')) {
      for (let rowNum = 5; rowNum <= 100; rowNum++) {
        const cell = worksheet.getCell(`${colLetter}${rowNum}`);
        cell.dataValidation = {
          type: 'date',
          operator: 'greaterThan',
          formulae: [new Date(1900, 0, 1)],
          showErrorMessage: true,
          errorTitle: 'Date invalide',
          error: 'Veuillez entrer une date valide au format JJ/MM/AAAA'
        };
      }
    }

    // Validation notes (0-20)
    if (col.category === 'scores') {
      for (let rowNum = 5; rowNum <= 100; rowNum++) {
        const cell = worksheet.getCell(`${colLetter}${rowNum}`);
        cell.dataValidation = {
          type: 'decimal',
          operator: 'between',
          formulae: [0, 20],
          showErrorMessage: true,
          errorTitle: 'Note invalide',
          error: 'La note doit être comprise entre 0 et 20'
        };
      }
    }

    // Validation sessions (format texte pour permettre N/année et R/année)
    if (col.category === 'sessions') {
      for (let rowNum = 5; rowNum <= 100; rowNum++) {
        const cell = worksheet.getCell(`${colLetter}${rowNum}`);
        // Note : Excel list validation est limitée en taille, on utilise un message d'info
        cell.note = 'Format attendu: N/2024-2025 (session normale) ou R/2024-2025 (rattrapage)';
      }
    }
  });
}

// =====================================================
// CRÉATION FEUILLE INSTRUCTIONS
// =====================================================

/**
 * Crée la feuille d'instructions détaillées
 */
function createInstructionsSheet(
  workbook: ExcelJS.Workbook,
  config: TemplateConfig,
  columns: TemplateColumn[]
): ExcelJS.Worksheet {

  const worksheet = workbook.addWorksheet('Instructions');

  // === SECTION 1 : Titre ===
  worksheet.addRow(['GUIDE D\'UTILISATION DU MODÈLE']);
  worksheet.mergeCells('A1:D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.style = {
    font: { bold: true, size: 16, color: { argb: 'FF1F497D' }, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  worksheet.getRow(1).height = 40;
  worksheet.addRow([]);

  // === SECTION 2 : Vue d'ensemble ===
  worksheet.addRow(['VUE D\'ENSEMBLE']);
  worksheet.mergeCells('A3:D3');
  worksheet.getCell('A3').font = { bold: true, size: 14, name: 'Calibri' };

  worksheet.addRow([
    'Type de document :',
    getDocumentTypeLabel(config.type),
    '',
    ''
  ]);

  const overview = [
    `Ce modèle permet d'importer des données pour la génération de ${getDocumentTypeLabel(config.type)}s.`,
    'Remplissez les colonnes selon les en-têtes de la feuille "Modèle".',
    'Les colonnes sont colorées selon leur importance et leur catégorie.',
    'Consultez les sections ci-dessous pour comprendre chaque colonne.'
  ];

  overview.forEach(text => {
    worksheet.addRow([text, '', '', '']);
    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
  });

  worksheet.addRow([]);

  // === SECTION 3 : Légende des couleurs ===
  worksheet.addRow(['LÉGENDE DES COULEURS']);
  worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
  worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, name: 'Calibri' };
  worksheet.addRow([]);

  const legendRow = worksheet.addRow(['Catégorie', 'Couleur', 'Type', 'Description']);
  legendRow.font = { bold: true, name: 'Calibri' };
  legendRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };

  const legendData = [
    ['Identité', 'Rouge clair', 'Obligatoire', 'Informations personnelles de l\'étudiant'],
    ['Académique', 'Bleu clair', 'Mixte', 'Informations de parcours et formation'],
    ['Notes', 'Violet clair', 'Dynamique', 'Notes des éléments constitutifs (ECs)'],
    ['Sessions', 'Orange clair', 'Optionnel', 'Sessions d\'examen (N/année ou R/année)'],
    ['Traductions', 'Vert clair', 'Conditionnel', 'Traductions anglaises (établissements Faculty)']
  ];

  legendData.forEach(([cat, color, type, desc]) => {
    const row = worksheet.addRow([cat, color, type, desc]);
    const colorCell = row.getCell(2);
    colorCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: getCategoryColorARGB(cat) }
    };
  });

  worksheet.addRow([]);

  // === SECTION 4 : Colonnes obligatoires ===
  const requiredCols = columns.filter(c => c.required);
  if (requiredCols.length > 0) {
    worksheet.addRow(['COLONNES OBLIGATOIRES']);
    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, color: { argb: 'FF8B0000' }, name: 'Calibri' };
    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['Nom Colonne', 'Format Attendu', 'Exemple', 'Description']);
    headerRow.font = { bold: true, name: 'Calibri' };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };

    requiredCols.forEach(col => {
      worksheet.addRow([
        col.displayName,
        getFormatDescription(col),
        col.exampleValue || 'N/A',
        col.description || ''
      ]);
    });

    worksheet.addRow([]);
  }

  // === SECTION 5 : Colonnes optionnelles ===
  const optionalCols = columns.filter(c => !c.required);
  if (optionalCols.length > 0) {
    worksheet.addRow(['COLONNES OPTIONNELLES']);
    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, color: { argb: 'FF00008B' }, name: 'Calibri' };
    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['Nom Colonne', 'Format Attendu', 'Exemple', 'Description']);
    headerRow.font = { bold: true, name: 'Calibri' };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };

    optionalCols.forEach(col => {
      worksheet.addRow([
        col.displayName,
        getFormatDescription(col),
        col.exampleValue || 'N/A',
        col.description || ''
      ]);
    });

    worksheet.addRow([]);
  }

  // === SECTION 6 : Colonnes dynamiques (si relevés) ===
  if (config.type === 'releve') {
    worksheet.addRow(['COLONNES DE NOTES (DYNAMIQUES)']);
    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, name: 'Calibri' };
    worksheet.addRow([]);

    const dynamicInfo = [
      'Les colonnes de notes correspondent aux éléments constitutifs (ECs) de votre formation.',
      '',
      config.dynamicColumns?.ecNames && config.dynamicColumns.ecNames.length > 0
        ? 'Ce modèle utilise les ECs de votre configuration active.'
        : 'Ce modèle utilise des ECs d\'exemple. Vous pouvez les personnaliser :',
      '',
      '• Renommer les colonnes selon vos matières réelles',
      '• Ajouter de nouvelles colonnes en copiant le format',
      '• Supprimer les colonnes non utilisées',
      '• Conserver le format numérique (notes sur 20)',
      '',
      'Important : Les noms de colonnes doivent correspondre aux ECs de votre configuration pour un mapping automatique.'
    ];

    dynamicInfo.forEach(text => {
      worksheet.addRow([text, '', '', '']);
      worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    });

    worksheet.addRow([]);
  }

  // === SECTION 7 : Sessions (si applicable) ===
  if (config.dynamicColumns?.includeSessions && config.type === 'releve') {
    worksheet.addRow(['COLONNES DE SESSIONS']);
    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, name: 'Calibri' };
    worksheet.addRow([]);

    const sessionInfo = [
      'Les colonnes de session permettent d\'identifier la session d\'examen pour chaque note.',
      '',
      'Format attendu : [TYPE]/[ANNÉE ACADÉMIQUE]',
      '• Type : N (session normale) ou R (session de rattrapage)',
      '• Année : Format AAAA-AAAA (ex: 2024-2025)',
      '',
      'Exemples valides :',
      '• N/2024-2025 - Session normale 2024-2025',
      '• R/2023-2024 - Session de rattrapage 2023-2024',
      '',
      'Règles :',
      '• Une colonne session par colonne de note (format S/[nom_ec])',
      '• Si vide, session normale de l\'année courante sera utilisée par défaut'
    ];

    sessionInfo.forEach(text => {
      worksheet.addRow([text, '', '', '']);
      worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    });

    worksheet.addRow([]);
  }

  // === SECTION 8 : Conseils pratiques ===
  worksheet.addRow(['CONSEILS PRATIQUES']);
  worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
  worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, name: 'Calibri' };
  worksheet.addRow([]);

  const tips = [
    '✓ Vérifiez l\'orthographe des noms et prénoms',
    '✓ Utilisez le format JJ/MM/AAAA pour les dates',
    '✓ Les matricules doivent être uniques',
    '✓ Enregistrez régulièrement votre travail',
    '✓ Testez avec quelques lignes avant import complet',
    '✓ Conservez une copie de sauvegarde',
    '✓ Utilisez Ctrl+F pour rechercher rapidement',
    '✓ Les filtres automatiques (ligne 4) facilitent le tri'
  ];

  tips.forEach(tip => {
    worksheet.addRow([tip, '', '', '']);
    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
  });

  worksheet.addRow([]);

  // === SECTION 9 : Dépannage ===
  worksheet.addRow(['DÉPANNAGE - ERREURS COURANTES']);
  worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
  worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14, color: { argb: 'FFFF0000' }, name: 'Calibri' };
  worksheet.addRow([]);

  const troubleshooting = [
    ['Erreur', 'Cause', 'Solution'],
    ['Colonne manquante', 'En-tête mal orthographié', 'Vérifiez orthographe exacte (sensible à la casse)'],
    ['Date invalide', 'Format non reconnu', 'Utilisez JJ/MM/AAAA (ex: 15/03/2005)'],
    ['Note rejetée', 'Valeur hors limites', 'Notes entre 0 et 20 uniquement'],
    ['Session invalide', 'Format incorrect', 'Utilisez N/année ou R/année (ex: N/2024-2025)'],
    ['Import échoue', 'Données manquantes', 'Remplissez toutes colonnes obligatoires (rouge)'],
    ['Matricule dupliqué', 'Même matricule plusieurs fois', 'Chaque matricule doit être unique']
  ];

  const troubleHeaderRow = worksheet.addRow(troubleshooting[0]);
  troubleHeaderRow.font = { bold: true, name: 'Calibri' };
  troubleHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } };

  for (let i = 1; i < troubleshooting.length; i++) {
    worksheet.addRow(troubleshooting[i]);
  }

  // === Formatage final ===
  worksheet.getColumn('A').width = 25;
  worksheet.getColumn('B').width = 30;
  worksheet.getColumn('C').width = 25;
  worksheet.getColumn('D').width = 50;

  return worksheet;
}

// =====================================================
// CRÉATION FEUILLE EXEMPLES (Optionnelle)
// =====================================================

/**
 * Crée la feuille d'exemples avec données fictives
 */
function createExamplesSheet(
  workbook: ExcelJS.Workbook,
  config: TemplateConfig,
  columns: TemplateColumn[]
): ExcelJS.Worksheet {

  const worksheet = workbook.addWorksheet('Exemple');

  // En-tête
  const headerRow = worksheet.addRow(columns.map(c => c.displayName));
  headerRow.height = 30;
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.style = getColumnHeaderStyle(col);
  });

  // Données fictives (3 lignes)
  const exampleData = generateExampleData(config, columns);
  exampleData.forEach(rowData => {
    worksheet.addRow(columns.map(col => rowData[col.key] || col.exampleValue || ''));
  });

  // Largeurs colonnes
  columns.forEach((col, index) => {
    const colLetter = String.fromCharCode(65 + index);
    worksheet.getColumn(colLetter).width = Math.max(col.displayName.length + 2, 15);
  });

  // Figer ligne en-tête
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  return worksheet;
}

/**
 * Génère des données d'exemple réalistes
 */
function generateExampleData(
  config: TemplateConfig,
  columns: TemplateColumn[]
): Record<string, string>[] {

  const baseExamples = [
    {
      'NOM': 'MARTIN',
      'PRENOM': 'Sophie',
      'MATRICULE': '2024001',
      'DATE DE NAISSANCE': '15/03/2005',
      'LIEU DE NAISSANCE': 'Paris',
      'SEXE': 'F',
      'EMAIL': 'sophie.martin@example.com'
    },
    {
      'NOM': 'BERNARD',
      'PRENOM': 'Lucas',
      'MATRICULE': '2024002',
      'DATE DE NAISSANCE': '22/07/2004',
      'LIEU DE NAISSANCE': 'Lyon',
      'SEXE': 'M',
      'EMAIL': 'lucas.bernard@example.com'
    },
    {
      'NOM': 'DUBOIS',
      'PRENOM': 'Emma',
      'MATRICULE': '2024003',
      'DATE DE NAISSANCE': '08/11/2005',
      'LIEU DE NAISSANCE': 'Marseille',
      'SEXE': 'F',
      'EMAIL': 'emma.dubois@example.com'
    }
  ];

  // Compléter selon le type de document
  const examples = baseExamples.map((base, index) => {
    const example: Record<string, string> = { ...base };

    // Colonnes académiques
    if (config.type === 'releve') {
      example['NIVEAU'] = '1';
      example['SEMESTRE'] = 'S1';
      example['CYCLE'] = 'Licence';
      example['FILIERE'] = 'Informatique';
      example['ANNEE ACADEMIQUE'] = '2024-2025';
    }

    if (config.type === 'attestation') {
      example['PARCOURS'] = 'Informatique';
      example['SPECIALITE'] = 'Systèmes et Réseaux';
      const moyenne = (14 + Math.random() * 4).toFixed(2);
      example['MOYENNE'] = moyenne;
      example['MENTION'] = parseFloat(moyenne) >= 16 ? 'Très Bien' : parseFloat(moyenne) >= 14 ? 'Bien' : 'Assez Bien';
      example['ANNEE ACADEMIQUE'] = '2024-2025';

      if (config.establishmentType?.toLowerCase().includes('faculty')) {
        example['DOMAINE_EN'] = 'Computer Science';
        example['PARCOURS_EN'] = 'Computer Science';
        example['SPECIALITE_EN'] = 'Systems and Networks';
        example['MENTION_EN'] = example['MENTION'] === 'Très Bien' ? 'Summa Cum Laude' :
                                example['MENTION'] === 'Bien' ? 'Magna Cum Laude' : 'Cum Laude';
      }
    }

    if (config.type === 'diploma') {
      example['TITRE DIPLOME FR'] = 'Licence en Informatique';
      example['TITRE DIPLOME EN'] = 'Bachelor in Computer Science';
      example['MENTION'] = 'Bien';
      example['MENTION_EN'] = 'Magna Cum Laude';
      const moyenne = (14 + Math.random() * 4).toFixed(2);
      example['MOYENNE'] = moyenne;
      example['GRADE'] = 'B';
      example['ANNEE OBTENTION'] = '2024';
      example['DATE JURY ADMISSION'] = '15/06/2024';
      example['DATE JURY DELIBERATION'] = '20/06/2024';
      example['PARCOURS'] = 'Informatique';
      example['SPECIALITE'] = 'Génie Logiciel';
    }

    // Colonnes dynamiques (notes)
    const scoreCols = columns.filter(c => c.category === 'scores');
    scoreCols.forEach(scoreCol => {
      example[scoreCol.key] = (10 + Math.random() * 10).toFixed(1);
    });

    // Colonnes sessions
    if (config.dynamicColumns?.includeSessions) {
      const sessionCols = columns.filter(c => c.category === 'sessions');
      sessionCols.forEach((sessionCol, idx) => {
        example[sessionCol.key] = idx === 2 && index === 2 ? 'R/2023-2024' : 'N/2024-2025';
      });
    }

    return example;
  });

  return examples;
}

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

/**
 * Génère le nom de fichier pour le template
 */
function generateFileName(config: TemplateConfig): string {
  const date = new Date().toISOString().split('T')[0];

  const typeLabel: Record<TemplateType, string> = {
    releve: 'releve-notes',
    attestation: 'attestation',
    diploma: 'diplome'
  };

  const variant = config.establishmentType?.toLowerCase().includes('faculty')
    ? '_faculty'
    : '';

  const sessions = config.dynamicColumns?.includeSessions ? '_avec-sessions' : '';

  return `modele_import_${typeLabel[config.type]}${variant}${sessions}_${date}.xlsx`;
}

/**
 * Calcule les statistiques du template
 */
function calculateTemplateStats(columns: TemplateColumn[]): TemplateGenerationResult['stats'] {
  return {
    totalColumns: columns.length,
    requiredColumns: columns.filter(c => c.required).length,
    optionalColumns: columns.filter(c => !c.required && c.category !== 'scores' && c.category !== 'sessions').length,
    dynamicColumns: columns.filter(c => c.category === 'scores').length,
    sessionColumns: columns.filter(c => c.category === 'sessions').length
  };
}

function getDocumentTypeLabel(type: TemplateType): string {
  const labels: Record<TemplateType, string> = {
    releve: 'Relevé de Notes',
    attestation: 'Attestation de Réussite',
    diploma: 'Diplôme'
  };
  return labels[type];
}

function getFormatDescription(column: TemplateColumn): string {
  if (column.key.includes('DATE')) return 'JJ/MM/AAAA';
  if (column.category === 'scores') return 'Numérique 0-20';
  if (column.category === 'sessions') return 'N/année ou R/année';
  if (column.key === 'SEXE') return 'M ou F';
  if (column.key === 'EMAIL') return 'adresse@example.com';
  if (column.key === 'MATRICULE') return 'Alphanumérique unique';
  return 'Texte';
}

function getCategoryColorARGB(category: string): string {
  const map: Record<string, string> = {
    'Identité': 'FFFFE0E0',
    'Académique': 'FFE0F0FF',
    'Notes': 'FFFFE0FF',
    'Sessions': 'FFFFF0E0',
    'Traductions': 'FFE0FFE0'
  };
  return map[category] || 'FFFFFFFF';
}

function convertToTemplateColumns(
  required: ColumnRequirement[],
  optional: ColumnRequirement[],
  includeQRCodeColumns: boolean = true
): TemplateColumn[] {

  const convert = (req: ColumnRequirement, isRequired: boolean): TemplateColumn => ({
    key: req.key,
    displayName: req.displayName,
    required: isRequired,
    category: categorizeColumn(req.key),
    description: req.description,
    exampleValue: getExampleValue(req.key)
  });

  const columns = [
    ...required.map(r => convert(r, true)),
    ...optional.map(o => convert(o, false))
  ];

  // Ajouter les colonnes QR Code si demandé
  if (includeQRCodeColumns) {
    const qrCodeColumns: TemplateColumn[] = [
      {
        key: 'NUMERO JURY',
        displayName: 'Numéro Jury',
        required: false,
        category: 'academic',
        description: 'Numéro du jury (utilisé pour le QR code)',
        exampleValue: '2024-001'
      }
    ];
    columns.push(...qrCodeColumns);
  }

  return columns;
}

function categorizeColumn(key: string): TemplateColumn['category'] {
  if (['NOM', 'PRENOM', 'MATRICULE', 'DATE DE NAISSANCE', 'LIEU DE NAISSANCE', 'SEXE'].includes(key)) {
    return 'identity';
  }
  if (key.endsWith('_EN')) {
    return 'translations';
  }
  if (key.startsWith('S/')) {
    return 'sessions';
  }
  return 'academic';
}

function getExampleValue(key: string): string {
  const examples: Record<string, string> = {
    'NOM': 'DUPONT',
    'PRENOM': 'Jean',
    'MATRICULE': '2024001',
    'DATE DE NAISSANCE': '15/03/2005',
    'LIEU DE NAISSANCE': 'Paris',
    'SEXE': 'M',
    'EMAIL': 'jean.dupont@example.com',
    'PARCOURS': 'Informatique',
    'SPECIALITE': 'Génie Logiciel',
    'MOYENNE': '15.5',
    'MENTION': 'Bien',
    'ANNEE ACADEMIQUE': '2024-2025',
    'TITRE DIPLOME FR': 'Licence en Informatique',
    'TITRE DIPLOME EN': 'Bachelor in Computer Science',
    'GRADE': 'B',
    'NUMERO JURY': '2024-001'
  };
  return examples[key] || '';
}
