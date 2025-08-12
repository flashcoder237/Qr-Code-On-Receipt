// src/components/organisms/attestation-generator/AttestationExportOptions.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Archive, FileText, Settings, Zap } from "lucide-react";
import ExcelJS from 'exceljs';
import { StudentExcelRecord } from "@/lib/helpers/qrcode";
import { AttestationThemeSettingsPayload } from "@/lib/form-schemas/attestation-theme-settings";

interface AttestationExportOptionsProps {
  selectedStudents: StudentExcelRecord[];
  schoolSettings: any;
  attestationTheme: AttestationThemeSettingsPayload;
  exportFormat: string;
  useCompression: boolean;
  encryptionEnabled: boolean;
  onExportFormatChange: (format: string) => void;
  onUseCompressionChange: (enabled: boolean) => void;
  onEncryptionEnabledChange: (enabled: boolean) => void;
  onExportData: () => void;
  onExportTemplate: () => void;
  onExportPDF: () => void;
  isLoading: boolean;
}

export const AttestationExportOptions: React.FC<AttestationExportOptionsProps> = ({
  selectedStudents,
  schoolSettings,
  attestationTheme,
  exportFormat,
  useCompression,
  encryptionEnabled,
  onExportFormatChange,
  onUseCompressionChange,
  onEncryptionEnabledChange,
  onExportData,
  onExportTemplate,
  onExportPDF,
  isLoading
}) => {

  const handleExportStudentData = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Métadonnées du document
      workbook.creator = 'Générateur d\'Attestations Académiques';
      workbook.lastModifiedBy = 'Système Export Excel';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.subject = 'Export Données Étudiants pour Attestations';
      workbook.keywords = 'attestation, étudiant, export, excel';

      if (!selectedStudents || selectedStudents.length === 0) {
        alert("Aucun étudiant sélectionné pour l'export. Veuillez d'abord sélectionner des étudiants.");
        return;
      }

      // Validation des champs EN obligatoires pour les établissements Faculty
      if (schoolSettings?.establishmentType?.toLowerCase().includes('faculty')) {
        const requiredEnFields = ['DOMAINE_EN', 'PARCOURS_EN', 'SPECIALITE_EN', 'OPTION_EN', 'FINALITE_EN', 'MENTION_EN'];
        const missingEnFields: string[] = [];
        
        selectedStudents.forEach((student, index) => {
          requiredEnFields.forEach(field => {
            if (!student[field] || student[field].toString().trim() === '') {
              if (!missingEnFields.includes(field)) {
                missingEnFields.push(field);
              }
            }
          });
        });
        
        if (missingEnFields.length > 0) {
          alert(`⚠️ Champs de traduction anglaise manquants (requis pour les établissements Faculty):\n\n${missingEnFields.join('\n')}\n\nVeuillez compléter ces champs avant l'export.`);
          return;
        }
      }

      // Créer la feuille principale
      const worksheet = createStyledWorksheet(
        workbook,
        selectedStudents,
        "🎓 DONNÉES ÉTUDIANTS POUR ATTESTATIONS",
        `📅 Généré le ${new Date().toLocaleDateString('fr-FR', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })} à ${new Date().toLocaleTimeString('fr-FR')} | Étudiants: ${selectedStudents?.length || 0} | Établissement: ${schoolSettings.nameFrench || 'N/D'}`,
        "🎓 Données Étudiants"
      );

      // Ajouter une feuille de résumé
      createSummaryWorksheet(workbook, selectedStudents, schoolSettings);

      // Ajouter une feuille d'instructions
      createInstructionsWorksheet(workbook);

      // Générer et télécharger le fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `donnees_etudiants_attestations_${formatDate(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Export réussi : ${selectedStudents?.length || 0} étudiants exportés`);

    } catch (error) {
      console.error("❌ Erreur lors de l'export:", error);
      alert(`Erreur lors de l'export Excel : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleExportTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      workbook.creator = 'Générateur d\'Attestations - Template';
      workbook.created = new Date();
      workbook.subject = 'Modèle Import Étudiants Attestations';

      // Données de template pour attestations
      const templateData = [
        {
          NOM: "DUPONT",
          PRENOM: "Jean",
          MATRICULE: "2024001",
          "DATE DE NAISSANCE": "15/03/2000",
          "LIEU DE NAISSANCE": "Douala",
          DOMAINE: "Sciences et Technologies",
          PARCOURS: "Informatique",
          SPECIALITE: "Génie Logiciel",
          OPTION: "Intelligence Artificielle",
          FINALITE: "Professionnelle",
          MOYENNE: 14.5,
          "TOTAL CREDIT": 180,
          MENTION: "Assez Bien",
          CYCLE: "Licence",
          "ANNEE ACADEMIQUE": "2023-2024",
          "DATE JURY": "15/06/2024",
          EMAIL: "jean.dupont@example.com",
          SEXE: "M"
        },
        {
          NOM: "MARTIN",
          PRENOM: "Marie",
          MATRICULE: "2024002", 
          "DATE DE NAISSANCE": "22/07/1999",
          "LIEU DE NAISSANCE": "Yaoundé",
          DOMAINE: "Sciences de la Santé",
          PARCOURS: "Pharmacie",
          SPECIALITE: "Pharmacie Clinique",
          OPTION: "Pharmacovigilance",
          FINALITE: "Recherche",
          MOYENNE: 16.2,
          "TOTAL CREDIT": 300,
          MENTION: "Bien",
          CYCLE: "Master",
          "ANNEE ACADEMIQUE": "2023-2024",
          "DATE JURY": "18/06/2024",
          EMAIL: "marie.martin@example.com",
          SEXE: "F"
        }
      ];

      // Ajouter les colonnes de traduction anglaise pour établissements faculty
      const facultyTemplateData = templateData.map(student => ({
        ...student,
        DOMAINE_EN: student.DOMAINE === "Sciences et Technologies" ? "Science and Technology" : "Health Sciences",
        PARCOURS_EN: student.PARCOURS === "Informatique" ? "Computer Science" : "Pharmacy",
        SPECIALITE_EN: student.SPECIALITE === "Génie Logiciel" ? "Software Engineering" : "Clinical Pharmacy",
        OPTION_EN: student.OPTION === "Intelligence Artificielle" ? "Artificial Intelligence" : "Pharmacovigilance",
        FINALITE_EN: student.FINALITE === "Professionnelle" ? "Professional" : "Research",
        MENTION_EN: student.MENTION === "Assez Bien" ? "Fairly Good" : "Good"
      }));

      createStyledWorksheet(
        workbook,
        facultyTemplateData,
        "📋 MODÈLE IMPORT ÉTUDIANTS ATTESTATIONS",
        "🚀 Template avec exemples concrets | Colonnes de traduction EN incluses pour établissements Faculty | Adaptez selon vos besoins",
        "📋 Modèle Étudiants"
      );

      // Ajouter des instructions spécialisées
      createTemplateInstructionsWorksheet(workbook);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `modele_import_etudiants_attestations_${formatDate(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("✅ Template attestations exporté avec succès");

    } catch (error) {
      console.error("❌ Erreur lors de l'export du template:", error);
      alert(`Erreur lors de l'export du template : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Fonctions utilitaires pour la création des feuilles Excel
  const createStyledWorksheet = (workbook: ExcelJS.Workbook, data: any[], title: string, description: string, sheetName: string) => {
    const worksheet = workbook.addWorksheet(sheetName);

    // Configuration de la page
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75
      }
    };

    // Ajouter l'en-tête
    worksheet.addRow([title]);
    worksheet.addRow([description]);
    worksheet.addRow([]); // Ligne vide

    // Fusionner les cellules pour l'en-tête
    const colCount = Object.keys(data[0] || {}).length || 15;
    const lastCol = String.fromCharCode(64 + colCount); // A=65, donc 64+colCount
    
    worksheet.mergeCells(`A1:${lastCol}1`);
    worksheet.mergeCells(`A2:${lastCol}2`);

    // Style de l'en-tête
    const headerCell = worksheet.getCell('A1');
    const descCell = worksheet.getCell('A2');
    
    headerCell.value = title;
    headerCell.style = {
      font: { bold: true, size: 16, color: { argb: 'FF1F497D' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    
    descCell.value = description;
    descCell.style = {
      font: { italic: true, size: 11, color: { argb: 'FF505050' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FBFF' } },
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true }
    };

    // Hauteurs des lignes d'en-tête
    worksheet.getRow(1).height = 40;
    worksheet.getRow(2).height = 30;
    worksheet.getRow(3).height = 10;

    // Ajouter les en-têtes de colonnes
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const headerRow = worksheet.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.style = {
          font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } },
          border: {
            top: { style: 'medium', color: { argb: 'FF2F5F8F' } },
            bottom: { style: 'medium', color: { argb: 'FF2F5F8F' } },
            left: { style: 'thin', color: { argb: 'FF2F5F8F' } },
            right: { style: 'thin', color: { argb: 'FF2F5F8F' } }
          },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
        };
      });

      // Ajouter les données
      data.forEach((row, index) => {
        const dataRow = worksheet.addRow(Object.values(row));
        
        dataRow.eachCell((cell) => {
          cell.style = {
            font: { size: 10 },
            border: {
              top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
            },
            alignment: { horizontal: 'left', vertical: 'middle' }
          };
        });

        // Alternance de couleurs
        if (index % 2 === 1) {
          dataRow.eachCell((cell) => {
            cell.style = {
              ...cell.style,
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } }
            };
          });
        }
      });

      // Ajuster les largeurs des colonnes
      headers.forEach((header, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = Math.max(header.length + 2, 12);
      });
    }

    return worksheet;
  };

  const createSummaryWorksheet = (workbook: ExcelJS.Workbook, students: StudentExcelRecord[], settings: any) => {
    const worksheet = workbook.addWorksheet("📊 Résumé");
    
    // Statistiques générales
    const stats = {
      'Total Étudiants': students?.length || 0,
      'Établissement': settings.nameFrench || 'N/D',
      'Type Établissement': settings.establishmentType || 'N/D',
      'Date Export': new Date().toLocaleDateString('fr-FR'),
      'Moyenne Générale': students?.length ? students.reduce((sum, s) => sum + (parseFloat(String(s.MOYENNE)) || 0), 0) / students.length : 0,
      'Cycles Représentés': [...new Set((students || []).map(s => s.CYCLE).filter(Boolean))].join(', '),
      'Spécialités': [...new Set((students || []).map(s => s.SPECIALITE).filter(Boolean))].length
    };

    worksheet.addRow(['📊 RÉSUMÉ STATISTIQUE']);
    worksheet.addRow([]);
    worksheet.mergeCells('A1:B1');
    
    Object.entries(stats).forEach(([key, value]) => {
      worksheet.addRow([key, value]);
    });

    return worksheet;
  };

  const createInstructionsWorksheet = (workbook: ExcelJS.Workbook) => {
    const worksheet = workbook.addWorksheet("📖 Instructions");
    
    const instructions = [
      { étape: "1", instruction: "Format des données", description: "Ce fichier contient les données des étudiants sélectionnés pour la génération d'attestations. Vous pouvez modifier les données directement dans Excel." },
      { étape: "2", instruction: "Colonnes obligatoires", description: "Les colonnes NOM, PRENOM, MATRICULE, MOYENNE sont obligatoires. Pour les établissements Faculty, les colonnes *_EN sont aussi requises." },
      { étape: "3", instruction: "Import des modifications", description: "Après modification, réimportez le fichier via l'interface de génération d'attestations." },
      { étape: "4", instruction: "Validation des données", description: "Vérifiez que les moyennes sont cohérentes et que tous les champs obligatoires sont remplis." }
    ];

    worksheet.addRow(['📖 INSTRUCTIONS D\'UTILISATION']);
    worksheet.addRow([]);
    worksheet.addRow(['Étape', 'Instruction', 'Description']);
    
    instructions.forEach(inst => {
      worksheet.addRow([inst.étape, inst.instruction, inst.description]);
    });

    return worksheet;
  };

  const createTemplateInstructionsWorksheet = (workbook: ExcelJS.Workbook) => {
    const worksheet = workbook.addWorksheet("📖 Guide Template");
    
    const instructions = [
      { étape: "1", instruction: "🎯 Utiliser ce modèle", description: "Remplacez les données d'exemple par vos propres informations en conservant la structure des colonnes." },
      { étape: "2", instruction: "🌐 Colonnes de traduction", description: "Les colonnes *_EN (DOMAINE_EN, PARCOURS_EN, etc.) sont obligatoires pour les établissements Faculty." },
      { étape: "3", instruction: "📊 Format des moyennes", description: "Les moyennes doivent être numériques (ex: 14.5). Les mentions peuvent être calculées automatiquement." },
      { étape: "4", instruction: "📅 Format des dates", description: "Les dates peuvent être au format DD/MM/YYYY ou MM/DD/YYYY selon votre configuration Excel." },
      { étape: "5", instruction: "📤 Import du fichier", description: "Une fois complété, importez le fichier via l'uploader Excel dans l'interface d'attestations." }
    ];

    worksheet.addRow(['📖 GUIDE D\'UTILISATION DU TEMPLATE']);
    worksheet.addRow([]);
    worksheet.addRow(['Étape', 'Instruction', 'Description']);
    
    instructions.forEach(inst => {
      worksheet.addRow([inst.étape, inst.instruction, inst.description]);
    });

    return worksheet;
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Options d'Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Format d'export */}
          <div className="space-y-2">
            <Label>Format d'export</Label>
            <Select value={exportFormat} onValueChange={onExportFormatChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zip">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archive ZIP
                  </div>
                </SelectItem>
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Fichiers individuels
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF unique
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compression */}
          <div className="flex items-center justify-between">
            <Label htmlFor="use-compression">Compression avancée</Label>
            <Switch
              id="use-compression"
              checked={useCompression}
              onCheckedChange={onUseCompressionChange}
            />
          </div>

          {/* Chiffrement QR Code */}
          <div className="flex items-center justify-between">
            <Label htmlFor="encryption-enabled">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Chiffrement QR Code
              </div>
            </Label>
            <Switch
              id="encryption-enabled"
              checked={encryptionEnabled}
              onCheckedChange={onEncryptionEnabledChange}
            />
          </div>
        </div>

        {/* Boutons d'export */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportStudentData}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            disabled={!selectedStudents || selectedStudents.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter Données ({selectedStudents?.length || 0})
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportTemplate}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Télécharger Modèle
          </Button>
          
          {exportFormat === 'pdf' ? (
            <Button 
              variant="default" 
              size="sm" 
              onClick={onExportPDF}
              disabled={!selectedStudents || selectedStudents.length === 0 || isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <>Génération en cours...</>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer PDF Unique ({selectedStudents?.length || 0})
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={onExportData}
              disabled={!selectedStudents || selectedStudents.length === 0 || isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <>Génération en cours...</>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Générer Attestations ({selectedStudents?.length || 0})
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};