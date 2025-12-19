// src/lib/helpers/grade-entry-template-generator.ts
// Générateur de masque de saisie de notes basé sur une configuration de classe

import ExcelJS from 'exceljs';
import {
  RELEVE_REQUIRED_COLUMNS,
  RELEVE_OPTIONAL_COLUMNS,
  ColumnRequirement
} from '@/lib/validators/excel-columns';

export interface GradeEntryConfig {
  classConfig: any; // Configuration de classe
  numberOfStudents: number;
  includeInstructions?: boolean;
  includeExamples?: boolean;
  includeSessions?: boolean;
  establishmentType?: string;
}

export interface GradeEntryResult {
  workbook: ExcelJS.Workbook;
  fileName: string;
  stats: {
    totalColumns: number;
    standardColumns: number;
    gradeColumns: number;
    sessionColumns: number;
  };
}

interface TemplateColumn {
  key: string;
  displayName: string;
  required: boolean;
  category: 'identity' | 'academic' | 'scores' | 'sessions';
  exampleValue?: string;
  description?: string;
}

/**
 * Génère un masque de saisie de notes basé sur une configuration de classe
 */
export async function generateGradeEntryTemplate(
  config: GradeEntryConfig
): Promise<GradeEntryResult> {
  const workbook = new ExcelJS.Workbook();

  // Métadonnées
  workbook.creator = 'Système DIPLOMATION';
  workbook.created = new Date();
  workbook.subject = `Masque de saisie - ${config.classConfig.name}`;

  // 1. Obtenir toutes les colonnes
  const columns = getGradeEntryColumns(config);

  // 2. Créer feuille principale
  createGradeEntryDataSheet(workbook, config, columns);

  // 3. Créer feuille instructions
  if (config.includeInstructions !== false) {
    createInstructionsSheet(workbook, config, columns);
  }

  // 4. Créer feuille avec structure de la configuration
  createConfigStructureSheet(workbook, config);

  // 5. Générer nom fichier
  const date = new Date().toISOString().split('T')[0];
  const configName = config.classConfig.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `masque_saisie_${configName}_${date}.xlsx`;

  // 6. Calculer statistiques
  const standardCols = columns.filter(c => c.category === 'identity' || c.category === 'academic');
  const gradeCols = columns.filter(c => c.category === 'scores');
  const sessionCols = columns.filter(c => c.category === 'sessions');

  const stats = {
    totalColumns: columns.length,
    standardColumns: standardCols.length,
    gradeColumns: gradeCols.length,
    sessionColumns: sessionCols.length
  };

  return { workbook, fileName, stats };
}

/**
 * Obtient toutes les colonnes pour le masque de saisie
 */
function getGradeEntryColumns(config: GradeEntryConfig): TemplateColumn[] {
  const columns: TemplateColumn[] = [];

  // 1. Colonnes standard (identité)
  RELEVE_REQUIRED_COLUMNS.forEach(col => {
    columns.push({
      key: col.key,
      displayName: col.key, // Utiliser le key exact pour l'import
      required: true,
      category: 'identity',
      exampleValue: getExampleValue(col.key),
      description: col.description
    });
  });

  // 2. Colonnes académiques optionnelles
  RELEVE_OPTIONAL_COLUMNS.forEach(col => {
    columns.push({
      key: col.key,
      displayName: col.key, // Utiliser le key exact
      required: false,
      category: 'academic',
      exampleValue: getExampleValue(col.key),
      description: col.description
    });
  });

  // 3. Colonne NUMERO JURY (pour QR code)
  columns.push({
    key: 'NUMERO JURY',
    displayName: 'NUMERO JURY',
    required: false,
    category: 'academic',
    exampleValue: '2024-001',
    description: 'Numéro du jury (utilisé pour le QR code)'
  });

  // 4. Extraire tous les ECs de la configuration et créer les colonnes de notes
  const ecColumns: TemplateColumn[] = [];
  const sessionColumns: TemplateColumn[] = [];

  config.classConfig.semesters?.forEach((semester: any) => {
    semester.ues?.forEach((ue: any) => {
      ue.ecs?.forEach((ec: any) => {
        // Colonne de note (utiliser le nom exact de l'EC)
        ecColumns.push({
          key: ec.name,
          displayName: ec.name,
          required: false,
          category: 'scores',
          exampleValue: '15.5',
          description: `Note de l'EC "${ec.name}" (0-20)`
        });

        // Colonne de session si demandé
        if (config.includeSessions) {
          sessionColumns.push({
            key: `S/${ec.name}`,
            displayName: `S/${ec.name}`,
            required: false,
            category: 'sessions',
            exampleValue: 'N/2024-2025',
            description: `Session pour "${ec.name}" (N/année ou R/année)`
          });
        }
      });
    });
  });

  // Combiner toutes les colonnes
  return [...columns, ...ecColumns, ...sessionColumns];
}

