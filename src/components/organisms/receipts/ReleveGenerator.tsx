import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Eye } from "lucide-react";
import * as XLSX from "xlsx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import { calculateGrade, calculateStatistics, calculateMGP } from "@/lib/helpers/grades";

// Import the extracted components
import { ConfigurationSelector } from "./ConfigurationSelector";
import { ExcelUploader } from "./ExcelUploader";
import { ColumnMappingEditor } from "./ColumnMappingEditor";
import { TranscriptPreview } from "./TranscriptPreview";

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

// Inversé: EC id comme clé, Excel column comme valeur
type ColumnMapping = {
  [ecId: string]: string; // key: EC id, value: Excel column name
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

const LOCAL_STORAGE_KEY = "academicConfigs";
const MAPPING_STORAGE_KEY = "columnMappings";

export const ReleveGenerator = () => {
  const [configs, setConfigs] = useState<ClassConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successNotification, setSuccessNotification] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("configuration");

  // Load academic configs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setConfigs(JSON.parse(stored));
      } catch {
        setConfigs([]);
      }
    }
  }, []);

  // Load saved column mappings for selected config
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

  // Save column mappings on change
  useEffect(() => {
    if (selectedConfigId) {
      localStorage.setItem(`${MAPPING_STORAGE_KEY}_${selectedConfigId}`, JSON.stringify(columnMapping));
    }
  }, [columnMapping, selectedConfigId]);

  // Cleanup preview PDF URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  const handleConfigChange = (value: string) => {
    setSelectedConfigId(value);
    setColumnMapping({});
    setError(null);
    setPreviewStudent(null);
    setPreviewPdfUrl(null);
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          setExcelColumns(Object.keys(jsonData[0]));
        } else {
          setExcelColumns([]);
        }
        setError(null);
        setPreviewStudent(null);
        setPreviewPdfUrl(null);
      } catch (err) {
        setError("Erreur lors de la lecture du fichier Excel");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (ecId: string, excelCol: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [ecId]: excelCol,
    }));
  };

  const generatePdfForStudent = async (student: StudentRecord) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size in points (portrait)
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSizeTitle = 16;
    const fontSizeHeader = 10;
    const fontSizeText = 9;
    const margin = 40;

    // Header
    page.drawText("RELEVE DE NOTES / TRANSCRIPT", {
      x: margin,
      y: height - margin,
      size: fontSizeTitle,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // University and ministry info (simplified for brevity)
    const headerLines = [
      "REPUBLIQUE DU CAMEROUN",
      "Paix – Travail – Patrie",
      "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR",
      "UNIVERSITE DE DOUALA",
      "FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES",
      "INSTITUT SUPERIEUR DES SCIENCES, ARTS ET METIERS",
    ];
    let y = height - margin - fontSizeTitle - 10;
    headerLines.forEach((line) => {
      page.drawText(line, { x: margin, y, size: fontSizeHeader, font });
      y -= fontSizeHeader + 2;
    });

    // Student info
    y -= 10;
    const studentInfoLines = [
      `Nom et prénom: ${student.NOM} ${student.PRENOM}`,
      `Matricule: ${student.MATRICULE}`,
      `Date de naissance: ${student["DATE DE NAISSANCE"]}`,
      `Lieu de naissance: ${student["LIEU DE NAISSANCE"]}`,
      `Niveau: ${student.NIVEAU || ""}`,
      `Semestre: ${student.SEMESTRE || ""}`,
      `Année académique: ${student["ANNEE ACADÉMIQUE"] || ""}`,
      `Filière: ${student.FILIERE || ""}`,
      `Option: ${student.OPTION || ""}`,
    ];
    studentInfoLines.forEach((line) => {
      page.drawText(line, { x: margin, y, size: fontSizeText, font });
      y -= fontSizeText + 4;
    });

    // Table header
    y -= 10;
    const tableX = margin;
    const colWidths = [60, 200, 50, 50, 50];
    const headers = ["CODE", "UNITE D'ENSEIGNEMENT", "NOTE/20", "MOYENNE", "CREDIT"];
    let x = tableX;
    headers.forEach((header, i) => {
      page.drawText(header, { x, y, size: fontSizeText, font: fontBold });
      x += colWidths[i];
    });
    y -= fontSizeText + 6;

    // Table rows
    student.COURSES?.forEach((course) => {
      x = tableX;
      page.drawText(course.CODE, { x, y, size: fontSizeText, font });
      x += colWidths[0];
      page.drawText(course.INTITULE, { x, y, size: fontSizeText, font });
      x += colWidths[1];
      page.drawText(course.NOTE.toFixed(2), { x, y, size: fontSizeText, font });
      x += colWidths[2];
      page.drawText(course.MOYENNE.toFixed(2), { x, y, size: fontSizeText, font });
      x += colWidths[3];
      page.drawText(course.CREDIT.toString(), { x, y, size: fontSizeText, font });
      y -= fontSizeText + 4;
    });

    // Calculate statistics
    const stats = calculateStatistics(
      student.COURSES?.map((c) => ({ credits: c.CREDIT, grade: c.NOTE })) || []
    );
    const mgp = calculateMGP(stats.grade);
    const gradeLetter = calculateGrade(stats.average);

    y -= 20;
    page.drawText(`TOTAL CREDITS: ${stats.totalCredits}`, { x: margin, y, size: fontSizeText, font: fontBold });
    y -= fontSizeText + 4;
    page.drawText(`MOYENNE SEMESTRIELLE: ${stats.average.toFixed(2)}`, { x: margin, y, size: fontSizeText, font: fontBold });
    y -= fontSizeText + 4;
    page.drawText(`MGP: ${mgp.toFixed(2)}`, { x: margin, y, size: fontSizeText, font: fontBold });
    y -= fontSizeText + 4;
    page.drawText(`GRADE: ${gradeLetter}`, { x: margin, y, size: fontSizeText, font: fontBold });
    y -= fontSizeText + 4;
    page.drawText(`DECISION DU JURY: ${stats.grade === "Pass" ? "SEMESTRE VALIDE" : "SEMESTRE NON VALIDE"}`, { x: margin, y, size: fontSizeText, font: fontBold });

    // Footer with signatures and legend (simplified)
    y -= 50;
    page.drawText("Le Doyen FMSP", { x: margin, y, size: fontSizeText, font });
    page.drawText("Le Directeur de l'Institut Supérieur des Sciences Arts et Métiers", { x: margin + 300, y, size: fontSizeText, font });

    y -= 40;
    const legendLines = [
      "Grade    Note/4     Appréciation    Moy /20",
      "A+ 4.0 Excellent [18-20]",
      "A 3.7 Très Bien [16-18[",
      "B+ 3.3 Bien [14-16[",
      "B 3 Assez Bien [13-14[",
      "B- 2.7 Assez Bien [12-13[",
      "C+ 2.3 Passable [11-12[",
      "C 2.0 Passable [10-11[",
      "C- 1.7 Insuffisant [09-10[",
      "D 1.3 Faible [08-09[",
      "E 1.0 Très Faible [06-08[",
      "F 0.0 Nul [00-06[",
    ];
    legendLines.forEach((line, idx) => {
      page.drawText(line, { x: margin, y: y - idx * (fontSizeText + 2), size: fontSizeText, font });
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  };

  const processStudentData = () => {
    if (excelData.length === 0 || !selectedConfigId) {
      return [];
    }

    // Group students by MATRICULE
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

      // Map ECs to Excel columns using columnMapping
      Object.entries(columnMapping).forEach(([ecId, excelCol]) => {
        if (row[excelCol] !== undefined) {
          // Find EC info from config
          const config = configs.find((c) => c.id === selectedConfigId);
          if (!config) return;
          let ecName = "";
          let ecCredits = 0;
          let ueCode = "";
          let ueName = "";
          for (const sem of config.semesters) {
            for (const ue of sem.ues) {
              const ec = ue.ecs.find((e) => e.id === ecId);
              if (ec) {
                ecName = ec.name;
                ecCredits = ec.credits;
                ueCode = ue.id;
                ueName = ue.name;
                break;
              }
            }
          }
          if (ecName) {
            studentsMap[matricule].COURSES?.push({
              CODE: ueCode,
              INTITULE: ecName,
              NOTE: Number(row[excelCol]) || 0,
              MOYENNE: Number(row[excelCol]) || 0,
              CREDIT: ecCredits,
            });
          }
        }
      });
    });

    return Object.values(studentsMap);
  };

  const handlePreviewReleve = async () => {
    const students = processStudentData();
    if (students.length === 0) {
      setError("Aucune donnée d'étudiant à prévisualiser");
      return;
    }

    setIsLoading(true);
    try {
      // Preview the first student
      const student = students[0];
      setPreviewStudent(student);
      
      const pdfBytes = await generatePdfForStudent(student);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      // Cleanup previous URL
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
      
      setPreviewPdfUrl(url);
      setActiveTab("preview");
    } catch (err) {
      setError("Erreur lors de la génération de la prévisualisation");
    } finally {
      setIsLoading(false);
    }
  };

  const processAndDownloadAll = async () => {
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
      const zip = new JSZip();

      for (const student of students) {
        const pdfBytes = await generatePdfForStudent(student);
        zip.file(`${student.MATRICULE}_releve.pdf`, pdfBytes);
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
      setError("Erreur lors de la génération des relevés");
    } finally {
      setIsLoading(false);
    }
  };

  // Get all available ECs from the selected config
  const getAvailableECs = () => {
    if (!selectedConfigId) return [];
    
    const config = configs.find((c) => c.id === selectedConfigId);
    if (!config) return [];
    
    const ecList: { id: string; fullName: string }[] = [];
    
    config.semesters.forEach((sem) => {
      sem.ues.forEach((ue) => {
        ue.ecs.forEach((ec) => {
          ecList.push({
            id: ec.id,
            fullName: `${sem.name} / ${ue.name} / ${ec.name}`
          });
        });
      });
    });
    
    return ecList;
  };

  const handleBackFromPreview = () => {
    setActiveTab("mapping");
  };

  return (
    <div className="container mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="mapping">Correspondance</TabsTrigger>
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
                      onClick={() => setActiveTab("mapping")} 
                      variant="outline"
                      disabled={!selectedConfigId}
                    >
                      Configurer la correspondance
                    </Button>
                    
                    <Button 
                      onClick={handlePreviewReleve} 
                      variant="secondary"
                      disabled={isLoading || !selectedConfigId || excelData.length === 0}
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