// src/components/organisms/diploma-generator/DiplomaGenerator.tsx
// Générateur principal de diplômes avec gestion des thèmes

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Settings2,
  Palette,
  Eye,
  Download,
  AlertCircle,
  Loader2,
  BookOpen,
  XCircle
} from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { DiplomaStudentRecord, FAKE_DIPLOMA_DATA } from '@/lib/diploma-generator/types';
import { defaultDiplomaTheme, DiplomaThemeSettingsPayload, mergeDiplomaTheme } from '@/lib/form-schemas/diploma-theme-settings';
import { DiplomaThemeEditor } from './DiplomaThemeEditor';
import { DiplomaThemeManager } from './DiplomaThemeManager';
import { ImportReport, ImportStats } from './ImportReport';
import { analyzeImportedData } from './import-analyzer';
import { DiplomaExportOptions } from './DiplomaExportOptions';
import { DiplomaGenerationReport } from './DiplomaGenerationReport';
import { validateDiplomaList, DiplomaValidationResult } from './diploma-validator';
import { openDiplomaPreview } from '@/lib/diploma-generator/preview';
import { generateDiplomaHTML } from '@/lib/diploma-generator/html-generator';
import { FileUploader } from '../receipts/components/FileUploader';
import { useDocumentHistory } from '../document-history/DocumentHistoryManager';
import { StudentSelector } from '../student-selector/StudentSelector';

