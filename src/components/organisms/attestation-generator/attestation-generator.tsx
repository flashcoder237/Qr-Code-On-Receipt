// src/components/organisms/attestation-generator/attestation-generator.tsx - Version mise à jour avec chiffrement
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateQrCodeBase64, StudentExcelRecord, getQrCodePayloadWithEncryption } from "@/lib/helpers/qrcode";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { useLocalStorage } from "usehooks-ts";
import { A4PositionPicker } from "../a4-position-picker";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttestationSettings } from "./AttestationSettings";
import { AttestationPreviewButton } from "./AttestationPreviewButton";
import { AttestationThemeEditor } from "./AttestationThemeEditor";
import { ThemePresetSelector } from "./ThemePresetSelector";
import { StudentSelector } from "../student-selector";
import { FileDown, Loader2, Settings2, Table2, Palette, FileText, Eye, Wand2, Users, AlertCircle, CheckCircle, Shield, ShieldCheck } from "lucide-react";
import { calculateGrade, calculateMention, getCurrentAcademicYear } from "@/lib/attestation-generator/utils";
import { openAttestationPreview } from "@/lib/attestation-generator/preview";
import { AttestationThemeSettingsPayload, defaultAttestationTheme } from "@/lib/form-schemas/attestation-theme-settings";
import { useNotifications } from "@/components/ui/notification-system";
import { useDocumentHistory } from "@/components/organisms/document-history/DocumentHistoryManager";
import { testEncryptionDecryption, createCryptoDataFromStudent } from "@/lib/crypto/encryption";

