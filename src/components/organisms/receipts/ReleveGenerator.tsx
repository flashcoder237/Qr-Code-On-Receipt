// src/components/organisms/receipts/ReleveGenerator.tsx - Version mise à jour avec chiffrement compact
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useHotkeys } from "react-hotkeys-hook";
import { Eye, Download, AlertCircle, CheckCircle, Users, RefreshCw, AlertTriangle, Shield, ShieldCheck, Info } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { useNotifications } from "@/components/ui/notification-system";
import { useDocumentHistory } from "@/components/organisms/document-history/DocumentHistoryManager";

// Components
import { FileUploader } from "@/components/organisms/receipts/ExcelUploader.tsx";
import { ProcessingProgress } from "./components/ProcessingProgress";
import { ConfigurationSelector } from "./ConfigurationSelector";
import { ColumnMappingEditor } from "./ColumnMappingEditor";
import { TranscriptPreview } from "./TranscriptPreview";
import { SemesterSelector } from "./SemesterSelector";
import { StudentSelector } from "../student-selector";

// Hooks
import { useConfiguration } from "./hooks/useConfiguration";
import { useProcessing } from "./hooks/useProcessing";
import { useTranscriptData } from "./hooks/useTranscriptData";
import { StudentRecord } from "../../../types/student";

// Validators et helpers pour le chiffrement
import { ValidationResult } from "@/lib/validators/excel-columns";
import { sanitizeStudentData, generateQrCodeBase64, testStudentEncryptionCompact, getQRCodeSizeEstimate } from "@/lib/helpers/qrcode";

const LOCAL_STORAGE_KEY = "academicConfigs";

interface TranscriptSettings {
  establishmentType: string;
  nameFrench: string;
  nameEnglish: string;
  postalBox: string;
  postalBoxEn: string;
  email: string;
  logo: string;
  universityLogo: string;
  facultyLogo: string;
  themeColor: string;
  themeFont: string;
}