export const DiplomaGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "theme" | "manager">("generator");

  // Hook pour l'historique des documents
  const { addDocumentRecord } = useDocumentHistory();

  // Données Excel des étudiants
  const [excelData, setExcelData] = useState<DiplomaStudentRecord[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  // Sélection d'étudiants et annulation
  const [selectedStudentMatricules, setSelectedStudentMatricules] = useState<string[]>([]);
  const isCancelledRef = useRef<boolean>(false);

  // Options d'export
  const [exportFormat, setExportFormat] = useState<string>('zip');
  const [useCompression, setUseCompression] = useState(false);

  // Rapport de génération
  const [generationReport, setGenerationReport] = useState<{
    valid: DiplomaValidationResult[];
    invalid: DiplomaValidationResult[];
    generated: number;
    failed: Array<{ student: DiplomaValidationResult; error: string }>;
    date: Date;
  } | null>(null);

  // Thème actuel (fusionné avec les valeurs par défaut pour les nouvelles propriétés)
  const [storedTheme, setStoredTheme] = useLocalStorage<Partial<DiplomaThemeSettingsPayload>>(
    'diploma-theme',
    defaultDiplomaTheme
  );
  const diplomaTheme = mergeDiplomaTheme(storedTheme);
  const setDiplomaTheme = (theme: DiplomaThemeSettingsPayload) => setStoredTheme(theme);

  // Paramètres de l'école
  const [schoolSettings, setSchoolSettings] = useLocalStorage('settings', {
    nameFrench: "FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES",
    nameEnglish: "FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES",
    nameAbreviation: "FMSP",
    logo: "",
    universityLogo: "",
    facultyLogo: "",
    coatOfArms: "",
    ministryLogo: "",
    watermarkLogo: "",
  });

  const isDemoMode = localStorage.getItem('demo_mode') === 'true';

  // Gestionnaire d'upload Excel
  const handleFileLoaded = (data: any[], columns: string[]) => {
    try {
      console.log('📊 Données reçues du fichier:', {
        rows: data.length,
        columns: columns.length
      });

      // Mapper les données aux champs du diplôme
      const convertedData: DiplomaStudentRecord[] = data.map((row) => ({
        NOM: row.NOM || row['Nom'] || 'N/D',
        PRENOM: row.PRENOM || row['Prénom'] || 'N/D',
        MATRICULE: row.MATRICULE || row['Matricule'] || 'N/D',
        "DATE DE NAISSANCE": row["DATE DE NAISSANCE"] || row['Date de naissance'] || 'N/D',
        "LIEU DE NAISSANCE": row["LIEU DE NAISSANCE"] || row['Lieu de naissance'] || 'N/D',
        PARCOURS: row.PARCOURS || row['Parcours'] || 'N/D',
        SPECIALITE: row.SPECIALITE || row['Spécialité'] || 'N/D',
        OPTION: row.OPTION || row['Option'],
        "ANNEE OBTENTION": row["ANNEE OBTENTION"] || row['Année obtention'] || new Date().getFullYear().toString(),
        MOYENNE: row.MOYENNE || row['Moyenne'] || 0,
        GRADE: row.GRADE || row['Grade'] || 'N/D',
        MENTION: row.MENTION || row['Mention'] || 'N/D',
        "TITRE DIPLOME FR": row["TITRE DIPLOME FR"] || row['Titre diplôme FR'] || 'N/D',
        "TITRE DIPLOME EN": row["TITRE DIPLOME EN"] || row['Titre diplôme EN'] || 'N/D',
        MENTION_EN: row.MENTION_EN || row['Mention EN'],
        OPTION_EN: row.OPTION_EN || row['Option EN'],
        "DATE JURY ADMISSION": row["DATE JURY ADMISSION"] || row['Date jury admission'] || 'N/D',
        "DATE JURY DELIBERATION": row["DATE JURY DELIBERATION"] || row['Date jury délibération'] || 'N/D',
      }));

      setExcelData(convertedData);

      // Analyser les données et générer le rapport
      const stats = analyzeImportedData(convertedData);
      setImportStats(stats);

      setError(null);

      console.log('✅ Données converties:', convertedData.length);
      console.log('📊 Statistiques d\'import:', stats);
    } catch (err) {
      console.error("Erreur lors du traitement du fichier Excel", err);
      const errorMessage = "Erreur lors du traitement du fichier Excel";
      setError(errorMessage);
    }
  };

  // Prévisualisation avec fausses données
  const handlePreviewWithFakeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await openDiplomaPreview(
        FAKE_DIPLOMA_DATA,
        {
          ...schoolSettings,
          theme: diplomaTheme
        },
        {
          theme: diplomaTheme,
          demoMode: true
        }
      );

      if (!success) {
        const message = "Impossible d'ouvrir la fenêtre de prévisualisation. Vérifiez que les popups ne sont pas bloqués.";
        setError(message);
      }
    } catch (err) {
      console.error("Erreur lors de la prévisualisation", err);
      const message = "Une erreur est survenue lors de la prévisualisation du diplôme";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Prévisualisation avec un étudiant réel
  const handlePreviewStudent = async (student: DiplomaStudentRecord) => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await openDiplomaPreview(
        student,
        {
          ...schoolSettings,
          theme: diplomaTheme
        },
        {
          theme: diplomaTheme,
          demoMode: isDemoMode
        }
      );

      if (!success) {
        const message = "Impossible d'ouvrir la fenêtre de prévisualisation";
        setError(message);
      }
    } catch (err) {
      console.error("Erreur lors de la prévisualisation", err);
      const message = "Une erreur est survenue lors de la prévisualisation";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de la sélection d'étudiants
  const handleStudentSelectionChange = (matricules: string[]) => {
    setSelectedStudentMatricules(matricules);
  };

  // Génération pour les étudiants sélectionnés via StudentSelector
  const handleGenerateSelected = (students?: DiplomaStudentRecord[]) => {
    const studentsToGenerate = students && students.length > 0
      ? students
      : selectedStudentMatricules.length > 0
        ? excelData.filter(s => selectedStudentMatricules.includes(s.MATRICULE))
        : excelData;

    // Valider puis déléguer
    const validation = validateDiplomaList(studentsToGenerate);
    handleGenerateDiplomas(validation.valid.map(v => v.student));
  };

  // Annulation de la génération
  const cancelGeneration = () => {
    isCancelledRef.current = true;
  };

  // Génération des diplômes avec validation et filtrage automatique (système IPC)
  const handleGenerateDiplomas = async (validStudents: DiplomaStudentRecord[]) => {
    if (validStudents.length === 0) {
      setError("Aucun diplôme générable. Tous les étudiants ont des données manquantes ou une moyenne < 10.");
      return;
    }

    // Vérifier que IPC est disponible
    if (!window.ipcRenderer) {
      setError("Système de génération PDF non disponible. Veuillez utiliser l'application Electron.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setProcessingProgress(0);
      isCancelledRef.current = false;

      // Valider tous les étudiants d'origine pour le rapport
      const fullValidation = validateDiplomaList(excelData);
      const generationDate = new Date();

      const successfulGenerations: DiplomaStudentRecord[] = [];
      const failedGenerations: Array<{ student: DiplomaValidationResult; error: string }> = [];
      const results = new Map<string, Uint8Array>();

      // Générer les PDFs via IPC (comme les attestations)
      console.log(`📜 Début génération de ${validStudents.length} diplôme(s)`);

      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];

        try {
          // Générer le PDF via IPC
          const pdfBytes = await window.ipcRenderer.invoke('generate-diploma-pdf', {
            student,
            settings: {
              ...schoolSettings,
              theme: diplomaTheme
            },
            options: {
              theme: diplomaTheme,
              demoMode: isDemoMode
            }
          });

          const fileName = `${student.MATRICULE}_Diplome.pdf`;
          results.set(fileName, pdfBytes);
          successfulGenerations.push(student);

          // Ajouter à l'historique des documents
          addDocumentRecord({
            type: 'diplome',
            studentName: `${student.NOM} ${student.PRENOM}`,
            studentMatricule: student.MATRICULE,
            academicYear: student["ANNEE OBTENTION"] || 'N/D',
            parcours: student.PARCOURS,
            speciality: student.SPECIALITE,
            average: parseFloat(String(student.MOYENNE || '0')),
            grade: student.GRADE,
            mention: student.MENTION,
            fileName: fileName,
            status: 'generated',
          });

          console.log(`✅ Diplôme généré: ${student.NOM} ${student.PRENOM}`);
        } catch (err) {
          console.error(`❌ Erreur lors de la génération du diplôme pour ${student.NOM}`, err);
          const validation = fullValidation.valid.find(v => v.student.MATRICULE === student.MATRICULE);
          if (validation) {
            failedGenerations.push({
              student: validation,
              error: err instanceof Error ? err.message : 'Erreur inconnue'
            });
          }
        }

        setProcessingProgress(((i + 1) / validStudents.length) * 90);

        // Vérifier l'annulation après chaque PDF
        if (isCancelledRef.current) {
          console.log(`⚠️ Génération annulée après ${i + 1}/${validStudents.length} diplôme(s)`);
          break;
        }
      }

      // Télécharger les fichiers selon le format choisi
      if (results.size > 0) {
        if (exportFormat === 'zip') {
          // Créer un ZIP avec tous les PDFs
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();

          for (const [fileName, pdfBytes] of results.entries()) {
            zip.file(fileName, pdfBytes);
          }

          const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: useCompression ? 'DEFLATE' : 'STORE'
          });
          const url = URL.createObjectURL(zipBlob);

          const link = document.createElement("a");
          link.href = url;
          const timestamp = new Date().toISOString().split('T')[0];
          link.download = `diplomes_${timestamp}.zip`;
          link.click();

          URL.revokeObjectURL(url);
          console.log(`📦 ZIP créé avec ${results.size} diplôme(s)`);

        } else if (exportFormat === 'pdf') {
          // PDF unique: combiner tous les PDFs avec pdf-lib
          console.log('📄 Création d\'un PDF unique...');
          const { PDFDocument } = await import('pdf-lib');

          const mergedPdf = await PDFDocument.create();

          // Copier toutes les pages de chaque PDF dans le PDF fusionné
          for (const [fileName, pdfBytes] of results.entries()) {
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
              mergedPdf.addPage(page);
            });
          }

          // Sauvegarder le PDF fusionné
          const mergedPdfBytes = await mergedPdf.save();
          const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          const timestamp = new Date().toISOString().split('T')[0];
          link.download = `diplomes_${timestamp}.pdf`;
          link.click();

          URL.revokeObjectURL(url);
          console.log(`📄 PDF unique créé avec ${results.size} diplôme(s)`);

        } else {
          // Fichiers individuels: télécharger chaque PDF avec délai pour éviter le blocage
          console.log('📄 Téléchargement de fichiers individuels...');
          let downloadIndex = 0;

          for (const [fileName, pdfBytes] of results.entries()) {
            // Ajouter un délai entre chaque téléchargement pour éviter le blocage du navigateur
            await new Promise(resolve => setTimeout(resolve, downloadIndex * 300));

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Nettoyer après un délai pour s'assurer que le téléchargement a commencé
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            downloadIndex++;
          }
          console.log(`📄 ${results.size} fichier(s) individuel(s) téléchargé(s)`);
        }
      }

      setProcessingProgress(100);

      // Créer le rapport de génération
      setGenerationReport({
        valid: fullValidation.valid,
        invalid: fullValidation.invalid,
        generated: successfulGenerations.length,
        failed: failedGenerations,
        date: generationDate
      });

      console.log(`✅ Génération terminée: ${successfulGenerations.length}/${validStudents.length} diplômes générés`);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la génération des diplômes", err);
      const message = "Une erreur est survenue lors de la génération des diplômes";
      setError(message);
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
    }
  };

  // Reset du thème
  const handleResetTheme = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le thème au défaut ?')) {
      setDiplomaTheme(defaultDiplomaTheme);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Générateur
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Thème
            </TabsTrigger>
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Mes Thèmes
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {isDemoMode && (
              <Badge variant="destructive">MODE DÉMO</Badge>
            )}
          </div>
        </div>

        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Génération de Diplômes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Colonnes requises dans le fichier Excel :</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>NOM, PRENOM, MATRICULE</li>
                    <li>DATE DE NAISSANCE, LIEU DE NAISSANCE</li>
                    <li>TITRE DIPLOME FR, TITRE DIPLOME EN</li>
                    <li>MENTION (FR), MENTION_EN (optionnel)</li>
                    <li>OPTION (optionnel), OPTION_EN (optionnel)</li>
                    <li>DATE JURY ADMISSION, DATE JURY DELIBERATION</li>
                    <li>ANNEE OBTENTION, PARCOURS, SPECIALITE</li>
                    <li>MOYENNE, GRADE</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Upload de fichier */}
              <div className="space-y-2">
                <Label>Fichier Excel des diplômés</Label>
                <FileUploader
                  onFileLoaded={handleFileLoaded}
                  onError={(err) => setError(err)}
                  isLoading={isLoading}
                  documentType="diploma"
                  allowPartialImport={true}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Rapport d'importation */}
              {importStats && (
                <ImportReport stats={importStats} />
              )}

              {isLoading && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Génération en cours...</span>
                    <span>{Math.round(processingProgress)}%</span>
                  </div>
                  <Progress value={processingProgress} />
                  <div className="flex justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={cancelGeneration}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Annuler la génération
                    </Button>
                  </div>
                </div>
              )}

              {excelData.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Données chargées</h4>
                        <p className="text-sm text-blue-700">
                          {excelData.length} diplômé(s)
                        </p>
                        <div className="flex items-center gap-4 text-sm text-blue-700 mt-1">
                          <span>Police: {diplomaTheme.mainFont.split(',')[0]}</span>
                          <span>Couleur: {diplomaTheme.primaryColor}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
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

              {/* Prévisualisation */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handlePreviewWithFakeData}
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Prévisualiser avec fausses données
                </Button>
              </div>

              {/* Options d'export et génération */}
              {excelData.length > 0 && (
                <DiplomaExportOptions
                  students={excelData}
                  schoolSettings={schoolSettings}
                  diplomaTheme={diplomaTheme}
                  exportFormat={exportFormat}
                  useCompression={useCompression}
                  onExportFormatChange={setExportFormat}
                  onUseCompressionChange={setUseCompression}
                  onGenerateDiplomas={handleGenerateDiplomas}
                  isLoading={isLoading}
                  selectedStudents={
                    selectedStudentMatricules.length > 0
                      ? excelData.filter(s => selectedStudentMatricules.includes(s.MATRICULE))
                      : undefined
                  }
                />
              )}

              {/* Rapport de génération */}
              {generationReport && (
                <DiplomaGenerationReport
                  validDiplomas={generationReport.valid}
                  invalidDiplomas={generationReport.invalid}
                  generatedCount={generationReport.generated}
                  failedGenerations={generationReport.failed}
                  schoolName={schoolSettings.nameFrench || 'Établissement'}
                  generationDate={generationReport.date}
                />
              )}

              {/* Sélection des étudiants */}
              {excelData.length > 0 && (
                <StudentSelector
                  students={excelData}
                  selectedStudents={selectedStudentMatricules}
                  onSelectionChange={handleStudentSelectionChange}
                  onPreview={(student) => handlePreviewStudent(student as DiplomaStudentRecord)}
                  onGenerateSelected={(students) => handleGenerateSelected(students as DiplomaStudentRecord[] | undefined)}
                  documentType="diplome"
                  isLoading={isLoading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <DiplomaThemeEditor
            theme={diplomaTheme}
            onThemeChange={setDiplomaTheme}
            onPreview={handlePreviewWithFakeData}
            onReset={handleResetTheme}
          />
        </TabsContent>

        <TabsContent value="manager">
          <DiplomaThemeManager
            currentTheme={diplomaTheme}
            onThemeSelect={setDiplomaTheme}
            onPreview={handlePreviewWithFakeData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
