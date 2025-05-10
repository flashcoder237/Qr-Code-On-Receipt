import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
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

  // Fonction pour appliquer des styles à une feuille Excel
  const applyStyles = (ws: XLSX.WorkSheet) => {
    // Si la propriété !cols n'existe pas, l'initialiser
    if (!ws['!cols']) ws['!cols'] = [];
    
    // Définir la largeur des colonnes
    // On applique des largeurs différentes pour chaque colonne
    const columnWidths = [
      { wch: 12 },  // configId
      { wch: 25 },  // configName
      { wch: 15 },  // academicYear
      { wch: 20 },  // filiere
      { wch: 10 },  // niveau
      { wch: 15 },  // cycle
      { wch: 20 },  // option
      { wch: 12 },  // semesterId
      { wch: 15 },  // semesterName
      { wch: 10 },  // ueId
      { wch: 10 },  // ueCode
      { wch: 35 },  // ueName
      { wch: 10 },  // ueCredits
      { wch: 10 },  // ecId
      { wch: 40 },  // ecName
    ];
    
    // Appliquer les largeurs des colonnes
    ws['!cols'] = columnWidths;

    // Créer un style pour les en-têtes
    const headerStyle = {
      fill: { fgColor: { rgb: "4F81BD" } }, // Couleur de fond bleu
      font: { bold: true, color: { rgb: "FFFFFF" } }, // Texte en gras et blanc
      alignment: { horizontal: "center", vertical: "center" }, // Centrer le texte
      border: { // Bordures complètes
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Style pour les données
    const dataStyle = {
      border: { // Bordures légères
        top: { style: "thin", color: { rgb: "D3D3D3" } },
        bottom: { style: "thin", color: { rgb: "D3D3D3" } },
        left: { style: "thin", color: { rgb: "D3D3D3" } },
        right: { style: "thin", color: { rgb: "D3D3D3" } }
      }
    };

    // Style pour les lignes de configuration (fond bleu clair)
    const configStyle = {
      ...dataStyle,
      fill: { fgColor: { rgb: "DCE6F1" } }, // Fond bleu clair
    };

    // Style pour les UEs (fond légèrement jaune)
    const ueStyle = {
      ...dataStyle,
      fill: { fgColor: { rgb: "FFF2CC" } }, // Fond jaune pâle
      font: { bold: true }, // Texte en gras
    };

    // Appliquer des styles par cellule (pour la démonstration, on applique simplement le style d'en-tête à la première ligne)
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 25 }; // Hauteur de la première ligne

    return ws;
  };

  // Fonction pour créer un en-tête informatif au début du fichier
  const addInfoHeader = (ws: XLSX.WorkSheet, heading: string, description: string) => {
    // Obtenir le contenu actuel
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");
    const lastRow = range.e.r;
    
    // Insérer deux lignes en haut
    XLSX.utils.sheet_add_aoa(ws, [
      [heading],
      [description],
      [], // Ligne vide pour séparer
    ], { origin: -1 });
    
    // Appliquer le style à l'en-tête
    const headerCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    const descCellRef = XLSX.utils.encode_cell({ r: 1, c: 0 });
    
    if (!ws[headerCellRef]) ws[headerCellRef] = {};
    if (!ws[descCellRef]) ws[descCellRef] = {};
    
    ws[headerCellRef].s = {
      font: { bold: true, size: 16, color: { rgb: "1F497D" } },
      alignment: { horizontal: "left" }
    };
    
    ws[descCellRef].s = {
      font: { italic: true, size: 12, color: { rgb: "404040" } },
      alignment: { horizontal: "left" }
    };
    
    // Fusionner les cellules pour l'en-tête et la description
    if (!ws['!merges']) ws['!merges'] = [];
    // Fusionner l'en-tête sur toutes les colonnes
    ws['!merges'].push({ 
      s: { r: 0, c: 0 }, 
      e: { r: 0, c: range.e.c > 5 ? range.e.c : 5 } 
    });
    // Fusionner la description sur toutes les colonnes
    ws['!merges'].push({ 
      s: { r: 1, c: 0 }, 
      e: { r: 1, c: range.e.c > 5 ? range.e.c : 5 } 
    });
  };

  // Fonction pour créer un tableau Excel avec des styles et des instructions
  const createStyledWorksheet = (data: any[], title: string, description: string) => {
    // Créer une feuille de calcul à partir des données
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajouter l'en-tête informatif
    addInfoHeader(ws, title, description);
    
    // Appliquer les styles
    return applyStyles(ws);
  };

  const handleExportAll = () => {
    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    
    // Propriétés du document
    wb.Props = {
      Title: "Configurations Académiques",
      Subject: "Export des configurations",
      Author: "Générateur de Relevés",
      CreatedDate: new Date()
    };
    
    // Convertir les configurations en format approprié pour Excel
    const worksheetData = configs.map((config) => {
      return flattenConfig(config);
    }).flat();

    if (worksheetData.length === 0) {
      alert("Aucune donnée à exporter. Veuillez d'abord créer des configurations.");
      return;
    }

    // Créer une feuille avec des styles
    const ws = createStyledWorksheet(
      worksheetData,
      "Export des Configurations Académiques",
      "Ce fichier contient toutes les configurations académiques exportées le " + new Date().toLocaleDateString()
    );
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, "Configurations");
    
    // Ajouter une feuille d'instructions
    const instructionsData = [
      { 
        instruction: "Comment utiliser ce fichier", 
        details: "Ce fichier contient l'export complet de vos configurations académiques." 
      },
      { 
        instruction: "Structure", 
        details: "Chaque ligne représente un élément constitutif (EC) dans une unité d'enseignement (UE) spécifique." 
      },
      { 
        instruction: "Modification", 
        details: "Vous pouvez modifier les données et réimporter le fichier. Conservez les colonnes d'ID pour maintenir les relations." 
      },
      { 
        instruction: "Identifiants", 
        details: "Les colonnes contenant 'ID' sont utilisées pour les relations et ne doivent pas être modifiées si vous prévoyez de mettre à jour des configurations existantes." 
      },
      { 
        instruction: "Nouvelles entrées", 
        details: "Pour créer de nouvelles entrées, laissez les champs ID vides. Le système générera automatiquement de nouveaux identifiants." 
      }
    ];
    
    const instructionsWs = XLSX.utils.json_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsWs, "Instructions");
    
    // Définir la largeur des colonnes pour les instructions
    instructionsWs['!cols'] = [{ wch: 20 }, { wch: 80 }];
    
    // Générer le fichier Excel
    XLSX.writeFile(wb, `configurations_academiques_${formatDate(new Date())}.xlsx`);
  };

  const handleExportTemplate = () => {
    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    
    // Propriétés du document
    wb.Props = {
      Title: "Modèle de Configuration Académique",
      Subject: "Modèle pour l'importation",
      Author: "Générateur de Relevés",
      CreatedDate: new Date()
    };
    
    // Créer des données de modèle plus riches
    const templateData = [
      // Premier exemple - Licence Informatique Semestre 1
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
      // Deuxième exemple - Master Pharmacie Semestre 3
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
        ueId: "ue_4",
        ueCode: "PHA5302",
        ueName: "Technologie Pharmaceutique",
        ueCredits: 6,
        ecId: "ec_5",
        ecName: "Formes Galéniques Avancées"
      }
    ];
    
    // Créer une feuille avec des styles
    const ws = createStyledWorksheet(
      templateData,
      "Modèle de Configuration Académique",
      "Utilisez ce modèle comme guide pour préparer vos propres données d'importation"
    );
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, "Modèle");
    
    // Ajouter une feuille avec des instructions détaillées
    const instructionsData = [
      { 
        étape: "1", 
        instruction: "Structure du fichier", 
        description: "Chaque ligne représente un élément constitutif (EC) au sein d'une unité d'enseignement (UE)." 
      },
      { 
        étape: "2", 
        instruction: "Identifiants", 
        description: "Les colonnes 'configId', 'semesterId', 'ueId' et 'ecId' sont utilisées pour créer des relations entre les éléments." 
      },
      { 
        étape: "3", 
        instruction: "Création de nouvelles configurations", 
        description: "Pour créer une nouvelle configuration, laissez les identifiants vides ou utilisez des valeurs cohérentes à travers les lignes liées." 
      },
      { 
        étape: "4", 
        instruction: "Colonnes obligatoires", 
        description: "Les colonnes 'configName', 'academicYear', 'semesterName', 'ueName' et 'ecName' sont obligatoires." 
      },
      { 
        étape: "5", 
        instruction: "Regroupement", 
        description: "Les UEs avec le même 'ueId' seront regroupées dans le même semestre. Les ECs seront regroupés dans l'UE correspondante." 
      },
      { 
        étape: "6", 
        instruction: "Crédits", 
        description: "Assurez-vous de définir le nombre de crédits (ueCredits) pour chaque UE." 
      },
      { 
        étape: "7", 
        instruction: "Importation", 
        description: "Utilisez le bouton 'Importer' dans l'interface pour télécharger votre fichier complété." 
      }
    ];
    
    const instructionsWs = XLSX.utils.json_to_sheet(instructionsData);
    
    // Ajouter des styles aux instructions
    instructionsWs['!cols'] = [
      { wch: 8 },    // Étape (colonne plus étroite)
      { wch: 25 },   // Instruction
      { wch: 100 }   // Description (colonne plus large)
    ];

    // Appliquer une mise en forme au titre des colonnes
    const headerStyle = { 
      font: { bold: true }, 
      fill: { fgColor: { rgb: "DCE6F1" } }
    };
    
    // Ajouter la feuille d'instructions au classeur
    XLSX.utils.book_append_sheet(wb, instructionsWs, "Instructions");
    
    // Ajouter une feuille pour les exemples expliqués
    const examplesData = createExamplesData();
    const examplesWs = XLSX.utils.json_to_sheet(examplesData);
    
    // Ajuster les largeurs de colonnes pour les exemples
    examplesWs['!cols'] = [
      { wch: 30 },   // Élément
      { wch: 20 },   // Type d'élément
      { wch: 70 }    // Description
    ];
    
    // Ajouter la feuille d'exemples au classeur
    XLSX.utils.book_append_sheet(wb, examplesWs, "Exemples");
    
    // Générer le fichier Excel
    XLSX.writeFile(wb, `modele_configuration_academique.xlsx`);
  };

  // Données pour la feuille d'exemples expliqués
  const createExamplesData = () => {
    return [
      {
        element: "Licence Informatique",
        type: "Configuration",
        description: "Représente une formation complète avec un ensemble de semestres, d'UEs et d'ECs."
      },
      {
        element: "Semestre 1",
        type: "Semestre",
        description: "Un semestre regroupe plusieurs UEs. Il est identifié par un numéro et appartient à une configuration."
      },
      {
        element: "INF1101 - Algorithmes et Programmation",
        type: "Unité d'Enseignement (UE)",
        description: "Une UE est une matière principale qui regroupe plusieurs éléments constitutifs. Elle a un code, un nom et un nombre de crédits."
      },
      {
        element: "Introduction aux Algorithmes",
        type: "Élément Constitutif (EC)",
        description: "Un EC est un sous-élément d'une UE, comme un module ou un cours spécifique au sein de cette UE."
      },
      {
        element: "configId, semesterId, ueId, ecId",
        type: "Identifiants",
        description: "Ces identifiants permettent de maintenir les relations entre les différents éléments. Un même configId relie tous les éléments d'une même configuration."
      },
      {
        element: "Cycle, Filière, Niveau, Option",
        type: "Métadonnées",
        description: "Informations supplémentaires qui caractérisent une configuration. Le cycle peut être 'Licence', 'Master', etc. Le niveau représente l'année d'étude."
      }
    ];
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Trouver la feuille principale (généralement la première, mais on vérifie les noms)
        let wsname = workbook.SheetNames[0];
        for (const name of workbook.SheetNames) {
          if (name.toLowerCase().includes("config") || 
              !name.toLowerCase().includes("instruction") && 
              !name.toLowerCase().includes("exemple")) {
            wsname = name;
            break;
          }
        }
        
        // Obtenir la feuille
        const ws = workbook.Sheets[wsname];
        
        // Convertir la feuille en JSON
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        // Ignorer les lignes d'en-tête ou vides (si nous en avons ajouté)
        const filteredData = jsonData.filter((row: any) => {
          // Vérifier que les champs essentiels sont présents
          return row.configName || row.ueName || row.semesterName;
        });

        if (filteredData.length === 0) {
          alert("Aucune donnée valide trouvée dans le fichier. Veuillez vérifier le format.");
          return;
        }
        
        // Convertir les données importées au format de configuration de l'application
        const importedConfigs = convertToConfigFormat(filteredData);
        
        // Appeler le callback d'importation avec les configurations importées
        onImport(importedConfigs);
        
        // Réinitialiser l'input de fichier
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error("Erreur lors de l'importation du fichier Excel:", error);
        alert("Erreur lors de l'importation du fichier Excel. Vérifiez le format du fichier.");
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Helper function to flatten a configuration for export
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
          // Include UEs even if they don't have ECs
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

  // Helper function to convert imported data to config format
  const convertToConfigFormat = (data: any[]): ClassConfig[] => {
    const configsMap = new Map<string, ClassConfig>();
    
    data.forEach(row => {
      // Générer un ID aléatoire si nécessaire
      const configId = row.configId || `config_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Get or create config
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
      
      // Get or create semester
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
      
      // Get or create UE
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
      
      // Add EC if it exists and is not already added
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

  // Helper function to format date for filenames
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
        className="text-green-600 whitespace-nowrap"
      >
        <Download className="h-4 w-4 mr-2" />
        Exporter
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportTemplate}
        className="text-gray-500 hitespace-nowrap"
      >
        <FileDown className="h-4 w-4 mr-2" />
        Télécharger Modèle
      </Button>
      
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 whitespace-nowrap"
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