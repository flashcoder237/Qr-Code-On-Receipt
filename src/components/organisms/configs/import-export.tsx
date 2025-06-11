import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileDown } from "lucide-react";
import * as ExcelJS from 'exceljs';
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

  // Styles simplifiés et sûrs
  const styles = {
    headerInfo: {
      font: { bold: true, size: 14, color: { argb: 'FF1F497D' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE7F3FF' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
    },
    
    columnHeader: {
      font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4F81BD' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
    },

    configRow: {
      font: { bold: true, size: 11, color: { argb: 'FF1F497D' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFDCE6F1' } },
      alignment: { horizontal: 'left' as const, vertical: 'middle' as const }
    },

    ueRow: {
      font: { bold: true, size: 10, color: { argb: 'FF7F6000' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFF2CC' } },
      alignment: { horizontal: 'left' as const, vertical: 'middle' as const }
    },

    ecRow: {
      font: { size: 10, color: { argb: 'FF404040' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF8F8F8' } },
      alignment: { horizontal: 'left' as const, vertical: 'middle' as const }
    }
  };

  // En-têtes standardisés
  const HEADERS = [
    'configId',
    'configName', 
    'academicYear',
    'filiere',
    'niveau',
    'cycle',
    'option',
    'semesterId',
    'semesterName',
    'ueId',
    'ueCode',
    'ueName',
    'ueCredits',
    'ecId',
    'ecName'
  ];

  const HEADER_LABELS = [
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

  const createWorksheet = (workbook: ExcelJS.Workbook, data: any[], title: string) => {
    const worksheet = workbook.addWorksheet('Configurations');

    // Titre
    worksheet.addRow([title]);
    worksheet.addRow([]);
    
    // Fusionner le titre
    worksheet.mergeCells('A1:O1');
    const titleCell = worksheet.getCell('A1');
    titleCell.style = styles.headerInfo;

    // En-têtes
    const headerRow = worksheet.addRow(HEADER_LABELS);
    headerRow.eachCell((cell) => {
      cell.style = styles.columnHeader;
    });

    // Données
    data.forEach((rowData) => {
      const rowValues = HEADERS.map(header => rowData[header] || '');
      const row = worksheet.addRow(rowValues);

      // Appliquer le style selon le type
      let rowStyle = styles.ecRow;
      if (rowData.ecName && rowData.ecName.trim() !== "") {
        rowStyle = styles.ecRow;
      } else if (rowData.ueName && rowData.ueName.trim() !== "") {
        rowStyle = styles.ueRow;
      } else if (rowData.configName && rowData.configName.trim() !== "") {
        rowStyle = styles.configRow;
      }

      row.eachCell((cell) => {
        cell.style = rowStyle;
      });
    });

    // Largeurs de colonnes
    const columnWidths = [16, 30, 15, 20, 8, 12, 20, 16, 20, 12, 12, 35, 10, 12, 40];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    return worksheet;
  };

  const handleExportAll = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Métadonnées
      workbook.creator = 'Générateur de Relevés Académiques';
      workbook.created = new Date();

      // Convertir les données
      const worksheetData = configs.flatMap(config => flattenConfig(config));

      if (worksheetData.length === 0) {
        alert("Aucune donnée à exporter. Veuillez d'abord créer des configurations.");
        return;
      }

      // Créer la feuille
      createWorksheet(
        workbook,
        worksheetData,
        `Export Configurations - ${new Date().toLocaleDateString('fr-FR')}`
      );

      // Créer une feuille d'instructions simple
      const instructionWorksheet = workbook.addWorksheet('Instructions');
      instructionWorksheet.addRow(['Instructions d\'importation']);
      instructionWorksheet.addRow(['']);
      instructionWorksheet.addRow(['1. Ne modifiez pas les en-têtes de colonnes']);
      instructionWorksheet.addRow(['2. Les ID sont importants pour maintenir les relations']);
      instructionWorksheet.addRow(['3. Sauvegardez en format .xlsx']);
      instructionWorksheet.addRow(['4. Utilisez le bouton Importer pour réimporter']);

      // Générer le fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `configurations_${formatDate(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Export réussi : ${worksheetData.length} entrées exportées`);

    } catch (error) {
      console.error("❌ Erreur lors de l'export:", error);
      alert(`Erreur lors de l'export Excel : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleExportTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      workbook.creator = 'Template Configuration';
      workbook.created = new Date();

      // Données d'exemple simplifiées
      const templateData = [
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
          ueId: "UE_ALGO",
          ueCode: "INF1101",
          ueName: "Algorithmes et Programmation",
          ueCredits: "6",
          ecId: "EC_ALGO_BASE",
          ecName: "Introduction aux Algorithmes"
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
          ueId: "UE_ALGO",
          ueCode: "",
          ueName: "",
          ueCredits: "",
          ecId: "EC_PROG_C",
          ecName: "Programmation en C"
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
          ueId: "UE_MATH",
          ueCode: "MAT1101",
          ueName: "Mathématiques pour l'Informatique",
          ueCredits: "5",
          ecId: "EC_LOGIQUE",
          ecName: "Logique Mathématique"
        }
      ];

      createWorksheet(
        workbook,
        templateData,
        'Modèle de Configuration Académique'
      );

      // Instructions détaillées
      const instructionWorksheet = workbook.addWorksheet('Guide');
      
      const instructions = [
        ['GUIDE D\'UTILISATION DU MODÈLE'],
        [''],
        ['1. Structure des données:'],
        ['   - Chaque ligne représente un Élément Constitutif (EC)'],
        ['   - Les informations se répètent selon la hiérarchie'],
        ['   - Configuration > Semestre > UE > EC'],
        [''],
        ['2. Champs obligatoires:'],
        ['   - configId: Identifiant unique de la configuration'],
        ['   - configName: Nom de la formation (première ligne seulement)'],
        ['   - semesterId: Identifiant unique du semestre'],
        ['   - semesterName: Nom du semestre (première ligne du semestre)'],
        ['   - ueId: Identifiant unique de l\'UE'],
        ['   - ueName: Nom de l\'UE (première ligne de l\'UE)'],
        ['   - ecId: Identifiant unique de l\'EC'],
        ['   - ecName: Nom de l\'EC (obligatoire sur chaque ligne)'],
        [''],
        ['3. Règles importantes:'],
        ['   - Ne changez jamais les en-têtes de colonnes'],
        ['   - Les ID doivent être cohérents pour lier les éléments'],
        ['   - Laissez vides les champs répétitifs (voir exemple)'],
        ['   - Les crédits sont au niveau UE uniquement'],
        [''],
        ['4. Après modification:'],
        ['   - Sauvegardez en format .xlsx'],
        ['   - Utilisez le bouton "Importer" dans l\'application']
      ];

      instructions.forEach(instruction => {
        instructionWorksheet.addRow(instruction);
      });

      instructionWorksheet.getColumn(1).width = 80;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `modele_configuration_${formatDate(new Date())}.xlsx`;
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

      // Prendre la première feuille qui contient des données
      let worksheet = workbook.worksheets.find(ws => ws.rowCount > 0);
      if (!worksheet) {
        alert("Aucune feuille de données trouvée dans le fichier.");
        return;
      }

      const jsonData: any[] = [];
      let headerRowIndex = -1;

      // Chercher la ligne d'en-têtes
      for (let i = 1; i <= Math.min(10, worksheet.rowCount); i++) {
        const row = worksheet.getRow(i);
        const firstCell = row.getCell(1).value?.toString().toLowerCase() || '';
        
        if (firstCell.includes('config') || firstCell === 'configid') {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        alert("Impossible de trouver les en-têtes dans le fichier. Vérifiez le format.");
        return;
      }

      // Lire les en-têtes
      const headerRow = worksheet.getRow(headerRowIndex);
      const headers: string[] = [];
      
      headerRow.eachCell((cell, colIndex) => {
        headers[colIndex] = cell.value?.toString().trim() || '';
      });

      // Mapper les en-têtes français vers les clés anglaises
      const headerMap: Record<string, string> = {
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

      // Lire les données
      for (let rowIndex = headerRowIndex + 1; rowIndex <= worksheet.rowCount; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const rowData: any = {};
        let hasData = false;

        row.eachCell((cell, colIndex) => {
          const header = headers[colIndex];
          if (!header) return;
          
          const mappedHeader = headerMap[header] || header;
          const cellValue = cell.value?.toString().trim() || '';
          
          if (cellValue) {
            rowData[mappedHeader] = cellValue;
            hasData = true;
          }
        });

        // Ajouter seulement les lignes qui ont au moins un EC
        if (hasData && (rowData.ecName || rowData.ueName || rowData.configName)) {
          jsonData.push(rowData);
        }
      }

      if (jsonData.length === 0) {
        alert("Aucune donnée valide trouvée dans le fichier.");
        return;
      }

      console.log(`📊 Import : ${jsonData.length} lignes trouvées`);

      const importedConfigs = convertToConfigFormat(jsonData);
      
      if (importedConfigs.length === 0) {
        alert("Impossible de créer des configurations à partir des données importées.");
        return;
      }

      onImport(importedConfigs);
      
      // Réinitialiser l'input
      if (fileInputRef.current) fileInputRef.current.value = "";

      alert(`✅ Import réussi !\n\n${importedConfigs.length} configuration(s) importée(s)\n${jsonData.length} ligne(s) de données traitée(s)`);

    } catch (error) {
      console.error("❌ Erreur lors de l'importation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`❌ Erreur lors de l'importation du fichier Excel.\n\nDétails : ${errorMessage}`);
    }
  };

  // Fonction pour aplatir les configurations
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
              ueCredits: ue.credits.toString(),
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
            ueCredits: ue.credits.toString(),
            ecId: "",
            ecName: ""
          });
        }
      });
    });
    
    return result;
  };

  // Fonction pour convertir vers le format de configuration
  const convertToConfigFormat = (data: any[]): ClassConfig[] => {
    const configsMap = new Map<string, ClassConfig>();
    
    data.forEach((row, index) => {
      try {
        // Récupérer ou créer la configuration
        const configId = row.configId || `config_${Date.now()}_${index}`;
        
        if (!configsMap.has(configId)) {
          configsMap.set(configId, {
            id: configId,
            name: row.configName || `Configuration ${configId}`,
            academicYear: row.academicYear || new Date().getFullYear().toString(),
            filiere: row.filiere || "",
            niveau: row.niveau || "",
            cycle: row.cycle || "",
            option: row.option || "",
            semesters: []
          });
        }
        
        const config = configsMap.get(configId)!;
        
        // Récupérer ou créer le semestre
        const semesterId = row.semesterId || `semester_${Date.now()}_${index}`;
        let semester = config.semesters.find(s => s.id === semesterId);
        if (!semester) {
          semester = {
            id: semesterId,
            name: row.semesterName || `Semestre ${config.semesters.length + 1}`,
            ues: []
          };
          config.semesters.push(semester);
        }
        
        // Récupérer ou créer l'UE
        const ueId = row.ueId || `ue_${Date.now()}_${index}`;
        let ue = semester.ues.find(u => u.id === ueId);
        if (!ue) {
          ue = {
            id: ueId,
            name: row.ueName || `UE ${semester.ues.length + 1}`,
            code: row.ueCode || "",
            credits: parseInt(row.ueCredits) || 0,
            ecs: []
          };
          semester.ues.push(ue);
        }
        
        // Ajouter l'EC si il existe
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
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportAll}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        title="Exporter toutes les configurations vers Excel"
      >
        <Download className="h-4 w-4 mr-2" />
        Exporter
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportTemplate}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        title="Télécharger un modèle Excel avec exemples"
      >
        <FileDown className="h-4 w-4 mr-2" />
        Télécharger Modèle
      </Button>
      
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
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