/**
 * Crée la feuille de données pour le masque de saisie
 */
function createGradeEntryDataSheet(
  workbook: ExcelJS.Workbook,
  config: GradeEntryConfig,
  columns: TemplateColumn[]
): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet('Saisie Notes');

  // Configuration page
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1
  };

  // === LIGNE 1 : En-têtes de colonnes (IMPORTANT: Première ligne pour l'import) ===
  const headerRow = worksheet.addRow(columns.map(col => col.displayName));
  headerRow.height = 50;

  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.style = getColumnHeaderStyle(col);

    if (col.description) {
      cell.note = col.description + (col.required ? '\n⚠️ COLONNE OBLIGATOIRE' : '\n💡 Colonne optionnelle');
    }
  });

  // === Lignes pour exemples si demandé ===
  if (config.includeExamples) {
    for (let i = 0; i < 3; i++) {
      const exampleRow = worksheet.addRow(columns.map(col => col.exampleValue || ''));
      exampleRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF5E7' }
        };
        cell.font = { italic: true, color: { argb: 'FF7F8C8D' } };
        cell.note = 'Exemple - Vous pouvez supprimer cette ligne';
      });
    }
  }

  // === Lignes vides pour saisie ===
  const startRow = config.includeExamples ? 5 : 2; // Après exemples ou après en-tête
  for (let i = 0; i < config.numberOfStudents; i++) {
    worksheet.addRow([]);
  }

  // === Ajouter une note sur la première ligne ===
  const firstHeaderCell = headerRow.getCell(1);
  firstHeaderCell.note = `Configuration: ${config.classConfig.name}\nAnnée: ${config.classConfig.academicYear || 'N/A'}\n\n⚠️ NE PAS MODIFIER LES EN-TÊTES DE COLONNES\nCommencez la saisie à partir de la ligne ${startRow}`;

  // === Formatage final ===
  columns.forEach((col, index) => {
    let width = Math.max(col.displayName.length + 2, 12);

    if (col.category === 'identity') width = Math.max(width, 15);
    if (col.key === 'MATRICULE') width = 18;
    if (col.category === 'academic') width = Math.max(width, 20);
    if (col.category === 'scores') width = 15;
    if (col.category === 'sessions') width = 18;

    worksheet.getColumn(index + 1).width = width;
  });

  // Figer la première ligne (en-têtes)
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 1,
      topLeftCell: 'A2',
      activeCell: 'A2'
    }
  ];

  // Filtres automatiques (limité à 26 colonnes pour Excel)
  if (columns.length <= 26) {
    const lastColumnLetter = String.fromCharCode(64 + columns.length);
    worksheet.autoFilter = {
      from: 'A1',
      to: `${lastColumnLetter}1`
    };
  }

  // Validation des données (commence à la ligne 2, après les en-têtes)
  const startDataRow = config.includeExamples ? 5 : 2;
  const endDataRow = startDataRow + config.numberOfStudents - 1;

  columns.forEach((col, index) => {
    const colLetter = String.fromCharCode(65 + index);

    // Validation dates
    if (col.key.includes('DATE')) {
      for (let rowNum = startDataRow; rowNum <= endDataRow; rowNum++) {
        const cell = worksheet.getCell(`${colLetter}${rowNum}`);
        cell.dataValidation = {
          type: 'date',
          operator: 'greaterThan',
          formulae: [new Date(1900, 0, 1)],
          showErrorMessage: true,
          errorTitle: 'Date invalide',
          error: 'Format attendu: JJ/MM/AAAA'
        };
      }
    }

    // Validation notes (0-20)
    if (col.category === 'scores') {
      for (let rowNum = startDataRow; rowNum <= endDataRow; rowNum++) {
        const cell = worksheet.getCell(`${colLetter}${rowNum}`);
        cell.dataValidation = {
          type: 'decimal',
          operator: 'between',
          formulae: [0, 20],
          showErrorMessage: true,
          errorTitle: 'Note invalide',
          error: 'La note doit être entre 0 et 20'
        };
      }
    }
  });

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
      font: { bold: true, size: 11, color: { argb: 'FF8B0000' } }
    },
    academic: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F0FF' } },
      font: { bold: true, size: 11, color: { argb: 'FF00008B' } }
    },
    scores: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0FF' } },
      font: { bold: true, size: 11, color: { argb: 'FF8B008B' } }
    },
    sessions: {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0E0' } },
      font: { italic: true, size: 10, color: { argb: 'FFFF8C00' } }
    }
  };

  return { ...baseStyle, ...categoryStyles[column.category] };
}

/**
 * Crée la feuille d'instructions
 */
