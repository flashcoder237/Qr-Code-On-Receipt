// src/components/organisms/receipts/ReleveGenerator.tsx - Version mise à jour avec validation
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { useHotkeys } from "react-hotkeys-hook";
import { Eye, Download, AlertCircle, CheckCircle, Users, RefreshCw, AlertTriangle } from "lucide-react";
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

// Validators
import { ValidationResult } from "@/lib/validators/excel-columns";

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

  // Hooks pour notifications et historique
  const { notifySuccess, notifyError, notifyWarning } = useNotifications();
  const { addDocumentRecord } = useDocumentHistory();

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
    }
  }, [excelData, notifySuccess]);

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

  // Prepare student data for PDF generation
  const prepareStudentData = useCallback((rawStudent: any): StudentRecord => {
    if (!currentConfig || !currentSemester) return null;
  
    const courses: any[] = [];
    
    currentSemester.ues.forEach((ue: any) => {
      ue.ecs.forEach((ec: any) => {
        const columnName = columnMapping[ec.id];
        if (columnName) {
          const grade = parseFloat(rawStudent[columnName]) || 0;
          
          courses.push({
            CODE: ue.code || `UE ${ue.name}`,
            INTITULE: ue.name,
            EC_TITRE: ec.name,
            NOTE: grade,
            UE_CREDIT: ue.credits || 0,
            UE_ID: ue.id
          });
        }
      });
    });
  
    const ueMap = new Map();
    
    courses.forEach(course => {
      const ueId = course.UE_ID;
      if (!ueMap.has(ueId)) {
        ueMap.set(ueId, {
          grades: [],
          credit: course.UE_CREDIT,
          code: course.CODE,
          name: course.INTITULE
        });
      }
      ueMap.get(ueId).grades.push(course.NOTE);
    });
    
    courses.forEach(course => {
      const ueData = ueMap.get(course.UE_ID);
      const sum = ueData.grades.reduce((total: number, grade: number) => total + grade, 0);
      const average = ueData.grades.length > 0 ? sum / ueData.grades.length : 0;
      course.UE_AVERAGE = average;
    });
  
    return {
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

      const preparedStudent = prepareStudentData(studentToPreview);
      if (!preparedStudent) {
        throw new Error("Erreur lors de la préparation des données");
      }

      console.log("Données étudiant préparées:", preparedStudent);
      console.log("Paramètres:", settings);

      setPreviewStudent(preparedStudent);
      
      if (!window.transcriptRenderer) {
        throw new Error("Impossible de communiquer avec le processus de rendu HTML");
      }
      
      try {
        const htmlContent = await window.transcriptRenderer.renderHTML({ student: preparedStudent, settings });
        console.log("Contenu HTML reçu:", htmlContent ? "Oui" : "Non", "Longueur:", htmlContent?.length);
        
        if (!htmlContent) {
          throw new Error("Aucun contenu HTML reçu");
        }
        
        const success = await window.ipcRenderer.invoke('show-preview', htmlContent, 'Prévisualisation du relevé');
        
        if (!success) {
          throw new Error("Impossible d'ouvrir la fenêtre de prévisualisation");
        }
        
        setError(null);
        notifySuccess("Prévisualisation", `Aperçu généré pour ${preparedStudent.NOM} ${preparedStudent.PRENOM}`);
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
  }, [currentConfig, currentSemester, excelData, mappingComplete, prepareStudentData, settings, selectedStudentMatricules, notifySuccess, notifyError, notifyWarning]);
  
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

    notifySuccess("Génération", `Début de la génération de ${dataToProcess.length} relevé(s)`);

    try {
      const preparedData = dataToProcess.map(student => {
        const prepared = prepareStudentData(student);
        if (!prepared) throw new Error("Erreur lors de la préparation des données");
        return { student: prepared, settings };
      });
      
      const results = await processBatch(
        preparedData,
        (data) => window.ipcRenderer.invoke('generate-transcript-pdf', data)
      );

      const zipBlob = await generateZipFile(results, 'releve');
      const url = URL.createObjectURL(zipBlob);
      
      const link = document.createElement("a");
      link.href = url;
      const fileName = `releves_${new Date().toISOString().split('T')[0]}.zip`;
      link.download = fileName;
      link.click();
      
      URL.revokeObjectURL(url);
      setError(null);
      
      // Ajouter les documents à l'historique
      dataToProcess.forEach(student => {
        const preparedStudent = prepareStudentData(student);
        if (preparedStudent) {
          // Calculer la moyenne pour l'historique
          const totalNotes = preparedStudent.COURSES.reduce((sum, course) => sum + course.NOTE, 0);
          const averageScore = preparedStudent.COURSES.length > 0 ? totalNotes / preparedStudent.COURSES.length : 0;
          
          addDocumentRecord({
            type: 'releve',
            studentName: `${preparedStudent.NOM} ${preparedStudent.PRENOM}`,
            studentMatricule: preparedStudent.MATRICULE,
            academicYear: preparedStudent["ANNEE ACADÉMIQUE"],
            level: preparedStudent.NIVEAU,
            semester: preparedStudent.SEMESTRE,
            average: averageScore,
            fileName: `${preparedStudent.MATRICULE}_releve.pdf`,
            status: 'generated'
          });
        }
      });
      
      const successMessage = `${results.size} relevé(s) généré(s) avec succès`;
      notifySuccess("Génération terminée", successMessage);
    } catch (error) {
      console.error('Generation error:', error);
      const message = "Erreur lors de la génération des relevés";
      setError(message);
      notifyError("Erreur de génération", message);
    }
  }, [currentConfig, currentSemester, excelData, mappingComplete, prepareStudentData, processBatch, generateZipFile, settings, selectedStudentMatricules, notifySuccess, notifyError, notifyWarning, addDocumentRecord]);

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
                    <CardTitle>Configuration des relevés de notes</CardTitle>
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
                </CardHeader>
                <CardContent className="space-y-4">
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
                              Prévisualiser
                            </Button>

                            <Button
                              onClick={() => handleGenerateSelected()}
                              disabled={!areButtonsEnabled()}
                            >
                              <Download className="mr-2 h-4 w-4" />
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

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-4 right-4 text-sm text-gray-500">
        <p>Ctrl+P: Prévisualiser</p>
        <p>Ctrl+G: Générer</p>
        <p>Esc: Retour</p>
      </div>
    </div>
  );
};