export const ReleveGenerator: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState("configuration");
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewContentUrl, setPreviewContentUrl] = useState<string | null>(null);
  const [selectedStudentMatricules, setSelectedStudentMatricules] = useState<string[]>([]);
  const [configsLoaded, setConfigsLoaded] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [forceShowMapping, setForceShowMapping] = useState(false);

  // NOUVEAU: Option pour activer/désactiver le chiffrement compact pour les relevés
  const [encryptionEnabled, setEncryptionEnabled] = useLocalStorage("releve-encryption-enabled", true);

  // Hooks pour notifications et historique
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotifications();
  const { addDocumentRecord } = useDocumentHistory();

  const isDemoMode = localStorage.getItem('demo_mode') === 'true';

  // Load settings from localStorage
  const [settings] = useLocalStorage<TranscriptSettings>("settings", {
    nameFrench: "",
    nameEnglish: "",
    postalBox: "",
    postalBoxEn: "",
    email: "",
    logo: "",
    universityLogo: "",
    facultyLogo: "",
    themeColor: "#000000",
    themeFont: "Times New Roman, serif",
  });

  // Load configurations from localStorage only once during component mount
  useEffect(() => {
    if (!configsLoaded) {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsedConfigs = JSON.parse(stored);
          setConfigs(parsedConfigs);
        }
        setConfigsLoaded(true);
      } catch (error) {
        console.error("Erreur lors du chargement des configurations:", error);
        notifyError("Erreur", "Impossible de charger les configurations");
      }
    }
  }, [configsLoaded, notifyError]);

  useEffect(() => {
    if (previewContentUrl) {
      console.log("previewContentUrl a changé, nouvelle valeur:", previewContentUrl);
      setActiveTab("preview");
    }
  }, [previewContentUrl]);

  // Listen to localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        try {
          const parsedConfigs = JSON.parse(e.newValue);
          setConfigs(parsedConfigs);
        } catch (error) {
          console.error("Erreur lors du traitement des nouvelles configurations:", error);
          notifyError("Erreur", "Erreur lors de la mise à jour des configurations");
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [notifyError]);

  // Custom hooks
  const {
    selectedConfigId,
    selectedSemesterId,
    availableSemesters,
    columnMapping,
    handleConfigChange,
    handleSemesterChange,
    handleMappingChange,
    updateAvailableSemesters,
    setColumnMapping
  } = useConfiguration({
    onConfigChange: (configId) => {
      const config = configs.find(c => c.id === configId);
      if (config) {
        updateAvailableSemesters(
          config.semesters.map((sem: any) => ({
            id: sem.id,
            name: sem.name
          }))
        );
        notifySuccess("Configuration", `Configuration "${config.name}" sélectionnée`);
      }
      setPreviewStudent(null);
      setSelectedStudentMatricules([]);
      if (previewContentUrl) {
        URL.revokeObjectURL(previewContentUrl);
        setPreviewContentUrl(null);
      }
      setError(null);
      setValidationResult(null);
      setForceShowMapping(false);
    },
    onSemesterChange: (semesterId) => {
      const config = configs.find(c => c.id === selectedConfigId);
      if (config) {
        const semester = config.semesters.find(s => s.id === semesterId);
        if (semester) {
          notifySuccess("Semestre", `Semestre "${semester.name}" sélectionné`);
        }
      }
      setPreviewStudent(null);
      setSelectedStudentMatricules([]);
      if (previewContentUrl) {
        URL.revokeObjectURL(previewContentUrl);
        setPreviewContentUrl(null);
      }
      setError(null);
    }
  });

  const {
    excelData,
    excelColumns,
    mappingComplete,
    handleFileLoaded: handleDataLoaded,
    clearData,
    setMappingStatus,
  } = useTranscriptData();

  const {
    state: processingState,
    processBatch,
    generateZipFile,
    cancel: cancelProcessing,
    resetState: resetProcessing,
  } = useProcessing();

  // Get current config and semester info
  const { currentConfig, currentSemester } = useMemo(() => {
    const config = configs.find(c => c.id === selectedConfigId);
    const semester = config?.semesters.find(s => s.id === selectedSemesterId);
    return { currentConfig: config, currentSemester: semester };
  }, [configs, selectedConfigId, selectedSemesterId]);

  // Get available ECs for mapping
  const getAvailableECs = useCallback(() => {
    if (!currentConfig || !currentSemester) return [];

    const ecs: Array<{ id: string; fullName: string }> = [];
    currentSemester.ues.forEach((ue: any) => {
      ue.ecs.forEach((ec: any) => {
        ecs.push({
          id: ec.id,
          fullName: `${currentSemester.name} - ${ue.name} - ${ec.name}`,
        });
      });
    });

    return ecs;
  }, [currentConfig, currentSemester]);

  // NOUVEAU: Fonction pour tester le chiffrement compact sur un étudiant
  const testStudentEncryptionCompactForReleve = (student: any) => {
    try {
      console.log('🧪 Test du chiffrement compact pour relevé:', student.NOM, student.PRENOM);
      console.log('🔑 Clé basée sur le matricule:', student.MATRICULE);
      
      const sanitizedStudent = sanitizeStudentData(student);
      const testResult = testStudentEncryptionCompact(sanitizedStudent, 'releve');
      
      if (testResult) {
        console.log('✅ Test de chiffrement compact réussi pour relevé');
        notifySuccess(
          "Chiffrement compact", 
          `Système opérationnel pour les relevés - Clé: AES-128-ECB`,
          { duration: 5000 }
        );
      } else {
        console.warn('⚠️ Test de chiffrement compact échoué pour relevé');
        notifyWarning("Chiffrement", "Problème détecté avec le chiffrement compact des relevés");
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de chiffrement compact pour relevé:', error);
      notifyError("Chiffrement", "Erreur lors du test de chiffrement compact des relevés");
    }
  };

  // NOUVEAU: Fonction pour analyser la taille des QR codes pour les relevés
  const analyzeQRCodeSizesForReleve = (student: any) => {
    try {
      const sizeAnalysis = getQRCodeSizeEstimate(student, 'releve', encryptionEnabled);
      
      console.log('📊 Analyse de taille QR Code pour relevé:', sizeAnalysis);
      
      if (sizeAnalysis.estimatedQRSize === 'Small') {
        notifyInfo(
          "Taille QR Code", 
          `Optimal pour relevé (${sizeAnalysis.totalContentLength} caractères) ${encryptionEnabled ? '🔐' : '📋'}`,
          { duration: 3000 }
        );
      } else if (sizeAnalysis.estimatedQRSize === 'Large') {
        notifyWarning(
          "Taille QR Code", 
          `Volumineux pour relevé (${sizeAnalysis.totalContentLength} caractères) - Vérifiez la lisibilité`
        );
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse de taille QR pour relevé:', error);
    }
  };

  // Handle file loading with validation and automatic mapping
  const handleFileLoadedWithMapping = useCallback((data: any[], columns: string[], mapping?: { [key: string]: string }) => {
    handleDataLoaded(data, columns);
    
    if (mapping) {
      // Appliquer le mapping automatique si fourni
      Object.entries(mapping).forEach(([ecId, columnName]) => {
        if (columnName && columns.includes(columnName)) {
          handleMappingChange(ecId, columnName);
        }
      });
    }

    setError(null);
    setForceShowMapping(false);
  }, [handleDataLoaded, handleMappingChange]);

  // Handle validation results
  const handleValidationResult = useCallback((result: ValidationResult) => {
    setValidationResult(result);
    
    if (result.isValid) {
      // Succès avec correspondances automatiques
      const mappedCount = Object.keys(result.mappedColumns || {}).length;
      if (mappedCount > 0) {
        notifySuccess(
          "Validation réussie", 
          `Toutes les colonnes requises détectées avec ${mappedCount} correspondance(s) automatique(s)`
        );
        
        // Afficher les correspondances dans une notification détaillée
        const mappings = Object.entries(result.mappedColumns || {})
          .map(([key, col]) => `• ${key} ← "${col}"`)
          .join('\n');
        
        setTimeout(() => {
          notifySuccess(
            "Correspondances automatiques", 
            `Colonnes mappées automatiquement :\n${mappings}`,
            { duration: 8000 }
          );
        }, 1000);
      } else {
        notifySuccess("Validation", "Toutes les colonnes requises sont présentes");
      }
    } else {
      if (result.missingRequired.length > 0) {
        const missingList = result.missingRequired
          .map(req => req.displayName)
          .join(', ');
        
        notifyError(
          "Colonnes manquantes", 
          `Colonnes obligatoires manquantes : ${missingList}`
        );
        setForceShowMapping(true);
      } else {
        const optionalCount = result.missingOptional.length;
        notifyWarning(
          "Validation partielle", 
          `${optionalCount} colonne(s) optionnelle(s) manquante(s). Vous pouvez continuer ou les ajouter.`
        );
      }
    }
  }, [notifySuccess, notifyError, notifyWarning]);

  // Check if mapping is complete when available ECs or column mapping changes
  useEffect(() => {
    if (!selectedConfigId || !selectedSemesterId) return;
    
    const availableECs = getAvailableECs();
    if (availableECs.length > 0) {
      const complete = availableECs.every(ec => columnMapping[ec.id]);
      setMappingStatus(complete);
      
      if (complete) {
        notifySuccess("Correspondance", "Correspondance des colonnes complétée");
        setForceShowMapping(false);
      }
    }
  }, [getAvailableECs, columnMapping, setMappingStatus, selectedConfigId, selectedSemesterId, notifySuccess]);

  // Reset selected students when excel data changes
  useEffect(() => {
    setSelectedStudentMatricules([]);
    if (excelData.length > 0) {
      notifySuccess("Import", `${excelData.length} étudiant(s) importé(s) avec succès`);
      
      // NOUVEAU: Test du chiffrement compact sur le premier étudiant si le chiffrement est activé
      if (encryptionEnabled && excelData.length > 0) {
        testStudentEncryptionCompactForReleve(excelData[0]);
      }
      
      // NOUVEAU: Analyser la taille estimée des QR codes pour relevés
      if (excelData.length > 0) {
        analyzeQRCodeSizesForReleve(excelData[0]);
      }
    }
  }, [excelData, notifySuccess, encryptionEnabled]);

  // Auto-switch to mapping tab if validation issues
  useEffect(() => {
    if (forceShowMapping && validationResult && !validationResult.isValid) {
      setActiveTab("mapping");
    }
  }, [forceShowMapping, validationResult]);

  // Fonction pour charger un mapping complet
  const handleLoadMapping = useCallback((mapping: Record<string, string>) => {
    try {
      setColumnMapping(mapping);
      notifySuccess("Correspondance", "Correspondance chargée avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement du mapping:", error);
      setError(`Erreur lors du chargement du mapping: ${error instanceof Error ? error.message : String(error)}`);
      notifyError("Erreur", "Impossible de charger la correspondance");
    }
  }, [setColumnMapping, notifySuccess, notifyError]);

  // Prepare student data for PDF generation - VERSION CORRIGÉE
  const prepareStudentData = useCallback((rawStudent: any): StudentRecord => {
    if (!currentConfig || !currentSemester) return null;
  
    // Vérifications de sécurité supplémentaires
    if (!currentConfig.semesters || !currentSemester.ues) {
      console.error("Configuration incomplète:", { currentConfig, currentSemester });
      throw new Error("Configuration incomplète - semestres ou UEs manquants");
    }

    const courses: any[] = [];
    const ueMap = new Map();
    
    // Première étape : construire les cours et regrouper par UE
    currentSemester.ues.forEach((ue: any) => {
      if (!ue || !ue.ecs) {
        console.warn("UE incomplète ignorée:", ue);
        return;
      }

      const ueGrades: number[] = [];
      
      ue.ecs.forEach((ec: any) => {
        if (!ec || !ec.id) {
          console.warn("EC incomplet ignoré:", ec);
          return;
        }

        const columnName = columnMapping[ec.id];
        if (columnName && rawStudent[columnName] !== undefined && rawStudent[columnName] !== null && rawStudent[columnName] !== '') {
          const gradeValue = rawStudent[columnName];
          const grade = parseFloat(gradeValue);
          
          if (isNaN(grade)) {
            console.warn(`Note invalide pour ${ec.name}: ${gradeValue}`);
            return;
          }
          
          courses.push({
            CODE: ue.code || `UE ${ue.name}`,
            INTITULE: ue.name,
            EC_TITRE: ec.name,
            NOTE: grade,
            UE_CREDIT: ue.credits || 0,
            UE_ID: ue.id
          });
          
          ueGrades.push(grade);
        }
      });
      
      // Calculer la moyenne de l'UE si elle a des notes
      if (ueGrades.length > 0) {
        const ueAverage = ueGrades.reduce((sum, grade) => sum + grade, 0) / ueGrades.length;
        ueMap.set(ue.id, {
          average: ueAverage,
          credits: ue.credits || 0,
          code: ue.code || `UE ${ue.name}`,
          name: ue.name
        });
      }
    });
    
    // Deuxième étape : assigner les moyennes UE aux cours
    courses.forEach(course => {
      const ueData = ueMap.get(course.UE_ID);
      if (ueData) {
        course.UE_AVERAGE = ueData.average;
      } else {
        console.warn(`Aucune donnée UE trouvée pour le cours ${course.EC_TITRE}`);
        course.UE_AVERAGE = 0;
      }
    });

    // Calculer le total des crédits
    const totalCredits = 30;

    const studentRecord: StudentRecord = {
      NOM: rawStudent.NOM || "",
      PRENOM: rawStudent.PRENOM || "",
      MATRICULE: rawStudent.MATRICULE || "",
      "DATE DE NAISSANCE": rawStudent["DATE DE NAISSANCE"] || "",
      "LIEU DE NAISSANCE": rawStudent["LIEU DE NAISSANCE"] || "",
      CYCLE: currentConfig.cycle || "",
      "ANNEE ACADÉMIQUE": currentConfig.academicYear || "",
      FILIERE: currentConfig.filiere || "",
      NIVEAU: currentConfig.niveau || "",
      SEMESTRE: currentSemester.name || "",
      OPTION: currentConfig.option || "",
      COURSES: courses,
      TOTAL_CREDITS: 30
    };

    console.log("Données étudiant préparées:", {
      nom: studentRecord.NOM,
      prenom: studentRecord.PRENOM,
      coursCount: courses.length,
      totalCredits: 30,
      ueCount: ueMap.size
    });

    return studentRecord;
  }, [currentConfig, currentSemester, columnMapping]);

  const handlePreviewReleve = useCallback(async (student?: any) => {
    if (!currentConfig || !currentSemester) {
      const message = "Veuillez sélectionner une configuration et un semestre";
      setError(message);
      notifyWarning("Configuration manquante", message);
      return;
    }

    if (excelData.length === 0) {
      const message = "Veuillez charger des données";
      setError(message);
      notifyWarning("Données manquantes", message);
      return;
    }

    if (!mappingComplete) {
      const message = "Veuillez compléter la correspondance des colonnes avant de prévisualiser";
      setError(message);
      notifyWarning("Correspondance incomplète", message);
      setActiveTab("mapping");
      return;
    }

    try {
      const studentToPreview = student || 
        (selectedStudentMatricules.length > 0 
          ? excelData.find(s => s.MATRICULE === selectedStudentMatricules[0])
          : excelData[0]);

      if (!studentToPreview) {
        throw new Error("Aucun étudiant trouvé pour la prévisualisation");
      }

      const preparedStudent = prepareStudentData(studentToPreview);
      if (!preparedStudent) {
        throw new Error("Erreur lors de la préparation des données");
      }

      console.log("Données étudiant préparées:", preparedStudent);
      console.log("Paramètres:", settings);
      console.log("🔐 Chiffrement activé pour relevé:", encryptionEnabled);

      setPreviewStudent(preparedStudent);
      
      if (!window.transcriptRenderer) {
        throw new Error("Impossible de communiquer avec le processus de rendu HTML");
      }
      
      try {
        // NOUVEAU: Passer l'option de chiffrement aux paramètres
        const renderParams = { 
          student: preparedStudent, 
          settings: {
            ...settings,
            demoMode: isDemoMode,
            encryptionEnabled: encryptionEnabled // Ajouter l'option de chiffrement
          }
        };
        
        const htmlContent = await window.transcriptRenderer.renderHTML(renderParams);
        console.log("Contenu HTML reçu:", htmlContent ? "Oui" : "Non", "Longueur:", htmlContent?.length);
        
        if (!htmlContent) {
          throw new Error("Aucun contenu HTML reçu");
        }
        
        const success = await window.ipcRenderer.invoke('show-preview', htmlContent, 
          `Prévisualisation du relevé - ${preparedStudent.NOM} ${preparedStudent.PRENOM} ${encryptionEnabled ? '🔐' : ''}`);
        
        if (!success) {
          throw new Error("Impossible d'ouvrir la fenêtre de prévisualisation");
        }
        
        setError(null);
        const encryptionStatus = encryptionEnabled ? " (avec chiffrement compact)" : " (sans chiffrement)";
        notifySuccess("Prévisualisation", `Aperçu généré pour ${preparedStudent.NOM} ${preparedStudent.PRENOM}${encryptionStatus}`);
      } catch (err) {
        console.error("Erreur pendant le rendu HTML:", err);
        const message = `Erreur de communication avec le processus de rendu: ${err.message || 'Erreur inconnue'}`;
        setError(message);
        notifyError("Erreur de rendu", message);
      }
    } catch (error) {
      console.error('Erreur de prévisualisation:', error);
      const message = `Erreur lors de la génération de la prévisualisation: ${error.message || 'Erreur inconnue'}`;
      setError(message);
      notifyError("Erreur", message);
    }
  }, [currentConfig, currentSemester, excelData, mappingComplete, prepareStudentData, settings, selectedStudentMatricules, encryptionEnabled, notifySuccess, notifyError, notifyWarning]);
  
  const handleGenerateSelected = useCallback(async (studentsToGenerate?: any[]) => {
    if (!currentConfig || !currentSemester) {
      const message = "Veuillez sélectionner une configuration et un semestre";
      setError(message);
      notifyWarning("Configuration manquante", message);
      return;
    }

    if (excelData.length === 0) {
      const message = "Veuillez charger des données";
      setError(message);
      notifyWarning("Données manquantes", message);
      return;
    }

    if (!mappingComplete) {
      const message = "Veuillez compléter la correspondance des colonnes avant de générer les relevés";
      setError(message);
      notifyWarning("Correspondance incomplète", message);
      setActiveTab("mapping");
      return;
    }

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

    const encryptionMessage = encryptionEnabled ? "avec chiffrement compact" : "sans chiffrement";
    notifySuccess("Génération", `Début de la génération de ${dataToProcess.length} relevé(s) ${encryptionMessage}`);

    try {
      const preparedData = [];
      
      for (const student of dataToProcess) {
        try {
          const prepared = prepareStudentData(student);
          if (!prepared) {
            console.error("Erreur lors de la préparation des données pour:", student.MATRICULE);
            throw new Error(`Erreur lors de la préparation des données pour l'étudiant ${student.MATRICULE}`);
          }
          
          // NOUVEAU: Inclure l'option de chiffrement dans les paramètres
          preparedData.push({ 
            student: prepared, 
            settings: {
              ...settings,
              demoMode: isDemoMode,
              encryptionEnabled: encryptionEnabled
            }
          });
        } catch (prepError) {
          console.error(`Erreur de préparation pour l'étudiant ${student.MATRICULE}:`, prepError);
          notifyError("Erreur de préparation", `Impossible de préparer les données pour ${student.NOM} ${student.PRENOM}`);
          throw prepError;
        }
      }
      
      const results = await processBatch(
        preparedData,
        (data) => window.ipcRenderer.invoke('generate-transcript-pdf', data)
      );

      const zipBlob = await generateZipFile(results, encryptionEnabled ? 'releve_compact' : 'releve');
      const url = URL.createObjectURL(zipBlob);
      
      const link = document.createElement("a");
      link.href = url;
      const fileName = `releves_${new Date().toISOString().split('T')[0]}${encryptionEnabled ? '_compact' : ''}.zip`;
      link.download = fileName;
      link.click();
      
      URL.revokeObjectURL(url);
      setError(null);
      
      // Ajouter les documents à l'historique - VERSION CORRIGÉE
      dataToProcess.forEach(student => {
        try {
          const preparedStudent = prepareStudentData(student);
          if (preparedStudent) {
            // Regrouper les cours par UE et calculer les moyennes
            const ueAverages = new Map();
            
            preparedStudent.COURSES?.forEach(course => {
              const ueId = course.UE_ID;
              if (!ueAverages.has(ueId)) {
                // Récupérer tous les cours de cette UE
                const ueCourses = preparedStudent.COURSES.filter(c => c.UE_ID === ueId);
                // Calculer la moyenne de l'UE
                const totalGrades = ueCourses.reduce((sum, c) => sum + c.NOTE, 0);
                const ueAverage = ueCourses.length > 0 ? totalGrades / ueCourses.length : 0;
                
                ueAverages.set(ueId, {
                  average: ueAverage,
                  credits: course.UE_CREDIT || 0
                });
              }
            });
            
            // Calculer la moyenne pondérée générale
            let totalWeightedScore = 0;
            let totalCredits = 0;
            
            ueAverages.forEach(ue => {
              totalWeightedScore += ue.average * ue.credits;
              totalCredits += ue.credits;
            });
            
            const averageScore = totalCredits > 0 ? totalWeightedScore / 30 : 0;
            
            addDocumentRecord({
              type: 'releve',
              studentName: `${preparedStudent.NOM} ${preparedStudent.PRENOM}`,
              studentMatricule: preparedStudent.MATRICULE,
              academicYear: preparedStudent["ANNEE ACADÉMIQUE"],
              level: preparedStudent.NIVEAU,
              semester: preparedStudent.SEMESTRE,
              average: averageScore,
              fileName: `${preparedStudent.MATRICULE}_releve${encryptionEnabled ? '_compact' : ''}.pdf`,
              status: 'generated',
              additionalInfo: encryptionEnabled ? 'Chiffrement compact activé' : 'Sans chiffrement'
            });
          }
        } catch (historyError) {
          console.error("Erreur lors de l'ajout à l'historique:", historyError);
          // Ne pas faire échouer tout le processus pour une erreur d'historique
        }
      });
      
      const successMessage = `${results.size} relevé(s) généré(s) avec succès ${encryptionMessage}`;
      notifySuccess("Génération terminée", successMessage);
    } catch (error) {
      console.error('Generation error:', error);
      const message = `Erreur lors de la génération des relevés: ${error.message || 'Erreur inconnue'}`;
      setError(message);
      notifyError("Erreur de génération", message);
    }
  }, [currentConfig, currentSemester, excelData, mappingComplete, prepareStudentData, processBatch, generateZipFile, settings, selectedStudentMatricules, encryptionEnabled, notifySuccess, notifyError, notifyWarning, addDocumentRecord]);

  // Keyboard shortcuts
  useHotkeys('ctrl+p', () => handlePreviewReleve(), [handlePreviewReleve]);
  useHotkeys('ctrl+g', () => handleGenerateSelected(), [handleGenerateSelected]);
  useHotkeys('esc', () => setActiveTab("configuration"), []);

  // Fonction pour vérifier si les boutons doivent être activés
  const areButtonsEnabled = useCallback(() => {
    return (
      !processingState.isLoading && 
      selectedConfigId && 
      selectedSemesterId && 
      mappingComplete && 
      excelData.length > 0
    );
  }, [processingState.isLoading, selectedConfigId, selectedSemesterId, mappingComplete, excelData.length]); 

  // Fonction pour gérer la sélection des étudiants
  const handleStudentSelectionChange = useCallback((matricules: string[]) => {
    setSelectedStudentMatricules(matricules);
    if (matricules.length > 0) {
      notifySuccess("Sélection", `${matricules.length} étudiant(s) sélectionné(s)`);
    }
  }, [notifySuccess]);

  // Fonction pour prévisualiser un étudiant spécifique
  const handlePreviewStudent = useCallback((student: any) => {
    handlePreviewReleve(student);
  }, [handlePreviewReleve]);

  // Force retry upload
  const handleRetryUpload = useCallback(() => {
    setValidationResult(null);
    setError(null);
    setForceShowMapping(false);
    clearData();
  }, [clearData]);

  return (
    <div className="container mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!selectedConfigId || !selectedSemesterId}>
            Correspondance
            {validationResult && !validationResult.isValid && (
              <AlertTriangle className="ml-2 h-4 w-4 text-red-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="selection" disabled={!mappingComplete || excelData.length === 0}>
            Sélection ({selectedStudentMatricules.length})
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewContentUrl}>
            Prévisualisation
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="configuration">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Configuration des relevés de notes avec chiffrement compact
                    </CardTitle>
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
                      {validationResult && !validationResult.isValid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRetryUpload}
                          className="text-orange-600 border-orange-300"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Réimporter le fichier
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* NOUVEAU: Option de chiffrement compact pour les relevés */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Sécurité des QR Codes pour Relevés (Compact)</h4>
                          <p className="text-sm text-blue-700">
                            Chiffrement compact basé uniquement sur le matricule - QR codes plus petits et plus lisibles pour les relevés
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            🔑 Clé de chiffrement: matricule • 📊 Taille: 50-80 caractères chiffrés
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label htmlFor="encryption-toggle-releve" className="text-sm font-medium">
                            Chiffrement
                          </Label>
                          <Switch
                            id="encryption-toggle-releve"
                            checked={encryptionEnabled}
                            onCheckedChange={(checked) => {
                              setEncryptionEnabled(checked);
                              const message = checked ? "Chiffrement compact activé pour les relevés" : "Chiffrement désactivé pour les relevés";
                              notifySuccess("Sécurité", message);
                              
                              // Analyser l'impact sur la taille si des données sont déjà chargées
                              if (excelData.length > 0) {
                                setTimeout(() => analyzeQRCodeSizesForReleve(excelData[0]), 500);
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

                  <ConfigurationSelector 
                    configs={configs}
                    selectedConfigId={selectedConfigId}
                    isLoading={processingState.isLoading}
                    onConfigChange={handleConfigChange}
                  />

                  {selectedConfigId && availableSemesters.length > 0 && (
                    <SemesterSelector
                      semesters={availableSemesters}
                      selectedSemesterId={selectedSemesterId}
                      isLoading={processingState.isLoading}
                      onSemesterChange={handleSemesterChange}
                    />
                  )}

                  <FileUploader
                    onFileLoaded={handleFileLoadedWithMapping}
                    onError={(error) => {
                      setError(error);
                      notifyError("Erreur de fichier", error);
                    }}
                    onValidationResult={handleValidationResult}
                    isLoading={processingState.isLoading}
                    documentType="releve"
                    allowPartialImport={true}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
                    </Alert>
                  )}

                  {processingState.successMessage && (
                    <Alert variant="default" className="bg-green-50 border-green-300">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700">
                        {processingState.successMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {processingState.isLoading && (
                    <ProcessingProgress
                      progress={processingState.progress}
                      processedCount={processingState.processedCount}
                      totalCount={processingState.totalCount}
                      onCancel={cancelProcessing}
                    />
                  )}

                  {excelData.length > 0 && !processingState.isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {excelData.length} ligne(s) chargée(s)
                          </p>
                          {validationResult && (
                            <p className={`text-xs ${
                              validationResult.isValid ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {validationResult.isValid 
                                ? "✅ Validation réussie"
                                : `⚠️ ${validationResult.missingRequired.length} colonne(s) manquante(s)`
                              }
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-blue-700">
                            <span className="font-medium">
                              {encryptionEnabled ? '🔐 QR Compact' : '📋 QR Standard'}
                            </span>
                            <span>Type: Relevé de notes</span>
                          </div>
                        </div>
                        
                        {selectedStudentMatricules.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">
                              {selectedStudentMatricules.length} sélectionné(s)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setActiveTab("mapping")}
                          variant="outline"
                          disabled={!selectedConfigId || !selectedSemesterId}
                        >
                          Configurer la correspondance
                          {validationResult && !validationResult.isValid && (
                            <AlertTriangle className="ml-2 h-4 w-4 text-orange-500" />
                          )}
                        </Button>
                        
                        {mappingComplete && (
                          <>
                            <Button 
                              onClick={() => setActiveTab("selection")}
                              variant="outline"
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Sélectionner les étudiants
                            </Button>

                            <Button 
                              onClick={() => handlePreviewReleve()}
                              variant="secondary"
                              disabled={!areButtonsEnabled()}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {encryptionEnabled && <ShieldCheck className="mr-1 h-3 w-3" />}
                              Prévisualiser
                            </Button>

                            <Button
                              onClick={() => handleGenerateSelected()}
                              disabled={!areButtonsEnabled()}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {encryptionEnabled && <ShieldCheck className="mr-1 h-3 w-3" />}
                              {selectedStudentMatricules.length > 0 
                                ? `Générer (${selectedStudentMatricules.length})` 
                                : 'Générer tous les relevés'
                              }
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mapping">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Correspondance des colonnes
                    {validationResult && !validationResult.isValid && (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                  </CardTitle>
                  {validationResult && !validationResult.isValid && (
                    <div className="text-sm text-orange-600">
                      Des colonnes sont manquantes. Configurez la correspondance ou corrigez votre fichier Excel.
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ColumnMappingEditor
                    selectedConfigId={selectedConfigId}
                    selectedSemesterId={selectedSemesterId}
                    excelColumns={excelColumns}
                    columnMapping={columnMapping}
                    getAvailableECs={getAvailableECs}
                    onMappingChange={handleMappingChange}
                    onLoadMapping={handleLoadMapping}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="selection">
              <StudentSelector
                students={excelData}
                selectedStudents={selectedStudentMatricules}
                onSelectionChange={handleStudentSelectionChange}
                onPreview={handlePreviewStudent}
                onGenerateSelected={handleGenerateSelected}
                documentType="releve"
                isLoading={processingState.isLoading}
                additionalInfo={encryptionEnabled ? "Chiffrement compact activé" : "Sans chiffrement"}
              />
            </TabsContent>

            <TabsContent value="preview">
              <TranscriptPreview
                previewStudent={previewStudent}
                previewContentUrl={previewContentUrl}
                isLoading={processingState.isLoading}
                onBack={() => setActiveTab("configuration")}
                onGenerateAll={() => handleGenerateSelected()}
              />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Informations sur le chiffrement compact en mode développement */}
      {process.env.NODE_ENV === 'development' && excelData.length > 0 && (
        <Card className="border-dashed border-gray-300 mt-6">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">🧪 Outils de développement - Chiffrement Compact (Relevés)</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const testStudent = sanitizeStudentData(excelData[0]);
                  console.log('🧹 Données sanitisées pour relevé:', testStudent);
                }}
              >
                Test sanitisation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testStudentEncryptionCompactForReleve(excelData[0])}
              >
                Test chiffrement compact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const testStudent = sanitizeStudentData(excelData[0]);
                    const qrCode = await generateQrCodeBase64(testStudent, 'releve', encryptionEnabled);
                    console.log('📱 QR Code relevé généré:', qrCode.substring(0, 50) + '...');
                    
                    // Analyser la taille
                    const sizeAnalysis = getQRCodeSizeEstimate(testStudent, 'releve', encryptionEnabled);
                    console.log('📊 Analyse de taille pour relevé:', sizeAnalysis);
                    
                    notifySuccess("Test", `QR Code relevé généré avec succès (${sizeAnalysis.totalContentLength} caractères)`);
                  } catch (error) {
                    console.error('❌ Erreur QR relevé:', error);
                    notifyError("Test", "Erreur lors de la génération du QR Code pour relevé");
                  }
                }}
              >
                Test QR Code compact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (excelData.length > 0) {
                    const sizeAnalysis = getQRCodeSizeEstimate(excelData[0], 'releve', encryptionEnabled);
                    console.log('📊 Analyse complète de taille pour relevé:', sizeAnalysis);
                    
                    console.log('📊 État actuel du système (Relevés):');
                    console.log('- Données Excel:', excelData.length, 'étudiants');
                    console.log('- Chiffrement compact:', encryptionEnabled);
                    console.log('- Type de document: Relevé');
                    console.log('- Taille QR estimée:', sizeAnalysis.estimatedQRSize);
                    console.log('- Longueur contenu:', sizeAnalysis.totalContentLength, 'caractères');
                    console.log('- Configuration:', selectedConfigId);
                    console.log('- Semestre:', selectedSemesterId);
                  }
                }}
              >
                Analyse de taille
              </Button>
            </div>
            
            {encryptionEnabled && excelData.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                <h5 className="text-sm font-medium text-green-800 mb-2">🔐 Chiffrement Compact Activé (Relevés)</h5>
                <div className="text-xs text-green-700 space-y-1">
                  <p>• Clé basée uniquement sur le matricule de l'étudiant</p>
                  <p>• Algorithme: AES-128-ECB (optimisé pour la compacité)</p>
                  <p>• Taille chiffrée estimée: 50-80 caractères</p>
                  <p>• QR codes plus petits et plus lisibles pour les relevés</p>
                  <p>• Déchiffrement possible avec juste le matricule</p>
                  <p>• Compatible avec l'application mobile de vérification</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Indicateur de performance du chiffrement pour relevés */}
      {excelData.length > 0 && (
        <Card className="bg-gray-50 mt-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">Performance QR Codes (Relevés):</span>
                </div>
                {(() => {
                  if (excelData.length > 0) {
                    const sizeAnalysis = getQRCodeSizeEstimate(excelData[0], 'releve', encryptionEnabled);
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
              
              {excelData.length > 0 && (() => {
                const sizeAnalysis = getQRCodeSizeEstimate(excelData[0], 'releve', encryptionEnabled);
                if (sizeAnalysis.estimatedQRSize === 'Small') {
                  return <Badge variant="default" className="bg-green-600">Optimal</Badge>;
                } else if (sizeAnalysis.estimatedQRSize === 'Medium') {
                  return <Badge variant="secondary">Moyen</Badge>;
                } else {
                  return <Badge variant="destructive">Volumineux</Badge>;
                }
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-4 right-4 text-sm text-gray-500">
        <p>Ctrl+P: Prévisualiser</p>
        <p>Ctrl+G: Générer</p>
        <p>Esc: Retour</p>
      </div>
    </div>
  );
};