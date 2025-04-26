import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Eye } from "lucide-react";
import * as XLSX from "xlsx";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { calculateGrade, calculateStatistics, calculateMGP } from "@/lib/helpers/grades";
import { generateTranscriptPDFWithPDFKit } from "@/lib/pdfGenerator";

// Import des composants
import { ConfigurationSelector } from "./ConfigurationSelector";
import { ExcelUploader } from "./ExcelUploader";
import { ColumnMappingEditor } from "./ColumnMappingEditor";
import { TranscriptPreview } from "./TranscriptPreview";
import { SemesterSelector } from "./SemesterSelector";

// Types
type EC = {
  id: string;
  name: string;
  credits: number;
};

type UE = {
  id: string;
  name: string;
  credits: number;
  ecs: EC[];
};

type Semester = {
  id: string;
  name: string;
  ues: UE[];
};

type ClassConfig = {
  id: string;
  name: string;
  academicYear: string;
  semesters: Semester[];
};

// Type pour la correspondance entre EC et colonnes Excel
type ColumnMapping = {
  [ecId: string]: string; // clé: ID de l'EC, valeur: nom de la colonne Excel
};

type StudentRecord = {
  MATRICULE: string;
  NOM: string;
  PRENOM: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  NIVEAU?: string;
  SEMESTRE?: string;
  "ANNEE ACADÉMIQUE"?: string;
  CYCLE?: string;
  FILIERE?: string;
  OPTION?: string;
  COURSES?: {
    CODE: string;
    INTITULE: string;
    NOTE: number;
    MOYENNE: number;
    CREDIT: number;
  }[];
};

// Constantes
const LOCAL_STORAGE_KEY = "academicConfigs";
const MAPPING_STORAGE_KEY = "columnMappings";

// Hook personnalisé pour gérer les configurations
const useClassConfigurations = () => {
  const [configs, setConfigs] = useState<ClassConfig[]>([]);
  
  useEffect(() => {
    const loadConfigs = () => {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsedConfigs = JSON.parse(stored);
          setConfigs(parsedConfigs);
        } catch (error) {
          console.error("Erreur lors du parsing des configurations:", error);
          setConfigs([]);
        }
      }
    };
    
    loadConfigs();
  }, []);
  
  return { configs };
};

// Hook personnalisé pour gérer les mappings de colonnes
const useColumnMapping = (selectedConfigId: string | null) => {
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  
  // Charger le mapping depuis le localStorage quand la configuration change
  useEffect(() => {
    if (selectedConfigId) {
      const storedMapping = localStorage.getItem(`${MAPPING_STORAGE_KEY}_${selectedConfigId}`);
      if (storedMapping) {
        try {
          setColumnMapping(JSON.parse(storedMapping));
        } catch {
          setColumnMapping({});
        }
      } else {
        setColumnMapping({});
      }
    }
  }, [selectedConfigId]);
  
  // Sauvegarder le mapping dans le localStorage quand il change
  useEffect(() => {
    if (selectedConfigId) {
      localStorage.setItem(`${MAPPING_STORAGE_KEY}_${selectedConfigId}`, JSON.stringify(columnMapping));
    }
  }, [columnMapping, selectedConfigId]);
  
  const handleMappingChange = useCallback((ecId: string, excelCol: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [ecId]: excelCol,
    }));
  }, []);
  
  return { columnMapping, handleMappingChange };
};

// Hook personnalisé pour gérer les données Excel
const useExcelData = () => {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  
  const handleExcelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true }) as any[];
  
        setExcelData(jsonData);
        if (jsonData.length > 0) {
          const cols = Object.keys(jsonData[0]);
          setExcelColumns(cols);
        } else {
          setExcelColumns([]);
          throw new Error("Aucune donnée trouvée dans le fichier Excel");
        }
      } catch (err) {
        console.error("Erreur lors de la lecture du fichier Excel:", err);
        throw err;
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);
  
  return { excelData, excelColumns, handleExcelUpload };
};

