import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileDown } from "lucide-react";
import ExcelJS from 'exceljs';
import { ClassConfig, Semester, UE, EC } from "@/components/organisms/configs/types";

interface ImportExportExcelProps {
  configs: ClassConfig[];
  onImport: (configs: ClassConfig[]) => void;
}

export const ImportExportExcel: React.FC<ImportExportExcelProps> = ({
  configs,
  onImport,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Styles avancés avec gestion du texte améliorée
  const styles = {
    headerInfo: {
      font: { 
        bold: true, 
        size: 18, 
        color: { argb: 'FF1F497D' },
        name: 'Calibri'
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFE7F3FF' } 
      },
      border: {
        top: { style: 'thick', color: { argb: 'FF1F497D' } },
        left: { style: 'thick', color: { argb: 'FF1F497D' } },
        bottom: { style: 'medium', color: { argb: 'FF1F497D' } },
        right: { style: 'thick', color: { argb: 'FF1F497D' } }
      },
      alignment: { 
        horizontal: 'left', 
        vertical: 'middle',
        wrapText: true,
        indent: 1
      }
    },
    
    headerDesc: {
      font: { 
        italic: true, 
        size: 12, 
        color: { argb: 'FF505050' },
        name: 'Calibri'
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFF8FBFF' } 
      },
      border: {
        top: { style: 'thin', color: { argb: 'FFC5D9F1' } },
        left: { style: 'thick', color: { argb: 'FF1F497D' } },
        bottom: { style: 'thick', color: { argb: 'FF1F497D' } },
        right: { style: 'thick', color: { argb: 'FF1F497D' } }
      },
      alignment: { 
        horizontal: 'left', 
        vertical: 'middle',
        wrapText: true,
        indent: 1
      }
    },

    columnHeader: {
      font: { 
        bold: true, 
        size: 11, 
        color: { argb: 'FFFFFFFF' },
        name: 'Calibri'
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FF4F81BD' } 
      },
      border: {
        top: { style: 'medium', color: { argb: 'FF2F5F8F' } },
        left: { style: 'thin', color: { argb: 'FF2F5F8F' } },
        bottom: { style: 'medium', color: { argb: 'FF2F5F8F' } },
        right: { style: 'thin', color: { argb: 'FF2F5F8F' } }
      },
      alignment: { 
        horizontal: 'center', 
        vertical: 'middle', 
        wrapText: true
      }
    },

    configRow: {
      font: { 
        bold: true, 
        size: 11, 
        color: { argb: 'FF1F497D' },
        name: 'Calibri'
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFDCE6F1' } 
      },
      border: {
        top: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        left: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        bottom: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        right: { style: 'thin', color: { argb: 'FFB8CCE4' } }
      },
      alignment: { 
        horizontal: 'left', 
        vertical: 'top',
        wrapText: true,
        indent: 0.5
      }
    },

    ueRow: {
      font: { 
        bold: true, 
        size: 10, 
        color: { argb: 'FF7F6000' },
        name: 'Calibri'
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFFFF2CC' } 
      },
      border: {
        top: { style: 'thin', color: { argb: 'FFD6B656' } },
        left: { style: 'thin', color: { argb: 'FFD6B656' } },
        bottom: { style: 'thin', color: { argb: 'FFD6B656' } },
        right: { style: 'thin', color: { argb: 'FFD6B656' } }
      },
      alignment: { 
        horizontal: 'left', 
        vertical: 'top',
        wrapText: true,
        indent: 1
      }
    },

    ecRow: {
      font: { 
        size: 10, 
        color: { argb: 'FF404040' },
        name: 'Calibri'
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFF8F8F8' } 
      },
      border: {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      },
      alignment: { 
        horizontal: 'left', 
        vertical: 'top',
        wrapText: true,
        indent: 1.5
      }
    },

    instructionHeader: {
      font: { 
        bold: true, 
        size: 12, 
        color: { argb: 'FFFFFFFF' },
        name: 'Calibri'
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FF70AD47' } 
      },
      border: {
        top: { style: 'medium', color: { argb: 'FF4CAF50' } },
        left: { style: 'medium', color: { argb: 'FF4CAF50' } },
        bottom: { style: 'medium', color: { argb: 'FF4CAF50' } },
        right: { style: 'medium', color: { argb: 'FF4CAF50' } }
      },
      alignment: { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true
      }
    },

    instructionData: {
      font: { 
        size: 10,
        name: 'Calibri'
      },
      border: {
        top: { style: 'thin', color: { argb: 'FFC6E0B4' } },
        left: { style: 'thin', color: { argb: 'FFC6E0B4' } },
        bottom: { style: 'thin', color: { argb: 'FFC6E0B4' } },
        right: { style: 'thin', color: { argb: 'FFC6E0B4' } }
      },
      alignment: { 
        horizontal: 'left', 
        vertical: 'top', 
        wrapText: true,
        indent: 0.5
      }
    },

    // Nouveaux styles pour les cellules spéciales
    creditsCell: {
      font: { 
        bold: true, 
        size: 10, 
        color: { argb: 'FF7F6000' },
        name: 'Calibri'
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFFFF2CC' } 
      },
      border: {
        top: { style: 'thin', color: { argb: 'FFD6B656' } },
        left: { style: 'thin', color: { argb: 'FFD6B656' } },
        bottom: { style: 'thin', color: { argb: 'FFD6B656' } },
        right: { style: 'thin', color: { argb: 'FFD6B656' } }
      },
      alignment: { 
        horizontal: 'center', 
        vertical: 'middle'
      },
      numFmt: '0' // Format numérique
    },

    codeCell: {
      font: { 
        bold: true, 
        size: 9, 
        color: { argb: 'FF1F497D' },
        name: 'Consolas'  // Police monospace pour les codes
      },
      fill: { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFE8F0FF' } 
      },
      border: {
        top: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        left: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        bottom: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        right: { style: 'thin', color: { argb: 'FFB8CCE4' } }
      },
      alignment: { 
        horizontal: 'center', 
        vertical: 'middle'
      }
    }
  };

  // Fonction pour calculer la hauteur nécessaire d'une ligne selon le contenu
  const calculateRowHeight = (rowData: any): number => {
    const minHeight = 20;
    const maxHeight = 120;
    const charWidth = 7; // Largeur approximative d'un caractère
    
    let maxLines = 1;
    
    // Colonnes avec leurs largeurs approximatives en caractères
    const columnWidths = {
      configName: 30,
      ueName: 40,
      ecName: 45,
      description: 80
    };

    // Calculer le nombre de lignes nécessaires pour chaque colonne
    Object.entries(rowData).forEach(([key, value]) => {
      if (value && typeof value === 'string' && columnWidths[key as keyof typeof columnWidths]) {
        const columnWidth = columnWidths[key as keyof typeof columnWidths];
        const textLength = value.length;
        const estimatedLines = Math.ceil(textLength / columnWidth);
        maxLines = Math.max(maxLines, estimatedLines);
      }
    });

    // Calculer la hauteur finale
    const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, maxLines * 15));
    return calculatedHeight;
  };

  // Fonction pour appliquer un style spécialisé selon le type de cellule
  const getSpecializedCellStyle = (columnIndex: number, rowData: any, baseStyle: any) => {
    const columnHeaders = [
      'configId', 'configName', 'academicYear', 'filiere', 'niveau', 'cycle', 'option',
      'semesterId', 'semesterName', 'ueId', 'ueCode', 'ueName', 'ueCredits', 'ecId', 'ecName'
    ];
    
    const currentColumn = columnHeaders[columnIndex - 1];
    
    // Style spécialisé pour les crédits
    if (currentColumn === 'ueCredits' && rowData.ueCredits) {
      return styles.creditsCell;
    }
    
    // Style spécialisé pour les codes UE
    if (currentColumn === 'ueCode' && rowData.ueCode) {
      return styles.codeCell;
    }
    
    return baseStyle;
  };

  // Fonction pour créer une feuille stylée avec gestion avancée du texte
  const createAdvancedStyledWorksheet = async (
    workbook: ExcelJS.Workbook, 
    data: any[], 
    title: string, 
    description: string, 
    sheetName: string
  ) => {
    const worksheet = workbook.addWorksheet(sheetName);

    // Configuration avancée de la feuille
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }
    };

    // Ajouter l'en-tête informatif avec emoji et formatage avancé
    const titleText = `${title}`;
    const descText = `${description}`;
    
    worksheet.addRow([titleText]);
    worksheet.addRow([descText]);
    worksheet.addRow([]); // Ligne vide

    // Fusionner les cellules pour l'en-tête sur toute la largeur
    worksheet.mergeCells('A1:O1');
    worksheet.mergeCells('A2:O2');

    // Appliquer les styles à l'en-tête avec gestion du texte
    const headerCell = worksheet.getCell('A1');
    const descCell = worksheet.getCell('A2');
    
    headerCell.value = titleText;
    headerCell.style = styles.headerInfo;
    
    descCell.value = descText;
    descCell.style = styles.headerDesc;

    // Hauteurs des lignes d'en-tête avec calcul automatique
    worksheet.getRow(1).height = Math.max(40, Math.ceil(titleText.length / 60) * 20);
    worksheet.getRow(2).height = Math.max(30, Math.ceil(descText.length / 80) * 15);
    worksheet.getRow(3).height = 10; // Ligne de séparation

    // En-têtes de colonnes avec descriptions améliorées
    const headers = [
      'ID Config\n(Identifiant unique)', 
      'Nom Configuration\n(Formation complète)', 
      'Année Académique\n(Ex: 2024-2025)', 
      'Filière\n(Domaine d\'étude)', 
      'Niveau\n(Année)', 
      'Cycle\n(Licence/Master)', 
      'Option\n(Spécialisation)',
      'ID Semestre\n(Identifiant unique)', 
      'Nom Semestre\n(Ex: Semestre 1)', 
      'ID UE\n(Identifiant unique)', 
      'Code UE\n(Ex: INF1101)', 
      'Nom UE\n(Matière principale)', 
      'Crédits UE\n(ECTS)', 
      'ID EC\n(Identifiant unique)', 
      'Nom EC\n(Cours/Module)'
    ];
    
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 50; // Hauteur fixe pour les en-têtes

    // Appliquer les styles aux en-têtes
    headerRow.eachCell((cell) => {
      cell.style = styles.columnHeader;
    });

    // Ajouter les données avec styles conditionnels et hauteurs dynamiques
    data.forEach((rowData, index) => {
      const rowValues = [
        rowData.configId || '',
        rowData.configName || '',
        rowData.academicYear || '',
        rowData.filiere || '',
        rowData.niveau || '',
        rowData.cycle || '',
        rowData.option || '',
        rowData.semesterId || '',
        rowData.semesterName || '',
        rowData.ueId || '',
        rowData.ueCode || '',
        rowData.ueName || '',
        rowData.ueCredits || '',
        rowData.ecId || '',
        rowData.ecName || ''
      ];

      const row = worksheet.addRow(rowValues);

      // Calculer et définir la hauteur de ligne dynamiquement
      const calculatedHeight = calculateRowHeight(rowData);
      row.height = calculatedHeight;

      // Déterminer le style de base selon le type de ligne
      let baseRowStyle;
      if (rowData.ecName && rowData.ecName.trim() !== "") {
        baseRowStyle = styles.ecRow;
      } else if (rowData.ueName && rowData.ueName.trim() !== "") {
        baseRowStyle = styles.ueRow;
      } else {
        baseRowStyle = styles.configRow;
      }

      // Appliquer les styles avec spécialisations par colonne
      row.eachCell((cell, colIndex) => {
        const specializedStyle = getSpecializedCellStyle(colIndex, rowData, baseRowStyle);
        cell.style = specializedStyle;
        
        // Gestion spéciale pour les cellules vides mais avec bordures
        if (!cell.value || cell.value === '') {
          cell.value = ''; // Assurer une valeur vide propre
        }
      });
    });

    // Définir les largeurs de colonnes optimisées avec auto-ajustement
    const columnWidths = [
      { key: 'A', width: 16 },   // ID Config
      { key: 'B', width: 32 },   // Nom Configuration (plus large)
      { key: 'C', width: 18 },   // Année Académique
      { key: 'D', width: 22 },   // Filière
      { key: 'E', width: 10 },   // Niveau
      { key: 'F', width: 15 },   // Cycle
      { key: 'G', width: 22 },   // Option
      { key: 'H', width: 16 },   // ID Semestre
      { key: 'I', width: 22 },   // Nom Semestre
      { key: 'J', width: 14 },   // ID UE
      { key: 'K', width: 14 },   // Code UE
      { key: 'L', width: 42 },   // Nom UE (plus large)
      { key: 'M', width: 12 },   // Crédits UE
      { key: 'N', width: 14 },   // ID EC
      { key: 'O', width: 48 }    // Nom EC (le plus large)
    ];

    columnWidths.forEach(({ key, width }) => {
      worksheet.getColumn(key).width = width;
    });

    // Figer les lignes d'en-tête pour la navigation
    worksheet.views = [
      { 
        state: 'frozen', 
        xSplit: 0, 
        ySplit: 4,  // Figer les 4 premières lignes
        topLeftCell: 'A5',
        activeCell: 'A5'
      }
    ];

    // Ajouter des filtres automatiques sur les en-têtes
    worksheet.autoFilter = {
      from: 'A4',
      to: 'O4'
    };

    return worksheet;
  };

  // Fonction pour créer une feuille d'instructions avec mise en forme avancée
  const createAdvancedInstructionWorksheet = (workbook: ExcelJS.Workbook, instructionsData: any[], sheetName: string) => {
    const worksheet = workbook.addWorksheet(sheetName);

    // Configuration de la page pour les instructions
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      margins: {
        left: 1,
        right: 1,
        top: 1,
        bottom: 1
      }
    };

    // Titre de la section
    worksheet.addRow(['📖 GUIDE D\'UTILISATION COMPLET']);
    worksheet.addRow(['']);
    
    // Fusionner et styliser le titre
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.style = {
      font: { bold: true, size: 16, color: { argb: 'FF1F497D' } },
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

    // En-têtes du tableau d'instructions
    const headerRow = worksheet.addRow(['Étape', 'Instruction', 'Description Détaillée']);
    headerRow.height = 35;
    
    headerRow.eachCell((cell) => {
      cell.style = styles.instructionHeader;
    });

    // Données des instructions avec calcul de hauteur
    instructionsData.forEach((instruction) => {
      const row = worksheet.addRow([
        instruction.étape, 
        instruction.instruction, 
        instruction.description
      ]);
      
      // Calculer la hauteur en fonction de la longueur de la description
      const descriptionLength = instruction.description.length;
      const estimatedLines = Math.ceil(descriptionLength / 80);
      row.height = Math.max(40, estimatedLines * 15);
      
      row.eachCell((cell) => {
        cell.style = styles.instructionData;
      });
    });

    // Largeurs de colonnes optimisées
    worksheet.getColumn('A').width = 8;   // Étape
    worksheet.getColumn('B').width = 35;  // Instruction
    worksheet.getColumn('C').width = 85;  // Description (très large)

    // Ajouter une section de conseils supplémentaires
    const tipsStartRow = worksheet.rowCount + 2;
    
    worksheet.addRow(['']);
    worksheet.addRow(['💡 CONSEILS SUPPLÉMENTAIRES']);
    worksheet.addRow(['']);

    const tipsTitle = worksheet.getCell(`A${tipsStartRow + 1}`);
    worksheet.mergeCells(`A${tipsStartRow + 1}:C${tipsStartRow + 1}`);
    tipsTitle.style = {
      font: { bold: true, size: 14, color: { argb: 'FFFF8C00' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E6' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'medium', color: { argb: 'FFFF8C00' } },
        bottom: { style: 'medium', color: { argb: 'FFFF8C00' } },
        left: { style: 'medium', color: { argb: 'FFFF8C00' } },
        right: { style: 'medium', color: { argb: 'FFFF8C00' } }
      }
    };

    const tips = [
      '• Utilisez Ctrl+F pour rechercher rapidement dans le fichier',
      '• Triez les données par ID Config puis ID Semestre pour voir la hiérarchie',
      '• Les cellules avec bordures colorées indiquent différents types d\'éléments',
      '• Sauvegardez régulièrement votre travail au format .xlsx',
      '• Les formules Excel peuvent être utilisées pour calculer automatiquement les totaux de crédits'
    ];

    tips.forEach(tip => {
      const tipRow = worksheet.addRow(['', tip, '']);
      worksheet.mergeCells(`B${tipRow.number}:C${tipRow.number}`);
      tipRow.height = 25;
      tipRow.getCell(2).style = {
        font: { size: 11, italic: true },
        alignment: { horizontal: 'left', vertical: 'middle', wrapText: true }
      };
    });

    return worksheet;
  };

  const handleExportAll = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Métadonnées du document
      workbook.creator = 'Générateur de Relevés Académiques';
      workbook.lastModifiedBy = 'Système Export Excel';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.subject = 'Export Configurations Académiques';
      workbook.keywords = 'académique, configuration, export, excel';

      // Convertir les données
      const worksheetData = configs.map((config) => {
        return flattenConfig(config);
      }).flat();

      if (worksheetData.length === 0) {
        alert("Aucune donnée à exporter. Veuillez d'abord créer des configurations.");
        return;
      }

      // Créer la feuille principale avec styles avancés
      await createAdvancedStyledWorksheet(
        workbook,
        worksheetData,
        "🎓 EXPORT CONFIGURATIONS ACADÉMIQUES",
        `📅 Généré le ${new Date().toLocaleDateString('fr-FR', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })} à ${new Date().toLocaleTimeString('fr-FR')} | Total: ${worksheetData.length} entrées | Configurations: ${configs.length}`,
        "🎓 Configurations"
      );

      // Instructions détaillées
      const instructionsData = [
        { 
          étape: "1", 
          instruction: "📋 Comprendre la structure", 
          description: "Chaque ligne représente un élément constitutif (EC) dans une unité d'enseignement (UE). La hiérarchie est : Configuration → Semestre → UE → EC. Les couleurs facilitent l'identification : bleu pour les configurations, jaune pour les UEs, gris pour les ECs." 
        },
        { 
          étape: "2", 
          instruction: "🔑 Gérer les identifiants", 
          description: "Les colonnes contenant 'ID' sont cruciales pour maintenir les relations. Ne les modifiez jamais lors des mises à jour. Pour créer de nouveaux éléments, laissez ces champs vides - le système générera automatiquement de nouveaux identifiants uniques." 
        },
        { 
          étape: "3", 
          instruction: "➕ Créer de nouvelles configurations", 
          description: "Pour ajouter une nouvelle formation : 1) Choisissez un nouvel ID Config unique, 2) Remplissez toutes les informations de base, 3) Utilisez des ID cohérents pour les semestres, UEs et ECs associés, 4) Respectez la hiérarchie en dupliquant les informations parentes." 
        },
        { 
          étape: "4", 
          instruction: "⚠️ Respecter les champs obligatoires", 
          description: "Colonnes essentielles à remplir : 'Nom Configuration' (pour identifier la formation), 'Année Académique' (période), 'Nom Semestre' (pour nouveaux semestres), 'Nom UE' (matière principale), 'Nom EC' (cours spécifique). Les champs vides peuvent causer des erreurs d'importation." 
        },
        { 
          étape: "5", 
          instruction: "🔗 Comprendre les relations", 
          description: "Les éléments avec le même ID sont liés : même ID UE = éléments de la même matière, même ID Semestre = éléments du même semestre, même ID Config = éléments de la même formation. Cette logique permet de regrouper automatiquement les données lors de l'importation." 
        },
        { 
          étape: "6", 
          instruction: "📊 Gérer les crédits ECTS", 
          description: "Les crédits UE sont essentiels pour les calculs de moyenne et validation de parcours. Utilisez des nombres entiers uniquement. La somme des crédits par semestre doit généralement être de 30. Vérifiez la cohérence avec votre système académique." 
        },
        { 
          étape: "7", 
          instruction: "📤 Procédure de réimportation", 
          description: "Après modification : 1) Sauvegardez au format .xlsx, 2) Utilisez le bouton 'Importer' dans l'interface, 3) Vérifiez les messages de validation, 4) Contrôlez que toutes les données sont correctement importées. En cas d'erreur, vérifiez la structure et les champs obligatoires." 
        }
      ];

      createAdvancedInstructionWorksheet(workbook, instructionsData, "📖 Instructions");

      // Créer une feuille de résumé statistique
      const summaryWorksheet = workbook.addWorksheet("📊 Résumé");
      const configStats = configs.map(config => ({
        'Nom Configuration': config.name,
        'Année': config.academicYear,
        'Filière': config.filiere,
        'Cycle': config.cycle,
        'Nb Semestres': config.semesters.length,
        'Total UEs': config.semesters.reduce((sum, sem) => sum + sem.ues.length, 0),
        'Total ECs': config.semesters.reduce((sum, sem) => 
          sum + sem.ues.reduce((ueSum, ue) => ueSum + ue.ecs.length, 0), 0),
        'Total Crédits': config.semesters.reduce((sum, sem) => 
          sum + sem.ues.reduce((ueSum, ue) => ueSum + (ue.credits || 0), 0), 0)
      }));

      // Ajouter le titre du résumé
      summaryWorksheet.addRow(['📊 RÉSUMÉ STATISTIQUE DES CONFIGURATIONS']);
      summaryWorksheet.addRow(['']);
      summaryWorksheet.mergeCells('A1:H1');
      
      const summaryTitleCell = summaryWorksheet.getCell('A1');
      summaryTitleCell.style = {
        font: { bold: true, size: 16, color: { argb: 'FF1F497D' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thick', color: { argb: 'FF1F497D' } },
          bottom: { style: 'thick', color: { argb: 'FF1F497D' } },
          left: { style: 'thick', color: { argb: 'FF1F497D' } },
          right: { style: 'thick', color: { argb: 'FF1F497D' } }
        }
      };

      // En-têtes du tableau de résumé
      const summaryHeaders = Object.keys(configStats[0] || {});
      if (summaryHeaders.length > 0) {
        const summaryHeaderRow = summaryWorksheet.addRow(summaryHeaders);
        summaryHeaderRow.eachCell((cell) => {
          cell.style = styles.instructionHeader;
        });

        // Données du résumé
        configStats.forEach(stat => {
          const row = summaryWorksheet.addRow(Object.values(stat));
          row.eachCell((cell, colIndex) => {
            cell.style = {
              ...styles.instructionData,
              alignment: { 
                horizontal: colIndex > 4 ? 'center' : 'left', 
                vertical: 'middle',
                wrapText: true
              }
            };
          });
        });

        // Ajuster les largeurs des colonnes du résumé
        summaryWorksheet.getColumn(1).width = 35; // Nom Configuration
        summaryWorksheet.getColumn(2).width = 15; // Année
        summaryWorksheet.getColumn(3).width = 20; // Filière
        summaryWorksheet.getColumn(4).width = 15; // Cycle
        summaryWorksheet.getColumn(5).width = 12; // Nb Semestres
        summaryWorksheet.getColumn(6).width = 12; // Total UEs
        summaryWorksheet.getColumn(7).width = 12; // Total ECs
        summaryWorksheet.getColumn(8).width = 15; // Total Crédits
      }

      // Générer et télécharger le fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `configurations_academiques_${formatDate(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Notification de succès
      console.log(`✅ Export réussi : ${worksheetData.length} entrées exportées dans ${workbook.worksheets.length} feuilles`);

    } catch (error) {
      console.error("❌ Erreur lors de l'export:", error);
      alert(`Erreur lors de l'export Excel : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleExportTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      workbook.creator = 'Générateur de Relevés - Template';
      workbook.created = new Date();
      workbook.subject = 'Modèle de Configuration Académique';

      // Données de template enrichies avec plus d'exemples
      const templateData = [
        // Exemple 1 : Licence Informatique complète
        {
          configId: "LIC_INFO_2024",
          configName: "Licence Informatique",
          academicYear: "2024-2025",
          filiere: "Sciences et Technologies",
          niveau: "1",
          cycle: "Licence",
          option: "",
          semesterId: "S1_LIC_INFO",
          semesterName: "Semestre 1",
          ueId: "UE_ALGO_PROG",
          ueCode: "INF1101",
          ueName: "Algorithmes et Programmation",
          ueCredits: 6,
          ecId: "EC_INTRO_ALGO",
          ecName: "Introduction aux Algorithmes et Structures de Données"
        },
        {
          configId: "LIC_INFO_2024",
          configName: "",
          academicYear: "",
          filiere: "",
          niveau: "",
          cycle: "",
          option: "",
          semesterId: "S1_LIC_INFO",
          semesterName: "",
          ueId: "UE_ALGO_PROG",
          ueCode: "",
          ueName: "",
          ueCredits: "",
          ecId: "EC_PROG_STRUCT",
          ecName: "Programmation Structurée en C"
        },
        {
          configId: "LIC_INFO_2024",
          configName: "",
          academicYear: "",
          filiere: "",
          niveau: "",
          cycle: "",
          option: "",
          semesterId: "S1_LIC_INFO",
          semesterName: "",
          ueId: "UE_MATH_INFO",
          ueCode: "MAT1101",
          ueName: "Mathématiques pour l'Informatique",
          ueCredits: 5,
          ecId: "EC_LOGIQUE",
          ecName: "Logique Mathématique et Ensembles"
        },
        {
          configId: "LIC_INFO_2024",
          configName: "",
          academicYear: "",
          filiere: "",
          niveau: "",
          cycle: "",
          option: "",
          semesterId: "S1_LIC_INFO",
          semesterName: "",
          ueId: "UE_MATH_INFO",
          ueCode: "",
          ueName: "",
          ueCredits: "",
          ecId: "EC_ALGEBRE",
          ecName: "Algèbre Linéaire Appliquée"
        },
        // Exemple 2 : Master Pharmacie
        {
          configId: "MAST_PHARMA_2024",
          configName: "Master Pharmacie Industrielle",
          academicYear: "2024-2025",
          filiere: "Sciences de la Santé",
          niveau: "5",
          cycle: "Master",
          option: "Industrie Pharmaceutique",
          semesterId: "S3_MAST_PHARMA",
          semesterName: "Semestre 3",
          ueId: "UE_PHARMACO_CLIN",
          ueCode: "PHA5301",
          ueName: "Pharmacologie Clinique Avancée",
          ueCredits: 7,
          ecId: "EC_PHARMACOCIN",
          ecName: "Pharmacocinétique et Pharmacodynamie"
        },
        {
          configId: "MAST_PHARMA_2024",
          configName: "",
          academicYear: "",
          filiere: "",
          niveau: "",
          cycle: "",
          option: "",
          semesterId: "S3_MAST_PHARMA",
          semesterName: "",
          ueId: "UE_PHARMACO_CLIN",
          ueCode: "",
          ueName: "",
          ueCredits: "",
          ecId: "EC_ESSAIS_CLIN",
          ecName: "Méthodologie des Essais Cliniques"
        }
      ];

      await createAdvancedStyledWorksheet(
        workbook,
        templateData,
        "📋 MODÈLE DE CONFIGURATION ACADÉMIQUE",
        "🚀 Template professionnel à personnaliser selon vos besoins | Exemples concrets inclus | Respectez la structure hiérarchique",
        "📋 Modèle"
      );

      // Instructions spécialisées pour le template
      const templateInstructions = [
        { 
          étape: "1", 
          instruction: "🎯 Utiliser ce modèle", 
          description: "Ce fichier contient des exemples concrets de configurations académiques. Remplacez les données d'exemple par vos propres informations en conservant la même structure. Chaque couleur représente un niveau hiérarchique différent." 
        },
        { 
          étape: "2", 
          instruction: "🔄 Dupliquer les structures", 
          description: "Pour créer une nouvelle configuration : 1) Copiez un bloc existant, 2) Changez l'ID Config, 3) Mettez à jour toutes les informations, 4) Conservez la logique de regroupement des IDs. Les lignes vides dans certaines colonnes sont normales et intentionnelles." 
        },
        { 
          étape: "3", 
          instruction: "📝 Remplir les informations", 
          description: "Informations obligatoires : Nom Configuration (première occurrence), Année Académique, Nom Semestre (première occurrence), Nom UE (première occurrence), Nom EC (toujours). Les autres champs peuvent être laissés vides sur les lignes de détail." 
        },
        { 
          étape: "4", 
          instruction: "🔢 Gérer les identifiants", 
          description: "Utilisez des IDs parlants et cohérents : LIC_INFO_2024 pour une licence, S1_LIC_INFO pour le semestre 1, UE_ALGO_PROG pour une UE d'algorithmique. Cette logique facilite la maintenance et la compréhension." 
        },
        { 
          étape: "5", 
          instruction: "⚖️ Équilibrer les crédits", 
          description: "Répartition typique : 30 crédits par semestre, 4-8 crédits par UE selon l'importance. Vérifiez que le total de crédits correspond aux exigences de votre institution. Les crédits sont essentiels pour les calculs de moyenne." 
        },
        { 
          étape: "6", 
          instruction: "🔍 Vérifier avant import", 
          description: "Avant l'importation : 1) Vérifiez l'orthographe des noms, 2) Contrôlez la cohérence des IDs, 3) Validez les totaux de crédits, 4) Assurez-vous que chaque UE a au moins un EC, 5) Testez avec un petit échantillon d'abord." 
        },
        { 
          étape: "7", 
          instruction: "📤 Importer les données", 
          description: "Une fois votre fichier prêt : 1) Sauvegardez au format .xlsx, 2) Utilisez le bouton 'Importer', 3) Vérifiez les messages de confirmation, 4) Contrôlez que toutes vos configurations apparaissent correctement dans l'interface." 
        }
      ];

      createAdvancedInstructionWorksheet(workbook, templateInstructions, "📖 Guide Template");

      // Feuille d'exemples détaillés avec explications
      const examplesWorksheet = workbook.addWorksheet("💡 Exemples");
      
      // Titre des exemples
      examplesWorksheet.addRow(['💡 EXEMPLES DÉTAILLÉS ET EXPLICATIONS']);
      examplesWorksheet.addRow(['']);
      examplesWorksheet.mergeCells('A1:C1');
      
      const examplesTitleCell = examplesWorksheet.getCell('A1');
      examplesTitleCell.style = styles.headerInfo;

      // Exemples avec explications
      const examplesData = [
        {
          élément: "LIC_INFO_2024",
          type: "🎓 ID Configuration",
          explication: "Identifiant unique de la formation : LIC (Licence) + INFO (Informatique) + 2024 (année). Format recommandé pour faciliter l'identification et le tri."
        },
        {
          élément: "Licence Informatique",
          type: "📚 Nom Configuration",
          explication: "Nom complet de la formation tel qu'il apparaîtra sur les documents officiels. Doit être précis et conforme à la nomenclature institutionnelle."
        },
        {
          élément: "S1_LIC_INFO",
          type: "📅 ID Semestre",
          explication: "Identifiant du semestre : S1 (Semestre 1) + LIC_INFO (référence à la configuration parent). Permet de lier le semestre à sa formation."
        },
        {
          élément: "UE_ALGO_PROG",
          type: "📖 ID Unité d'Enseignement",
          explication: "Identifiant de l'UE : UE + ALGO_PROG (Algorithmes Programmation). Doit être unique au sein du semestre et refléter le contenu."
        },
        {
          élément: "INF1101",
          type: "🔤 Code UE",
          explication: "Code officiel de l'UE : INF (Informatique) + 1 (niveau 1) + 101 (numéro séquentiel). Format standardisé selon les règles institutionnelles."
        },
        {
          élément: "EC_INTRO_ALGO",
          type: "📝 ID Élément Constitutif",
          explication: "Identifiant de l'EC : EC + INTRO_ALGO (Introduction Algorithmes). Chaque EC doit avoir un ID unique au sein de son UE parente."
        },
        {
          élément: "6",
          type: "🎯 Crédits ECTS",
          explication: "Nombre de crédits européens attribués à l'UE. Reflète la charge de travail : 1 crédit = 25-30h de travail étudiant. Total semestre typique = 30 crédits."
        },
        {
          élément: "Sciences et Technologies",
          type: "🏷️ Filière",
          explication: "Domaine disciplinaire principal de la formation. Utilisé pour les statistiques et le regroupement des formations par secteur d'activité."
        }
      ];

      // En-têtes des exemples
      const examplesHeaderRow = examplesWorksheet.addRow(['Élément', 'Type', 'Explication Détaillée']);
      examplesHeaderRow.eachCell((cell) => {
        cell.style = styles.instructionHeader;
      });

      // Données des exemples avec hauteur adaptative
      examplesData.forEach((example) => {
        const row = examplesWorksheet.addRow([example.élément, example.type, example.explication]);
        
        // Calculer la hauteur selon la longueur de l'explication
        const explanationLength = example.explication.length;
        const estimatedLines = Math.ceil(explanationLength / 90);
        row.height = Math.max(35, estimatedLines * 16);
        
        row.eachCell((cell, colIndex) => {
          cell.style = {
            ...styles.instructionData,
            font: { 
              size: colIndex === 1 ? 11 : 10,
              bold: colIndex === 1,
              name: 'Calibri'
            }
          };
        });
      });

      // Largeurs optimisées pour les exemples
      examplesWorksheet.getColumn(1).width = 25; // Élément
      examplesWorksheet.getColumn(2).width = 25; // Type
      examplesWorksheet.getColumn(3).width = 90; // Explication

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `modele_configuration_academique_${formatDate(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("✅ Template exporté avec succès");

    } catch (error) {
      console.error("❌ Erreur lors de l'export du template:", error);
      alert(`Erreur lors de l'export du template : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      // Trouver la feuille principale avec une logique améliorée
      let worksheet = workbook.worksheets[0];
      const priorityNames = ['config', 'modèle', 'template', 'données'];
      
      for (const ws of workbook.worksheets) {
        const wsNameLower = (ws.name || '').toLowerCase();
        if (priorityNames.some(name => wsNameLower.includes(name)) && 
            !wsNameLower.includes('instruction') && 
            !wsNameLower.includes('guide') &&
            !wsNameLower.includes('exemple') &&
            !wsNameLower.includes('résumé')) {
          worksheet = ws;
          break;
        }
      }

      const jsonData: any[] = [];
      const headers: string[] = [];

      // Recherche intelligente de la ligne d'en-têtes
      let headerRowIndex = 4;
      const possibleHeaders = ['ID Config', 'configId', 'Nom Configuration', 'configName'];
      
      for (let i = 1; i <= 15; i++) {
        const row = worksheet.getRow(i);
        let foundHeaders = 0;
        
        row.eachCell((cell) => {
          const cellValue = cell.value?.toString() || '';
          if (possibleHeaders.some(header => 
            (cellValue || '').toLowerCase().includes((header || '').toLowerCase()))) {
            foundHeaders++;
          }
        });
        
        if (foundHeaders >= 2) {
          headerRowIndex = i;
          break;
        }
      }

      // Extraire les en-têtes avec gestion des cellules fusionnées
      const headerRow = worksheet.getRow(headerRowIndex);
      headerRow.eachCell((cell, colIndex) => {
        let cellValue = cell.value?.toString() || '';
        
        // Nettoyer les en-têtes (supprimer les retours à la ligne)
        cellValue = cellValue.replace(/\n/g, ' ').trim();
        headers[colIndex] = cellValue;
      });

      // Extraire les données avec validation améliorée
      let validRowsCount = 0;
      for (let rowIndex = headerRowIndex + 1; rowIndex <= worksheet.rowCount; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const rowData: any = {};
        let hasValidData = false;

        row.eachCell((cell, colIndex) => {
          const header = headers[colIndex];
          const cellValue = cell.value;
          
          if (header && cellValue !== null && cellValue !== undefined) {
            // Mapper les en-têtes français vers les clés anglaises
            const keyMap: Record<string, string> = {
              'ID Config': 'configId',
              'Nom Configuration': 'configName',
              'Année Académique': 'academicYear',
              'Filière': 'filiere',
              'Niveau': 'niveau',
              'Cycle': 'cycle',
              'Option': 'option',
              'ID Semestre': 'semesterId',
              'Nom Semestre': 'semesterName',
              'ID UE': 'ueId',
              'Code UE': 'ueCode',
              'Nom UE': 'ueName',
              'Crédits UE': 'ueCredits',
              'ID EC': 'ecId',
              'Nom EC': 'ecName'
            };

            const cleanHeader = header.replace(/\n.*/, '').trim(); // Garder seulement la première ligne de l'en-tête
            const key = keyMap[cleanHeader] || (cleanHeader || '').toLowerCase().replace(/\s+/g, '');
            
            let processedValue = cellValue.toString().trim();
            
            // Traitement spécial pour les crédits
            if (key === 'ueCredits') {
              const numValue = parseInt(processedValue);
              processedValue = isNaN(numValue) ? '' : numValue.toString();
            }
            
            if (processedValue !== '') {
              rowData[key] = processedValue;
              hasValidData = true;
            }
          }
        });

        // Validation de la ligne
        const hasEssentialData = rowData.configName || rowData.ueName || 
                                rowData.semesterName || rowData.ecName;
        
        if (hasValidData && hasEssentialData) {
          jsonData.push(rowData);
          validRowsCount++;
        }
      }

      if (jsonData.length === 0) {
        alert("❌ Aucune donnée valide trouvée dans le fichier.\n\nVérifiez que :\n• La feuille contient des données\n• Les en-têtes sont corrects\n• Au moins une ligne contient des informations valides");
        return;
      }

      console.log(`📊 Import : ${validRowsCount} lignes valides trouvées`);

      const importedConfigs = convertToConfigFormat(jsonData);
      
      if (importedConfigs.length === 0) {
        alert("❌ Impossible de créer des configurations à partir des données importées.\n\nVérifiez la structure de vos données.");
        return;
      }

      onImport(importedConfigs);
      
      // Réinitialiser l'input
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Message de succès
      alert(`✅ Import réussi !\n\n📊 Statistiques :\n• ${importedConfigs.length} configuration(s) importée(s)\n• ${validRowsCount} ligne(s) de données traitée(s)\n• Source : ${worksheet.name}`);

    } catch (error) {
      console.error("❌ Erreur lors de l'importation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`❌ Erreur lors de l'importation du fichier Excel.\n\nDétails : ${errorMessage}\n\nVérifiez :\n• Le format du fichier (.xlsx)\n• La structure des données\n• Les droits d'accès au fichier`);
    }
  };

  // Fonctions utilitaires optimisées
  const flattenConfig = (config: ClassConfig) => {
    const result: any[] = [];
    
    config.semesters.forEach(semester => {
      semester.ues.forEach(ue => {
        if (ue.ecs.length > 0) {
          ue.ecs.forEach(ec => {
            result.push({
              configId: config.id,
              configName: config.name,
              academicYear: config.academicYear,
              filiere: config.filiere || "",
              niveau: config.niveau || "",
              cycle: config.cycle || "",
              option: config.option || "",
              semesterId: semester.id,
              semesterName: semester.name,
              ueId: ue.id,
              ueCode: ue.code || "",
              ueName: ue.name,
              ueCredits: ue.credits,
              ecId: ec.id,
              ecName: ec.name
            });
          });
        } else {
          result.push({
            configId: config.id,
            configName: config.name,
            academicYear: config.academicYear,
            filiere: config.filiere || "",
            niveau: config.niveau || "",
            cycle: config.cycle || "",
            option: config.option || "",
            semesterId: semester.id,
            semesterName: semester.name,
            ueId: ue.id,
            ueCode: ue.code || "",
            ueName: ue.name,
            ueCredits: ue.credits,
            ecId: "",
            ecName: ""
          });
        }
      });
    });
    
    return result;
  };

  const convertToConfigFormat = (data: any[]): ClassConfig[] => {
    const configsMap = new Map<string, ClassConfig>();
    
    data.forEach((row, index) => {
      try {
        const configId = row.configId || `config_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        if (!configsMap.has(configId)) {
          configsMap.set(configId, {
            id: configId,
            name: row.configName || `Configuration ${configId}`,
            academicYear: row.academicYear || "",
            filiere: row.filiere || "",
            niveau: row.niveau || "",
            cycle: row.cycle || "",
            option: row.option || "",
            semesters: []
          });
        }
        
        const config = configsMap.get(configId)!;
        
        const semesterId = row.semesterId || `semester_${Date.now()}_${index}`;
        let semester = config.semesters.find(s => s.id === semesterId);
        if (!semester) {
          semester = {
            id: semesterId,
            name: row.semesterName || `Semestre ${semesterId}`,
            ues: []
          };
          config.semesters.push(semester);
        }
        
        const ueId = row.ueId || `ue_${Date.now()}_${index}`;
        let ue = semester.ues.find(u => u.id === ueId);
        if (!ue) {
          ue = {
            id: ueId,
            name: row.ueName || `UE ${ueId}`,
            code: row.ueCode || "",
            credits: parseInt(row.ueCredits) || 0,
            ecs: []
          };
          semester.ues.push(ue);
        }
        
        if (row.ecName && row.ecName.trim() !== '') {
          const ecId = row.ecId || `ec_${Date.now()}_${index}`;
          const ecExists = ue.ecs.some(e => e.id === ecId);
          if (!ecExists) {
            const ec: EC = {
              id: ecId,
              name: row.ecName.trim()
            };
            ue.ecs.push(ec);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erreur ligne ${index + 1}:`, error);
      }
    });
    
    return Array.from(configsMap.values());
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportAll}
        className="text-green-600 hover:text-green-700 hover:bg-green-50 whitespace-nowrap transition-colors duration-200"
        title="Exporter toutes les configurations vers Excel avec styles avancés"
      >
        <Download className="h-4 w-4 mr-2" />
        Exporter
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportTemplate}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 whitespace-nowrap transition-colors duration-200"
        title="Télécharger un modèle Excel pré-formaté avec exemples"
      >
        <FileDown className="h-4 w-4 mr-2" />
        Télécharger Modèle
      </Button>
      
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 whitespace-nowrap transition-colors duration-200"
          title="Importer des configurations depuis un fichier Excel"
        >
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".xlsx,.xls" 
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  );
};