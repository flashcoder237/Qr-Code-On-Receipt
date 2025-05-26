// src/components/organisms/attestation-generator/attestation-generator.tsx - Version mise à jour
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateQrCode, StudentExcelRecord } from "@/lib/helpers/qrcode";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { useLocalStorage } from "usehooks-ts";
import { A4PositionPicker } from "../a4-position-picker";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttestationSettings } from "./AttestationSettings";
import { AttestationPreviewButton } from "./AttestationPreviewButton";
import { AttestationThemeEditor } from "./AttestationThemeEditor";
import { ThemePresetSelector } from "./ThemePresetSelector"; // Import ajouté
import { FileDown, Loader2, Settings2, Table2, Palette, FileText, Eye, Wand2 } from "lucide-react";
import { calculateGrade, calculateMention, getCurrentAcademicYear } from "@/lib/attestation-generator/utils";
import { openAttestationPreview } from "@/lib/attestation-generator/preview";
import { AttestationThemeSettingsPayload, defaultAttestationTheme } from "@/lib/form-schemas/attestation-theme-settings";

export const AttestationGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "settings" | "theme" | "presets">("generator");
  const [excelData, setExcelData] = useState<StudentExcelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  
  // Position pour le QR code
  const [position, setPosition] = useLocalStorage("attestation-qrcode-position", {
    x: 470,
    y: 220,
  });
  
  // Paramètres de l'établissement
  const [schoolSettings, setSchoolSettings] = useLocalStorage("settings", {
    nameFrench: "N/D",
    establishmentType: "N/D",
    nameEnglish: "N/D",
    nameAbreviation: "N/D",
    postalBox: "N/D",
    postalBoxEn: "N/D",
    email: "N/D",
    logo: "",
    universityLogo: "",
    facultyLogo: "",
  });

  // Thème des attestations
  const [attestationTheme, setAttestationTheme] = useLocalStorage<AttestationThemeSettingsPayload>(
    "attestation-theme", 
    defaultAttestationTheme
  );

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
          }) as any[];

          // Traitement spécifique pour les attestations
          const convertedData = jsonData.map((row) => {
            // Normalisation des champs pour les attestations
            const standardizedRow: StudentExcelRecord = {
              ETABLISSEMENT: row["ETABLISSEMENT"] || schoolSettings.nameFrench,
              NOM: row["NOM"] || "",
              PRENOM: row["PRENOM"] || "",
              MATRICULE: row["MATRICULE"] || row["MAT"] || "",
              "DATE DE NAISSANCE": formatDate(row["DATE DE NAISSANCE"]),
              "LIEU DE NAISSANCE": row["LIEU DE NAISSANCE"] || "",
              PARCOURS: row["PARCOURS"] || row["FILIERE"] || "",
              SPECIALITE: row["SPECIALITE"] || row["OPTION"] || "",
              OPTION: row["OPTION"] || "",
              MOYENNE: row["MOYENNE"] || row["MOY"] || 0,
              GRADE: row["GRADE"] || calculateGrade(row["MOYENNE"] || row["MOY"] || 0),
              MENTION: row["MENTION"] || calculateMention(row["MOYENNE"] || row["MOY"] || 0),
              "ANNEE ACADEMIQUE": row["ANNEE ACADEMIQUE"] || getCurrentAcademicYear(),
              "DATE JURY": formatDate(row["DATE JURY"]),
              "FINALITE": row["FINALITE"] || "",
              "TOTAL CREDIT": row["TOTAL CREDIT"] || "",
              "DOMAINE": row["DOMAINE"] || "",
            };
            return standardizedRow;
          });

          setExcelData(convertedData);
          setError(null);
          setSuccess(`${convertedData.length} étudiant(s) importé(s) avec succès.`);
          
          setTimeout(() => {
            setSuccess(null);
          }, 5000);
          
        } catch (err) {
          console.error("Erreur lors de la lecture du fichier Excel", err);
          setError("Erreur lors de la lecture du fichier Excel");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "";
    
    // Si c'est déjà une chaîne formatée, la retourner
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
      return dateValue;
    }
    
    // Si c'est un nombre (format Excel), le convertir
    if (typeof dateValue === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(dateValue);
        if (date) {
          return `${String(date.d).padStart(2, "0")}/${String(date.m).padStart(2, "0")}/${date.y}`;
        }
      } catch (e) {
        console.error("Erreur lors de la conversion de la date", e);
      }
    }
    
    return String(dateValue);
  };

  const generateAttestations = async () => {
    if (excelData.length === 0) {
      setError("Veuillez d'abord importer des données depuis Excel");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      setProcessingProgress(0);
      
      // Vérification de sécurité pour la position
      const safePosition = position && typeof position.x === 'number' && typeof position.y === 'number' 
        ? position 
        : { x: 470, y: 220 };
      
      const zip = new JSZip();
      let processedCount = 0;

      for (const student of excelData) {
        try {
          // Utiliser la nouvelle méthode de génération HTML-to-PDF via IPC avec le thème
          const params = {
            student,
            settings: {
              ...schoolSettings,
              theme: attestationTheme,
            },
            options: {
              qrCodePosition: safePosition,
              theme: attestationTheme,
            }
          };
          
          // Invoquer la fonction IPC pour générer le PDF
          const pdfBytes = await window.ipcRenderer.invoke('generate-attestation-pdf', params);
          
          // Ajouter le PDF au ZIP
          const fileName = `${student.MATRICULE}_Attestation.pdf`;
          zip.file(fileName, pdfBytes);
          
          // Mettre à jour le compteur et la progression
          processedCount++;
          setProcessingProgress((processedCount / excelData.length) * 100);
          
        } catch (err) {
          console.error(`Erreur lors de la génération de l'attestation pour ${student.MATRICULE}`, err);
        }
      }

      // Générer le ZIP final
      const zipContent = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipContent);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attestations.zip";
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess(`${processedCount} attestation(s) générée(s) avec succès`);
      
    } catch (err) {
      console.error("Erreur lors de la génération des attestations", err);
      setError("Une erreur est survenue lors de la génération des attestations");
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
    }
  };

  const handleSettingsUpdate = () => {
    // Recharger les paramètres après mise à jour
    const settings = localStorage.getItem("settings");
    if (settings) {
      try {
        setSchoolSettings(JSON.parse(settings));
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
      }
    }
  };

  const handleThemeUpdate = (newTheme: AttestationThemeSettingsPayload) => {
    setAttestationTheme(newTheme);
    setSuccess("Thème mis à jour avec succès");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleThemeSave = () => {
    // Le thème est déjà sauvegardé via useLocalStorage
    setSuccess("Thème sauvegardé avec succès");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePresetSelect = (newTheme: AttestationThemeSettingsPayload) => {
    setAttestationTheme(newTheme);
    setSuccess("Préréglage appliqué avec succès");
    setTimeout(() => setSuccess(null), 3000);
    // Changer d'onglet pour voir le thème appliqué
    setActiveTab("theme");
  };

  const handleThemePreview = () => {
    if (excelData.length > 0) {
      previewAttestation(excelData[0]);
    } else {
      setError("Veuillez importer des données pour prévisualiser avec le nouveau thème");
    }
  };

  // Fonction pour prévisualiser une attestation individuelle
  const previewAttestation = async (student: StudentExcelRecord) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Vérification de sécurité pour la position
      const safePosition = position && typeof position.x === 'number' && typeof position.y === 'number' 
        ? position 
        : { x: 470, y: 220 };
      
      // Utiliser la fonction de prévisualisation avec le thème
      const success = await openAttestationPreview(
        student, 
        {
          ...schoolSettings,
          theme: attestationTheme,
        }, 
        { 
          qrCodePosition: safePosition,
          theme: attestationTheme,
        }
      );
      
      if (!success) {
        setError("Impossible d'ouvrir la fenêtre de prévisualisation. Veuillez vérifier vos paramètres de bloqueur de popups.");
      }
      
    } catch (err) {
      console.error("Erreur lors de la prévisualisation", err);
      setError("Une erreur est survenue lors de la prévisualisation de l'attestation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "generator" | "settings" | "theme" | "presets")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Générateur
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Préréglages
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Thème
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Génération d'Attestations Personnalisées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Importation des données Excel */}
              <div className="space-y-2">
                <Label>Fichier Excel des étudiants</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500">
                  Le fichier doit contenir au minimum: NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE, MOYENNE.
                </p>
              </div>

              {/* Messages de succès et d'erreur */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              {/* Barre de progression */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Génération en cours...</span>
                    <span>{Math.round(processingProgress)}%</span>
                  </div>
                  <Progress value={processingProgress} />
                </div>
              )}

              {/* Aperçu du thème actuel */}
              {excelData.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Thème actuel</h4>
                        <p className="text-sm text-blue-700">
                          Police: {attestationTheme.mainFont.split(',')[0]} • 
                          Couleur: {attestationTheme.primaryColor} • 
                          Style: {attestationTheme.contentLayout}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("presets")}
                          className="border-purple-300 text-purple-700 hover:bg-purple-100"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Préréglages
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("theme")}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Palette className="h-4 w-4 mr-2" />
                          Personnaliser
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bouton de génération */}
              <div className="flex justify-end">
                <Button 
                  onClick={generateAttestations} 
                  disabled={isLoading || excelData.length === 0}
                  className="min-w-32"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Générer les attestations
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des étudiants importés */}
          {excelData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Données importées ({excelData.length} étudiant(s))</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Matricule</TableHead>
                        <TableHead>Date de naissance</TableHead>
                        <TableHead>Moyenne</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Mention</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {excelData.map((student, index) => (
                        <TableRow key={`${student.MATRICULE || index}`}>
                          <TableCell>{student.NOM}</TableCell>
                          <TableCell>{student.PRENOM}</TableCell>
                          <TableCell>{student.MATRICULE}</TableCell>
                          <TableCell>{student["DATE DE NAISSANCE"]}</TableCell>
                          <TableCell>
                            {typeof student.MOYENNE === 'number' 
                              ? student.MOYENNE.toFixed(2) 
                              : student.MOYENNE}
                          </TableCell>
                          <TableCell>{student.GRADE}</TableCell>
                          <TableCell>{student.MENTION}</TableCell>
                          <TableCell>
                            <AttestationPreviewButton
                              student={student}
                              schoolSettings={{
                                ...schoolSettings,
                                theme: attestationTheme,
                              }}
                              qrCodePosition={position}
                              onError={setError}
                              disabled={isLoading}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="presets">
          <ThemePresetSelector
            currentTheme={attestationTheme}
            onThemeSelect={handlePresetSelect}
            onPreview={handleThemePreview}
          />
        </TabsContent>

        <TabsContent value="theme">
          <AttestationThemeEditor
            theme={attestationTheme}
            onThemeChange={handleThemeUpdate}
            onSave={handleThemeSave}
            onPreview={handleThemePreview}
          />
        </TabsContent>

        <TabsContent value="settings">
          <AttestationSettings onSettingsUpdated={handleSettingsUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};