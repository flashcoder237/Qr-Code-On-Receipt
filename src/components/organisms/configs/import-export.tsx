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

  // Styles prédéfinis
  const styles = {
    headerInfo: {
      font: { bold: true, size: 16, color: { argb: 'FF1F497D' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } },
      border: {
        top: { style: 'thick', color: { argb: 'FF1F497D' } },
        left: { style: 'thick', color: { argb: 'FF1F497D' } },
        bottom: { style: 'thin', color: { argb: 'FF1F497D' } },
        right: { style: 'thick', color: { argb: 'FF1F497D' } }
      },
      alignment: { horizontal: 'left', vertical: 'middle' }
    },
    
    headerDesc: {
      font: { italic: true, size: 12, color: { argb: 'FF404040' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FBFF' } },
      border: {
        top: { style: 'thin', color: { argb: 'FFC5D9F1' } },
        left: { style: 'thick', color: { argb: 'FF1F497D' } },
        bottom: { style: 'thick', color: { argb: 'FF1F497D' } },
        right: { style: 'thick', color: { argb: 'FF1F497D' } }
      },
      alignment: { horizontal: 'left', vertical: 'middle' }
    },

    columnHeader: {
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } },
      border: {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
    },

    configRow: {
      font: { bold: true, size: 10, color: { argb: 'FF1F497D' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } },
      border: {
        top: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        left: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        bottom: { style: 'thin', color: { argb: 'FFB8CCE4' } },
        right: { style: 'thin', color: { argb: 'FFB8CCE4' } }
      },
      alignment: { horizontal: 'left', vertical: 'middle' }
    },

    ueRow: {
      font: { bold: true, size: 10, color: { argb: 'FF7F6000' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } },
      border: {
        top: { style: 'thin', color: { argb: 'FFD6B656' } },
        left: { style: 'thin', color: { argb: 'FFD6B656' } },
        bottom: { style: 'thin', color: { argb: 'FFD6B656' } },
        right: { style: 'thin', color: { argb: 'FFD6B656' } }
      },
      alignment: { horizontal: 'left', vertical: 'middle' }
    },

    ecRow: {
      font: { size: 10, color: { argb: 'FF404040' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } },
      border: {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      },
      alignment: { horizontal: 'left', vertical: 'middle' }
    },

    instructionHeader: {
      font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } },
      border: {
        top: { style: 'medium', color: { argb: 'FF4CAF50' } },
        left: { style: 'medium', color: { argb: 'FF4CAF50' } },
        bottom: { style: 'medium', color: { argb: 'FF4CAF50' } },
        right: { style: 'medium', color: { argb: 'FF4CAF50' } }
      },
      alignment: { horizontal: 'center', vertical: 'middle' }
    },

    instructionData: {
      font: { size: 10 },
      border: {
        top: { style: 'thin', color: { argb: 'FFC6E0B4' } },
        left: { style: 'thin', color: { argb: 'FFC6E0B4' } },
        bottom: { style: 'thin', color: { argb: 'FFC6E0B4' } },
        right: { style: 'thin', color: { argb: 'FFC6E0B4' } }
      },
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true }
    }
  };

  // Fonction pour créer une feuille stylée avec ExcelJS
  const createStyledWorksheet = async (workbook: ExcelJS.Workbook, data: any[], title: string, description: string, sheetName: string) => {
    const worksheet = workbook.addWorksheet(sheetName);

    // Ajouter l'en-tête informatif
    worksheet.addRow([title]);
    worksheet.addRow([description]);
    worksheet.addRow([]); // Ligne vide

    // Fusionner les cellules pour l'en-tête
    worksheet.mergeCells('A1:O1');
    worksheet.mergeCells('A2:O2');

    // Appliquer les styles à l'en-tête
    const headerCell = worksheet.getCell('A1');
    const descCell = worksheet.getCell('A2');
    
    headerCell.style = styles.headerInfo;
    descCell.style = styles.headerDesc;

    // Définir la hauteur des lignes d'en-tête
    worksheet.getRow(1).height = 35;
    worksheet.getRow(2).height = 25;
    worksheet.getRow(3).height = 15;

    // Ajouter les en-têtes de colonnes
    const headers = [
      'ID Config', 'Nom Configuration', 'Année Académique', 'Filière', 'Niveau', 'Cycle', 'Option',
      'ID Semestre', 'Nom Semestre', 'ID UE', 'Code UE', 'Nom UE', 'Crédits UE', 'ID EC', 'Nom EC'
    ];
    
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 30;

    // Appliquer le style aux en-têtes de colonnes
    headerRow.eachCell((cell) => {
      cell.style = styles.columnHeader;
    });

    // Ajouter les données avec styles conditionnels
    data.forEach((rowData, index) => {
      const row = worksheet.addRow([
        rowData.configId,
        rowData.configName,
        rowData.academicYear,
        rowData.filiere,
        rowData.niveau,
        rowData.cycle,
        rowData.option,
        rowData.semesterId,
        rowData.semesterName,
        rowData.ueId,
        rowData.ueCode,
        rowData.ueName,
        rowData.ueCredits,
        rowData.ecId,
        rowData.ecName
      ]);

      // Déterminer le style en fonction du type de ligne
      let rowStyle;
      if (rowData.ecName && rowData.ecName.trim() !== "") {
        rowStyle = styles.ecRow;
      } else if (rowData.ueName && rowData.ueName.trim() !== "") {
        rowStyle = styles.ueRow;
      } else {
        rowStyle = styles.configRow;
      }

      // Appliquer le style à toute la ligne
      row.eachCell((cell) => {
        cell.style = rowStyle;
      });

      row.height = 20;
    });

    // Définir les largeurs de colonnes
    const columnWidths = [15, 30, 18, 20, 10, 15, 20, 15, 20, 12, 12, 40, 12, 12, 45];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    return worksheet;
  };

  // Fonction pour créer une feuille d'instructions stylée
  const createInstructionWorksheet = (workbook: ExcelJS.Workbook, instructionsData: any[], sheetName: string) => {
    const worksheet = workbook.addWorksheet(sheetName);

    // En-têtes
    const headerRow = worksheet.addRow(['Étape', 'Instruction', 'Description']);
    headerRow.height = 30;
    
    headerRow.eachCell((cell) => {
      cell.style = styles.instructionHeader;
    });

    // Données
    instructionsData.forEach((instruction) => {
      const row = worksheet.addRow([instruction.étape, instruction.instruction, instruction.description]);
      row.height = 40;
      
      row.eachCell((cell) => {
        cell.style = styles.instructionData;
      });
    });

    // Largeurs de colonnes
    worksheet.getColumn(1).width = 8;   // Étape
    worksheet.getColumn(2).width = 30;  // Instruction
    worksheet.getColumn(3).width = 80;  // Description

    return worksheet;
  };

  const handleExportAll = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Propriétés du document
      workbook.creator = 'Générateur de Relevés';
      workbook.lastModifiedBy = 'Générateur de Relevés';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Convertir les données
      const worksheetData = configs.map((config) => {
        return flattenConfig(config);
      }).flat();

      if (worksheetData.length === 0) {
        alert("Aucune donnée à exporter. Veuillez d'abord créer des configurations.");
        return;
      }

      // Créer la feuille principale
      await createStyledWorksheet(
        workbook,
        worksheetData,
        "🎓 Export des Configurations Académiques",
        `📅 Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} - ${worksheetData.length} entrées`,
        "Configurations"
      );

      // Créer la feuille d'instructions
      const instructionsData = [
        { 
          étape: "1", 
          instruction: "📋 Structure du fichier", 
          description: "Chaque ligne représente un élément constitutif (EC) au sein d'une unité d'enseignement (UE). Les couleurs distinguent les types : bleu pour les configurations, jaune pour les UEs, gris pour les ECs." 
        },
        { 
          étape: "2", 
          instruction: "🔑 Identifiants uniques", 
          description: "Les colonnes avec 'ID' maintiennent les relations entre éléments. Ne les modifiez pas pour préserver l'intégrité des données lors des mises à jour." 
        },
        { 
          étape: "3", 
          instruction: "➕ Nouvelles configurations", 
          description: "Pour créer de nouvelles entrées, laissez les champs ID vides ou utilisez de nouveaux identifiants cohérents. Le système générera automatiquement les IDs manquants." 
        },
        { 
          étape: "4", 
          instruction: "⚠️ Champs obligatoires", 
          description: "Les colonnes 'Nom Configuration', 'Année Académique', 'Nom Semestre', 'Nom UE' sont essentielles. Assurez-vous qu'elles contiennent des valeurs valides." 
        },
        { 
          étape: "5", 
          instruction: "🔗 Relations et regroupement", 
          description: "Les éléments partageant le même ID seront regroupés : même ID UE = même UE, même ID Semestre = même semestre, même ID Config = même configuration." 
        },
        { 
          étape: "6", 
          instruction: "📊 Crédits ECTS", 
          description: "Définissez correctement les crédits pour chaque UE. Ces valeurs sont utilisées pour les calculs de moyenne et la validation des parcours." 
        },
        { 
          étape: "7", 
          instruction: "📤 Réimportation", 
          description: "Utilisez le bouton 'Importer' dans l'interface pour charger votre fichier modifié. Le système validera automatiquement la structure des données." 
        }
      ];

      createInstructionWorksheet(workbook, instructionsData, "📖 Instructions");

      // Générer et télécharger le fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `configurations_academiques_${formatDate(new Date())}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export Excel. Veuillez réessayer.");
    }
  };

  const handleExportTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      workbook.creator = 'Générateur de Relevés';
      workbook.created = new Date();

      // Données de template
      const templateData = [
        {
          configId: "template_1",
          configName: "Licence Informatique",
          academicYear: "2024-2025",
          filiere: "Informatique",
          niveau: "1",
          cycle: "Licence",
          option: "",
          semesterId: "sem_1",
          semesterName: "Semestre 1",
          ueId: "ue_1",
          ueCode: "INF1101",
          ueName: "Algorithmes et Programmation",
          ueCredits: 6,
          ecId: "ec_1",
          ecName: "Introduction aux Algorithmes"
        },
        {
          configId: "template_1",
          configName: "Licence Informatique",
          academicYear: "2024-2025",
          filiere: "Informatique",
          niveau: "1",
          cycle: "Licence",
          option: "",
          semesterId: "sem_1",
          semesterName: "Semestre 1",
          ueId: "ue_1",
          ueCode: "INF1101",
          ueName: "Algorithmes et Programmation",
          ueCredits: 6,
          ecId: "ec_2",
          ecName: "Programmation Structurée"
        },
        {
          configId: "template_1",
          configName: "Licence Informatique",
          academicYear: "2024-2025",
          filiere: "Informatique",
          niveau: "1",
          cycle: "Licence",
          option: "",
          semesterId: "sem_1",
          semesterName: "Semestre 1",
          ueId: "ue_2",
          ueCode: "INF1102",
          ueName: "Architecture des Ordinateurs",
          ueCredits: 4,
          ecId: "ec_3",
          ecName: "Systèmes Numériques"
        },
        {
          configId: "template_2",
          configName: "Master Pharmacie",
          academicYear: "2024-2025",
          filiere: "Pharmacie",
          niveau: "5",
          cycle: "Master",
          option: "Industrie",
          semesterId: "sem_3",
          semesterName: "Semestre 3",
          ueId: "ue_3",
          ueCode: "PHA5301",
          ueName: "Pharmacologie Clinique",
          ueCredits: 5,
          ecId: "ec_4",
          ecName: "Pharmacocinétique Avancée"
        }
      ];

      await createStyledWorksheet(
        workbook,
        templateData,
        "📋 Modèle de Configuration Académique",
        "🚀 Utilisez ce modèle comme guide pour préparer vos données d'importation - Modifiez les exemples selon vos besoins",
        "📋 Modèle"
      );

      // Instructions pour le template
      const templateInstructions = [
        { 
          étape: "1", 
          instruction: "📋 Structure du fichier", 
          description: "Chaque ligne représente un élément constitutif (EC) au sein d'une unité d'enseignement (UE). Les couleurs vous aident à distinguer les niveaux hiérarchiques." 
        },
        { 
          étape: "2", 
          instruction: "🔑 Identifiants", 
          description: "Les colonnes ID créent les relations entre éléments. Gardez les mêmes IDs pour les éléments liés." 
        },
        { 
          étape: "3", 
          instruction: "➕ Nouvelles configurations", 
          description: "Pour créer une nouvelle configuration, changez l'ID Config et utilisez des identifiants cohérents pour tous les éléments associés." 
        },
        { 
          étape: "4", 
          instruction: "✅ Colonnes obligatoires", 
          description: "Les colonnes 'Nom Configuration', 'Année Académique', 'Nom Semestre', 'Nom UE' et 'Nom EC' sont obligatoires et ne peuvent pas être vides." 
        },
        { 
          étape: "5", 
          instruction: "🔗 Regroupement automatique", 
          description: "Les UEs avec le même 'ID UE' seront regroupées. Les ECs seront automatiquement associés à leur UE correspondante." 
        },
        { 
          étape: "6", 
          instruction: "🎯 Crédits ECTS", 
          description: "Définissez soigneusement le nombre de crédits pour chaque UE. Ces valeurs sont essentielles pour les calculs." 
        },
        { 
          étape: "7", 
          instruction: "📤 Importation", 
          description: "Sauvegardez votre fichier et utilisez le bouton 'Importer' dans l'interface. Le système validera automatiquement vos données." 
        }
      ];

      createInstructionWorksheet(workbook, templateInstructions, "📖 Instructions");

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `modele_configuration_academique.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erreur lors de l'export du template:", error);
      alert("Erreur lors de l'export du template. Veuillez réessayer.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      // Trouver la feuille principale
      let worksheet = workbook.worksheets[0];
      for (const ws of workbook.worksheets) {
        if (ws.name.toLowerCase().includes("config") || 
            ws.name.toLowerCase().includes("modèle") || 
            (!ws.name.toLowerCase().includes("instruction"))) {
          worksheet = ws;
          break;
        }
      }

      const jsonData: any[] = [];
      const headers: string[] = [];

      // Trouver la ligne d'en-têtes (généralement ligne 4 après les infos)
      let headerRowIndex = 4;
      for (let i = 1; i <= 10; i++) {
        const firstCell = worksheet.getCell(i, 1).value;
        if (firstCell && firstCell.toString().includes('ID Config')) {
          headerRowIndex = i;
          break;
        }
      }

      // Extraire les en-têtes
      const headerRow = worksheet.getRow(headerRowIndex);
      headerRow.eachCell((cell, colIndex) => {
        headers[colIndex] = cell.value?.toString() || '';
      });

      // Extraire les données
      for (let rowIndex = headerRowIndex + 1; rowIndex <= worksheet.rowCount; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const rowData: any = {};
        let hasData = false;

        row.eachCell((cell, colIndex) => {
          const header = headers[colIndex];
          const value = cell.value;
          
          if (header && value !== null && value !== undefined) {
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

            const key = keyMap[header] || header;
            rowData[key] = value.toString();
            hasData = true;
          }
        });

        if (hasData && (rowData.configName || rowData.ueName || rowData.semesterName)) {
          jsonData.push(rowData);
        }
      }

      if (jsonData.length === 0) {
        alert("Aucune donnée valide trouvée dans le fichier. Veuillez vérifier le format.");
        return;
      }

      const importedConfigs = convertToConfigFormat(jsonData);
      onImport(importedConfigs);
      
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      alert("Erreur lors de l'importation du fichier Excel. Vérifiez le format du fichier.");
    }
  };

  // Fonctions utilitaires (inchangées)
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
    
    data.forEach(row => {
      const configId = row.configId || `config_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      if (!configsMap.has(configId)) {
        configsMap.set(configId, {
          id: configId,
          name: row.configName || "Nouvelle configuration",
          academicYear: row.academicYear || "",
          filiere: row.filiere || "",
          niveau: row.niveau || "",
          cycle: row.cycle || "",
          option: row.option || "",
          semesters: []
        });
      }
      
      const config = configsMap.get(configId)!;
      
      const semesterId = row.semesterId || `semester_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      let semester = config.semesters.find(s => s.id === semesterId);
      if (!semester) {
        semester = {
          id: semesterId,
          name: row.semesterName || "Nouveau semestre",
          ues: []
        };
        config.semesters.push(semester);
      }
      
      const ueId = row.ueId || `ue_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      let ue = semester.ues.find(u => u.id === ueId);
      if (!ue) {
        ue = {
          id: ueId,
          name: row.ueName || "Nouvelle UE",
          code: row.ueCode || "",
          credits: Number(row.ueCredits) || 0,
          ecs: []
        };
        semester.ues.push(ue);
      }
      
      if (row.ecName) {
        const ecId = row.ecId || `ec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const ecExists = ue.ecs.some(e => e.id === ecId);
        if (!ecExists) {
          const ec: EC = {
            id: ecId,
            name: row.ecName || "Nouvel EC"
          };
          ue.ecs.push(ec);
        }
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
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportAll}
        className="text-green-600 hover:text-green-700 hover:bg-green-50 whitespace-nowrap"
      >
        <Download className="h-4 w-4 mr-2" />
        Exportera
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportTemplate}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 whitespace-nowrap"
      >
        <FileDown className="h-4 w-4 mr-2" />
        Télécharger Modèle
      </Button>
      
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 whitespace-nowrap"
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