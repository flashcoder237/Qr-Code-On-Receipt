import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { useHotkeys } from "react-hotkeys-hook";
import { Eye, Download, AlertCircle, CheckCircle } from "lucide-react";

// Components
import { FileUploader } from "./components/FileUploader";
import { ProcessingProgress } from "./components/ProcessingProgress";
import { ConfigurationSelector } from "./ConfigurationSelector";
import { ColumnMappingEditor } from "./ColumnMappingEditor";
import { TranscriptPreview } from "./TranscriptPreview";
import { SemesterSelector } from "./SemesterSelector";

// Hooks
import { useConfiguration } from "./hooks/useConfiguration";
import { useProcessing } from "./hooks/useProcessing";
import { useTranscriptData } from "./hooks/useTranscriptData";
import { StudentRecord } from "../../../types/student";

const LOCAL_STORAGE_KEY = "academicConfigs";

export const ReleveGenerator: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState("configuration");
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load configurations from localStorage
  useEffect(() => {
    const loadConfigs = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsedConfigs = JSON.parse(stored);
          setConfigs(parsedConfigs);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des configurations:", error);
      }
    };

    loadConfigs();
    window.addEventListener('storage', loadConfigs);
    return () => window.removeEventListener('storage', loadConfigs);
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
      }
      setPreviewStudent(null);
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
        setPreviewPdfUrl(null);
      }
      setError(null);
    },
    onSemesterChange: () => {
      // Reset preview when semester changes
      setPreviewStudent(null);
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
        setPreviewPdfUrl(null);
      }
      setError(null);
    }
  });

  const {
    excelData,
    excelColumns,
    mappingComplete,
    handleFileLoaded,
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

  // Check if mapping is complete
  useEffect(() => {
    const availableECs = getAvailableECs();
    const complete = availableECs.length > 0 && availableECs.every(ec => columnMapping[ec.id]);
    setMappingStatus(complete);
  }, [getAvailableECs, columnMapping, setMappingStatus]);

  // Prepare student data for PDF generation
  const prepareStudentData = useCallback((rawStudent: any): StudentRecord => {
    if (!currentConfig || !currentSemester) return null;

    // Group ECs by UE and calculate UE averages
    const ueGroups = new Map();
    currentSemester.ues.forEach((ue: any) => {
      const ecGrades: number[] = [];
      const ecData: any[] = [];
      
      ue.ecs.forEach((ec: any) => {
        const columnName = columnMapping[ec.id];
        if (columnName) {
          const grade = parseFloat(rawStudent[columnName]) || 0;
          ecGrades.push(grade);
          ecData.push({
            CODE: `UE ${ue.name}`,
            INTITULE: ue.name,
            EC_TITRE: ec.name,
            NOTE: grade,
            CREDIT: 0 // Credits only at UE level
          });
        }
      });
      
      // Calculate UE average
      const ueAverage = ecGrades.length > 0 
        ? ecGrades.reduce((sum, grade) => sum + grade, 0) / ecGrades.length 
        : 0;

      // Add UE credits to first EC
      if (ecData.length > 0) {
        ecData[0].CREDIT = ue.credits || 0;
      }

      ueGroups.set(ue.id, ecData);
    });

    // Flatten all ECs into COURSES array
    const courses = Array.from(ueGroups.values()).flat();

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
      COURSES: courses
    };
  }, [currentConfig, currentSemester, columnMapping]);

  const handlePreviewReleve = useCallback(async () => {
    if (!selectedSemesterId || excelData.length === 0) {
      setError("Veuillez sélectionner un semestre et charger des données");
      return;
    }

    if (!mappingComplete) {
      setError("Veuillez compléter la correspondance des colonnes avant de prévisualiser");
      setActiveTab("mapping");
      return;
    }

    try {
      const student = prepareStudentData(excelData[0]);
      if (!student) {
        setError("Erreur lors de la préparation des données");
        return;
      }

      console.log("Prepared student data:", student); // Debug log

      setPreviewStudent(student);
      const pdfBytes = await window.ipcRenderer.invoke('generate-transcript-pdf', student);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      console.log("Created PDF URL:", url); // Debug log
      
      setPreviewPdfUrl(url);
      setActiveTab("preview");
      setError(null);
    } catch (error) {
      console.error('Preview error:', error);
      setError("Erreur lors de la génération de l'aperçu");
    }
  }, [selectedSemesterId, excelData, mappingComplete, prepareStudentData, previewPdfUrl]);

  const handleGenerateAll = useCallback(async () => {
    if (!selectedSemesterId || excelData.length === 0) {
      setError("Veuillez sélectionner un semestre et charger des données");
      return;
    }

    if (!mappingComplete) {
      setError("Veuillez compléter la correspondance des colonnes avant de générer les relevés");
      setActiveTab("mapping");
      return;
    }

    try {
      const preparedData = excelData.map(student => {
        const prepared = prepareStudentData(student);
        if (!prepared) throw new Error("Erreur lors de la préparation des données");
        return prepared;
      });
      
      const results = await processBatch(
        preparedData,
        (student) => window.ipcRenderer.invoke('generate-transcript-pdf', student)
      );

      const zipBlob = await generateZipFile(results, 'releve');
      const url = URL.createObjectURL(zipBlob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `releves_${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      
      URL.revokeObjectURL(url);
      setError(null);
    } catch (error) {
      console.error('Generation error:', error);
      setError("Erreur lors de la génération des relevés");
    }
  }, [selectedSemesterId, excelData, mappingComplete, prepareStudentData, processBatch, generateZipFile]);

  // Keyboard shortcuts
  useHotkeys('ctrl+p', handlePreviewReleve, [handlePreviewReleve]);
  useHotkeys('ctrl+g', handleGenerateAll, [handleGenerateAll]);
  useHotkeys('esc', () => setActiveTab("configuration"), []);

  return (
    <div className="container mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!selectedConfigId || !selectedSemesterId}>
            Correspondance
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewPdfUrl}>
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
                  <CardTitle>Configuration des relevés de notes</CardTitle>
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
                    onFileLoaded={handleFileLoaded}
                    onError={(error) => setError(error)}
                    isLoading={processingState.isLoading}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
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
                      <p className="text-sm text-gray-600 mb-4">
                        {excelData.length} ligne(s) chargée(s)
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => setActiveTab("mapping")}
                          variant="outline"
                          disabled={!selectedConfigId || !selectedSemesterId}
                        >
                          Configurer la correspondance
                        </Button>
                        
                        <Button 
                          onClick={handlePreviewReleve}
                          variant="secondary"
                          disabled={processingState.isLoading || !selectedConfigId || !selectedSemesterId || !mappingComplete}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Prévisualiser
                        </Button>

                        <Button
                          onClick={handleGenerateAll}
                          disabled={processingState.isLoading || !selectedConfigId || !selectedSemesterId || !mappingComplete}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Générer tous les relevés
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mapping">
              <Card>
                <CardHeader>
                  <CardTitle>Correspondance des colonnes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ColumnMappingEditor
                    selectedConfigId={selectedConfigId}
                    excelColumns={excelColumns}
                    columnMapping={columnMapping}
                    getAvailableECs={getAvailableECs}
                    onMappingChange={handleMappingChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <TranscriptPreview
                previewStudent={previewStudent}
                previewPdfUrl={previewPdfUrl}
                isLoading={processingState.isLoading}
                onBack={() => setActiveTab("mapping")}
                onGenerateAll={handleGenerateAll}
              />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-4 right-4 text-sm text-gray-500">
        <p>Ctrl+P: Prévisualiser</p>
        <p>Ctrl+G: Générer tout</p>
        <p>Esc: Retour</p>
      </div>
    </div>
  );
};