function createInstructionsSheet(
  workbook: ExcelJS.Workbook,
  config: GradeEntryConfig,
  columns: TemplateColumn[]
): void {
  const worksheet = workbook.addWorksheet('Instructions');

  worksheet.addRow(['GUIDE D\'UTILISATION DU MASQUE DE SAISIE']);
  worksheet.mergeCells('A1:D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.style = {
    font: { bold: true, size: 16, color: { argb: 'FF1F497D' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  worksheet.getRow(1).height = 40;
  worksheet.addRow([]);

  const instructions = [
    `Configuration : ${config.classConfig.name}`,
    `Année académique : ${config.classConfig.academicYear || 'N/A'}`,
    `Nombre d'ECs : ${columns.filter(c => c.category === 'scores').length}`,
    '',
    'INSTRUCTIONS DE SAISIE :',
    '',
    '1. INFORMATIONS ÉTUDIANTS (colonnes rouges) :',
    '   - Remplissez NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE',
    '   - Format des dates : JJ/MM/AAAA (ex: 15/03/2005)',
    '   - Le matricule doit être unique pour chaque étudiant',
    '',
    '2. INFORMATIONS ACADÉMIQUES (colonnes bleues) :',
    '   - NIVEAU, SEMESTRE, CYCLE, FILIERE, ANNEE ACADEMIQUE, etc.',
    '   - Ces informations peuvent être les mêmes pour tous les étudiants',
    '   - NUMERO JURY est utilisé pour la génération du QR code',
    '',
    '3. NOTES DES ECS (colonnes violettes) :',
    '   - Saisissez les notes sur 20',
    '   - Format : nombre décimal (ex: 15.5)',
    '   - Laissez vide si l\'étudiant n\'a pas passé l\'EC',
    '',
    '4. SESSIONS (colonnes oranges) - Optionnel :',
    '   - Format : N/2024-2025 (session normale)',
    '   - Format : R/2024-2025 (session de rattrapage)',
    '   - Si vide, session normale de l\'année en cours sera utilisée',
    '',
    '5. IMPORTATION :',
    '   - Sauvegardez le fichier au format .xlsx',
    '   - Allez dans "Générer les relevés"',
    '   - Importez ce fichier',
    '   - Vérifiez que toutes les colonnes sont reconnues',
    '',
    'REMARQUES IMPORTANTES :',
    '• Les noms de colonnes NE DOIVENT PAS être modifiés',
    '• Respectez les formats de données indiqués',
    '• Les données manquantes seront remplacées par "N/D" lors de l\'import',
    '• Consultez la feuille "Structure Config" pour voir l\'organisation des UEs et ECs'
  ];

  instructions.forEach(text => {
    const row = worksheet.addRow([text, '', '', '']);
    worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);
    if (text.startsWith('   ')) {
      row.getCell(1).font = { size: 10, italic: true };
    }
  });

  worksheet.getColumn('A').width = 100;
}

/**
 * Crée une feuille avec la structure de la configuration
 */
function createConfigStructureSheet(
  workbook: ExcelJS.Workbook,
  config: GradeEntryConfig
): void {
  const worksheet = workbook.addWorksheet('Structure Config');

  worksheet.addRow(['STRUCTURE DE LA CONFIGURATION']);
  worksheet.mergeCells('A1:D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.style = {
    font: { bold: true, size: 14, color: { argb: 'FF1F497D' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  worksheet.addRow([]);

  // En-têtes
  const headerRow = worksheet.addRow(['Semestre', 'UE', 'Code UE', 'EC']);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };

  // Données
  config.classConfig.semesters?.forEach((semester: any) => {
    semester.ues?.forEach((ue: any, ueIndex: number) => {
      ue.ecs?.forEach((ec: any, ecIndex: number) => {
        worksheet.addRow([
          ueIndex === 0 && ecIndex === 0 ? semester.name : '',
          ecIndex === 0 ? ue.name : '',
          ecIndex === 0 ? (ue.code || '') : '',
          ec.name
        ]);
      });
    });
  });

  worksheet.getColumn(1).width = 20;
  worksheet.getColumn(2).width = 40;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 50;
}

/**
 * Valeurs d'exemple pour les colonnes
 */
function getExampleValue(key: string): string {
  const examples: Record<string, string> = {
    'NOM': 'DUPONT',
    'PRENOM': 'Jean',
    'MATRICULE': '2024001',
    'DATE DE NAISSANCE': '15/03/2005',
    'LIEU DE NAISSANCE': 'Paris',
    'SEXE': 'M',
    'EMAIL': 'jean.dupont@example.com',
    'NIVEAU': '1',
    'SEMESTRE': '1',
    'CYCLE': 'Licence',
    'FILIERE': 'Informatique',
    'ANNEE ACADEMIQUE': '2024-2025',
    'NUMERO JURY': '2024-001'
  };
  return examples[key] || '';
}
