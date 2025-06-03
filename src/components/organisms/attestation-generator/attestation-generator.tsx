// src/components/organisms/attestation-generator/attestation-generator.tsx - Version corrigée avec chiffrement

import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { generateQrCodeBase64, StudentExcelRecord, sanitizeStudentData } from "@/lib/helpers/qrcode";
import JSZip from "jszip";
import { useLocalStorage } from "usehooks-ts";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttestationSettings } from "./AttestationSettings";
import { AttestationThemeEditor } from "./AttestationThemeEditor";
import { ThemePresetSelector } from "./ThemePresetSelector";
import { StudentSelector } from "../student-selector";
import { FileUploader } from "@/components/organisms/receipts/ExcelUploader.tsx";
import { FileDown, Loader2, Settings2, Table2, Palette, FileText, Eye, Wand2, Users, AlertCircle, CheckCircle, Shield, ShieldCheck } from "lucide-react";
import { calculateGrade, calculateMention, getCurrentAcademicYear } from "@/lib/attestation-generator/utils";
import { openAttestationPreview } from "@/lib/attestation-generator/preview";
import { AttestationThemeSettingsPayload, defaultAttestationTheme } from "@/lib/form-schemas/attestation-theme-settings";
import { useNotifications } from "@/components/ui/notification-system";
import { useDocumentHistory } from "@/components/organisms/document-history/DocumentHistoryManager";
import { testEncryptionDecryption, createCryptoDataFromStudent } from "@/lib/crypto/encryption";
import { validateExcelColumns, ValidationResult } from "@/lib/validators/excel-columns";
import { Label } from "@/components/ui/label";

