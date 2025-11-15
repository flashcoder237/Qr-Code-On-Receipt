// src/components/organisms/qr-document-processor/QRCodeDocumentProcessor.tsx
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  FileText,
  Upload,
  Settings,
  Eye,
  Download,
  Wand2,
  FileSpreadsheet,
  MousePointer,
  AlertCircle,
  CheckCircle,
  Info,
  Archive,
  Files
} from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { useNotifications } from "@/components/ui/notification-system";

// Components
import { ManualQRDataEntry } from "./components/ManualQRDataEntry";
import { ExcelQRProcessor } from "./components/ExcelQRProcessor";
import { QRPositioning } from "./components/QRPositioning";
import { QRSettings } from "./components/QRSettings";

// Types
interface QRSettings {
  size: "small" | "medium" | "large" | "custom";
  customSize?: number; // Size in pixels when size is "custom"
  position: { x: number; y: number };
  errorCorrection: "L" | "M" | "Q" | "H";
}

interface ManualQRData {
  content: string;
  fields: { [key: string]: string };
}

interface ProcessingMode {
  mode: "manual" | "excel" | null;
  step: "setup" | "positioning" | "preview" | "processing";
}

export const QRCodeDocumentProcessor: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<"setup" | "manual" | "excel">("setup");
  const [processingMode, setProcessingMode] = useState<ProcessingMode>({ mode: null, step: "setup" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR Code settings
  const [qrSettings, setQRSettings] = useLocalStorage<QRSettings>("qr-document-settings", {
    size: "medium",
    customSize: 80,
    position: { x: 50, y: 50 },
    errorCorrection: "M"
  });

  // NOUVEAU: Format d'export
  const [exportFormat, setExportFormat] = useLocalStorage<'zip' | 'individual' | 'single'>(
    'qr-document-export-format', 'zip'
  );

  // Manual mode data
  const [manualData, setManualData] = useState<ManualQRData>({
    content: "",
    fields: {}
  });

  // Excel mode data
  const [excelBatchData, setExcelBatchData] = useState<{
    excelData: any[];
    selectedColumns: string[];
    matchingColumn: string;
    columnFormats: { [column: string]: any };
    documentMappings: any[];
  } | null>(null);

  // Document data
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [previewDocumentIndex, setPreviewDocumentIndex] = useState<number>(0);

  // Notifications
  const { notifySuccess, notifyError, notifyInfo, notifyWarning } = useNotifications();

  // Handlers
  const handleModeSelection = useCallback((mode: "manual" | "excel") => {
    setProcessingMode({ mode, step: "setup" });
    setActiveTab(mode);
    setError(null);
    notifyInfo("Mode sélectionné", `Mode ${mode === "manual" ? "Saisie manuelle" : "Traitement Excel"} activé`);
  }, [notifyInfo]);

  const handleDocumentUpload = useCallback((file: File) => {
    setUploadedDocument(file);
    
    // Create preview for PDF/images
    if (file.type.includes('pdf') || file.type.includes('image')) {
      const url = URL.createObjectURL(file);
      setDocumentPreview(url);
    }
    
    notifySuccess("Document chargé", `${file.name} prêt pour le traitement`);
  }, [notifySuccess]);

  const handleManualDataChange = useCallback((data: ManualQRData) => {
    setManualData(data);
  }, []);

  const handleQRSettingsChange = useCallback((settings: Partial<QRSettings>) => {
    setQRSettings(prev => ({ ...prev, ...settings }));
  }, [setQRSettings]);

  const handleExcelBatchData = useCallback((data: {
    excelData: any[];
    selectedColumns: string[];
    matchingColumn: string;
    columnFormats: { [column: string]: any };
    documentMappings: any[];
  }) => {
    setExcelBatchData(data);

    // Use the first matched document for positioning preview
    const matchedMappings = data.documentMappings.filter(m => m.status === 'matched');
    if (matchedMappings.length > 0) {
      const firstMatched = matchedMappings[0];
      setUploadedDocument(firstMatched.file);
      setPreviewDocumentIndex(0);

      // Create preview
      if (firstMatched.file.type.includes('pdf') || firstMatched.file.type.includes('image')) {
        const url = URL.createObjectURL(firstMatched.file);
        setDocumentPreview(url);
      }
    }

    setActiveTab("positioning");
    notifyInfo("Données configurées", "Configuration prête pour le traitement en lot");
  }, [notifyInfo]);

  // Handle preview document change in batch mode
  const handlePreviewDocumentChange = useCallback((index: number) => {
    if (!excelBatchData) return;

    const matchedMappings = excelBatchData.documentMappings.filter(m => m.status === 'matched');
    if (index >= 0 && index < matchedMappings.length) {
      const mapping = matchedMappings[index];
      setPreviewDocumentIndex(index);

      // Clean up old preview URL
      if (documentPreview) {
        URL.revokeObjectURL(documentPreview);
      }

      setUploadedDocument(mapping.file);

      // Create new preview
      if (mapping.file.type.includes('pdf') || mapping.file.type.includes('image')) {
        const url = URL.createObjectURL(mapping.file);
        setDocumentPreview(url);
      }
    }
  }, [excelBatchData, documentPreview]);

  const handleProcessDocument = useCallback(async () => {
    if (processingMode.mode === "manual") {
      if (!uploadedDocument) {
        notifyError("Erreur", "Veuillez charger un document d'abord");
        return;
      }
      if (!manualData.content) {
        notifyError("Erreur", "Veuillez saisir les données du QR code");
        return;
      }
    } else if (processingMode.mode === "excel") {
      if (!excelBatchData) {
        notifyError("Erreur", "Veuillez configurer les données Excel d'abord");
        return;
      }
      if (excelBatchData.documentMappings.filter(m => m.status === 'matched').length === 0) {
        notifyError("Erreur", "Aucun document n'a été apparié avec les données Excel");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        processPDFWithQRCode,
        processImageWithQRCode,
        downloadProcessedDocument,
        validateDocumentFile,
        processBatchDocuments,
        downloadProcessedDocumentsAsZip,
        downloadProcessedDocumentsIndividually,
        downloadProcessedDocumentsAsSinglePDF
      } = await import("@/lib/qr-document-processor/pdf-qr-processor");

      if (processingMode.mode === "manual") {
        // Validate document file
        const validation = validateDocumentFile(uploadedDocument!);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Process single document with manual QR data
        let result;
        if (uploadedDocument!.type === "application/pdf") {
          result = await processPDFWithQRCode(uploadedDocument!, manualData.content, qrSettings);
        } else {
          result = await processImageWithQRCode(uploadedDocument!, manualData.content, qrSettings);
        }
        
        if (result.success) {
          downloadProcessedDocument(result);
          notifySuccess("Succès", `Document traité: ${result.filename}`);
          setProcessingMode({ mode: null, step: "setup" });
        } else {
          throw new Error(result.error || "Erreur lors du traitement");
        }
      } else if (processingMode.mode === "excel" && excelBatchData) {
        // Process batch documents with Excel data
        const documents = excelBatchData.documentMappings.map(m => m.file);
        const results = await processBatchDocuments(
          documents,
          excelBatchData.excelData,
          excelBatchData.selectedColumns,
          excelBatchData.matchingColumn,
          excelBatchData.documentMappings,
          qrSettings,
          excelBatchData.columnFormats
        );
        
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        if (successCount === 0) {
          throw new Error("Aucun document n'a pu être traité avec succès");
        }

        // NOUVEAU: Appliquer le format d'export choisi
        const timestamp = new Date().toISOString().split('T')[0];

        if (successCount === 1 && totalCount === 1) {
          // Un seul document : téléchargement direct
          const successResult = results.find(r => r.success);
          if (successResult) {
            downloadProcessedDocument(successResult);
          }
        } else {
          // Plusieurs documents : appliquer le format d'export
          switch (exportFormat) {
            case 'single':
              console.log('📄 [QR-DOC] Export: PDF unique fusionné');
              await downloadProcessedDocumentsAsSinglePDF(results, `documents_fusionnes_QR_${timestamp}.pdf`);
              notifySuccess("Traitement terminé", `${successCount} documents fusionnés en 1 PDF`);
              break;

            case 'individual':
              console.log('📥 [QR-DOC] Export: Fichiers individuels');
              await downloadProcessedDocumentsIndividually(results);
              notifySuccess("Traitement terminé", `${successCount} fichiers téléchargés individuellement`);
              break;

            case 'zip':
            default:
              console.log('🗜️ [QR-DOC] Export: Archive ZIP');
              await downloadProcessedDocumentsAsZip(results, `documents_QR_${timestamp}.zip`);
              notifySuccess("Traitement terminé", `ZIP créé avec ${successCount} documents`);
              break;
          }
        }
        
        if (successCount < totalCount) {
          const errorCount = totalCount - successCount;
          notifyWarning("Avertissement", `${errorCount} document(s) n'ont pas pu être traités`);
        }
        
        setProcessingMode({ mode: null, step: "setup" });
        setExcelBatchData(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      notifyError("Erreur de traitement", message);
    } finally {
      setIsLoading(false);
    }
  }, [uploadedDocument, processingMode.mode, manualData.content, excelBatchData, qrSettings, exportFormat, notifySuccess, notifyError, notifyWarning]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <QrCode className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Placement de QR Code sur Documents</h1>
          <p className="text-gray-600">Ajoutez des QR codes personnalisés à vos documents</p>
        </div>
      </div>

      {/* Mode Selection */}
      {processingMode.mode === null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Choisissez votre mode de traitement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Mode */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                    onClick={() => handleModeSelection("manual")}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Wand2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Saisie Manuelle</h3>
                  <p className="text-sm text-gray-600">
                    Traitez un document unique en saisissant manuellement les données du QR code
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Traitement ponctuel</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Contrôle total des données</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Positionnement précis</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Excel Mode */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300"
                    onClick={() => handleModeSelection("excel")}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Traitement Excel</h3>
                  <p className="text-sm text-gray-600">
                    Traitez plusieurs documents en lot avec des données depuis un fichier Excel
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Traitement en lot</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Correspondance automatique</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Données Excel structurées</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800">Comment ça marche ?</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Choisissez votre mode selon vos besoins : <strong>Manuel</strong> pour des documents uniques, 
                    <strong> Excel</strong> pour traiter plusieurs documents avec des données correspondantes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Interface */}
      {processingMode.mode && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {processingMode.mode === "manual" ? (
                <>
                  <Wand2 className="h-5 w-5 text-blue-600" />
                  Mode Saisie Manuelle
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Mode Traitement Excel
                </>
              )}
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setProcessingMode({ mode: null, step: "setup" })}
            >
              Changer de mode
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="setup">Configuration</TabsTrigger>
                <TabsTrigger value="positioning">Positionnement</TabsTrigger>
                <TabsTrigger value="preview">Aperçu & Traitement</TabsTrigger>
              </TabsList>

              {/* Setup Tab */}
              <TabsContent value="setup" className="space-y-6">
                {processingMode.mode === "manual" ? (
                  <ManualQRDataEntry 
                    data={manualData}
                    onChange={handleManualDataChange}
                    onDocumentUpload={handleDocumentUpload}
                    uploadedDocument={uploadedDocument}
                  />
                ) : (
                  <ExcelQRProcessor 
                    onDocumentUpload={handleDocumentUpload}
                    uploadedDocument={uploadedDocument}
                    onBatchProcess={handleExcelBatchData}
                  />
                )}
              </TabsContent>

              {/* Positioning Tab */}
              <TabsContent value="positioning" className="space-y-6">
                {processingMode.mode === "excel" && excelBatchData && (
                  <>
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Mode traitement par lot : Le positionnement du QR code sera appliqué à tous les documents.
                      </AlertDescription>
                    </Alert>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Document de prévisualisation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Select
                              value={String(previewDocumentIndex)}
                              onValueChange={(value) => handlePreviewDocumentChange(Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {excelBatchData.documentMappings
                                  .filter(m => m.status === 'matched')
                                  .map((mapping, index) => (
                                    <SelectItem key={index} value={String(index)}>
                                      {mapping.file.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Badge variant="secondary">
                            {previewDocumentIndex + 1} / {excelBatchData.documentMappings.filter(m => m.status === 'matched').length}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                <QRPositioning
                  document={uploadedDocument}
                  documentPreview={documentPreview}
                  settings={qrSettings}
                  onSettingsChange={handleQRSettingsChange}
                />
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">
                    {processingMode.mode === "excel" ? "Traitement en Lot" : "Aperçu et Traitement Final"}
                  </h3>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Preview info based on mode */}
                  {processingMode.mode === "excel" && excelBatchData && (
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="p-4 bg-blue-50 rounded-lg text-left">
                        <h4 className="font-medium text-blue-800 mb-2">Configuration du traitement :</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• <strong>{excelBatchData.excelData.length}</strong> lignes de données Excel</li>
                          <li>• <strong>{excelBatchData.selectedColumns.length}</strong> colonnes sélectionnées</li>
                          <li>• <strong>{excelBatchData.documentMappings.filter(m => m.status === 'matched').length}</strong> documents appariés</li>
                          <li>• Colonne de correspondance: <strong>{excelBatchData.matchingColumn}</strong></li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* NOUVEAU: Sélecteur de format d'export pour mode batch */}
                  {processingMode.mode === "excel" && excelBatchData && excelBatchData.documentMappings.filter(m => m.status === 'matched').length > 1 && (
                    <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label htmlFor="export-format-qr" className="text-sm font-semibold text-blue-900">
                        Format d'export
                      </Label>
                      <Select
                        value={exportFormat}
                        onValueChange={(value: any) => setExportFormat(value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger id="export-format-qr" className="w-full border-blue-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zip">
                            <div className="flex items-center gap-2">
                              <Archive className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span className="font-medium">Archive ZIP</span>
                                <span className="text-xs text-gray-500">Tous les PDFs dans un ZIP</span>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="individual">
                            <div className="flex items-center gap-2">
                              <Files className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span className="font-medium">Fichiers individuels</span>
                                <span className="text-xs text-gray-500">Téléchargements séparés (sans ZIP)</span>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="single">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span className="font-medium">PDF unique fusionné</span>
                                <span className="text-xs text-gray-500">Tous les documents en 1 seul PDF</span>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-blue-700">
                        ℹ️ Le QR code sera ajouté sur <strong>toutes les pages</strong> de chaque document PDF
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Button
                      onClick={handleProcessDocument}
                      disabled={
                        isLoading ||
                        (processingMode.mode === "manual" && !uploadedDocument) ||
                        (processingMode.mode === "excel" && !excelBatchData)
                      }
                      className="w-full max-w-md"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          {processingMode.mode === "excel" 
                            ? "Traiter tous les documents" 
                            : "Générer le document avec QR code"
                          }
                        </>
                      )}
                    </Button>
                    
                    {processingMode.mode === "manual" && uploadedDocument && (
                      <p className="text-sm text-gray-600">
                        Document prêt : {uploadedDocument.name}
                      </p>
                    )}
                    
                    {processingMode.mode === "excel" && excelBatchData && (
                      <p className="text-sm text-gray-600">
                        {excelBatchData.documentMappings.filter(m => m.status === 'matched').length} documents prêts pour le traitement
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Settings Panel */}
      <QRSettings 
        settings={qrSettings}
        onChange={handleQRSettingsChange}
      />
    </div>
  );
};