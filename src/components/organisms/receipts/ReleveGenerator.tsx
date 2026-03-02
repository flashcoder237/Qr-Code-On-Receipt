// src/components/organisms/receipts/ReleveGenerator.tsx - Version mise à jour avec gestion des sessions
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useHotkeys } from "react-hotkeys-hook";
import { Eye, Download, AlertCircle, Layers, CheckCircle, Users, RefreshCw, AlertTriangle, Shield, ShieldCheck, Info, Clock, Archive, FileText, Files, Settings } from "lucide-react";
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
import { MultiSemesterGenerator } from "./MultiSemesterGenerator";

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
  qrCodeSize?: "small" | "medium" | "large";
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

  // NOUVEAU: État pour le mapping des sessions
  const [sessionMapping, setSessionMapping] = useState<{ [ecId: string]: string }>({});

  // NOUVEAU: État pour la génération multi-semestres
  const [showMultiSemester, setShowMultiSemester] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [selectedMultiSemesterIds, setSelectedMultiSemesterIds] = useState<string[]>([]);

  // RESTAURÉ: États pour gérer le workbook Excel chargé et les feuilles disponibles
  // Note: Le vrai problème était JSON.stringify dans useProcessing, pas le workbook
  const [loadedWorkbook, setLoadedWorkbook] = useState<any>(null);
  const [availableExcelSheets, setAvailableExcelSheets] = useState<string[]>([]);
  const [currentExcelFileName, setCurrentExcelFileName] = useState<string>('');

  // NOUVEAU: Option pour activer/désactiver le chiffrement compact pour les relevés
  const [encryptionEnabled, setEncryptionEnabled] = useLocalStorage("releve-encryption-enabled", true);

  // Nouvelles options d'export
  const [exportFormat, setExportFormat] = useLocalStorage<'zip' | 'individual' | 'single'>('releve-export-format', 'zip');
  const [useCompression, setUseCompression] = useLocalStorage('releve-use-compression', true);
  const [nameFormat, setNameFormat] = useLocalStorage<'default' | 'detailed'>('releve-name-format', 'detailed');

  // NOUVEAU: Format d'export spécifique pour multi-semestres (plus d'options)
  const [multiSemesterExportFormat, setMultiSemesterExportFormat] = useLocalStorage<
    'all-single' | 'all-zip-individual' | 'per-semester-merged' | 'zip-per-semester-merged' | 'all-individual'
  >("multi-semester-export-format", 'all-zip-individual');

  // Hooks pour notifications et historique
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotifications();
  const { addDocumentRecord } = useDocumentHistory();

  const isDemoMode = localStorage.getItem('demo_mode') === 'true';

  // Load settings from localStorage
  const [settings] = useLocalStorage<TranscriptSettings>("settings", {
    establishmentType: "ipes",
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
    qrCodeSize: "medium",
  });

  // Load configurations from localStorage only once during component mount
  // MODIFIÉ: Filtrer les configurations masquées
  useEffect(() => {
    if (!configsLoaded) {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsedConfigs = JSON.parse(stored);
          // Filtrer les configurations masquées (isHidden: true)
          const visibleConfigs = parsedConfigs.filter((config: any) => !config.isHidden);
          setConfigs(visibleConfigs);
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
      
      setActiveTab("preview");
    }
  }, [previewContentUrl]);

  // Listen to localStorage changes
  // MODIFIÉ: Filtrer les configurations masquées lors des changements
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        try {
          const parsedConfigs = JSON.parse(e.newValue);
          // Filtrer les configurations masquées (isHidden: true)
          const visibleConfigs = parsedConfigs.filter((config: any) => !config.isHidden);
          setConfigs(visibleConfigs);
        } catch (error) {
          console.error("Erreur lors du traitement des nouvelles configurations:", error);
          notifyError("Erreur", "Erreur lors de la mise à jour des configurations");
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [notifyError]);

  // NOUVEAU: Fonction pour gérer les changements de mapping des sessions
  const handleSessionMappingChange = useCallback((ecId: string, sessionCol: string) => {
    setSessionMapping(prev => ({
      ...prev,
      [ecId]: sessionCol
    }));
  }, []);

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
      setSessionMapping({}); // NOUVEAU: Réinitialiser le mapping des sessions
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
        // NOUVEAU: Gérer l'option "Tous les semestres"
        if (semesterId === 'all-semesters') {
          const allSemesterIds = config.semesters.map(s => s.id);
          setSelectedMultiSemesterIds(allSemesterIds);
          // Sauvegarder la sélection dans localStorage pour le MultiSemesterGenerator
          localStorage.setItem(`multi-semester-selection-${config.id}`, JSON.stringify(allSemesterIds));
          notifySuccess("Semestre", `Tous les semestres sélectionnés (${allSemesterIds.length})`);
        } else {
          const semester = config.semesters.find(s => s.id === semesterId);
          if (semester) {
            notifySuccess("Semestre", `Semestre "${semester.name}" sélectionné`);
          }
          // Réinitialiser la sélection multi-semestre
          setSelectedMultiSemesterIds([]);
          // Nettoyer le localStorage
          if (config) {
            localStorage.removeItem(`multi-semester-selection-${config.id}`);
          }
        }
      }
      setPreviewStudent(null);
      setSelectedStudentMatricules([]);
      setSessionMapping({}); // NOUVEAU: Réinitialiser le mapping des sessions
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
    downloadFiles,
    downloadSinglePDF,
    cancel: cancelProcessing,
    resetState: resetProcessing,
  } = useProcessing();

  // Get current config and semester info
  const { currentConfig, currentSemester } = useMemo(() => {
    const config = configs.find(c => c.id === selectedConfigId);
    const semester = config?.semesters.find(s => s.id === selectedSemesterId);
    return { currentConfig: config, currentSemester: semester };
  }, [configs, selectedConfigId, selectedSemesterId]);

  // NOUVEAU: Préparer les données étudiants pour l'affichage avec calcul des moyennes
  const preparedStudentsForDisplay = useMemo(() => {
    if (!currentConfig || !excelData || excelData.length === 0) return [];
    if (!mappingComplete) return excelData; // Retourner brut si pas de mapping

    return excelData.map(student => {
      try {
        // Calculer la moyenne pour cet étudiant
        let totalGrade = 0;
        let totalCredits = 0;
        let hasGrades = false;

        // Déterminer quels semestres utiliser
        const semestersToUse = selectedMultiSemesterIds.length > 0
          ? currentConfig.semesters.filter(s => selectedMultiSemesterIds.includes(s.id))
          : (currentSemester ? [currentSemester] : []);

        semestersToUse.forEach(semester => {
          semester.ues.forEach((ue: any) => {
            // Si useExcelAverage est activé, lire la moyenne directement depuis Excel
            if (ue.useExcelAverage) {
              const excelVal = student[ue.code] !== undefined && student[ue.code] !== null && student[ue.code] !== ''
                ? parseFloat(student[ue.code])
                : (student[ue.name] !== undefined && student[ue.name] !== null && student[ue.name] !== ''
                  ? parseFloat(student[ue.name])
                  : NaN);

              if (!isNaN(excelVal)) {
                hasGrades = true;
                const ueDisplayBase = ue.displayBase || 20;
                const normalizedGrade = (excelVal * 20) / ueDisplayBase;
                const ueCredits = ue.credits || 0;
                totalGrade += normalizedGrade * ueCredits;
                totalCredits += ueCredits;
                return; // Skip le calcul EC
              }
              // Fallback : continuer le calcul normal si colonne non trouvée
            }

            let ueGradeSum = 0;
            let ueWeightSum = 0;

            ue.ecs.forEach((ec: any) => {
              const columnName = columnMapping[ec.id];
              if (columnName && student[columnName] !== undefined) {
                const grade = parseFloat(student[columnName]);
                if (!isNaN(grade)) {
                  hasGrades = true;
                  const weight = ec.weight || 1;
                  const noteBase = ec.noteBase || 20;
                  const normalizedGrade = (grade / noteBase) * 20;
                  ueGradeSum += normalizedGrade * weight;
                  ueWeightSum += weight;
                }
              }
            });

            if (ueWeightSum > 0) {
              const ueAverage = ueGradeSum / ueWeightSum;
              const ueCredits = ue.credits || 0;
              totalGrade += ueAverage * ueCredits;
              totalCredits += ueCredits;
            }
          });
        });

        const moyenne = hasGrades && totalCredits > 0 ? totalGrade / totalCredits : 0;

        // Déterminer grade et mention
        let grade = "";
        let mention = "";
        if (moyenne >= 16) {
          grade = "Très Bien";
          mention = "Très Bien";
        } else if (moyenne >= 14) {
          grade = "Bien";
          mention = "Bien";
        } else if (moyenne >= 12) {
          grade = "Assez Bien";
          mention = "Assez Bien";
        } else if (moyenne >= 10) {
          grade = "Passable";
          mention = "Passable";
        } else {
          grade = "Ajourné";
          mention = "Ajourné";
        }

        return {
          ...student,
          NIVEAU: currentConfig.niveau || student.NIVEAU || "N/D",
          SEMESTRE: selectedMultiSemesterIds.length > 0
            ? `${selectedMultiSemesterIds.length} semestres`
            : (currentSemester?.name || student.SEMESTRE || "N/D"),
          MOYENNE: hasGrades ? parseFloat(moyenne.toFixed(2)) : 0,
          GRADE: grade,
          MENTION: mention
        };
      } catch (error) {
        console.error('Erreur préparation étudiant:', error);
        return student;
      }
    });
  }, [excelData, currentConfig, currentSemester, selectedMultiSemesterIds, columnMapping, mappingComplete]);

  // NOUVEAU: Restaurer la sélection multi-semestres au changement de config
  useEffect(() => {
    if (selectedConfigId) {
      const savedSelection = localStorage.getItem(`multi-semester-selection-${selectedConfigId}`);
      if (savedSelection) {
        try {
          const parsed = JSON.parse(savedSelection);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedMultiSemesterIds(parsed);
          }
        } catch (e) {
          console.error('Erreur restauration sélection multi-semestres:', e);
        }
      } else {
        // Pas de sélection sauvegardée, réinitialiser seulement si pas vide
        if (selectedMultiSemesterIds.length > 0) {
          setSelectedMultiSemesterIds([]);
        }
      }
    }
  }, [selectedConfigId]);

  // Get available ECs for mapping - MODIFIÉ pour supporter multi-semestre
  const getAvailableECs = useCallback(() => {
    if (!currentConfig) return [];

    const ecs: Array<{ id: string; fullName: string; semesterName?: string }> = [];

    // Si multi-semestre est activé et des semestres sont sélectionnés
    if (selectedMultiSemesterIds.length > 0) {
      selectedMultiSemesterIds.forEach(semesterId => {
        const semester = currentConfig.semesters.find(s => s.id === semesterId);
        if (semester) {
          semester.ues.forEach((ue: any) => {
            ue.ecs.forEach((ec: any) => {
              ecs.push({
                id: ec.id,
                fullName: `${semester.name} - ${ue.name} - ${ec.name}`,
                semesterName: semester.name
              });
            });
          });
        }
      });
    } else if (currentSemester) {
      // Mode normal - un seul semestre
      currentSemester.ues.forEach((ue: any) => {
        ue.ecs.forEach((ec: any) => {
          ecs.push({
            id: ec.id,
            fullName: `${currentSemester.name} - ${ue.name} - ${ec.name}`,
            semesterName: currentSemester.name
          });
        });
      });
    }

    return ecs;
  }, [currentConfig, currentSemester, selectedMultiSemesterIds]);

  // NOUVEAU: Fonction pour tester le chiffrement compact sur un étudiant
  const testStudentEncryptionCompactForReleve = (student: any) => {
    try {
      
      
      
      const sanitizedStudent = sanitizeStudentData(student);
      const testResult = testStudentEncryptionCompact(sanitizedStudent, 'releve');
      
      if (testResult) {
        
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

  // NOUVEAU: Fonction pour sauvegarder les informations du fichier Excel utilisé
  const saveExcelFileInfo = useCallback((fileName: string, columnMappingData: Record<string, string>, sessionMappingData: Record<string, string>) => {
    if (!selectedConfigId) return;

    try {
      const updatedConfigs = configs.map(config => {
        if (config.id === selectedConfigId) {
          return {
            ...config,
            lastUsedExcelFile: {
              fileName: fileName,
              lastUsed: new Date().toISOString(),
              columnMapping: columnMappingData,
              sessionMapping: sessionMappingData
            }
          };
        }
        return config;
      });

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedConfigs));
      setConfigs(updatedConfigs);

      notifySuccess("Mémorisation", `Fichier "${fileName}" mémorisé pour cette configuration`);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des infos du fichier:", error);
    }
  }, [selectedConfigId, configs, notifySuccess]);

  // NOUVEAU: Fonction pour restaurer le mapping depuis le fichier mémorisé
  const restoreSavedMapping = useCallback((fileName: string) => {
    if (!selectedConfigId || !currentConfig?.lastUsedExcelFile) return false;

    const savedFile = currentConfig.lastUsedExcelFile;

    // Vérifier si c'est le même fichier
    if (savedFile.fileName === fileName && savedFile.columnMapping) {
      // Restaurer le mapping des colonnes
      Object.entries(savedFile.columnMapping).forEach(([ecId, columnName]) => {
        handleMappingChange(ecId, columnName);
      });

      // Restaurer le mapping des sessions si disponible
      if (savedFile.sessionMapping) {
        setSessionMapping(savedFile.sessionMapping);
      }

      notifyInfo(
        "Mapping restauré",
        `Correspondances chargées depuis le dernier import de "${fileName}"`,
        { duration: 5000 }
      );

      return true;
    }

    return false;
  }, [selectedConfigId, currentConfig, handleMappingChange, notifyInfo]);

  // NOUVEAU: Fonction pour faire une correspondance automatique par nom d'EC
  const autoMapByECName = useCallback((columns: string[]) => {
    if (!currentConfig) {
      
      return 0;
    }

    
    

    // Utiliser directement la fonction au lieu de l'appeler depuis le callback
    const ecs: Array<{ id: string; fullName: string; ecName: string; semesterName?: string }> = [];

    // AMÉLIORATION MAJEURE: TOUJOURS chercher dans TOUS les semestres pour l'auto-mapping
    // Cela permet de reconnaître automatiquement TOUTES les colonnes du masque de saisie,
    // peu importe le mode (semestre simple, composite, ou aucun semestre sélectionné)

    currentConfig.semesters.forEach((semester: any) => {
      semester.ues.forEach((ue: any) => {
        ue.ecs.forEach((ec: any) => {
          ecs.push({
            id: ec.id,
            fullName: `${semester.name} - ${ue.name} - ${ec.name}`,
            ecName: ec.name,
            semesterName: semester.name
          });
        });
      });
    });

    
    

    let mappedCount = 0;

    ecs.forEach(ec => {
      // Vérifier si déjà mappé avec une VRAIE valeur (pas "null" ou vide)
      const currentValue = columnMapping[ec.id];
      if (currentValue && currentValue !== "null" && currentValue !== "") {
        // Déjà mappé avec une vraie colonne, skip

        return;
      }

      // Chercher une colonne qui correspond exactement au nom de l'EC
      const matchingColumn = columns.find(col => {
        // Correspondance exacte (insensible à la casse)
        const match = col.toLowerCase().trim() === ec.ecName.toLowerCase().trim();
        if (match) {

        }
        return match;
      });

      if (matchingColumn) {
        
        handleMappingChange(ec.id, matchingColumn);
        mappedCount++;

        // Chercher aussi la colonne de session correspondante
        const sessionColumn = columns.find(col => col === `S/${matchingColumn}`);
        if (sessionColumn) {
          
          handleSessionMappingChange(ec.id, sessionColumn);
        }
      } 
    });

    

    if (mappedCount > 0) {
      notifySuccess(
        "Correspondance automatique",
        `${mappedCount} EC(s) mappé(s) automatiquement par nom`,
        { duration: 5000 }
      );
    }

    return mappedCount;
  }, [currentConfig, currentSemester, selectedMultiSemesterIds, columnMapping, handleMappingChange, handleSessionMappingChange, notifySuccess]);

  // Handle file loading with validation and automatic mapping
  const handleFileLoadedWithMapping = useCallback((data: any[], columns: string[], mapping?: { [key: string]: string }, fileName?: string) => {
    handleDataLoaded(data, columns);

    // Sauvegarder le nom du fichier
    if (fileName) {
      setCurrentFileName(fileName);

      // Essayer de restaurer le mapping sauvegardé
      const restored = restoreSavedMapping(fileName);

      if (!restored) {
        // Pas de mapping restauré, essayer la correspondance automatique
        if (mapping) {
          // Appliquer le mapping automatique fourni
          Object.entries(mapping).forEach(([ecId, columnName]) => {
            if (columnName && columns.includes(columnName)) {
              handleMappingChange(ecId, columnName);
            }
          });
        }

        // NOUVEAU: Essayer la correspondance automatique par nom d'EC
        const mappedCount = autoMapByECName(columns);

        if (mappedCount === 0 && !mapping) {
          notifyInfo(
            "Correspondance manuelle nécessaire",
            "Aucune correspondance automatique trouvée. Veuillez configurer manuellement."
          );
        }
      }
    } else if (mapping) {
      // Appliquer le mapping automatique si fourni
      Object.entries(mapping).forEach(([ecId, columnName]) => {
        if (columnName && columns.includes(columnName)) {
          handleMappingChange(ecId, columnName);
        }
      });

      // NOUVEAU: Essayer aussi la correspondance par nom
      autoMapByECName(columns);
    } else {
      // NOUVEAU: Pas de mapping fourni, essayer la correspondance par nom
      autoMapByECName(columns);
    }

    // Réinitialiser le mapping des sessions si pas restauré
    if (!currentConfig?.lastUsedExcelFile?.sessionMapping) {
      setSessionMapping({});
    }

    setError(null);
    setForceShowMapping(false);
  }, [handleDataLoaded, handleMappingChange, restoreSavedMapping, currentConfig, autoMapByECName, notifyInfo]);

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
  const handleLoadMapping = useCallback((mapping: Record<string, string>, sessionMappingData: Record<string, string>) => {
    try {
      setColumnMapping(mapping);
      setSessionMapping(sessionMappingData || {}); // NOUVEAU: Charger le mapping des sessions
      notifySuccess("Correspondance", "Correspondance chargée avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement du mapping:", error);
      setError(`Erreur lors du chargement du mapping: ${error instanceof Error ? error.message : String(error)}`);
      notifyError("Erreur", "Impossible de charger la correspondance");
    }
  }, [setColumnMapping, notifySuccess, notifyError]);

  // NOUVEAU: Fonction pour extraire la session depuis une colonne de session
  const extractSessionFromColumn = useCallback((student: any, sessionColumn: string) => {
    if (!sessionColumn || sessionColumn === "null") return null;
    
    const sessionValue = student[sessionColumn];
    if (!sessionValue) return null;
    
    // Format attendu: N/année ou R/année
    const sessionMatch = sessionValue.toString().match(/^(N|R)\/(.+)$/);
    if (sessionMatch) {
      const [, type, year] = sessionMatch;
      return {
        type: type === 'N' ? 'N/' : 'Ratt/',
        year: year
      };
    }
    
    return null;
  }, []);

  // Prepare student data for PDF generation - VERSION AVEC NOUVEAUX PARAMETRES
  const prepareStudentData = useCallback((rawStudent: any, semester?: any): StudentRecord => {
    const semesterToUse = semester || currentSemester;
    if (!currentConfig || !semesterToUse) return null;
  
    // Vérifications de sécurité supplémentaires
    if (!currentConfig.semesters || !semesterToUse.ues) {
      console.error("Configuration incomplète:", { currentConfig, semesterToUse });
      throw new Error("Configuration incomplète - semestres ou UEs manquants");
    }

    const courses: any[] = [];
    const ueMap = new Map();
    
    // Fonction pour traiter un semestre (utile pour les semestres fusionnés)
    const processSemester = (semester: any) => {
      semester.ues.forEach((ue: any) => {
        if (!ue || !ue.ecs) {
          console.warn("UE incomplète ignorée:", ue);
          return;
        }

        // Pré-lire la moyenne Excel si useExcelAverage est activé
        let excelAverageOverride: number | null = null;
        if (ue.useExcelAverage) {
          const excelVal = rawStudent[ue.code] !== undefined && rawStudent[ue.code] !== null && rawStudent[ue.code] !== ''
            ? parseFloat(rawStudent[ue.code])
            : (rawStudent[ue.name] !== undefined && rawStudent[ue.name] !== null && rawStudent[ue.name] !== ''
              ? parseFloat(rawStudent[ue.name])
              : NaN);

          if (!isNaN(excelVal)) {
            excelAverageOverride = excelVal;
          } else {
            console.warn(`Moyenne Excel non trouvée pour UE ${ue.code}/${ue.name}, fallback sur calcul EC`);
          }
        }

        const ecData: any[] = [];

        ue.ecs.forEach((ec: any) => {
          if (!ec || !ec.id) {
            console.warn("EC incomplet ignoré:", ec);
            return;
          }

          // Chercher le mapping par ID d'abord, sinon par nom d'EC
          let columnName = columnMapping[ec.id];
          let sessionColumnName = sessionMapping[ec.id];

          // Fallback : si pas de mapping par ID, chercher une colonne Excel avec le même nom que l'EC
          if (!columnName && ec.name && rawStudent[ec.name] !== undefined) {
            columnName = ec.name;
            console.log(`Utilisation du nom de l'EC comme fallback: ${ec.name}`);

            // Chercher aussi la colonne de session correspondante (format: S/NomEC)
            const potentialSessionColumn = `S/${ec.name}`;
            if (rawStudent[potentialSessionColumn] !== undefined) {
              sessionColumnName = potentialSessionColumn;
              console.log(`Utilisation de la colonne session fallback: ${potentialSessionColumn}`);
            }
          }

          if (columnName && rawStudent[columnName] !== undefined && rawStudent[columnName] !== null && rawStudent[columnName] !== '') {
            const gradeValue = rawStudent[columnName];
            const grade = parseFloat(gradeValue);
            
            if (isNaN(grade)) {
              console.warn(`Note invalide pour ${ec.name}: ${gradeValue}`);
              return;
            }

            // NOUVEAU: Appliquer la conversion de base de notation
            const noteBase = ec.noteBase || 20;
            const displayBase = ec.displayBase || 20;
            
            // Convertir la note vers la base d'affichage
            const displayGrade = (grade * displayBase) / noteBase;
            
            // NOUVEAU: Extraire les informations de session
            const sessionInfo = extractSessionFromColumn(rawStudent, sessionColumnName);
            
            // NOUVEAU: Formater la session selon la configuration
            let sessionDisplay = 'N/A';
            if (sessionInfo && currentConfig.displaySessions !== false) {
              const format = currentConfig.sessionDisplayFormat || 'short';
              if (format === 'full') {
                // Format complet: "Normale 2024", "Rattrapage 2024"
                const sessionType = sessionInfo.type === 'N/' ? 'Normale' : 'Rattrapage';
                sessionDisplay = `${sessionType} ${sessionInfo.year}`;
              } else {
                // Format court: "N/2024", "Ratt/2024"
                sessionDisplay = `${sessionInfo.type}${sessionInfo.year}`;
              }
            } else if (currentConfig.displaySessions === false) {
              sessionDisplay = ''; // Masquer complètement si désactivé
            }
            
            courses.push({
              CODE: ue.code || `UE ${ue.name}`,
              INTITULE: ue.name,
              EC_TITRE: ec.name,
              NOTE: displayGrade, // Note convertie pour l'affichage
              NOTE_ORIGINAL: grade, // Note originale pour les calculs
              NOTE_BASE: noteBase,
              DISPLAY_BASE: displayBase,
              WEIGHT: ec.weight || 1, // NOUVEAU: Poids de l'EC
              UE_CREDIT: ue.credits || 0,
              UE_ID: ue.id,
              UE_AVERAGE: 0, // Sera calculé plus tard
              UE_DISPLAY_BASE: ue.displayBase || 20, // NOUVEAU: Base d'affichage de l'UE
              SESSION: sessionDisplay, // NOUVEAU: Session formatée selon la configuration
              SHOW_SESSION: currentConfig.displaySessions !== false // NOUVEAU: Indicateur pour le template
            });
            
            // Stocker les données pour le calcul de moyenne pondérée
            ecData.push({
              grade: grade, // Note originale pour les calculs
              weight: ec.weight || 1,
              noteBase: noteBase,
              displayBase: displayBase
            });
          }
        });
        
        // NOUVEAU: Calculer la moyenne pondérée de l'UE
        if (ecData.length > 0 || excelAverageOverride !== null) {
          const ueDisplayBase = ue.displayBase || 20;
          let displayAverage: number;
          let averageOriginal: number;

          if (excelAverageOverride !== null) {
            // Utiliser la moyenne Excel directement
            displayAverage = excelAverageOverride;
            averageOriginal = (excelAverageOverride * 20) / ueDisplayBase;
          } else {
            // Calcul normal à partir des ECs
            let totalWeightedPoints = 0;
            let totalWeights = 0;

            ecData.forEach(ec => {
              const normalizedGrade = (ec.grade * 20) / ec.noteBase;
              totalWeightedPoints += normalizedGrade * ec.weight;
              totalWeights += ec.weight;
            });

            const ueAverage = totalWeights > 0 ? totalWeightedPoints / totalWeights : 0;
            displayAverage = (ueAverage * ueDisplayBase) / 20;
            averageOriginal = ueAverage;
          }

          ueMap.set(ue.id, {
            average: displayAverage,
            averageOriginal: averageOriginal,
            credits: ue.credits || 0,
            code: ue.code || `UE ${ue.name}`,
            name: ue.name,
            displayBase: ueDisplayBase
          });
        }
      });
    };

    // Vérifier s'il y a un semestre fusionné actif
    const activeMergedSemester = currentConfig.mergedSemesters?.find(ms => ms.isActive);
    
    if (activeMergedSemester) {
      // Traiter tous les semestres fusionnés
      activeMergedSemester.semesterIds.forEach(semesterId => {
        const semester = currentConfig.semesters.find(s => s.id === semesterId);
        if (semester) {
          processSemester(semester);
        }
      });
    } else {
      // Traiter seulement le semestre sélectionné
      processSemester(semesterToUse);
    }
    
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

    // NOUVEAU: Calculer le total des crédits requis
    let totalCreditsRequired = 30; // Défaut
    
    if (activeMergedSemester) {
      totalCreditsRequired = activeMergedSemester.creditsRequired;
    } else {
      totalCreditsRequired = semesterToUse.creditsRequired || 30;
    }

    // NOUVEAU: Gérer le nom du semestre pour les semestres fusionnés
    let semesterName = semesterToUse.name || "";
    if (activeMergedSemester) {
      semesterName = activeMergedSemester.name;
    }
    
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
      SEMESTRE: semesterName,
      OPTION: currentConfig.option || "",
      COURSES: courses,
      TOTAL_CREDITS: totalCreditsRequired, // NOUVEAU: Utiliser les crédits configurés
      // NOUVEAU: Paramètres d'affichage des sessions
      DISPLAY_SESSIONS: currentConfig.displaySessions !== false,
      SESSION_FORMAT: currentConfig.sessionDisplayFormat || 'short'
    };

    console.log("Données étudiant préparées:", {
      nom: studentRecord.NOM,
      prenom: studentRecord.PRENOM,
      coursCount: courses.length,
      totalCredits: totalCreditsRequired,
      ueCount: ueMap.size,
      mergedSemester: activeMergedSemester?.name || null,
      semesterName: semesterName
    });

    return studentRecord;
  }, [currentConfig, currentSemester, columnMapping, sessionMapping, extractSessionFromColumn]);

  // NOUVEAU: Prévisualisation multi-semestres
  const handlePreviewReleve = useCallback(async (student?: any) => {
    if (!currentConfig) {
      const message = "Veuillez sélectionner une configuration";
      setError(message);
      notifyWarning("Configuration manquante", message);
      return;
    }

    // Mode multi-semestres
    if (selectedMultiSemesterIds.length > 0) {
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

      const studentToPreview = student ||
        (selectedStudentMatricules.length > 0
          ? excelData.find(s => s.MATRICULE === selectedStudentMatricules[0])
          : excelData[0]);

      if (!studentToPreview) {
        notifyError("Erreur", "Aucun étudiant trouvé pour la prévisualisation");
        return;
      }

      // Prévisualiser pour chaque semestre sélectionné
      notifyInfo("Prévisualisation", `Génération de ${selectedMultiSemesterIds.length} prévisualisations...`);

      for (const semesterId of selectedMultiSemesterIds) {
        const semester = currentConfig.semesters.find(s => s.id === semesterId);
        if (!semester) continue;

        try {
          // Préparer les données avec le contexte du semestre actuel
          const tempCurrentSemester = semester;

          // Créer un contexte temporaire pour ce semestre
          const studentRecord: any = {
            NOM: studentToPreview.NOM || "",
            PRENOM: studentToPreview.PRENOM || "",
            MATRICULE: studentToPreview.MATRICULE || "",
            "DATE DE NAISSANCE": studentToPreview["DATE DE NAISSANCE"] || "",
            "LIEU DE NAISSANCE": studentToPreview["LIEU DE NAISSANCE"] || "",
            CYCLE: currentConfig.cycle || "",
            "ANNEE ACADÉMIQUE": currentConfig.academicYear || "",
            FILIERE: currentConfig.filiere || "",
            NIVEAU: currentConfig.niveau || "",
            SEMESTRE: semester.name,
            OPTION: currentConfig.option || "",
            COURSES: [],
            TOTAL_CREDITS: semester.creditsRequired || 30,
            DISPLAY_SESSIONS: currentConfig.displaySessions !== false,
            SESSION_FORMAT: currentConfig.sessionDisplayFormat || 'short'
          };

          // Ajouter les cours de ce semestre avec calcul des moyennes par UE
          const coursesByUE = new Map<string, any[]>();

          semester.ues.forEach((ue: any) => {
            const ueCourses: any[] = [];

            ue.ecs.forEach((ec: any) => {
              const columnName = columnMapping[ec.id];
              if (columnName && studentToPreview[columnName] !== undefined) {
                const grade = parseFloat(studentToPreview[columnName]);
                if (!isNaN(grade)) {
                  // Récupérer la session si elle existe
                  const sessionColumnName = sessionMapping[ec.id];
                  let session = null;
                  if (sessionColumnName && studentToPreview[sessionColumnName]) {
                    session = extractSessionFromColumn(studentToPreview[sessionColumnName]);
                  }

                  ueCourses.push({
                    CODE: ue.code || `UE ${ue.name}`,
                    INTITULE: ue.name,
                    EC_TITRE: ec.name,
                    NOTE: grade,
                    WEIGHT: ec.weight || 1,
                    UE_CREDIT: ue.credits || 0,
                    UE_ID: ue.id,
                    UE_AVERAGE: 0,
                    SESSION: session,
                    NOTE_BASE: ec.noteBase || 20,
                    DISPLAY_BASE: ec.displayBase || ue.displayBase || 20
                  });
                }
              }
            });

            if (ueCourses.length > 0) {
              let ueAverage: number;

              // Vérifier si useExcelAverage est activé et la colonne existe
              let excelAvgOverride: number | null = null;
              if (ue.useExcelAverage) {
                const excelVal = studentToPreview[ue.code] !== undefined && studentToPreview[ue.code] !== null && studentToPreview[ue.code] !== ''
                  ? parseFloat(studentToPreview[ue.code])
                  : (studentToPreview[ue.name] !== undefined && studentToPreview[ue.name] !== null && studentToPreview[ue.name] !== ''
                    ? parseFloat(studentToPreview[ue.name])
                    : NaN);
                if (!isNaN(excelVal)) {
                  excelAvgOverride = excelVal;
                }
              }

              if (excelAvgOverride !== null) {
                // Utiliser la moyenne Excel directement
                ueAverage = excelAvgOverride;
              } else {
                // Calculer la moyenne de l'UE normalement
                const totalWeight = ueCourses.reduce((sum, course) => sum + course.WEIGHT, 0);
                const weightedSum = ueCourses.reduce((sum, course) => {
                  const normalizedGrade = (course.NOTE / course.NOTE_BASE) * 20;
                  return sum + (normalizedGrade * course.WEIGHT);
                }, 0);
                ueAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
              }

              // Appliquer l'UE average à tous les cours de cette UE
              ueCourses.forEach(course => {
                course.UE_AVERAGE = ueAverage;
              });

              coursesByUE.set(ue.id, ueCourses);
            }
          });

          // Ajouter tous les cours à studentRecord
          coursesByUE.forEach(courses => {
            studentRecord.COURSES.push(...courses);
          });

          // Utiliser le thème du semestre s'il existe, sinon le thème de la classe, sinon le thème global
          const semesterTheme = semester.theme || currentConfig?.theme;

          const effectiveSettings = {
            ...settings,
            demoMode: isDemoMode,
            encryptionEnabled: encryptionEnabled,
            ...(semesterTheme && { theme: semesterTheme })
          };

          const renderParams = {
            student: studentRecord,
            settings: effectiveSettings,
            config: currentConfig
          };

          const htmlContent = await window.transcriptRenderer.renderHTML(renderParams);

          if (htmlContent) {
            await window.ipcRenderer.invoke('show-preview', htmlContent,
              `Prévisualisation ${semester.name} - ${studentRecord.NOM} ${studentRecord.PRENOM} ${encryptionEnabled ? '🔐' : ''}`);
          }
        } catch (error) {
          console.error(`Erreur prévisualisation ${semester.name}:`, error);
          notifyError("Erreur", `Erreur lors de la prévisualisation de ${semester.name}`);
        }
      }

      notifySuccess("Prévisualisation", `${selectedMultiSemesterIds.length} prévisualisation(s) générée(s)`);
      return;
    }

    // Mode normal - un seul semestre
    if (!currentSemester) {
      const message = "Veuillez sélectionner un semestre";
      setError(message);
      notifyWarning("Semestre manquant", message);
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

      setPreviewStudent(preparedStudent);

      if (!window.transcriptRenderer) {
        throw new Error("Impossible de communiquer avec le processus de rendu HTML");
      }

      // Utiliser le thème du semestre s'il existe, sinon le thème de la classe, sinon le thème global
      const semesterTheme = currentSemester?.theme || currentConfig?.theme;

      // NOUVEAU: Charger le centre si la configuration est associée à un centre
      let centreInfo = null;
      console.log('🔍 [PREVIEW] Vérification centre pour config:', {
        configName: currentConfig?.name,
        centreId: currentConfig?.centreId,
        hasConfig: !!currentConfig
      });

      if (currentConfig?.centreId) {
        try {
          const centresStored = localStorage.getItem('training-centres');
          console.log('📦 [PREVIEW] Centres stockés:', centresStored ? 'Oui' : 'Non');

          if (centresStored) {
            const centres = JSON.parse(centresStored);
            console.log(`📋 [PREVIEW] Nombre de centres trouvés: ${centres.length}`);

            centreInfo = centres.find((c: any) => c.id === currentConfig.centreId);
            if (centreInfo) {
              console.log(`✅ [PREVIEW] Centre trouvé pour la config: ${centreInfo.nameFrench}`, centreInfo);
            } else {
              console.warn(`❌ [PREVIEW] Aucun centre trouvé avec l'ID: ${currentConfig.centreId}`);
              console.log('IDs disponibles:', centres.map((c: any) => c.id));
            }
          }
        } catch (error) {
          console.error('❌ [PREVIEW] Erreur lors du chargement du centre:', error);
        }
      } else {
        console.log('ℹ️ [PREVIEW] Pas de centreId dans la configuration');
      }

      const effectiveSettings = {
        ...settings,
        demoMode: isDemoMode,
        encryptionEnabled: encryptionEnabled,
        ...(semesterTheme && { theme: semesterTheme }),
        // NOUVEAU: Ajouter les informations du centre si disponibles
        ...(centreInfo && {
          centre: {
            ...centreInfo,
            authorizationTextFr: centreInfo.authorizationTextFr,
            authorizationTextEn: centreInfo.authorizationTextEn,
            location: centreInfo.location
          },
          // Surcharger les logos et informations avec ceux du centre
          centreLogo: centreInfo.logo,
          centreAdministrativeInstanceLogo: centreInfo.administrativeInstanceLogo,
          centreAdministrativeInstanceNameFr: centreInfo.administrativeInstanceNameFr,
          centreAdministrativeInstanceNameEn: centreInfo.administrativeInstanceNameEn
        })
      };

      if (centreInfo) {
        console.log('✅ [PREVIEW] Informations du centre ajoutées aux settings:', {
          centreName: centreInfo.nameFrench,
          hasLogo: !!centreInfo.logo,
          hasAdminLogo: !!centreInfo.administrativeInstanceLogo,
          adminNameFr: centreInfo.administrativeInstanceNameFr
        });
      }

      const renderParams = {
        student: preparedStudent,
        settings: effectiveSettings,
        config: currentConfig
      };

      const htmlContent = await window.transcriptRenderer.renderHTML(renderParams);

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
    } catch (error) {
      console.error('Erreur de prévisualisation:', error);
      const message = `Erreur lors de la génération de la prévisualisation: ${error.message || 'Erreur inconnue'}`;
      setError(message);
      notifyError("Erreur", message);
    }
  }, [currentConfig, currentSemester, selectedMultiSemesterIds, excelData, mappingComplete, prepareStudentData, settings, selectedStudentMatricules, encryptionEnabled, columnMapping, isDemoMode, notifySuccess, notifyError, notifyWarning, notifyInfo]);
  
  const handleGenerateSelected = useCallback(async (studentsToGenerate?: any[]) => {
    // Vérifier la configuration
    if (!currentConfig) {
      const message = "Veuillez sélectionner une configuration";
      setError(message);
      notifyWarning("Configuration manquante", message);
      return;
    }

    // Vérifier qu'un semestre est sélectionné OU que le mode multi-semestres est actif
    if (!currentSemester && selectedMultiSemesterIds.length === 0) {
      const message = "Veuillez sélectionner un semestre ou activer le mode multi-semestres";
      setError(message);
      notifyWarning("Semestre manquant", message);
      return;
    }

    // Si mode multi-semestres, utiliser la fonction dédiée
    if (selectedMultiSemesterIds.length > 0) {
      await handleGenerateMultipleSemesters(selectedMultiSemesterIds);
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

    // NOUVEAU: Sauvegarder les informations du fichier Excel
    if (currentFileName) {
      saveExcelFileInfo(currentFileName, columnMapping, sessionMapping);
    }

    try {
      const preparedData = [];
      
      for (const student of dataToProcess) {
        try {
          const prepared = prepareStudentData(student);
          if (!prepared) {
            console.error("Erreur lors de la préparation des données pour:", student.MATRICULE);
            throw new Error(`Erreur lors de la préparation des données pour l'étudiant ${student.MATRICULE}`);
          }
          
          // NOUVEAU: Fusionner le thème de la configuration de classe avec les paramètres globaux
          // Utiliser le thème du semestre s'il existe, sinon le thème de la classe, sinon le thème global
          const semesterTheme = currentSemester?.theme || currentConfig?.theme;

          // NOUVEAU: Charger le centre si la configuration est associée à un centre
          let centreInfo = null;
          console.log('🔍 Vérification centre pour config:', {
            configName: currentConfig?.name,
            centreId: currentConfig?.centreId,
            hasConfig: !!currentConfig
          });

          if (currentConfig?.centreId) {
            try {
              const centresStored = localStorage.getItem('training-centres');
              console.log('📦 Centres stockés:', centresStored ? 'Oui' : 'Non');

              if (centresStored) {
                const centres = JSON.parse(centresStored);
                console.log(`📋 Nombre de centres trouvés: ${centres.length}`);

                centreInfo = centres.find((c: any) => c.id === currentConfig.centreId);
                if (centreInfo) {
                  console.log(`✅ Centre trouvé pour la config: ${centreInfo.nameFrench}`, centreInfo);
                } else {
                  console.warn(`❌ Aucun centre trouvé avec l'ID: ${currentConfig.centreId}`);
                  console.log('IDs disponibles:', centres.map((c: any) => c.id));
                }
              }
            } catch (error) {
              console.error('❌ Erreur lors du chargement du centre:', error);
            }
          } else {
            console.log('ℹ️ Pas de centreId dans la configuration');
          }

          const effectiveSettings = {
            ...settings,
            demoMode: isDemoMode,
            encryptionEnabled: encryptionEnabled,
            // Si la configuration de classe ou le semestre a un thème personnalisé, l'utiliser
            ...(semesterTheme && { theme: semesterTheme }),
            // NOUVEAU: Ajouter les informations du centre si disponibles
            ...(centreInfo && {
              centre: {
                ...centreInfo,
                authorizationTextFr: centreInfo.authorizationTextFr,
                authorizationTextEn: centreInfo.authorizationTextEn,
                location: centreInfo.location
              },
              // Surcharger les logos et informations avec ceux du centre
              centreLogo: centreInfo.logo,
              centreAdministrativeInstanceLogo: centreInfo.administrativeInstanceLogo,
              centreAdministrativeInstanceNameFr: centreInfo.administrativeInstanceNameFr,
              centreAdministrativeInstanceNameEn: centreInfo.administrativeInstanceNameEn
            })
          };

          if (centreInfo) {
            console.log('✅ Informations du centre ajoutées aux settings:', {
              centreName: centreInfo.nameFrench,
              hasLogo: !!centreInfo.logo,
              hasAdminLogo: !!centreInfo.administrativeInstanceLogo,
              adminNameFr: centreInfo.administrativeInstanceNameFr
            });
          }

          preparedData.push({
            student: prepared,
            settings: effectiveSettings,
            config: currentConfig // NOUVEAU: Passer la configuration de classe pour les options d'affichage
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

      const prefix = encryptionEnabled ? 'releve_compact' : 'releve';
      
      // Gestion des différents formats d'export
      try {
        switch (exportFormat) {
          case 'individual':
            await downloadFiles(results, prefix, nameFormat);
            notifySuccess("Export terminé", `${results.size} fichiers téléchargés individuellement`);
            break;
            
          case 'single':
            await downloadSinglePDF(results, prefix, nameFormat);
            notifySuccess("Export terminé", "PDF combiné téléchargé avec succès");
            break;
            
          case 'zip':
          default:
            const zipBlob = await generateZipFile(results, prefix, {
              useCompression,
              nameFormat
            });
            const url = URL.createObjectURL(zipBlob);
            
            const link = document.createElement("a");
            link.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            const compressionSuffix = useCompression ? '' : '_nocompress';
            const encryptionSuffix = encryptionEnabled ? '_compact' : '';
            const fileName = `releves_${timestamp}${encryptionSuffix}${compressionSuffix}.zip`;
            link.download = fileName;
            link.click();
            
            URL.revokeObjectURL(url);
            notifySuccess("Export terminé", `Archive ZIP ${useCompression ? 'compressée' : 'non compressée'} téléchargée`);
            break;
        }
      } catch (downloadError) {
        console.error('Erreur lors du téléchargement:', downloadError);
        notifyError("Erreur d'export", "Impossible de télécharger les fichiers");
        throw downloadError;
      }
      
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

  // NOUVEAU: Fonction pour générer les relevés de plusieurs semestres avec gestion optimisée de la mémoire
  const handleGenerateMultipleSemesters = useCallback(async (semesterIds: string[]) => {
    console.log('🚀 [MULTI-SEM] Début handleGenerateMultipleSemesters', {
      semesterIds,
      excelDataLength: excelData.length,
      timestamp: new Date().toISOString()
    });

    if (!currentConfig) {
      notifyError("Erreur", "Aucune configuration sélectionnée");
      return;
    }

    if (excelData.length === 0) {
      notifyError("Erreur", "Veuillez charger des données Excel");
      return;
    }

    if (!mappingComplete) {
      notifyError("Erreur", "Veuillez compléter la correspondance des colonnes");
      return;
    }

    try {
      console.log('📊 [MULTI-SEM] Configuration validée, début du traitement');
      console.log(`📦 [MULTI-SEM] Format d'export: ${multiSemesterExportFormat}, compression: ${useCompression}, nommage: ${nameFormat}`);
      notifyInfo(
        "Génération multi-semestres",
        `Génération de ${semesterIds.length} semestre(s) pour ${excelData.length} étudiant(s)...`
      );

      // CORRECTION: Collecter tous les PDFs avec leurs métadonnées
      // Le format d'export sera appliqué à la fin
      const allPDFs: Array<{ blob: Uint8Array; fileName: string; semesterName: string; studentInfo: any }> = [];
      let totalGenerated = 0;

      // Pour chaque semestre sélectionné
      console.log(`🔄 [MULTI-SEM] Début boucle semestres, total: ${semesterIds.length}`);
      for (let semIndex = 0; semIndex < semesterIds.length; semIndex++) {
        const semesterId = semesterIds[semIndex];
        console.log(`📝 [MULTI-SEM] Traitement semestre ${semIndex + 1}/${semesterIds.length}: ${semesterId}`);

        const semester = currentConfig.semesters.find(s => s.id === semesterId);
        if (!semester) {
          console.warn(`⚠️ [MULTI-SEM] Semestre non trouvé: ${semesterId}`);
          continue;
        }

        console.log(`✅ [MULTI-SEM] Semestre trouvé: ${semester.name}`);
        notifyInfo("Génération", `Traitement du semestre: ${semester.name}...`);

        // CORRECTION: Traiter par lots plus petits pour éviter l'accumulation de BrowserWindow
        // Chaque BrowserWindow consomme ~100-200 MB de RAM, donc limiter le parallélisme
        const BATCH_SIZE = 10;  // Réduit de 50 à 10 pour limiter les BrowserWindow simultanées
        const totalStudents = excelData.length;
        let processedInSemester = 0;

        console.log(`👥 [MULTI-SEM] ${semester.name}: ${totalStudents} étudiants à traiter, BATCH_SIZE=${BATCH_SIZE}`);

        for (let i = 0; i < totalStudents; i += BATCH_SIZE) {
          const batchStudents = excelData.slice(i, Math.min(i + BATCH_SIZE, totalStudents));
          console.log(`📦 [MULTI-SEM] ${semester.name}: Lot ${Math.floor(i / BATCH_SIZE) + 1}, étudiants ${i} à ${i + batchStudents.length}`);

          // Préparer les données pour ce lot
          const preparedData = [];
          for (const student of batchStudents) {
            console.log(`🔍 [MULTI-SEM] Préparation étudiant: ${student.MATRICULE || 'NO_MATRICULE'}`);

            try {
              // Utiliser prepareStudentData avec le semestre spécifique
              const prepared = prepareStudentData(student, semester);
              if (!prepared) continue;

              // Utiliser le thème du semestre s'il existe, sinon le thème de la classe
              const semesterTheme = semester.theme || currentConfig?.theme;

              const effectiveSettings = {
                ...settings,
                demoMode: isDemoMode,
                encryptionEnabled: encryptionEnabled,
                ...(semesterTheme && { theme: semesterTheme })
              };

              preparedData.push({
                student: prepared,
                settings: effectiveSettings,
                config: currentConfig
              });
            } catch (error) {
              console.error(`Erreur pour l'étudiant ${student.MATRICULE}:`, error);
            }
          }

          if (preparedData.length === 0) continue;

          // Générer les PDFs pour ce lot
          // CORRECTION: Utiliser batchSize=1 pour éviter les BrowserWindow simultanées
          // Chaque BrowserWindow prend 1-2 secondes et consomme beaucoup de RAM
          const results = await processBatch(
            preparedData,
            (data) => window.ipcRenderer.invoke('generate-transcript-pdf', data),
            1  // batchSize = 1 pour éviter l'accumulation de BrowserWindow
          );

          // CORRECTION: Collecter les PDFs avec leurs métadonnées
          results.forEach((blob, key) => {
            try {
              // Parser la clé JSON pour récupérer les infos de l'étudiant
              const studentInfo = JSON.parse(key);

              // Générer le nom de fichier
              const prefix = encryptionEnabled ? 'releve_compact' : 'releve';
              const cleanNom = (studentInfo.NOM || 'Unknown').replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();
              const cleanPrenom = (studentInfo.PRENOM || 'Unknown').replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();
              const matricule = studentInfo.MATRICULE || 'UNKNOWN';

              let fileName: string;
              if (nameFormat === 'detailed') {
                const niveau = studentInfo.NIVEAU || 'L1';
                const semestre = studentInfo.SEMESTRE || 'S1';
                const cleanFiliere = (studentInfo.FILIERE || 'UNKNOWN').replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();
                fileName = `${prefix}_${cleanNom}_${cleanPrenom}_${matricule}_${niveau}_${semestre}_${cleanFiliere}.pdf`;
              } else {
                fileName = `${prefix}_${cleanNom}_${cleanPrenom}_${matricule}.pdf`;
              }

              console.log(`📁 [MULTI-SEM] PDF collecté: ${fileName}`);
              allPDFs.push({
                blob,
                fileName,
                semesterName: semester.name,
                studentInfo
              });
              totalGenerated++;
              processedInSemester++;
            } catch (error) {
              console.error('❌ [MULTI-SEM] Erreur lors de la collecte du PDF:', error);
            }
          });

          // CORRECTION: Libérer explicitement la mémoire
          results.clear();
          preparedData.length = 0;

          // SUPPRIMÉ: global.gc() n'existe pas dans le renderer process (browser)
          // Le garbage collector sera appelé automatiquement par V8

          notifyInfo(
            "Progression",
            `${semester.name}: ${processedInSemester}/${totalStudents} traités`
          );
        }

        notifySuccess("Génération", `Semestre "${semester.name}" terminé (${processedInSemester} relevés)`);
      }

      if (totalGenerated === 0) {
        notifyError("Erreur", "Aucun relevé n'a été généré");
        return;
      }

      // NOUVEAU: Appliquer le format d'export choisi avec TOUTES les options possibles
      const timestamp = new Date().toISOString().split('T')[0];
      const encryptionSuffix = encryptionEnabled ? '_compact' : '';

      switch (multiSemesterExportFormat) {
        case 'all-single': {
          // Option 1: TOUT fusionné en UN SEUL PDF
          console.log('📄 [MULTI-SEM] Export: TOUT en un seul PDF');
          notifyInfo("Finalisation", "Combinaison de TOUS les relevés en un seul document...");

          const { PDFDocument } = await import('pdf-lib');
          const combinedPdf = await PDFDocument.create();

          for (const pdf of allPDFs) {
            try {
              const pdfDoc = await PDFDocument.load(pdf.blob);
              const pages = await combinedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
              pages.forEach((page) => combinedPdf.addPage(page));
            } catch (error) {
              console.error(`Erreur lors de l'ajout du PDF ${pdf.fileName}:`, error);
            }
          }

          const combinedBytes = await combinedPdf.save();
          const blob = new Blob([combinedBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `releves_tous_semestres_${timestamp}${encryptionSuffix}.pdf`;
          link.click();
          URL.revokeObjectURL(url);

          notifySuccess("Export terminé", `1 PDF unique généré (${totalGenerated} relevés combinés)`);
          break;
        }

        case 'per-semester-merged': {
          // Option 2: Un PDF fusionné PAR SEMESTRE (téléchargés séparément)
          console.log('📚 [MULTI-SEM] Export: Un PDF fusionné par semestre');
          notifyInfo("Finalisation", "Création d'un PDF par semestre...");

          const { PDFDocument } = await import('pdf-lib');
          const semesterGroups = new Map<string, typeof allPDFs>();

          // Grouper les PDFs par semestre
          for (const pdf of allPDFs) {
            if (!semesterGroups.has(pdf.semesterName)) {
              semesterGroups.set(pdf.semesterName, []);
            }
            semesterGroups.get(pdf.semesterName).push(pdf);
          }

          // Créer un PDF fusionné pour chaque semestre
          for (const [semesterName, pdfs] of semesterGroups) {
            const mergedPdf = await PDFDocument.create();

            for (const pdf of pdfs) {
              try {
                const pdfDoc = await PDFDocument.load(pdf.blob);
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach((page) => mergedPdf.addPage(page));
              } catch (error) {
                console.error(`Erreur lors de l'ajout du PDF ${pdf.fileName}:`, error);
              }
            }

            const mergedBytes = await mergedPdf.save();
            const blob = new Blob([mergedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const cleanSemesterName = semesterName.replace(/[^a-zA-Z0-9\-_]/g, '_');
            link.download = `releves_${cleanSemesterName}_${timestamp}${encryptionSuffix}.pdf`;
            link.click();
            URL.revokeObjectURL(url);

            await new Promise(resolve => setTimeout(resolve, 100));
          }

          notifySuccess("Export terminé", `${semesterGroups.size} PDFs fusionnés générés (1 par semestre)`);
          break;
        }

        case 'zip-per-semester-merged': {
          // Option 3: ZIP avec un PDF fusionné PAR SEMESTRE
          console.log('🗜️📚 [MULTI-SEM] Export: ZIP avec PDFs fusionnés par semestre');
          notifyInfo("Finalisation", "Création d'un ZIP avec un PDF par semestre...");

          const { PDFDocument } = await import('pdf-lib');
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();

          const semesterGroups = new Map<string, typeof allPDFs>();

          // Grouper les PDFs par semestre
          for (const pdf of allPDFs) {
            if (!semesterGroups.has(pdf.semesterName)) {
              semesterGroups.set(pdf.semesterName, []);
            }
            semesterGroups.get(pdf.semesterName).push(pdf);
          }

          // Créer un PDF fusionné pour chaque semestre et l'ajouter au ZIP
          for (const [semesterName, pdfs] of semesterGroups) {
            const mergedPdf = await PDFDocument.create();

            for (const pdf of pdfs) {
              try {
                const pdfDoc = await PDFDocument.load(pdf.blob);
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach((page) => mergedPdf.addPage(page));
              } catch (error) {
                console.error(`Erreur lors de l'ajout du PDF ${pdf.fileName}:`, error);
              }
            }

            const mergedBytes = await mergedPdf.save();
            const cleanSemesterName = semesterName.replace(/[^a-zA-Z0-9\-_]/g, '_');
            zip.file(`${cleanSemesterName}.pdf`, mergedBytes);
          }

          // Générer le ZIP
          const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: useCompression ? 'DEFLATE' : 'STORE',
            compressionOptions: useCompression ? { level: 6 } : undefined
          });

          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement("a");
          link.href = url;
          const compressionSuffix = useCompression ? '' : '_nocompress';
          link.download = `releves_par_semestre_${timestamp}${encryptionSuffix}${compressionSuffix}.zip`;
          link.click();
          URL.revokeObjectURL(url);

          notifySuccess("Export terminé", `ZIP créé avec ${semesterGroups.size} PDFs fusionnés`);
          break;
        }

        case 'all-individual': {
          // Option 4: TOUS les fichiers individuels (sans ZIP)
          console.log('📥 [MULTI-SEM] Export: Tous fichiers individuels');
          notifyInfo("Finalisation", "Téléchargement de tous les fichiers individuels...");

          for (const pdf of allPDFs) {
            const blob = new Blob([pdf.blob], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = pdf.fileName;
            link.click();
            URL.revokeObjectURL(url);

            await new Promise(resolve => setTimeout(resolve, 100));
          }

          notifySuccess("Export terminé", `${totalGenerated} fichiers téléchargés individuellement`);
          break;
        }

        case 'all-zip-individual':
        default: {
          // Option 5 (défaut): ZIP avec fichiers individuels organisés par semestre
          console.log('🗜️📁 [MULTI-SEM] Export: ZIP avec fichiers individuels par semestre');
          notifyInfo("Finalisation", "Création d'une archive ZIP organisée...");

          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();

          // Organiser par semestre
          const semesterFolders = new Map<string, any>();
          for (const pdf of allPDFs) {
            if (!semesterFolders.has(pdf.semesterName)) {
              semesterFolders.set(pdf.semesterName, zip.folder(pdf.semesterName));
            }
            const folder = semesterFolders.get(pdf.semesterName);
            folder.file(pdf.fileName, pdf.blob);
          }

          // Générer le ZIP
          const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: useCompression ? 'DEFLATE' : 'STORE',
            compressionOptions: useCompression ? { level: 6 } : undefined
          });

          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement("a");
          link.href = url;
          const compressionSuffix = useCompression ? '' : '_nocompress';
          link.download = `releves_multi_semestres_${timestamp}${encryptionSuffix}${compressionSuffix}.zip`;
          link.click();
          URL.revokeObjectURL(url);

          notifySuccess("Export terminé", `ZIP créé avec ${totalGenerated} relevés dans ${semesterFolders.size} dossiers`);
          break;
        }
      }

      // Sauvegarder les infos du fichier
      if (currentFileName) {
        saveExcelFileInfo(currentFileName, columnMapping, sessionMapping);
      }

    } catch (error) {
      console.error("Erreur lors de la génération multi-semestres:", error);
      notifyError("Erreur", `Erreur lors de la génération: ${error.message}`);
    }
  }, [currentConfig, excelData, mappingComplete, prepareStudentData, settings, isDemoMode, encryptionEnabled, processBatch, useCompression, currentFileName, columnMapping, sessionMapping, saveExcelFileInfo, notifyInfo, notifySuccess, notifyError, notifyWarning]);

  // Keyboard shortcuts
  useHotkeys('ctrl+p', () => handlePreviewReleve(), [handlePreviewReleve]);
  useHotkeys('ctrl+g', () => handleGenerateSelected(), [handleGenerateSelected]);
  useHotkeys('esc', () => setActiveTab("configuration"), []);

  // Fonction pour vérifier si les boutons doivent être activés
  const areButtonsEnabled = useCallback(() => {
    return (
      !processingState.isLoading &&
      selectedConfigId &&
      (selectedSemesterId || selectedMultiSemesterIds.length > 0) &&
      mappingComplete &&
      excelData.length > 0
    );
  }, [processingState.isLoading, selectedConfigId, selectedSemesterId, selectedMultiSemesterIds.length, mappingComplete, excelData.length]); 

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
    setSessionMapping({}); // NOUVEAU: Réinitialiser le mapping des sessions
    clearData();
  }, [clearData]);

  // NOUVEAU: Statistiques des sessions
  const sessionStats = useMemo(() => {
    const sessionColumns = excelColumns.filter(col => col.startsWith('S/'));
    const mappedSessions = Object.values(sessionMapping).filter(v => v && v !== "null").length;
    
    return {
      totalSessionColumns: sessionColumns.length,
      mappedSessions,
      availableSessions: sessionColumns.length
    };
  }, [excelColumns, sessionMapping]);

  return (
    <div className="container mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!selectedConfigId || (!selectedSemesterId && selectedMultiSemesterIds.length === 0)}>
            Correspondance
            {validationResult && !validationResult.isValid && (
              <AlertTriangle className="ml-2 h-4 w-4 text-red-500" />
            )}
            {/* NOUVEAU: Indicateur multi-semestre */}
            {selectedMultiSemesterIds.length > 0 && (
              <Badge variant="default" className="ml-2 text-xs bg-purple-600">
                <Layers className="h-3 w-3 mr-1" />
                {selectedMultiSemesterIds.length} sem.
              </Badge>
            )}
            {/* NOUVEAU: Indicateur de sessions */}
            {sessionStats.totalSessionColumns > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {sessionStats.mappedSessions}/{sessionStats.totalSessionColumns}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="selection" disabled={!mappingComplete || excelData.length === 0}>
            Sélection ({selectedStudentMatricules.length})
          </TabsTrigger>
          <TabsTrigger value="multi-semester" disabled={selectedMultiSemesterIds.length === 0}>
            <Layers className="h-4 w-4 mr-1" />
            Multi-semestres
            {selectedMultiSemesterIds.length > 0 && (
              <Badge variant="default" className="ml-2 text-xs bg-blue-600">
                {selectedMultiSemesterIds.length}
              </Badge>
            )}
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
                      {/* NOUVEAU: Badge pour les sessions */}
                      {sessionStats.totalSessionColumns > 0 && (
                        <Badge variant="outline" className="bg-blue-50 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {sessionStats.totalSessionColumns} session(s)
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
                  {/* Sécurité et Export - Fusionnés */}
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-orange-50">
                    <CardContent className="p-3 space-y-3">
                      {/* Ligne 1: Chiffrement */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <div>
                            <Label htmlFor="encryption-toggle-releve" className="text-sm font-medium text-blue-900">
                              Chiffrement QR Compact
                            </Label>
                            <p className="text-xs text-blue-700">Basé sur le matricule (50-80 car.)</p>
                          </div>
                        </div>
                        <Switch
                          id="encryption-toggle-releve"
                          checked={encryptionEnabled}
                          onCheckedChange={(checked) => {
                            setEncryptionEnabled(checked);
                            notifySuccess("Sécurité", checked ? "Chiffrement compact activé" : "Chiffrement désactivé");
                            if (excelData.length > 0) setTimeout(() => analyzeQRCodeSizesForReleve(excelData[0]), 500);
                          }}
                        />
                      </div>

                      <Separator />

                      {/* Ligne 2: Format d'export + Nommage */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <Settings className="h-3 w-3 text-orange-600" />
                          <Label className="text-xs font-medium text-orange-800">Format:</Label>
                          <div className="flex gap-1">
                            <Button
                              variant={exportFormat === 'zip' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setExportFormat('zip')}
                              className="h-6 px-1.5 text-xs"
                              title="Archive ZIP"
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                            <Button
                              variant={exportFormat === 'individual' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setExportFormat('individual')}
                              className="h-6 px-1.5 text-xs"
                              title="Fichiers séparés"
                            >
                              <Files className="h-3 w-3" />
                            </Button>
                            <Button
                              variant={exportFormat === 'single' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setExportFormat('single')}
                              className="h-6 px-1.5 text-xs"
                              title="PDF unique"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Label className="text-xs font-medium text-orange-800">Noms:</Label>
                          <div className="flex gap-1">
                            <Button
                              variant={nameFormat === 'default' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNameFormat('default')}
                              className="h-6 px-2 text-xs"
                            >
                              Standard
                            </Button>
                            <Button
                              variant={nameFormat === 'detailed' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNameFormat('detailed')}
                              className="h-6 px-2 text-xs"
                            >
                              Détaillé
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Ligne 3: Compression ZIP (conditionnel) */}
                      {exportFormat === 'zip' && (
                        <div className="flex items-center justify-between bg-orange-100 px-2 py-1 rounded">
                          <Label htmlFor="compression-toggle" className="text-xs font-medium text-orange-900 flex items-center gap-1">
                            <Archive className="h-3 w-3" />
                            Compression ZIP
                          </Label>
                          <Switch
                            id="compression-toggle"
                            checked={useCompression}
                            onCheckedChange={setUseCompression}
                            className="scale-75"
                          />
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
                      mergedSemesters={currentConfig?.mergedSemesters || []}
                      selectedSemesterId={selectedSemesterId}
                      isLoading={processingState.isLoading}
                      onSemesterChange={handleSemesterChange}
                    />
                  )}

                  {/* Indicateur de fichier mémorisé */}
                  {currentConfig?.lastUsedExcelFile && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <strong>Fichier mémorisé :</strong> {currentConfig.lastUsedExcelFile.fileName}
                            <div className="text-xs text-blue-600 mt-1">
                              Dernière utilisation : {new Date(currentConfig.lastUsedExcelFile.lastUsed).toLocaleString('fr-FR')}
                              {currentConfig.lastUsedExcelFile.columnMapping && (
                                <span className="ml-2">• Mapping sauvegardé : {Object.keys(currentConfig.lastUsedExcelFile.columnMapping).length} EC(s)</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100">
                            <Info className="h-3 w-3 mr-1" />
                            Auto-mapping activé
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
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
                    // RESTAURÉ: Gestion du workbook (le vrai problème était ailleurs)
                    externalWorkbook={loadedWorkbook}
                    externalSheets={availableExcelSheets}
                    externalFileName={currentExcelFileName}
                    onWorkbookLoaded={(wb, sheets, fileName) => {
                      setLoadedWorkbook(wb);
                      setAvailableExcelSheets(sheets);
                      setCurrentExcelFileName(fileName);
                    }}
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
                            {/* NOUVEAU: Affichage des sessions */}
                            {sessionStats.totalSessionColumns > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {sessionStats.totalSessionColumns} session(s)
                              </span>
                            )}
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
                          {/* NOUVEAU: Indicateur de sessions dans le bouton */}
                          {sessionStats.totalSessionColumns > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {sessionStats.mappedSessions}/{sessionStats.totalSessionColumns}
                            </Badge>
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
                              {selectedMultiSemesterIds.length > 0
                                ? `Prévisualiser les relevés de chaque semestre`
                                : 'Prévisualiser'
                              }
                            </Button>

                            <Button
                              onClick={() => handleGenerateSelected()}
                              disabled={!areButtonsEnabled()}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {encryptionEnabled && <ShieldCheck className="mr-1 h-3 w-3" />}
                              {selectedMultiSemesterIds.length > 0
                                ? `Générer les relevés de tous les semestres`
                                : (selectedStudentMatricules.length > 0
                                  ? `Générer (${selectedStudentMatricules.length})`
                                  : 'Générer tous les relevés'
                                )
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
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    Correspondance des colonnes
                    {validationResult && !validationResult.isValid && (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                    {/* NOUVEAU: Indicateur multi-semestre dans le titre */}
                    {selectedMultiSemesterIds.length > 0 && (
                      <Badge variant="default" className="bg-purple-600">
                        <Layers className="h-4 w-4 mr-1" />
                        Mode multi-semestres ({selectedMultiSemesterIds.length} semestres)
                      </Badge>
                    )}
                    {/* NOUVEAU: Indicateur de sessions dans le titre */}
                    {sessionStats.totalSessionColumns > 0 && (
                      <Badge variant="outline" className="bg-blue-50 border-blue-200">
                        <Clock className="h-3 w-3 mr-1" />
                        {sessionStats.totalSessionColumns} session(s) détectée(s)
                      </Badge>
                    )}
                  </CardTitle>
                  {selectedMultiSemesterIds.length > 0 && (
                    <Alert className="bg-purple-50 border-purple-200 mt-2">
                      <Info className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-800 text-sm">
                        <strong>Mode multi-semestres activé :</strong> Vous configurez la correspondance pour {selectedMultiSemesterIds.length} semestre(s).
                        Les ECs de tous les semestres sélectionnés sont affichés ci-dessous.
                      </AlertDescription>
                    </Alert>
                  )}
                  {validationResult && !validationResult.isValid && (
                    <div className="text-sm text-orange-600 mt-2">
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
                    sessionMapping={sessionMapping}
                    getAvailableECs={getAvailableECs}
                    onMappingChange={handleMappingChange}
                    onSessionMappingChange={handleSessionMappingChange}
                    onLoadMapping={handleLoadMapping}
                    onAutoMapECs={() => autoMapByECName(excelColumns)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="selection">
              <StudentSelector
                students={preparedStudentsForDisplay}
                selectedStudents={selectedStudentMatricules}
                onSelectionChange={handleStudentSelectionChange}
                onPreview={handlePreviewStudent}
                onGenerateSelected={handleGenerateSelected}
                documentType="releve"
                isLoading={processingState.isLoading}
                additionalInfo={`${encryptionEnabled ? "Chiffrement compact activé" : "Sans chiffrement"}${sessionStats.totalSessionColumns > 0 ? ` • ${sessionStats.totalSessionColumns} session(s)` : ''}`}
              />
            </TabsContent>

            <TabsContent value="multi-semester">
              <div className="space-y-4">
                {/* Alert pour indiquer d'aller à la correspondance */}
                {selectedMultiSemesterIds.length > 0 && !mappingComplete && (
                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Correspondance requise :</strong> Vous avez sélectionné {selectedMultiSemesterIds.length} semestre(s).
                          <br />
                          Veuillez configurer la correspondance des colonnes pour tous les ECs.
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("mapping")}
                          className="border-orange-300"
                        >
                          Aller à la correspondance
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <MultiSemesterGenerator
                  config={currentConfig}
                  onGenerateMultiple={handleGenerateMultipleSemesters}
                  onSemesterSelectionChange={setSelectedMultiSemesterIds}
                  isLoading={processingState.isLoading}
                  multiSemesterExportFormat={multiSemesterExportFormat}
                  onExportFormatChange={setMultiSemesterExportFormat}
                />
              </div>
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
                        {/* NOUVEAU: Indicateur de sessions */}
                        {sessionStats.totalSessionColumns > 0 && (
                          <span className="text-blue-700 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">{sessionStats.totalSessionColumns} session(s)</span>
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