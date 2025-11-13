import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileDown } from "lucide-react";
import ExcelJS from 'exceljs';
import { ClassConfig, Semester, UE, EC } from "@/components/organisms/configs/types";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";

interface ImportExportExcelProps {
  configs: ClassConfig[];
  onImport: (configs: ClassConfig[]) => void;
}

export const ImportExportExcel: React.FC<ImportExportExcelProps> = ({
  configs,
  onImport,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toasts, toast, removeToast } = useToast();

  // État pour stocker le workbook et permettre de changer de feuille
  const [loadedWorkbook, setLoadedWorkbook] = React.useState<ExcelJS.Workbook | null>(null);
  const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = React.useState<number>(0);
  const [uploadedFileName, setUploadedFileName] = React.useState<string>('');

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

  // Fonction utilitaire pour nettoyer les valeurs
  const cleanValue = (value: any): any => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Nettoyer les caractères de contrôle problématiques
      return value.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    }
    return value;
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

    // Ajouter l'en-tête informatif avec formatage avancé
    const titleText = cleanValue(title);
    const descText = cleanValue(description);

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

    // En-têtes de colonnes avec accents
    const headers = [
      'ID Config',
      'Nom Configuration',
      'Année Académique',
      'Filière',
      'Niveau',
      'Cycle',
      'Option',
      'ID Semestre',
      'Nom Semestre',
      'ID UE',
      'Code UE',
      'Nom UE',
      'Crédits UE',
      'ID EC',
      'Nom EC'
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
        cleanValue(rowData.configId || ''),
        cleanValue(rowData.configName || ''),
        cleanValue(rowData.academicYear || ''),
        cleanValue(rowData.filiere || ''),
        cleanValue(rowData.niveau || ''),
        cleanValue(rowData.cycle || ''),
        cleanValue(rowData.option || ''),
        cleanValue(rowData.semesterId || ''),
        cleanValue(rowData.semesterName || ''),
        cleanValue(rowData.ueId || ''),
        cleanValue(rowData.ueCode || ''),
        cleanValue(rowData.ueName || ''),
        rowData.ueCredits !== '' && rowData.ueCredits !== null && rowData.ueCredits !== undefined ? Number(rowData.ueCredits) : '',
        cleanValue(rowData.ecId || ''),
        cleanValue(rowData.ecName || '')
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

    // Titre de la section
    worksheet.addRow([cleanValue('GUIDE D\'UTILISATION COMPLET')]);
    worksheet.addRow(['']);

    // Fusionner le titre
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1F497D' } };
    titleCell.fill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFE7F3FF' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    // En-têtes du tableau d'instructions
    const headerRow = worksheet.addRow([
      cleanValue('Étape'),
      cleanValue('Instruction'),
      cleanValue('Description Détaillée')
    ]);
    headerRow.height = 35;

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF70AD47' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Données des instructions
    instructionsData.forEach((instruction) => {
      const row = worksheet.addRow([
        cleanValue(instruction.étape),
        cleanValue(instruction.instruction),
        cleanValue(instruction.description)
      ]);

      const descriptionLength = (instruction.description || '').length;
      const estimatedLines = Math.ceil(descriptionLength / 80);
      row.height = Math.max(40, estimatedLines * 15);

      row.eachCell((cell) => {
        cell.font = { size: 10 };
        cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
      });
    });

    // Largeurs de colonnes
    worksheet.getColumn('A').width = 8;
    worksheet.getColumn('B').width = 35;
    worksheet.getColumn('C').width = 85;

    // Section conseils
    const tipsStartRow = worksheet.rowCount + 2;
    worksheet.addRow(['']);
    worksheet.addRow([cleanValue('CONSEILS SUPPLEMENTAIRES')]);
    worksheet.addRow(['']);

    const tipsTitle = worksheet.getCell(`A${tipsStartRow + 1}`);
    worksheet.mergeCells(`A${tipsStartRow + 1}:C${tipsStartRow + 1}`);
    tipsTitle.font = { bold: true, size: 14, color: { argb: 'FFFF8C00' } };
    tipsTitle.fill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFFFF4E6' }
    };
    tipsTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    const tips = [
      'Utilisez Ctrl+F pour rechercher rapidement dans le fichier',
      'Triez les données par ID Config puis ID Semestre pour voir la hiérarchie',
      'Les cellules avec bordures colorées indiquent différents types d\'éléments',
      'Sauvegardez régulièrement votre travail au format .xlsx',
      'Les formules Excel peuvent être utilisées pour calculer automatiquement les totaux de crédits'
    ];

    tips.forEach(tip => {
      const tipRow = worksheet.addRow(['', cleanValue(tip), '']);
      worksheet.mergeCells(`B${tipRow.number}:C${tipRow.number}`);
      tipRow.height = 25;
      tipRow.getCell(2).font = { size: 11, italic: true };
      tipRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
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
        toast.warning("Aucune donnée à exporter", "Veuillez d'abord créer des configurations.");
        return;
      }

      // Créer la feuille principale avec styles avancés
      await createAdvancedStyledWorksheet(
        workbook,
        worksheetData,
        "EXPORT CONFIGURATIONS ACADEMIQUES",
        `Genere le ${new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })} a ${new Date().toLocaleTimeString('fr-FR')} | Total: ${worksheetData.length} entrees | Configurations: ${configs.length}`,
        "Configurations"
      );

      // Instructions détaillées
      const instructionsData = [
        {
          étape: "1",
          instruction: "Comprendre la structure", 
          description: "Chaque ligne représente un élément constitutif (EC) dans une unité d'enseignement (UE). La hiérarchie est : Configuration → Semestre → UE → EC. Les couleurs facilitent l'identification : bleu pour les configurations, jaune pour les UEs, gris pour les ECs." 
        },
        {
          étape: "2",
          instruction: "Gerer les identifiants", 
          description: "Les colonnes contenant 'ID' sont cruciales pour maintenir les relations. Ne les modifiez jamais lors des mises à jour. Pour créer de nouveaux éléments, laissez ces champs vides - le système générera automatiquement de nouveaux identifiants uniques." 
        },
        {
          étape: "3",
          instruction: "Creer de nouvelles configurations",
          description: "Pour ajouter une nouvelle formation : 1) Choisissez un nouvel ID Config unique, 2) Remplissez toutes les informations de base, 3) Utilisez des ID coherents pour les semestres, UEs et ECs associes, 4) Respectez la hierarchie en dupliquant les informations parentes."
        },
        {
          étape: "4",
          instruction: "Respecter les champs obligatoires",
          description: "Colonnes essentielles a remplir : 'Nom Configuration' (pour identifier la formation), 'Annee Academique' (periode), 'Nom Semestre' (pour nouveaux semestres), 'Nom UE' (matiere principale), 'Nom EC' (cours specifique). Les champs vides peuvent causer des erreurs d'importation."
        },
        {
          étape: "5",
          instruction: "Comprendre les relations",
          description: "Les elements avec le meme ID sont lies : meme ID UE = elements de la meme matiere, meme ID Semestre = elements du meme semestre, meme ID Config = elements de la meme formation. Cette logique permet de regrouper automatiquement les donnees lors de l'importation."
        },
        {
          étape: "6",
          instruction: "Gerer les credits ECTS",
          description: "Les credits UE sont essentiels pour les calculs de moyenne et validation de parcours. Utilisez des nombres entiers uniquement. La somme des credits par semestre doit generalement etre de 30. Verifiez la coherence avec votre systeme academique."
        },
        {
          étape: "7",
          instruction: "Procedure de reimportation",
          description: "Apres modification : 1) Sauvegardez au format .xlsx, 2) Utilisez le bouton 'Importer' dans l'interface, 3) Verifiez les messages de validation, 4) Controlez que toutes les donnees sont correctement importees. En cas d'erreur, verifiez la structure et les champs obligatoires."
        }
      ];

      createAdvancedInstructionWorksheet(workbook, instructionsData, "Instructions");

      // Créer une feuille de résumé statistique
      const summaryWorksheet = workbook.addWorksheet("Resume");
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
      summaryWorksheet.addRow(['RESUME STATISTIQUE DES CONFIGURATIONS']);
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
      toast.error("Erreur lors de l'export Excel", error instanceof Error ? error.message : 'Erreur inconnue');
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
        "MODELE DE CONFIGURATION ACADEMIQUE",
        "Template professionnel a personnaliser selon vos besoins | Exemples concrets inclus | Respectez la structure hierarchique",
        "Modele"
      );

      // Instructions spécialisées pour le template
      const templateInstructions = [
        {
          étape: "1",
          instruction: "Utiliser ce modele", 
          description: "Ce fichier contient des exemples concrets de configurations académiques. Remplacez les données d'exemple par vos propres informations en conservant la même structure. Chaque couleur représente un niveau hiérarchique différent." 
        },
        {
          étape: "2",
          instruction: "Dupliquer les structures",
          description: "Pour creer une nouvelle configuration : 1) Copiez un bloc existant, 2) Changez l'ID Config, 3) Mettez a jour toutes les informations, 4) Conservez la logique de regroupement des IDs. Les lignes vides dans certaines colonnes sont normales et intentionnelles."
        },
        {
          étape: "3",
          instruction: "Remplir les informations",
          description: "Informations obligatoires : Nom Configuration (premiere occurrence), Annee Academique, Nom Semestre (premiere occurrence), Nom UE (premiere occurrence), Nom EC (toujours). Les autres champs peuvent etre laisses vides sur les lignes de detail."
        },
        {
          étape: "4",
          instruction: "Gerer les identifiants",
          description: "Utilisez des IDs parlants et coherents : LIC_INFO_2024 pour une licence, S1_LIC_INFO pour le semestre 1, UE_ALGO_PROG pour une UE d'algorithmique. Cette logique facilite la maintenance et la comprehension."
        },
        {
          étape: "5",
          instruction: "Equilibrer les credits",
          description: "Repartition typique : 30 credits par semestre, 4-8 credits par UE selon l'importance. Verifiez que le total de credits correspond aux exigences de votre institution. Les credits sont essentiels pour les calculs de moyenne."
        },
        {
          étape: "6",
          instruction: "Verifier avant import",
          description: "Avant l'importation : 1) Verifiez l'orthographe des noms, 2) Controlez la coherence des IDs, 3) Validez les totaux de credits, 4) Assurez-vous que chaque UE a au moins un EC, 5) Testez avec un petit echantillon d'abord."
        },
        {
          étape: "7",
          instruction: "Importer les donnees",
          description: "Une fois votre fichier pret : 1) Sauvegardez au format .xlsx, 2) Utilisez le bouton 'Importer', 3) Verifiez les messages de confirmation, 4) Controlez que toutes vos configurations apparaissent correctement dans l'interface."
        }
      ];

      createAdvancedInstructionWorksheet(workbook, templateInstructions, "Guide Template");

      // Feuille d'exemples détaillés avec explications
      const examplesWorksheet = workbook.addWorksheet("Exemples");

      // Titre des exemples
      examplesWorksheet.addRow(['EXEMPLES DETAILLES ET EXPLICATIONS']);
      examplesWorksheet.addRow(['']);
      examplesWorksheet.mergeCells('A1:C1');
      
      const examplesTitleCell = examplesWorksheet.getCell('A1');
      examplesTitleCell.style = styles.headerInfo;

      // Exemples avec explications
      const examplesData = [
        {
          élément: "LIC_INFO_2024",
          type: "ID Configuration",
          explication: "Identifiant unique de la formation : LIC (Licence) + INFO (Informatique) + 2024 (annee). Format recommande pour faciliter l'identification et le tri."
        },
        {
          élément: "Licence Informatique",
          type: "Nom Configuration",
          explication: "Nom complet de la formation tel qu'il apparaitra sur les documents officiels. Doit etre precis et conforme a la nomenclature institutionnelle."
        },
        {
          élément: "S1_LIC_INFO",
          type: "ID Semestre",
          explication: "Identifiant du semestre : S1 (Semestre 1) + LIC_INFO (reference a la configuration parent). Permet de lier le semestre a sa formation."
        },
        {
          élément: "UE_ALGO_PROG",
          type: "ID Unite d'Enseignement",
          explication: "Identifiant de l'UE : UE + ALGO_PROG (Algorithmes Programmation). Doit etre unique au sein du semestre et reflechir le contenu."
        },
        {
          élément: "INF1101",
          type: "Code UE",
          explication: "Code officiel de l'UE : INF (Informatique) + 1 (niveau 1) + 101 (numero sequentiel). Format standardise selon les regles institutionnelles."
        },
        {
          élément: "EC_INTRO_ALGO",
          type: "ID Element Constitutif",
          explication: "Identifiant de l'EC : EC + INTRO_ALGO (Introduction Algorithmes). Chaque EC doit avoir un ID unique au sein de son UE parente."
        },
        {
          élément: "6",
          type: "Credits ECTS",
          explication: "Nombre de credits europeens attribues a l'UE. Reflete la charge de travail : 1 credit = 25-30h de travail etudiant. Total semestre typique = 30 credits."
        },
        {
          élément: "Sciences et Technologies",
          type: "Filiere",
          explication: "Domaine disciplinaire principal de la formation. Utilise pour les statistiques et le regroupement des formations par secteur d'activite."
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
      toast.error("Erreur lors de l'export du template", error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  // Fonction pour charger le fichier sans le traiter
  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      // Sauvegarder le workbook et lister les feuilles
      setLoadedWorkbook(workbook);
      setUploadedFileName(file.name);
      const sheetNames = workbook.worksheets.map(ws => ws.name);
      setAvailableSheets(sheetNames);

      // Trouver la feuille principale par défaut
      let defaultSheetIndex = 0;
      const priorityNames = ['config', 'modèle', 'template', 'données'];

      for (let i = 0; i < workbook.worksheets.length; i++) {
        const ws = workbook.worksheets[i];
        const wsNameLower = (ws.name || '').toLowerCase();
        if (priorityNames.some(name => wsNameLower.includes(name)) &&
            !wsNameLower.includes('instruction') &&
            !wsNameLower.includes('guide') &&
            !wsNameLower.includes('exemple') &&
            !wsNameLower.includes('résumé')) {
          defaultSheetIndex = i;
          break;
        }
      }

      setSelectedSheetIndex(defaultSheetIndex);

      console.log("✅ Fichier chargé:", file.name);
      console.log("📋 Feuilles disponibles:", sheetNames);
      console.log("🎯 État loadedWorkbook:", workbook ? "OK" : "NULL");
      console.log("🎯 État availableSheets:", sheetNames);

      toast.success(
        "Fichier chargé",
        `${sheetNames.length} feuille(s) trouvée(s). Sélectionnez la feuille à importer.`
      );

    } catch (error) {
      console.error("❌ Erreur lors du chargement:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(
        "Erreur lors du chargement",
        `${errorMessage} - Vérifiez le format du fichier (.xlsx)`
      );
    }
  };

  // Fonction pour traiter une feuille spécifique
  const processSheet = async (sheetIndex: number) => {
    if (!loadedWorkbook) {
      toast.error("Aucun fichier chargé", "Veuillez d'abord charger un fichier Excel");
      return;
    }

    try {
      const worksheet = loadedWorkbook.worksheets[sheetIndex];

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

      // Extraire les données avec validation améliorée et propagation des valeurs
      let validRowsCount = 0;
      let lastValidValues: any = {}; // Pour propager les valeurs de configuration/semestre/UE

      for (let rowIndex = headerRowIndex + 1; rowIndex <= worksheet.rowCount; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const rowData: any = {};
        let hasValidData = false;

        row.eachCell((cell, colIndex) => {
          const header = headers[colIndex];
          const cellValue = cell.value;

          if (header) {
            // Mapper les en-têtes français vers les clés anglaises
            const keyMap: Record<string, string> = {
              'ID Config': 'configId',
              'Nom Configuration': 'configName',
              'Annee Academique': 'academicYear',
              'Année Académique': 'academicYear', // Ancienne version pour compatibilité
              'Filiere': 'filiere',
              'Filière': 'filiere', // Ancienne version
              'Niveau': 'niveau',
              'Cycle': 'cycle',
              'Option': 'option',
              'ID Semestre': 'semesterId',
              'Nom Semestre': 'semesterName',
              'ID UE': 'ueId',
              'Code UE': 'ueCode',
              'Nom UE': 'ueName',
              'Credits UE': 'ueCredits',
              'Crédits UE': 'ueCredits', // Ancienne version
              'ID EC': 'ecId',
              'Nom EC': 'ecName'
            };

            const cleanHeader = header.replace(/\n.*/, '').trim(); // Garder seulement la première ligne de l'en-tête
            const key = keyMap[cleanHeader] || (cleanHeader || '').toLowerCase().replace(/\s+/g, '');

            if (cellValue !== null && cellValue !== undefined) {
              let processedValue = cellValue.toString().trim();

              // Traitement spécial pour les crédits
              if (key === 'ueCredits') {
                const numValue = parseInt(processedValue);
                processedValue = isNaN(numValue) ? '' : numValue.toString();
              }

              if (processedValue !== '') {
                rowData[key] = processedValue;
                hasValidData = true;

                // Sauvegarder les valeurs importantes pour propagation
                if (['configId', 'configName', 'academicYear', 'filiere', 'niveau', 'cycle', 'option',
                     'semesterId', 'semesterName', 'ueId', 'ueCode', 'ueName', 'ueCredits'].includes(key)) {
                  lastValidValues[key] = processedValue;
                }
              }
            }
          }
        });

        // Propager les valeurs manquantes depuis la dernière ligne valide
        if (hasValidData) {
          // Propager les valeurs de configuration si manquantes
          const keysToPropagate = [
            'configId', 'configName', 'academicYear', 'filiere', 'niveau', 'cycle', 'option',
            'semesterId', 'semesterName', 'ueId', 'ueCode', 'ueName', 'ueCredits'
          ];

          keysToPropagate.forEach(key => {
            if (!rowData[key] && lastValidValues[key]) {
              rowData[key] = lastValidValues[key];
            }
          });

          // Validation de la ligne
          const hasEssentialData = rowData.configName || rowData.ueName ||
                                  rowData.semesterName || rowData.ecName;

          if (hasEssentialData) {
            jsonData.push(rowData);
            validRowsCount++;
          }
        }
      }

      if (jsonData.length === 0) {
        toast.error(
          "Aucune donnée valide trouvée",
          "Vérifiez que la feuille contient des données, que les en-têtes sont corrects et qu'au moins une ligne contient des informations valides"
        );
        console.log("Debug - Headers found:", headers);
        console.log("Debug - Header row index:", headerRowIndex);
        console.log("Debug - Total rows in worksheet:", worksheet.rowCount);
        return;
      }

      console.log(`📊 Import : ${validRowsCount} lignes valides trouvées`);

      const importedConfigs = convertToConfigFormat(jsonData);
      
      if (importedConfigs.length === 0) {
        toast.error("Impossible de créer des configurations", "Vérifiez la structure de vos données.");
        return;
      }

      onImport(importedConfigs);

      // Message de succès
      toast.success(
        "Import réussi !",
        `${importedConfigs.length} configuration(s) importée(s) • ${validRowsCount} ligne(s) traitée(s) • Source : ${worksheet.name}`
      );

    } catch (error) {
      console.error("❌ Erreur lors de l'importation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(
        "Erreur lors de l'importation",
        `${errorMessage} - Vérifiez la structure des données`
      );
    }
  };

  // Fonction pour réinitialiser le chargement
  const resetFileLoad = () => {
    setLoadedWorkbook(null);
    setAvailableSheets([]);
    setSelectedSheetIndex(0);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Fonctions utilitaires optimisées
  const flattenConfig = (config: ClassConfig) => {
    const result: any[] = [];
    let isFirstConfigRow = true;

    config.semesters.forEach((semester, semIndex) => {
      let isFirstSemesterRow = true;

      semester.ues.forEach((ue, ueIndex) => {
        let isFirstUERow = true;

        if (ue.ecs.length > 0) {
          ue.ecs.forEach((ec, ecIndex) => {
            result.push({
              configId: config.id,
              configName: isFirstConfigRow ? config.name : "",
              academicYear: isFirstConfigRow ? config.academicYear : "",
              filiere: isFirstConfigRow ? (config.filiere || "") : "",
              niveau: isFirstConfigRow ? (config.niveau || "") : "",
              cycle: isFirstConfigRow ? (config.cycle || "") : "",
              option: isFirstConfigRow ? (config.option || "") : "",
              semesterId: semester.id,
              semesterName: isFirstSemesterRow ? semester.name : "",
              ueId: ue.id,
              ueCode: isFirstUERow ? (ue.code || "") : "",
              ueName: isFirstUERow ? ue.name : "",
              ueCredits: isFirstUERow ? (ue.credits || "") : "",
              ecId: ec.id,
              ecName: ec.name
            });
            isFirstConfigRow = false;
            isFirstSemesterRow = false;
            isFirstUERow = false;
          });
        } else {
          // UE sans EC
          result.push({
            configId: config.id,
            configName: isFirstConfigRow ? config.name : "",
            academicYear: isFirstConfigRow ? config.academicYear : "",
            filiere: isFirstConfigRow ? (config.filiere || "") : "",
            niveau: isFirstConfigRow ? (config.niveau || "") : "",
            cycle: isFirstConfigRow ? (config.cycle || "") : "",
            option: isFirstConfigRow ? (config.option || "") : "",
            semesterId: semester.id,
            semesterName: isFirstSemesterRow ? semester.name : "",
            ueId: ue.id,
            ueCode: ue.code || "",
            ueName: ue.name,
            ueCredits: ue.credits || "",
            ecId: "",
            ecName: ""
          });
          isFirstConfigRow = false;
          isFirstSemesterRow = false;
        }
      });
    });

    return result;
  };

  const convertToConfigFormat = (data: any[]): ClassConfig[] => {
    const configsMap = new Map<string, ClassConfig>();
    const configIdMapping = new Map<string, string>(); // Mappage ancien ID -> nouvel ID
    const semesterIdMapping = new Map<string, string>(); // Mappage ancien semestre ID -> nouvel ID
    const ueIdMapping = new Map<string, string>(); // Mappage ancien UE ID -> nouvel ID

    data.forEach((row, index) => {
      try {
        const originalConfigId = row.configId || `config_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Générer un nouvel ID unique pour éviter les conflits lors de l'import
        let newConfigId = configIdMapping.get(originalConfigId);
        if (!newConfigId) {
          newConfigId = `imported_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          configIdMapping.set(originalConfigId, newConfigId);
        }

        if (!configsMap.has(newConfigId)) {
          configsMap.set(newConfigId, {
            id: newConfigId,
            name: row.configName || `Configuration ${originalConfigId}`,
            academicYear: row.academicYear || "",
            filiere: row.filiere || "",
            niveau: row.niveau || "",
            cycle: row.cycle || "",
            option: row.option || "",
            semesters: []
          });
        }

        const config = configsMap.get(newConfigId)!;

        // Gérer les semestres par leur ID d'origine
        const originalSemesterId = row.semesterId || `semester_${index}`;
        let newSemesterId = semesterIdMapping.get(originalSemesterId);

        if (!newSemesterId) {
          newSemesterId = `semester_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          semesterIdMapping.set(originalSemesterId, newSemesterId);
        }

        let semester = config.semesters.find(s => s.id === newSemesterId);
        if (!semester) {
          semester = {
            id: newSemesterId,
            name: row.semesterName || `Semestre ${config.semesters.length + 1}`,
            ues: []
          };
          config.semesters.push(semester);
        }

        // Gérer les UEs par leur ID d'origine
        const originalUeId = row.ueId || `ue_${index}`;
        let newUeId = ueIdMapping.get(originalUeId);

        if (!newUeId) {
          newUeId = `ue_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          ueIdMapping.set(originalUeId, newUeId);
        }

        let ue = semester.ues.find(u => u.id === newUeId);
        if (!ue) {
          ue = {
            id: newUeId,
            name: row.ueName || `UE ${semester.ues.length + 1}`,
            code: row.ueCode || "",
            credits: parseInt(row.ueCredits) || 0,
            ecs: []
          };
          semester.ues.push(ue);
        }

        // Ajouter l'EC s'il existe
        if (row.ecName && row.ecName.trim() !== '') {
          const ecId = `ec_${Date.now()}_${index}_${Math.floor(Math.random() * 10000)}`;
          const ecExists = ue.ecs.some(e => e.name === row.ecName.trim());
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
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      <div className="space-y-4">
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
              title="Charger un fichier Excel"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loadedWorkbook ? "Changer de fichier" : "Charger un fichier"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileLoad}
              className="hidden"
            />
          </div>
        </div>

        {/* Interface de sélection de feuille */}
        {loadedWorkbook && availableSheets.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Fichier chargé: {uploadedFileName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFileLoad}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                ✕ Fermer
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sélectionnez la feuille à importer ({availableSheets.length} feuille{availableSheets.length > 1 ? 's' : ''} disponible{availableSheets.length > 1 ? 's' : ''})
              </label>
              <select
                value={selectedSheetIndex}
                onChange={(e) => setSelectedSheetIndex(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {availableSheets.map((sheetName, index) => (
                  <option key={index} value={index}>
                    {index + 1}. {sheetName}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => processSheet(selectedSheetIndex)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer la feuille "{availableSheets[selectedSheetIndex]}"
            </Button>
          </div>
        )}
      </div>
    </>
  );
};