// src/components/organisms/centre-attestation-generator/CentreAttestationGenerator.tsx
// Générateur principal des attestations de centres

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FileSpreadsheet, Award, AlertCircle, Upload, Download, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from 'usehooks-ts';
import { Centre } from '@/lib/form-schemas/centre-settings';
import { CentreAttestationStudentRecord } from '@/lib/centre-attestation-generator/types';
import { defaultCentreAttestationTheme, CentreAttestationTheme } from '@/lib/form-schemas/centre-attestation-theme';
import { openCentreAttestationPreview } from '@/lib/centre-attestation-generator/preview';
import * as XLSX from 'xlsx';
import { validateCentreAttestationStudents } from '@/lib/centre-attestation-generator/validation';
import { CentreAttestationExportOptions } from './CentreAttestationExportOptions';

export const CentreAttestationGenerator: React.FC = () => {
  const { toast } = useToast();
  const [centres] = useState<Centre[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('training-centres');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [students, setStudents] = useState<CentreAttestationStudentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>('upload');

  // Options d'export
  const [exportFormat, setExportFormat] = useState<string>('zip');
  const [useCompression, setUseCompression] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  // Thème d'attestation
  const [attestationTheme] = useLocalStorage<CentreAttestationTheme>(
    'centre-attestation-theme',
    defaultCentreAttestationTheme
  );

  // Gérer l'upload de fichier Excel
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Fichier sélectionné:', file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        console.log('📊 Données Excel brutes:', jsonData);
        console.log('📊 Nombre de lignes:', jsonData.length);

        // Valider les données
        const validation = validateCentreAttestationStudents(jsonData as any[]);

        console.log('✅ Résultat validation:', {
          total: validation.total,
          valid: validation.valid,
          invalid: validation.invalid,
        });

        // Afficher les erreurs de validation
        if (validation.invalid > 0) {
          console.log('❌ Étudiants invalides:', validation.invalidStudents);

          // Afficher les premières erreurs pour aider au débogage
          const firstErrors = validation.invalidStudents.slice(0, 3).map(inv => ({
            student: `${inv.student.NOM} ${inv.student.PRENOM}`,
            errors: inv.errors
          }));
          console.log('❌ Premières erreurs:', firstErrors);

          toast({
            title: "Attention",
            description: `${validation.valid} étudiants valides, ${validation.invalid} invalides. Consultez la console pour les détails.`,
            variant: "error",
          });
        }

        setStudents(validation.validStudents);

        if (validation.valid > 0) {
          toast({
            title: "Fichier chargé",
            description: `${validation.valid} étudiants importés avec succès`,
          });
          setActiveTab('preview');
        } else {
          toast({
            title: "Aucun étudiant valide",
            description: "Aucun étudiant n'a passé la validation. Vérifiez le format de votre fichier Excel.",
            variant: "error",
          });
        }
      } catch (error) {
        console.error('❌ Erreur lors de la lecture du fichier:', error);
        toast({
          title: "Erreur",
          description: `Impossible de lire le fichier Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          variant: "error",
        });
      }
    };

    reader.onerror = () => {
      console.error('❌ Erreur FileReader');
      toast({
        title: "Erreur",
        description: "Erreur lors de la lecture du fichier",
        variant: "error",
      });
    };

    reader.readAsArrayBuffer(file);

    // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
    event.target.value = '';
  };

  const selectedCentre = centres.find(c => c.id === selectedCentreId);

  // Prévisualiser une attestation
  const handlePreviewAttestation = async () => {
    if (!selectedCentre || students.length === 0) return;

    const firstStudent = students[0];
    const success = await openCentreAttestationPreview(
      firstStudent,
      selectedCentre,
      {
        theme: attestationTheme,
        demoMode: true
      }
    );

    if (success) {
      toast({
        title: "Prévisualisation ouverte",
        description: "L'aperçu de l'attestation a été ouvert dans une nouvelle fenêtre",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir la prévisualisation",
        variant: "error",
      });
    }
  };

  // Générer les attestations
  const handleGenerateAttestations = async (validStudents: CentreAttestationStudentRecord[]) => {
    if (!selectedCentre) {
      toast({
        title: "Erreur",
        description: "Aucun centre sélectionné",
        variant: "error",
      });
      return;
    }

    if (!window.ipcRenderer) {
      toast({
        title: "Erreur",
        description: "Système de génération PDF non disponible. Veuillez utiliser l'application Electron.",
        variant: "error",
      });
      return;
    }

    setIsLoading(true);
    setProcessingProgress(0);

    try {
      console.log(`🚀 Début de la génération de ${validStudents.length} attestations`);
      const results = new Map<string, Uint8Array>();
      const failedGenerations: any[] = [];

      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];
        try {
          const pdfBytes = await window.ipcRenderer.invoke('generate-centre-attestation-pdf', {
            student,
            centre: selectedCentre,
            options: {
              theme: attestationTheme,
              demoMode: false,
            }
          });

          const fileName = `${student.MATRICULE}_Attestation_Centre.pdf`;
          results.set(fileName, pdfBytes);
        } catch (err) {
          console.error(`❌ Erreur lors de la génération pour ${student.NOM}`, err);
          failedGenerations.push({ student, error: err instanceof Error ? err.message : 'Erreur inconnue' });
        }
        setProcessingProgress(((i + 1) / validStudents.length) * 90);
      }

      // Télécharger les fichiers selon le format choisi
      if (results.size > 0) {
        if (exportFormat === 'zip') {
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
          link.download = `attestations_centre_${selectedCentre.nameAbreviation}_${timestamp}.zip`;
          link.click();
          URL.revokeObjectURL(url);
          console.log(`📦 ZIP créé avec ${results.size} attestation(s)`);

        } else if (exportFormat === 'pdf') {
          const { PDFDocument } = await import('pdf-lib');
          const mergedPdf = await PDFDocument.create();
          for (const pdfBytes of results.values()) {
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          }
          const mergedPdfBytes = await mergedPdf.save();
          const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const timestamp = new Date().toISOString().split('T')[0];
          link.download = `attestations_centre_${selectedCentre.nameAbreviation}_${timestamp}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          console.log(`📄 PDF unique créé avec ${results.size} attestation(s)`);

        } else {
          let downloadIndex = 0;
          for (const [fileName, pdfBytes] of results.entries()) {
            await new Promise(resolve => setTimeout(resolve, downloadIndex * 300));
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            downloadIndex++;
          }
          console.log(`📄 ${results.size} fichier(s) individuel(s) téléchargé(s)`);
        }
      }

      setProcessingProgress(100);
      toast({
        title: "Génération terminée",
        description: `${results.size}/${validStudents.length} attestation(s) générée(s).`,
      });

      if (failedGenerations.length > 0) {
        console.error("Échecs de génération:", failedGenerations);
        toast({
          title: `Échec pour ${failedGenerations.length} attestation(s)`,
          description: "Certaines attestations n'ont pas pu être générées. Consultez la console.",
          variant: "error",
        });
      }

    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast({
        title: "Erreur majeure",
        description: `Échec de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
    }
  };

  // Télécharger un fichier Excel modèle
  const handleDownloadTemplate = () => {
    const template = [
      {
        'NOM': 'DUPONT',
        'PRENOM': 'Jean',
        'MATRICULE': '2024001',
        'DATE DE NAISSANCE': '15/05/2000',
        'LIEU DE NAISSANCE': 'Yaoundé',
        'SPECIALITE': 'Électricité Bâtiment',
        'SPECIALITE_EN': 'Building Electricity',
        'SPECIALITE_ABR': 'EB',
        'SESSION_EXAMEN': 'septembre 2025',
        'LIEU_DELIVRANCE': 'Yaoundé',
        'MENTION': 'ASSEZ BIEN',
        'MENTION_EN': 'FAIRLY GOOD',
        'GRADE': 'CAP',
        'MOYENNE': '14.5',
        'NUMERO_ORDRE': '001',
        'TITRE_ATTESTATION_FR': 'ATTESTATION DE QUALIFICATION PROFESSIONNELLE',
        'TITRE_ATTESTATION_EN': 'VOCATIONAL TRAINING CERTIFICATE',
      },
      {
        'NOM': 'MARTIN',
        'PRENOM': 'Marie',
        'MATRICULE': '2024002',
        'DATE DE NAISSANCE': '20/08/1999',
        'LIEU DE NAISSANCE': 'Douala',
        'SPECIALITE': 'Coupe-Couture',
        'SPECIALITE_EN': 'Tailoring',
        'SPECIALITE_ABR': 'CC',
        'SESSION_EXAMEN': 'septembre 2025',
        'LIEU_DELIVRANCE': 'Douala',
        'MENTION': 'BIEN',
        'MENTION_EN': 'GOOD',
        'GRADE': 'CAP',
        'MOYENNE': '16.0',
        'NUMERO_ORDRE': '002',
        'TITRE_ATTESTATION_FR': 'ATTESTATION DE QUALIFICATION PROFESSIONNELLE',
        'TITRE_ATTESTATION_EN': 'VOCATIONAL TRAINING CERTIFICATE',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Étudiants');

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 15 }, // NOM
      { wch: 15 }, // PRENOM
      { wch: 12 }, // MATRICULE
      { wch: 18 }, // DATE DE NAISSANCE
      { wch: 20 }, // LIEU DE NAISSANCE
      { wch: 25 }, // SPECIALITE
      { wch: 25 }, // SPECIALITE_EN
      { wch: 15 }, // SPECIALITE_ABR
      { wch: 18 }, // SESSION_EXAMEN
      { wch: 18 }, // LIEU_DELIVRANCE
      { wch: 15 }, // MENTION
      { wch: 15 }, // MENTION_EN
      { wch: 10 }, // GRADE
      { wch: 10 }, // MOYENNE
      { wch: 15 }, // NUMERO_ORDRE
      { wch: 45 }, // TITRE_ATTESTATION_FR
      { wch: 45 }, // TITRE_ATTESTATION_EN
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'Modele_Attestations_Centre.xlsx');

    toast({
      title: "Modèle téléchargé",
      description: "Le fichier modèle a été téléchargé avec succès",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6" />
            <div>
              <CardTitle>Attestations de Centre</CardTitle>
              <CardDescription>
                Générer les attestations de qualification professionnelle
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Sélection du centre */}
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="centre-select">Centre de formation *</Label>
              {centres.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun centre configuré. Veuillez d'abord créer un centre dans la section "Gestion des Centres".
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedCentreId} onValueChange={setSelectedCentreId}>
                  <SelectTrigger id="centre-select">
                    <SelectValue placeholder="Sélectionnez un centre" />
                  </SelectTrigger>
                  <SelectContent>
                    {centres.map((centre) => (
                      <SelectItem key={centre.id} value={centre.id}>
                        {centre.nameFrench}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedCentre && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>{selectedCentre.nameFrench}</strong>
                  {selectedCentre.location && ` - ${selectedCentre.location}`}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tabs pour import et preview */}
          {selectedCentreId && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Importer</TabsTrigger>
                <TabsTrigger value="preview" disabled={students.length === 0}>
                  Aperçu ({students.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Importer un fichier Excel</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Téléchargez le modèle pour voir toutes les colonnes requises et optionnelles.
                    Les colonnes optionnelles permettent de personnaliser vos attestations.
                  </p>
                  <div className="flex gap-2 justify-center items-center">
                    <Label htmlFor="excel-upload" className="cursor-pointer">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        <Upload className="h-4 w-4" />
                        Choisir un fichier
                      </div>
                    </Label>
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger le modèle
                    </Button>
                  </div>
                  <input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Colonnes requises:</strong> NOM, PRENOM, MATRICULE, DATE DE NAISSANCE,
                    LIEU DE NAISSANCE, SPECIALITE, SESSION_EXAMEN, LIEU_DELIVRANCE, MENTION, GRADE, MOYENNE
                    <br/>
                    <strong>Colonnes optionnelles:</strong> SPECIALITE_EN, SPECIALITE_ABR, MENTION_EN, NUMERO_ORDRE, TITRE_ATTESTATION_FR, TITRE_ATTESTATION_EN
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                {students.length > 0 && (
                  <>
                    {/* Barre de progression */}
                    {isLoading && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="font-medium text-blue-900">
                            Génération en cours... {processingProgress}%
                          </span>
                        </div>
                        <Progress value={processingProgress} className="h-2" />
                      </div>
                    )}

                    {/* Aperçu des données */}
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Étudiants importés: {students.length}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviewAttestation}
                          disabled={students.length === 0 || !selectedCentre}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Prévisualiser
                        </Button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Nom</th>
                              <th className="text-left p-2">Prénom</th>
                              <th className="text-left p-2">Matricule</th>
                              <th className="text-left p-2">Spécialité</th>
                              <th className="text-left p-2">Mention</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.slice(0, 10).map((student, idx) => (
                              <tr key={idx} className="border-b">
                                <td className="p-2">{student.NOM}</td>
                                <td className="p-2">{student.PRENOM}</td>
                                <td className="p-2">{student.MATRICULE}</td>
                                <td className="p-2">{student.SPECIALITE}</td>
                                <td className="p-2">{student.MENTION}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {students.length > 10 && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            ... et {students.length - 10} autres
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Options d'export */}
                    <CentreAttestationExportOptions
                      students={students}
                      exportFormat={exportFormat}
                      useCompression={useCompression}
                      onExportFormatChange={setExportFormat}
                      onUseCompressionChange={setUseCompression}
                      onGenerateAttestations={handleGenerateAttestations}
                      isLoading={isLoading}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CentreAttestationGenerator;