export const ReleveGenerator: React.FC = () => {
  // États locaux
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [availableSemesters, setAvailableSemesters] = useState<{id: string; name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successNotification, setSuccessNotification] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("configuration");

  // Hooks personnalisés
  const { configs } = useClassConfigurations();
  const { excelData, excelColumns, handleExcelUpload: handleExcelUploadBase } = useExcelData();
  const { columnMapping, handleMappingChange } = useColumnMapping(selectedConfigId);

  // Mettre à jour les semestres disponibles quand la configuration change
  useEffect(() => {
    if (selectedConfigId) {
      const config = configs.find(c => c.id === selectedConfigId);
      if (config) {
        const semesters = config.semesters.map(sem => ({
          id: sem.id,
          name: sem.name
        }));
        setAvailableSemesters(semesters);
        setSelectedSemesterId(null); // Réinitialiser la sélection de semestre
      } else {
        setAvailableSemesters([]);
      }
    }
  }, [selectedConfigId, configs]);

  // Nettoyer l'URL du PDF de prévisualisation
  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  // Handler pour l'upload d'Excel avec gestion d'erreur
  const handleExcelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreviewStudent(null);
    setPreviewPdfUrl(null);
    
    try {
      handleExcelUploadBase(event);
    } catch (err) {
      setError((err as Error).message || "Erreur lors de la lecture du fichier Excel");
    }
  }, [handleExcelUploadBase]);

  // Handler pour le changement de configuration
  const handleConfigChange = useCallback((value: string) => {
    setSelectedConfigId(value);
    setError(null);
    setPreviewStudent(null);
    setPreviewPdfUrl(null);
  }, []);

  // Handler pour le changement de semestre
  const handleSemesterChange = useCallback((value: string) => {
    setSelectedSemesterId(value);
    setError(null);
    setPreviewStudent(null);
    setPreviewPdfUrl(null);
  }, []);

  // Handler pour configurer le mapping
  const handleConfigureMapping = useCallback(() => {
    if (!selectedConfigId) {
      setError("Veuillez d'abord sélectionner une configuration");
      return;
    }
    
    if (!selectedSemesterId) {
      setError("Veuillez sélectionner un semestre");
      return;
    }
    
    if (excelColumns.length === 0) {
      setError("Veuillez charger un fichier Excel");
      return;
    }
    
    if (getAvailableECs().length === 0) {
      setError("Aucun EC trouvé pour cette configuration et ce semestre");
      return;
    }
    
    setActiveTab("mapping");
  }, [selectedConfigId, selectedSemesterId, excelColumns]);

  // Handler pour naviguer de la prévisualisation au mapping
  const handleBackFromPreview = useCallback(() => {
    setActiveTab("mapping");
  }, []);

  // Obtenir la liste des ECs disponibles 
  const getAvailableECs = useCallback(() => {
    if (!selectedConfigId || !selectedSemesterId) return [];
    
    const config = configs.find((c) => c.id === selectedConfigId);
    if (!config) return [];
    
    const semester = config.semesters.find(sem => sem.id === selectedSemesterId);
    if (!semester) return [];
    
    const ecList: { id: string; fullName: string }[] = [];
    
    semester.ues.forEach((ue) => {
      ue.ecs.forEach((ec) => {
        ecList.push({
          id: ec.id,
          fullName: `${ue.name} / ${ec.name}`
        });
      });
    });
    
    return ecList;
  }, [selectedConfigId, selectedSemesterId, configs]);

  // Mémoiser le traitement des données étudiants
  const processStudentData = useCallback(() => {
    if (excelData.length === 0 || !selectedConfigId || !selectedSemesterId) {
      return [];
    }

    // Grouper les étudiants par MATRICULE
    const studentsMap: { [matricule: string]: StudentRecord } = {};

    excelData.forEach((row) => {
      const matricule = row["MATRICULE"];
      if (!matricule) return;

      if (!studentsMap[matricule]) {
        studentsMap[matricule] = {
          MATRICULE: matricule,
          NOM: row["NOM"],
          PRENOM: row["PRENOM"],
          "DATE DE NAISSANCE": row["DATE DE NAISSANCE"],
          "LIEU DE NAISSANCE": row["LIEU DE NAISSANCE"],
          NIVEAU: row["NIVEAU"],
          SEMESTRE: row["SEMESTRE"],
          "ANNEE ACADÉMIQUE": row["ANNEE ACADÉMIQUE"],
          CYCLE: row["CYCLE"],
          FILIERE: row["FILIERE"],
          OPTION: row["OPTION"],
          COURSES: [],
        };
      }

      // Mapper les ECs aux colonnes Excel
      Object.entries(columnMapping).forEach(([ecId, excelCol]) => {
        if (!excelCol || row[excelCol] === undefined) return;
        
        // Trouver les informations de l'EC depuis la config
        const config = configs.find((c) => c.id === selectedConfigId);
        if (!config) return;
        
        let ecInfo: { name: string, credits: number, ueCode: string, ueName: string } | null = null;
        
        // Recherche efficace de l'EC
        outerLoop: for (const sem of config.semesters) {
          for (const ue of sem.ues) {
            const ec = ue.ecs.find((e) => e.id === ecId);
            if (ec) {
              ecInfo = {
                name: ec.name,
                credits: ec.credits,
                ueCode: ue.id,
                ueName: ue.name
              };
              break outerLoop;
            }
          }
        }
        
        if (ecInfo) {
          studentsMap[matricule].COURSES?.push({
            CODE: ecInfo.ueCode,
            INTITULE: ecInfo.name,
            NOTE: Number(row[excelCol]) || 0,
            MOYENNE: Number(row[excelCol]) || 0,
            CREDIT: ecInfo.credits,
          });
        }
      });
    });

    return Object.values(studentsMap);
  }, [excelData, selectedConfigId, selectedSemesterId, columnMapping, configs]);

  // Handler pour prévisualiser un relevé
  const handlePreviewReleve = async () => {
    if (!selectedSemesterId) {
      setError("Veuillez sélectionner un semestre");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const students = processStudentData();
      if (students.length === 0) {
        throw new Error("Aucune donnée d'étudiant à prévisualiser");
      }

      // Prévisualiser le premier étudiant
      const student = students[0];
      setPreviewStudent(student);
      
      const pdfBytes = await generateTranscriptPDFWithPDFKit(student);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      
      // Nettoyer l'URL précédente
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setActiveTab("preview");
    } catch (err) {
      setError((err as Error).message || "Erreur lors de la génération de la prévisualisation");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler pour générer et télécharger tous les relevés
  const processAndDownloadAll = async () => {
    if (!selectedSemesterId) {
      setError("Veuillez sélectionner un semestre");
      return;
    }
    if (excelData.length === 0) {
      setError("Aucune donnée d'étudiant chargée");
      return;
    }
    if (!selectedConfigId) {
      setError("Veuillez sélectionner une configuration de classe");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessNotification(false);

    try {
      const students = processStudentData();
      if (students.length === 0) {
        throw new Error("Aucune donnée d'étudiant valide");
      }
      
      const zip = new JSZip();

      for (const student of students) {
        try {
          const pdfBytes = await generateTranscriptPDFWithPDFKit(student);
          zip.file(`${student.MATRICULE}_releve.pdf`, pdfBytes);
        } catch (err) {
          console.error(`Erreur pour l'étudiant ${student.MATRICULE}:`, err);
          // Continue malgré l'erreur pour un étudiant
        }
      }

      const zipContent = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipContent);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = "releves_de_notes.zip";
      link.click();
      
      window.URL.revokeObjectURL(url);
      setSuccessNotification(true);
      setTimeout(() => setSuccessNotification(false), 5000);
    } catch (err) {
      setError((err as Error).message || "Erreur lors de la génération des relevés");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!selectedConfigId || !selectedSemesterId}>Correspondance</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewPdfUrl}>Prévisualisation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des relevés de notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConfigurationSelector 
                configs={configs}
                selectedConfigId={selectedConfigId}
                isLoading={isLoading}
                onConfigChange={handleConfigChange}
              />
  
              {selectedConfigId && availableSemesters.length > 0 && (
                <SemesterSelector
                  semesters={availableSemesters}
                  selectedSemesterId={selectedSemesterId}
                  isLoading={isLoading}
                  onSemesterChange={handleSemesterChange}
                />
              )}
              
              <ExcelUploader 
                isLoading={isLoading}
                onExcelUpload={handleExcelUpload}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successNotification && (
                <Alert variant="default" className="bg-green-50 border-green-300 text-green-800">
                  <AlertDescription>Les relevés ont été générés avec succès !</AlertDescription>
                </Alert>
              )}

              {excelData.length > 0 && (
                <div className="pt-4">
                  <p className="text-sm text-gray-600 mb-4">{excelData.length} ligne(s) chargée(s)</p>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleConfigureMapping} 
                      variant="outline"
                      disabled={!selectedConfigId || !selectedSemesterId || excelColumns.length === 0}
                    >
                      Configurer la correspondance
                    </Button>
                    
                    <Button 
                      onClick={handlePreviewReleve} 
                      variant="secondary"
                      disabled={isLoading || !selectedConfigId || !selectedSemesterId || excelData.length === 0}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Prévisualiser un relevé
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Correspondance des colonnes Excel aux ECs</CardTitle>
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
            <CardFooter className="flex justify-between">
              <Button 
                onClick={() => setActiveTab("configuration")} 
                variant="outline"
              >
                Retour
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handlePreviewReleve} 
                  variant="secondary"
                  disabled={isLoading || Object.keys(columnMapping).length === 0}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Prévisualiser
                </Button>
                
                <Button 
                  onClick={processAndDownloadAll} 
                  disabled={isLoading || Object.keys(columnMapping).length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Générer tous les relevés
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <TranscriptPreview
            previewStudent={previewStudent}
            previewPdfUrl={previewPdfUrl}
            isLoading={isLoading}
            onBack={handleBackFromPreview}
            onGenerateAll={processAndDownloadAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};