export const AttestationGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "settings" | "theme" | "presets" | "selection">("generator");
  const [excelData, setExcelData] = useState<StudentExcelRecord[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [selectedStudentMatricules, setSelectedStudentMatricules] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  // Option pour activer/désactiver le chiffrement
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
    establishmentType: "ipes",
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
      
      const sanitizedStudent = sanitizeStudentData(student);
      const cryptoData = createCryptoDataFromStudent(sanitizedStudent, 'attestation');
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

  // Gestionnaire d'upload Excel amélioré avec validation et sanitisation
  const handleFileLoaded = (data: any[], columns: string[], mapping?: { [key: string]: string }) => {
    try {
      console.log('📊 Données reçues du fichier:', { 
        rows: data.length, 
        columns: columns.length,
        mapping: Object.keys(mapping || {}).length 
      });

      // Les données ont déjà été traitées par le FileUploader avec sanitisation
      console.log('🧹 Données déjà sanitisées par FileUploader');
      
      // Conversion finale et validation
      const convertedData = data.map((row) => {
        // S'assurer que les champs critiques existent
        const standardizedRow: StudentExcelRecord = {
          ETABLISSEMENT: row.ETABLISSEMENT || schoolSettings.nameFrench || 'N/D',
          NOM: row.NOM || 'N/D',
          PRENOM: row.PRENOM || 'N/D',
          MATRICULE: row.MATRICULE || 'N/D',
          "DATE DE NAISSANCE": row["DATE DE NAISSANCE"] || 'N/D',
          "LIEU DE NAISSANCE": row["LIEU DE NAISSANCE"] || 'N/D',
          PARCOURS: row.PARCOURS || 'N/D',
          SPECIALITE: row.SPECIALITE || 'N/D',
          OPTION: row.OPTION || 'N/D',
          MOYENNE: row.MOYENNE || 0,
          GRADE: row.GRADE || calculateGrade(parseFloat(String(row.MOYENNE)) || 0),
          MENTION: row.MENTION || calculateMention(parseFloat(String(row.MOYENNE)) || 0),
          "ANNEE ACADEMIQUE": row["ANNEE ACADEMIQUE"] || getCurrentAcademicYear(),
          "DATE JURY": row["DATE JURY"] || 'N/D',
          "FINALITE": row.FINALITE || 'N/D',
          "TOTAL CREDIT": row["TOTAL CREDIT"] || '60',
          "DOMAINE": row.DOMAINE || 'SCIENCES MEDICO-SANITAIRES',
        };
        return standardizedRow;
      });

      setExcelData(convertedData);
      setExcelColumns(columns);
      setError(null);
      
      console.log('✅ Données converties et stockées:', convertedData.length, 'étudiants');
      
    } catch (err) {
      console.error("Erreur lors du traitement du fichier Excel", err);
      const errorMessage = "Erreur lors du traitement du fichier Excel";
      setError(errorMessage);
      notifyError("Erreur de traitement", errorMessage);
    }
  };

  // Gestionnaire de validation
  const handleValidationResult = (result: ValidationResult) => {
    setValidationResult(result);
    
    if (!result.isValid) {
      if (result.missingRequired.length > 0) {
        notifyError(
          "Colonnes manquantes", 
          `${result.missingRequired.length} colonne(s) obligatoire(s) manquante(s)`
        );
      } else {
        notifyWarning(
          "Colonnes optionnelles", 
          `${result.missingOptional.length} colonne(s) optionnelle(s) manquante(s)`
        );
      }
    }
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
          console.log(`🔄 Génération pour ${student.MATRICULE} (${student.NOM} ${student.PRENOM})`);
          
          // Sanitiser les données de l'étudiant
          const sanitizedStudent = sanitizeStudentData(student);
          console.log('🧹 Données étudiant sanitisées');
          
          // Générer le QR code avec ou sans chiffrement selon la configuration
          let qrCodeBase64 = '';
          try {
            console.log(`🔄 Génération QR pour ${sanitizedStudent.MATRICULE} (Chiffrement: ${encryptionEnabled})`);
            qrCodeBase64 = await generateQrCodeBase64(sanitizedStudent, 'attestation', encryptionEnabled);
            
            if (encryptionEnabled) {
              console.log('🔐 QR Code généré avec chiffrement');
            } else {
              console.log('📋 QR Code généré sans chiffrement');
            }
          } catch (qrError) {
            console.error("Erreur lors de la génération du QR code:", qrError);
            notifyWarning("QR Code", `Erreur QR pour ${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM}`);
            // Continuer sans QR code
          }

          const params = {
            student: sanitizedStudent,
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
          
          console.log('📄 Génération du PDF...');
          const pdfBytes = await window.ipcRenderer.invoke('generate-attestation-pdf', params);
          
          const fileName = `${sanitizedStudent.MATRICULE}_Attestation${encryptionEnabled ? '_Chiffre' : ''}.pdf`;
          zip.file(fileName, pdfBytes);
          
          // Ajouter à l'historique avec information sur le chiffrement
          addDocumentRecord({
            type: 'attestation',
            studentName: `${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM}`,
            studentMatricule: sanitizedStudent.MATRICULE,
            academicYear: sanitizedStudent["ANNEE ACADEMIQUE"],
            parcours: sanitizedStudent.PARCOURS,
            speciality: sanitizedStudent.SPECIALITE,
            average: typeof sanitizedStudent.MOYENNE === 'number' ? sanitizedStudent.MOYENNE : parseFloat(String(sanitizedStudent.MOYENNE)) || undefined,
            grade: sanitizedStudent.GRADE,
            mention: sanitizedStudent.MENTION,
            fileName: fileName,
            status: 'generated',
            additionalInfo: encryptionEnabled ? 'Chiffrement activé' : 'Sans chiffrement'
          });
          
          successCount++;
          console.log(`✅ PDF généré avec succès pour ${sanitizedStudent.MATRICULE}`);
          
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
      
      console.log('🔄 Début de la prévisualisation');
      
      // Sanitiser les données de l'étudiant
      const sanitizedStudent = sanitizeStudentData(student);
      console.log('🧹 Données étudiant sanitisées pour prévisualisation');
      
      const safePosition = position && typeof position.x === 'number' && typeof position.y === 'number' 
        ? position 
        : { x: 470, y: 220 };
      
      const success = await openAttestationPreview(
        sanitizedStudent, 
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
        notifySuccess("Prévisualisation", `Aperçu généré pour ${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM}${encryptionStatus}`);
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

              {/* Upload de fichier amélioré */}
              <div className="space-y-2">
                <Label>Fichier Excel des étudiants</Label>
                <FileUploader
                  onFileLoaded={handleFileLoaded}
                  onError={setError}
                  onValidationResult={handleValidationResult}
                  isLoading={isLoading}
                  documentType="attestation"
                  allowPartialImport={true}
                />
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
                        {validationResult && !validationResult.isValid && (
                          <p className="text-sm text-yellow-700 mt-1">
                            ⚠️ {validationResult.missingRequired.length} colonne(s) requise(s) manquante(s)
                          </p>
                        )}
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
            additionalInfo={encryptionEnabled ? "Chiffrement activé" : "Sans chiffrement"}
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

      {/* Boutons de test pour développeurs */}
      {process.env.NODE_ENV === 'development' && excelData.length > 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">🧪 Outils de développement</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const testStudent = sanitizeStudentData(excelData[0]);
                  console.log('🧹 Données sanitisées:', testStudent);
                }}
              >
                Test sanitisation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testStudentEncryption(excelData[0])}
              >
                Test chiffrement
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const testStudent = sanitizeStudentData(excelData[0]);
                    const qrCode = await generateQrCodeBase64(testStudent, 'attestation', encryptionEnabled);
                    console.log('📱 QR Code généré:', qrCode.substring(0, 50) + '...');
                    notifySuccess("Test", "QR Code généré avec succès");
                  } catch (error) {
                    console.error('❌ Erreur QR:', error);
                    notifyError("Test", "Erreur lors de la génération du QR Code");
                  }
                }}
              >
                Test QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('📊 État actuel:');
                  console.log('- Données Excel:', excelData.length, 'étudiants');
                  console.log('- Chiffrement:', encryptionEnabled);
                  console.log('- Paramètres école:', schoolSettings);
                  console.log('- Thème:', attestationTheme);
                }}
              >
                État du système
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};