export const AttestationGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "settings" | "theme" | "presets" | "selection">("generator");
  const [excelData, setExcelData] = useState<StudentExcelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [selectedStudentMatricules, setSelectedStudentMatricules] = useState<string[]>([]);
  
  // Nouveau: Option pour activer/désactiver le chiffrement
  const [encryptionEnabled, setEncryptionEnabled] = useLocalStorage("attestation-encryption-enabled", true);
  
  // Hooks pour notifications et historique
  const { notifySuccess, notifyError, notifyWarning } = useNotifications();
  const { addDocumentRecord } = useDocumentHistory();
  
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

  // Reset selected students when excel data changes
  useEffect(() => {
    setSelectedStudentMatricules([]);
    if (excelData.length > 0) {
      notifySuccess("Import", `${excelData.length} étudiant(s) importé(s) avec succès`);
      
      // Test du chiffrement sur le premier étudiant si le chiffrement est activé
      if (encryptionEnabled && excelData.length > 0) {
        testStudentEncryption(excelData[0]);
      }
    }
  }, [excelData, notifySuccess, encryptionEnabled]);

  // Fonction pour tester le chiffrement sur un étudiant
  const testStudentEncryption = (student: StudentExcelRecord) => {
    try {
      console.log('🧪 Test du chiffrement pour:', student.NOM, student.PRENOM);
      
      const cryptoData = createCryptoDataFromStudent(student, 'attestation');
      const testResult = testEncryptionDecryption(cryptoData);
      
      if (testResult) {
        console.log('✅ Test de chiffrement réussi');
        notifySuccess("Chiffrement", "Système de chiffrement opérationnel");
      } else {
        console.warn('⚠️ Test de chiffrement échoué');
        notifyWarning("Chiffrement", "Problème détecté avec le chiffrement");
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de chiffrement:', error);
      notifyError("Chiffrement", "Erreur lors du test de chiffrement");
    }
  };

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

          const convertedData = jsonData.map((row) => {
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
          
        } catch (err) {
          console.error("Erreur lors de la lecture du fichier Excel", err);
          const errorMessage = "Erreur lors de la lecture du fichier Excel";
          setError(errorMessage);
          notifyError("Erreur d'import", errorMessage);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "";
    
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
      return dateValue;
    }
    
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

  const generateAttestations = async (studentsToGenerate?: StudentExcelRecord[]) => {
    const dataToProcess = studentsToGenerate || 
      (selectedStudentMatricules.length > 0 
        ? excelData.filter(s => selectedStudentMatricules.includes(s.MATRICULE))
        : excelData);

    if (dataToProcess.length === 0) {
      const message = "Aucun étudiant sélectionné pour la génération";
      setError(message);
      notifyWarning("Sélection vide", message);
      return;
    }

    const encryptionMessage = encryptionEnabled ? "avec chiffrement" : "sans chiffrement";
    notifySuccess("Génération", `Début de la génération de ${dataToProcess.length} attestation(s) ${encryptionMessage}`);

    try {
      setIsLoading(true);
      setError(null);
      setProcessingProgress(0);
      
      const safePosition = position && typeof position.x === 'number' && typeof position.y === 'number' 
        ? position 
        : { x: 470, y: 220 };
      
      const zip = new JSZip();
      let processedCount = 0;
      let successCount = 0;

      for (const student of dataToProcess) {
        try {
          // Générer le QR code avec ou sans chiffrement selon la configuration
          let qrCodeBase64 = '';
          try {
            console.log(`🔄 Génération QR pour ${student.MATRICULE} (Chiffrement: ${encryptionEnabled})`);
            qrCodeBase64 = await generateQrCodeBase64(student, 'attestation', encryptionEnabled);
            
            if (encryptionEnabled) {
              console.log('🔐 QR Code généré avec chiffrement');
            } else {
              console.log('📋 QR Code généré sans chiffrement');
            }
          } catch (qrError) {
            console.error("Erreur lors de la génération du QR code:", qrError);
            notifyWarning("QR Code", `Erreur QR pour ${student.NOM} ${student.PRENOM}`);
            // Continuer sans QR code
          }

          const params = {
            student,
            settings: {
              ...schoolSettings,
              theme: attestationTheme,
            },
            options: {
              qrCodePosition: safePosition,
              theme: attestationTheme,
              qrCodeImage: qrCodeBase64,
              encryptionEnabled: encryptionEnabled
            }
          };
          
          const pdfBytes = await window.ipcRenderer.invoke('generate-attestation-pdf', params);
          
          const fileName = `${student.MATRICULE}_Attestation${encryptionEnabled ? '_Chiffre' : ''}.pdf`;
          zip.file(fileName, pdfBytes);
          
          // Ajouter à l'historique avec information sur le chiffrement
          addDocumentRecord({
            type: 'attestation',
            studentName: `${student.NOM} ${student.PRENOM}`,
            studentMatricule: student.MATRICULE,
            academicYear: student["ANNEE ACADEMIQUE"],
            parcours: student.PARCOURS,
            speciality: student.SPECIALITE,
            average: typeof student.MOYENNE === 'number' ? student.MOYENNE : parseFloat(String(student.MOYENNE)) || undefined,
            grade: student.GRADE,
            mention: student.MENTION,
            fileName: fileName,
            status: 'generated',
            additionalInfo: encryptionEnabled ? 'Chiffrement activé' : undefined
          });
          
          successCount++;
          
        } catch (err) {
          console.error(`Erreur lors de la génération de l'attestation pour ${student.MATRICULE}`, err);
          notifyError("Erreur", `Échec de génération pour ${student.NOM} ${student.PRENOM}`);
        }
        
        processedCount++;
        setProcessingProgress((processedCount / dataToProcess.length) * 100);
      }

      if (successCount > 0) {
        const zipContent = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(zipContent);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        const zipName = `attestations_${timestamp}${encryptionEnabled ? '_chiffrees' : ''}.zip`;
        link.download = zipName;
        link.click();
        window.URL.revokeObjectURL(url);

        const successMessage = `${successCount} attestation(s) générée(s) avec succès ${encryptionMessage}`;
        notifySuccess("Génération terminée", successMessage);
      }
      
      if (successCount < dataToProcess.length) {
        const errorCount = dataToProcess.length - successCount;
        notifyWarning("Génération incomplète", `${errorCount} attestation(s) ont échoué`);
      }
      
    } catch (err) {
      console.error("Erreur lors de la génération des attestations", err);
      const message = "Une erreur est survenue lors de la génération des attestations";
      setError(message);
      notifyError("Erreur de génération", message);
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
    }
  };

  const handleSettingsUpdate = () => {
    const settings = localStorage.getItem("settings");
    if (settings) {
      try {
        setSchoolSettings(JSON.parse(settings));
        notifySuccess("Paramètres", "Paramètres mis à jour avec succès");
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
        notifyError("Erreur", "Impossible de charger les paramètres");
      }
    }
  };

  const handleThemeUpdate = (newTheme: AttestationThemeSettingsPayload) => {
    setAttestationTheme(newTheme);
    notifySuccess("Thème", "Thème mis à jour avec succès");
  };

  const handleThemeSave = () => {
    notifySuccess("Thème", "Thème sauvegardé avec succès");
  };

  const handlePresetSelect = (newTheme: AttestationThemeSettingsPayload) => {
    setAttestationTheme(newTheme);
    notifySuccess("Préréglage", "Préréglage appliqué avec succès");
    setActiveTab("theme");
  };

  const handleThemePreview = () => {
    if (excelData.length > 0) {
      const studentToPreview = selectedStudentMatricules.length > 0 
        ? excelData.find(s => s.MATRICULE === selectedStudentMatricules[0])
        : excelData[0];
      
      if (studentToPreview) {
        previewAttestation(studentToPreview);
      }
    } else {
      const message = "Veuillez importer des données pour prévisualiser avec le nouveau thème";
      setError(message);
      notifyWarning("Données manquantes", message);
    }
  };

  const previewAttestation = async (student: StudentExcelRecord) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const safePosition = position && typeof position.x === 'number' && typeof position.y === 'number' 
        ? position 
        : { x: 470, y: 220 };
      
      const success = await openAttestationPreview(
        student, 
        {
          ...schoolSettings,
          theme: attestationTheme,
        }, 
        { 
          qrCodePosition: safePosition,
          theme: attestationTheme,
          encryptionEnabled: encryptionEnabled
        }
      );
      
      if (!success) {
        const message = "Impossible d'ouvrir la fenêtre de prévisualisation. Veuillez vérifier vos paramètres de bloqueur de popups.";
        setError(message);
        notifyError("Erreur de prévisualisation", message);
      } else {
        const encryptionStatus = encryptionEnabled ? " (avec chiffrement)" : " (sans chiffrement)";
        notifySuccess("Prévisualisation", `Aperçu généré pour ${student.NOM} ${student.PRENOM}${encryptionStatus}`);
      }
      
    } catch (err) {
      console.error("Erreur lors de la prévisualisation", err);
      const message = "Une erreur est survenue lors de la prévisualisation de l'attestation";
      setError(message);
      notifyError("Erreur", message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour gérer la sélection des étudiants
  const handleStudentSelectionChange = (matricules: string[]) => {
    setSelectedStudentMatricules(matricules);
    if (matricules.length > 0) {
      notifySuccess("Sélection", `${matricules.length} étudiant(s) sélectionné(s)`);
    }
  };

  // Fonction pour prévisualiser un étudiant spécifique
  const handlePreviewStudent = (student: StudentExcelRecord) => {
    previewAttestation(student);
  };

  // Fonction pour tester le contenu d'un QR code
  const previewQRContent = async (student: StudentExcelRecord) => {
    try {
      const qrContent = getQrCodePayloadWithEncryption(student, 'attestation');
      console.log('📋 Contenu du QR Code:');
      console.log(qrContent);
      
      // Créer une nouvelle fenêtre pour afficher le contenu
      const previewWindow = window.open('', '_blank', 'width=600,height=800');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head><title>Contenu QR Code - ${student.NOM} ${student.PRENOM}</title></head>
            <body style="font-family: monospace; padding: 20px;">
              <h2>Contenu du QR Code</h2>
              <h3>Étudiant: ${student.NOM} ${student.PRENOM}</h3>
              <h4>Chiffrement: ${encryptionEnabled ? 'Activé' : 'Désactivé'}</h4>
              <hr>
              <pre style="white-space: pre-wrap; word-wrap: break-word;">${qrContent}</pre>
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
      
      notifySuccess("QR Preview", "Contenu du QR code affiché");
    } catch (error) {
      console.error('Erreur lors de la prévisualisation du QR code:', error);
      notifyError("Erreur", "Impossible de prévisualiser le contenu du QR code");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Générateur
            </TabsTrigger>
            <TabsTrigger value="selection" disabled={excelData.length === 0} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sélection ({selectedStudentMatricules.length})
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
          
          {/* Indicateur de chiffrement */}
          <div className="flex items-center gap-2">
            {encryptionEnabled ? (
              <Badge variant="default" className="bg-green-600">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Chiffrement activé
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Chiffrement désactivé
              </Badge>
            )}
          </div>
        </div>

        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Génération d'Attestations avec Chiffrement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Option de chiffrement */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Sécurité des QR Codes</h4>
                      <p className="text-sm text-blue-700">
                        Chiffrer les informations sensibles dans les QR codes pour une sécurité renforcée
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="encryption-toggle" className="text-sm font-medium">
                        Chiffrement
                      </Label>
                      <Switch
                        id="encryption-toggle"
                        checked={encryptionEnabled}
                        onCheckedChange={(checked) => {
                          setEncryptionEnabled(checked);
                          const message = checked ? "Chiffrement activé" : "Chiffrement désactivé";
                          notifySuccess("Sécurité", message);
                        }}
                      />
                    </div>
                  </div>
                  {encryptionEnabled && (
                    <div className="mt-3 text-xs text-blue-600">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Les QR codes contiendront des données chiffrées déchiffrables uniquement avec l'application mobile
                    </div>
                  )}
                </CardContent>
              </Card>

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

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Génération en cours...</span>
                    <span>{Math.round(processingProgress)}%</span>
                  </div>
                  <Progress value={processingProgress} />
                </div>
              )}

              {excelData.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Données chargées</h4>
                        <p className="text-sm text-blue-700">
                          {excelData.length} étudiant(s) • {selectedStudentMatricules.length} sélectionné(s)
                        </p>
                        <p className="text-sm text-blue-700">
                          Police: {attestationTheme.mainFont.split(',')[0]} • 
                          Couleur: {attestationTheme.primaryColor} • 
                          Style: {attestationTheme.contentLayout} •
                          Chiffrement: {encryptionEnabled ? 'Activé' : 'Désactivé'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("selection")}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Sélectionner
                        </Button>
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

              <div className="flex justify-end">
                <Button 
                  onClick={() => generateAttestations()} 
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
                      {encryptionEnabled && <ShieldCheck className="mr-1 h-3 w-3" />}
                      {selectedStudentMatricules.length > 0 
                        ? `Générer (${selectedStudentMatricules.length})` 
                        : 'Générer toutes les attestations'
                      }
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selection">
          <StudentSelector
            students={excelData}
            selectedStudents={selectedStudentMatricules}
            onSelectionChange={handleStudentSelectionChange}
            onPreview={handlePreviewStudent}
            onGenerateSelected={generateAttestations}
            documentType="attestation"
            isLoading={isLoading}
            additionalInfo={encryptionEnabled ? "Chiffrement activé" : undefined}
          />
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

      {/* Bouton de test pour développeurs */}
      {process.env.NODE_ENV === 'development' && excelData.length > 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">🧪 Outils de développement</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewQRContent(excelData[0])}
              >
                Voir contenu QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testStudentEncryption(excelData[0])}
              >
                Test chiffrement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};