// src/components/organisms/attestation-generator/attestation-generator.tsx - Version avec validation des moyennes
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateQrCodeBase64, StudentExcelRecord, sanitizeStudentData, getQRCodeSizeEstimate } from "@/lib/helpers/qrcode";
import JSZip from "jszip";
import { useLocalStorage } from "usehooks-ts";
import { AttestationSettings } from "./AttestationSettings";
import { AttestationThemeEditor } from "./AttestationThemeEditor";
import { ThemePresetSelector } from "./ThemePresetSelector";
import { StudentSelector } from "../student-selector";
import { FileUploader } from "@/components/organisms/receipts/ExcelUploader.tsx";
import { FileDown, Loader2, Settings2, Table2, Palette, FileText, Eye, Wand2, Users, AlertCircle, CheckCircle, Shield, ShieldCheck, Info, TrendingUp, XCircle } from "lucide-react";
import { calculateGrade, calculateMention, getCurrentAcademicYear } from "@/lib/attestation-generator/utils";
import { openAttestationPreview } from "@/lib/attestation-generator/preview";
import { AttestationThemeSettingsPayload, defaultAttestationTheme } from "@/lib/form-schemas/attestation-theme-settings";
import { useNotifications } from "@/components/ui/notification-system";
import { useDocumentHistory } from "@/components/organisms/document-history/DocumentHistoryManager";
import { testCompactEncryption, createCompactDataFromStudent, getCompactEncryptionInfo } from "@/lib/crypto/compact-encryption";
import { validateExcelColumns, ValidationResult } from "@/lib/validators/excel-columns";
import { validateStudentForAttestation, filterEligibleStudents, validateSelectedStudents, calculateAverageStatistics } from "@/lib/validation/average-validation";
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
  
  // Option pour activer/désactiver le chiffrement compact
  const [encryptionEnabled, setEncryptionEnabled] = useLocalStorage("attestation-encryption-enabled", true);
  
  // Hooks pour notifications et historique
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotifications();
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

  // Validation des moyennes et statistiques
  const eligibilityData = React.useMemo(() => {
    return filterEligibleStudents(excelData);
  }, [excelData]);

  const averageStats = React.useMemo(() => {
    return calculateAverageStatistics(excelData);
  }, [excelData]);

  // Reset selected students when excel data changes
  useEffect(() => {
    setSelectedStudentMatricules([]);
    if (excelData.length > 0) {
      notifySuccess("Import", `${excelData.length} étudiant(s) importé(s) avec succès`);
      
      // Afficher les statistiques d'éligibilité
      if (eligibilityData.ineligibleCount > 0) {
        notifyWarning(
          "Éligibilité", 
          `${eligibilityData.ineligibleCount} étudiant(s) non éligible(s) pour les attestations (moyenne < 10/20)`
        );
      }
      
      if (eligibilityData.eligibleCount > 0) {
        notifyInfo(
          "Éligibilité", 
          `${eligibilityData.eligibleCount} étudiant(s) éligible(s) pour les attestations`
        );
      }
      
      // Test du chiffrement compact sur le premier étudiant éligible si le chiffrement est activé
      if (encryptionEnabled && eligibilityData.eligible.length > 0) {
        testStudentEncryptionCompact(eligibilityData.eligible[0]);
      }
      
      // Analyser la taille estimée des QR codes
      if (eligibilityData.eligible.length > 0) {
        analyzeQRCodeSizes(eligibilityData.eligible[0]);
      }
    }
  }, [excelData, encryptionEnabled, eligibilityData, notifySuccess, notifyWarning, notifyInfo]);

  // Fonction pour tester le chiffrement compact sur un étudiant
  const testStudentEncryptionCompact = (student: StudentExcelRecord) => {
    try {
      console.log('🧪 Test du chiffrement compact pour:', student.NOM, student.PRENOM);
      console.log('🔑 Clé basée sur le matricule:', student.MATRICULE);
      
      const sanitizedStudent = sanitizeStudentData(student);
      const { publicData, sensitiveData } = createCompactDataFromStudent(sanitizedStudent, 'attestation');
      const testResult = testCompactEncryption(publicData, sensitiveData);
      
      if (testResult) {
        console.log('✅ Test de chiffrement compact réussi');
        const encryptionInfo = getCompactEncryptionInfo(student.MATRICULE);
        notifySuccess(
          "Chiffrement compact", 
          `Système opérationnel - Clé: ${encryptionInfo.algorithm}`,
          { duration: 5000 }
        );
      } else {
        console.warn('⚠️ Test de chiffrement compact échoué');
        notifyWarning("Chiffrement", "Problème détecté avec le chiffrement compact");
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de chiffrement compact:', error);
      notifyError("Chiffrement", "Erreur lors du test de chiffrement compact");
    }
  };

  // Fonction pour analyser la taille des QR codes
  const analyzeQRCodeSizes = (student: StudentExcelRecord) => {
    try {
      const sizeAnalysis = getQRCodeSizeEstimate(student, 'attestation', encryptionEnabled);
      
      console.log('📊 Analyse de taille QR Code:', sizeAnalysis);
      
      if (sizeAnalysis.estimatedQRSize === 'Small') {
       // Suite du fichier attestation-generator.tsx - à partir de la fonction analyzeQRCodeSizes

        notifyInfo(
          "Taille QR Code", 
          `Optimal (${sizeAnalysis.totalContentLength} caractères) ${encryptionEnabled ? '🔐' : '📋'}`,
          { duration: 3000 }
        );
      } else if (sizeAnalysis.estimatedQRSize === 'Large') {
        notifyWarning(
          "Taille QR Code", 
          `Volumineux (${sizeAnalysis.totalContentLength} caractères) - Vérifiez la lisibilité`
        );
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse de taille QR:', error);
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
          CYCLE: row.CYCLE || 'N/D',
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

    // Validation des moyennes pour les attestations
    const validationResult = validateSelectedStudents(excelData, dataToProcess.map(s => s.MATRICULE));
    
    if (!validationResult.isValid) {
      const ineligibleList = validationResult.ineligibleStudents
        .map(({ student, reason }) => `• ${student.NOM} ${student.PRENOM}: ${reason}`)
        .join('\n');
      
      const message = `Impossible de générer les attestations pour les étudiants suivants :\n\n${ineligibleList}\n\nSeuls les étudiants avec une moyenne ≥ 10/20 peuvent recevoir une attestation.`;
      setError(message);
      notifyError("Étudiants non éligibles", message);
      return;
    }

    // Filtrer pour ne garder que les étudiants éligibles
    const eligibleStudents = dataToProcess.filter(student => {
      const validation = validateStudentForAttestation(student);
      return validation.isEligible;
    });

    if (eligibleStudents.length === 0) {
      const message = "Aucun étudiant éligible pour la génération d'attestations (moyenne < 10/20)";
      setError(message);
      notifyError("Aucun étudiant éligible", message);
      return;
    }

    if (eligibleStudents.length < dataToProcess.length) {
      const skippedCount = dataToProcess.length - eligibleStudents.length;
      notifyWarning(
        "Étudiants ignorés", 
        `${skippedCount} étudiant(s) ignoré(s) car leur moyenne est < 10/20`
      );
    }

    const encryptionMessage = encryptionEnabled ? "avec chiffrement compact" : "sans chiffrement";
    notifySuccess("Génération", `Début de la génération de ${eligibleStudents.length} attestation(s) ${encryptionMessage}`);

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

      // Analyser la taille totale estimée
      if (encryptionEnabled && eligibleStudents.length > 0) {
        const sampleAnalysis = getQRCodeSizeEstimate(eligibleStudents[0], 'attestation', true);
        console.log('📊 Analyse de taille pour le lot:', sampleAnalysis);
        
        if (sampleAnalysis.estimatedQRSize === 'Large') {
          notifyWarning(
            "Taille QR Codes", 
            "QR codes volumineux détectés - Vérifiez la lisibilité après génération"
          );
        }
      }

      for (const student of eligibleStudents) {
        try {
          console.log(`🔄 Génération pour ${student.MATRICULE} (${student.NOM} ${student.PRENOM})`);
          
          // Sanitiser les données de l'étudiant
          const sanitizedStudent = sanitizeStudentData(student);
          console.log('🧹 Données étudiant sanitisées');
          
          // Vérifier encore une fois l'éligibilité avant génération
          const finalValidation = validateStudentForAttestation(sanitizedStudent);
          if (!finalValidation.isEligible) {
            console.warn(`⚠️ Étudiant ${sanitizedStudent.MATRICULE} non éligible, ignoré`);
            continue;
          }
          
          // Générer le QR code compact avec ou sans chiffrement selon la configuration
          let qrCodeBase64 = '';
          try {
            console.log(`🔄 Génération QR compact pour ${sanitizedStudent.MATRICULE} (Chiffrement: ${encryptionEnabled})`);
            qrCodeBase64 = await generateQrCodeBase64(sanitizedStudent, 'attestation', encryptionEnabled);
            
            if (encryptionEnabled) {
              console.log('🔐 QR Code compact généré avec chiffrement (clé: matricule)');
              
              // Analyser la taille pour cet étudiant spécifique
              const studentSizeAnalysis = getQRCodeSizeEstimate(sanitizedStudent, 'attestation', true);
              console.log(`📊 Taille QR pour ${sanitizedStudent.MATRICULE}:`, studentSizeAnalysis.totalContentLength, 'caractères');
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
          
          const fileName = `${sanitizedStudent.MATRICULE}_Attestation${encryptionEnabled ? '_Compact' : ''}.pdf`;
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
            additionalInfo: encryptionEnabled ? 'Chiffrement compact activé' : 'Sans chiffrement'
          });
          
          successCount++;
          console.log(`✅ PDF généré avec succès pour ${sanitizedStudent.MATRICULE}`);
          
        } catch (err) {
          console.error(`Erreur lors de la génération de l'attestation pour ${student.MATRICULE}`, err);
          notifyError("Erreur", `Échec de génération pour ${student.NOM} ${student.PRENOM}`);
        }
        
        processedCount++;
        setProcessingProgress((processedCount / eligibleStudents.length) * 100);
      }

      if (successCount > 0) {
        const zipContent = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(zipContent);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        const zipName = `attestations_${timestamp}${encryptionEnabled ? '_compact' : ''}.zip`;
        link.download = zipName;
        link.click();
        window.URL.revokeObjectURL(url);

        const successMessage = `${successCount} attestation(s) générée(s) avec succès ${encryptionMessage}`;
        notifySuccess("Génération terminée", successMessage);
      }
      
      if (successCount < eligibleStudents.length) {
        const errorCount = eligibleStudents.length - successCount;
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
    if (eligibilityData.eligible.length > 0) {
      const studentToPreview = selectedStudentMatricules.length > 0 
        ? eligibilityData.eligible.find(s => s.MATRICULE === selectedStudentMatricules[0])
        : eligibilityData.eligible[0];
      
      if (studentToPreview) {
        previewAttestation(studentToPreview);
      }
    } else {
      const message = "Aucun étudiant éligible disponible pour la prévisualisation";
      setError(message);
      notifyWarning("Aucun étudiant éligible", message);
    }
  };

  const previewAttestation = async (student: StudentExcelRecord) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Vérifier l'éligibilité avant prévisualisation
      const validation = validateStudentForAttestation(student);
      if (!validation.isEligible) {
        throw new Error(`Cet étudiant n'est pas éligible pour une attestation: ${validation.reason}`);
      }
      
      console.log('🔄 Début de la prévisualisation avec chiffrement compact');
      
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
        const message = "Impossible d'ouvrir la fenêtre de prévisualisation. Vérifiez que les popups ne sont pas bloqués.";
        setError(message);
        notifyError("Erreur de prévisualisation", message);
      } else {
        const encryptionStatus = encryptionEnabled ? " (avec chiffrement compact)" : " (sans chiffrement)";
        notifySuccess("Prévisualisation", `Aperçu généré pour ${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM}${encryptionStatus}`);
      }
      
    } catch (err) {
      console.error("Erreur lors de la prévisualisation", err);
      const message = err instanceof Error ? err.message : "Une erreur est survenue lors de la prévisualisation de l'attestation";
      setError(message);
      notifyError("Erreur", message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour gérer la sélection des étudiants avec validation
  const handleStudentSelectionChange = (matricules: string[]) => {
    // Filtrer pour ne garder que les étudiants éligibles
    const eligibleMatricules = matricules.filter(matricule => {
      const student = excelData.find(s => s.MATRICULE === matricule);
      if (!student) return false;
      const validation = validateStudentForAttestation(student);
      return validation.isEligible;
    });
    
    if (eligibleMatricules.length < matricules.length) {
      const rejectedCount = matricules.length - eligibleMatricules.length;
      notifyWarning(
        "Sélection filtrée", 
        `${rejectedCount} étudiant(s) non éligible(s) exclu(s) de la sélection (moyenne < 10/20)`
      );
    }
    
    setSelectedStudentMatricules(eligibleMatricules);
    if (eligibleMatricules.length > 0) {
      notifySuccess("Sélection", `${eligibleMatricules.length} étudiant(s) éligible(s) sélectionné(s)`);
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
          
          {/* Indicateur de chiffrement compact */}
          <div className="flex items-center gap-2">
            {encryptionEnabled ? (
              <Badge variant="default" className="bg-green-600">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Chiffrement compact
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Sans chiffrement
              </Badge>
            )}
          </div>
        </div>

        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Génération d'Attestations avec Validation des Moyennes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Statistiques d'éligibilité */}
              {excelData.length > 0 && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{averageStats.eligible}</div>
                        <div className="text-sm text-gray-600">Éligibles (≥10/20)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{averageStats.ineligible}</div>
                        <div className="text-sm text-gray-600">Non éligibles (&lt;10/20)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{averageStats.percentageEligible.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Taux d'éligibilité</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{averageStats.averageEligible.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Moyenne éligibles</div>
                      </div>
                    </div>
                    {averageStats.ineligible > 0 && (
                      <Alert className="border-orange-300 bg-orange-50">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription className="text-orange-800">
                          <strong>{averageStats.ineligible} étudiant(s)</strong> ne peuvent pas recevoir d'attestation car leur moyenne est inférieure à 10/20.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Option de chiffrement compact */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Sécurité des QR Codes</h4>
                      <p className="text-sm text-blue-700">
                        Chiffrement compact basé uniquement sur le matricule - QR codes plus petits et plus lisibles
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        🔑 Clé de chiffrement: matricule • Taille: 50-80 caractères chiffrés
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
                          const message = checked ? "Chiffrement compact activé" : "Chiffrement désactivé";
                          notifySuccess("Sécurité", message);
                          
                          // Analyser l'impact sur la taille si des données sont déjà chargées
                          if (eligibilityData.eligible.length > 0) {
                            setTimeout(() => analyzeQRCodeSizes(eligibilityData.eligible[0]), 500);
                          }
                        }}
                      />
                    </div>
                  </div>
                  {encryptionEnabled && (
                    <div className="mt-3 text-xs text-blue-600">
                      <Shield className="h-3 w-3 inline mr-1" />
                      QR codes compacts avec chiffrement AES-128-ECB basé sur le matricule
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
                  <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
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
                          {excelData.length} étudiant(s) • {eligibilityData.eligibleCount} éligible(s) • {selectedStudentMatricules.length} sélectionné(s)
                        </p>
                        <div className="flex items-center gap-4 text-sm text-blue-700 mt-1">
                          <span>Police: {attestationTheme.mainFont.split(',')[0]}</span>
                          <span>Couleur: {attestationTheme.primaryColor}</span>
                          <span>Style: {attestationTheme.contentLayout}</span>
                          <span className="font-medium">
                            {encryptionEnabled ? '🔐 Compact' : '📋 Standard'}
                          </span>
                        </div>
                        {validationResult && !validationResult.isValid && (
                          <p className="text-sm text-yellow-700 mt-1">
                            ⚠️ {validationResult.missingRequired.length} colonne(s) requise(s) manquante(s)
                          </p>
                        )}
                        {averageStats.ineligible > 0 && (
                          <p className="text-sm text-red-700 mt-1">
                            ⚠️ {averageStats.ineligible} étudiant(s) non éligible(s) (moyenne &lt; 10/20)
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
                  disabled={isLoading || excelData.length === 0 || eligibilityData.eligibleCount === 0}
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
                        : `Générer attestations éligibles (${eligibilityData.eligibleCount})`
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
            students={eligibilityData.eligible} // Ne montrer que les étudiants éligibles
            selectedStudents={selectedStudentMatricules}
            onSelectionChange={handleStudentSelectionChange}
            onPreview={handlePreviewStudent}
            onGenerateSelected={generateAttestations}
            documentType="attestation"
            isLoading={isLoading}
            additionalInfo={`${encryptionEnabled ? "Chiffrement compact activé" : "Sans chiffrement"} • ${eligibilityData.ineligibleCount} non éligible(s) masqué(s)`}
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

      {/* Informations sur le chiffrement compact en mode développement */}
      {process.env.NODE_ENV === 'development' && excelData.length > 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">🧪 Outils de développement - Chiffrement Compact</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (eligibilityData.eligible.length > 0) {
                    const testStudent = sanitizeStudentData(eligibilityData.eligible[0]);
                    console.log('🧹 Données sanitisées:', testStudent);
                  }
                }}
              >
                Test sanitisation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (eligibilityData.eligible.length > 0) {
                    testStudentEncryptionCompact(eligibilityData.eligible[0]);
                  }
                }}
              >
                Test chiffrement compact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (eligibilityData.eligible.length > 0) {
                    try {
                      const testStudent = sanitizeStudentData(eligibilityData.eligible[0]);
                      const qrCode = await generateQrCodeBase64(testStudent, 'attestation', encryptionEnabled);
                      console.log('📱 QR Code généré:', qrCode.substring(0, 50) + '...');
                      
                      // Analyser la taille
                      const sizeAnalysis = getQRCodeSizeEstimate(testStudent, 'attestation', encryptionEnabled);
                      console.log('📊 Analyse de taille:', sizeAnalysis);
                      
                      notifySuccess("Test", `QR Code généré avec succès (${sizeAnalysis.totalContentLength} caractères)`);
                    } catch (error) {
                      console.error('❌ Erreur QR:', error);
                      notifyError("Test", "Erreur lors de la génération du QR Code");
                    }
                  }
                }}
              >
                Test QR Code compact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (eligibilityData.eligible.length > 0) {
                    const sizeAnalysis = getQRCodeSizeEstimate(eligibilityData.eligible[0], 'attestation', encryptionEnabled);
                    console.log('📊 Analyse complète de taille:', sizeAnalysis);
                    
                    const encryptionInfo = encryptionEnabled ? 
                      getCompactEncryptionInfo(eligibilityData.eligible[0].MATRICULE) : null;
                    
                    console.log('📊 État actuel du système:');
                    console.log('- Données Excel:', excelData.length, 'étudiants');
                    console.log('- Étudiants éligibles:', eligibilityData.eligibleCount);
                    console.log('- Étudiants non éligibles:', eligibilityData.ineligibleCount);
                    console.log('- Chiffrement compact:', encryptionEnabled);
                    console.log('- Taille QR estimée:', sizeAnalysis.estimatedQRSize);
                    console.log('- Longueur contenu:', sizeAnalysis.totalContentLength, 'caractères');
                    console.log('- Paramètres école:', schoolSettings);
                    console.log('- Thème:', attestationTheme);
                    if (encryptionInfo) {
                      console.log('- Info chiffrement:', encryptionInfo);
                    }
                  }
                }}
              >
                Analyse de taille
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (eligibilityData.eligible.length > 0 && encryptionEnabled) {
                    const student = sanitizeStudentData(eligibilityData.eligible[0]);
                    const { publicData, sensitiveData } = createCompactDataFromStudent(student, 'attestation');
                    
                    console.log('🔑 Test de clé de chiffrement compact:');
                    console.log('- Matricule utilisé:', sensitiveData.m);
                    
                    const encryptionInfo = getCompactEncryptionInfo(sensitiveData.m);
                    console.log('- Info clé:', encryptionInfo);
                    
                    console.log('📊 Répartition des données:');
                    console.log('- Publiques:', Object.keys(publicData));
                    console.log('- Sensibles:', Object.keys(sensitiveData));
                    
                    notifyInfo(
                      "Info chiffrement", 
                      `Clé basée sur: ${sensitiveData.m} | Algorithme: ${encryptionInfo.algorithm}`
                    );
                  }
                }}
                disabled={!encryptionEnabled}
              >
                Info clé de chiffrement
              </Button>
            </div>
            
            {encryptionEnabled && eligibilityData.eligible.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                <h5 className="text-sm font-medium text-green-800 mb-2">🔐 Chiffrement Compact Activé</h5>
                <div className="text-xs text-green-700 space-y-1">
                  <p>• Clé basée uniquement sur le matricule de l'étudiant</p>
                  <p>• Algorithme: AES-128-ECB (optimisé pour la compacité)</p>
                  <p>• Taille chiffrée estimée: 50-80 caractères</p>
                  <p>• QR codes plus petits et plus lisibles</p>
                  <p>• Déchiffrement possible avec juste le matricule</p>
                  <p>• Seuls les étudiants avec moyenne ≥ 10/20 sont éligibles</p>
                </div>
              </div>
            )}
            
            {excelData.length > 0 && (
              <div className="mt-3 p-3 bg-orange-50 rounded-md border border-orange-200">
                <h5 className="text-sm font-medium text-orange-800 mb-2">📊 Validation des Moyennes</h5>
                <div className="text-xs text-orange-700 space-y-1">
                  <p>• Total d'étudiants: {excelData.length}</p>
                  <p>• Étudiants éligibles (≥10/20): {eligibilityData.eligibleCount}</p>
                  <p>• Étudiants non éligibles (&lt;10/20): {eligibilityData.ineligibleCount}</p>
                  <p>• Taux d'éligibilité: {averageStats.percentageEligible.toFixed(1)}%</p>
                  <p>• Moyenne générale: {averageStats.averageGeneral.toFixed(2)}/20</p>
                  <p>• Moyenne des éligibles: {averageStats.averageEligible.toFixed(2)}/20</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Indicateur de performance du chiffrement */}
      {excelData.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">Performance QR Codes:</span>
                </div>
                {(() => {
                  if (eligibilityData.eligible.length > 0) {
                    const sizeAnalysis = getQRCodeSizeEstimate(eligibilityData.eligible[0], 'attestation', encryptionEnabled);
                    return (
                      <div className="flex items-center gap-4">
                        <span className="text-gray-700">
                          Taille: <span className="font-medium">{sizeAnalysis.estimatedQRSize}</span>
                        </span>
                        <span className="text-gray-700">
                          Contenu: <span className="font-medium">{sizeAnalysis.totalContentLength} caractères</span>
                        </span>
                        {encryptionEnabled && (
                          <span className="text-green-700">
                            🔐 <span className="font-medium">Compact</span>
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              
              <div className="flex items-center gap-2">
                {excelData.length > 0 && (() => {
                  if (eligibilityData.eligible.length > 0) {
                    const sizeAnalysis = getQRCodeSizeEstimate(eligibilityData.eligible[0], 'attestation', encryptionEnabled);
                    if (sizeAnalysis.estimatedQRSize === 'Small') {
                      return <Badge variant="default" className="bg-green-600">Optimal</Badge>;
                    } else if (sizeAnalysis.estimatedQRSize === 'Medium') {
                      return <Badge variant="secondary">Moyen</Badge>;
                    } else {
                      return <Badge variant="destructive">Volumineux</Badge>;
                    }
                  }
                  return null;
                })()}
                
                {/* Badge d'éligibilité */}
                {excelData.length > 0 && (
                  <Badge variant={eligibilityData.eligibleCount === excelData.length ? "default" : "destructive"}>
                    {eligibilityData.eligibleCount}/{excelData.length} éligibles
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerte d'information sur la validation des moyennes */}
      {excelData.length > 0 && eligibilityData.ineligibleCount > 0 && (
        <Alert className="border-orange-300 bg-orange-50">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>Information importante :</strong> Seuls les étudiants avec une moyenne supérieure ou égale à 10/20 peuvent recevoir une attestation de réussite. 
            {eligibilityData.ineligibleCount} étudiant(s) ont été exclus de la génération car leur moyenne est insuffisante.
            <div className="mt-2 text-sm">
              • Étudiants éligibles : {eligibilityData.eligibleCount}
              • Étudiants non éligibles : {eligibilityData.ineligibleCount}
              • Taux d'éligibilité : {averageStats.percentageEligible.toFixed(1)}%
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};