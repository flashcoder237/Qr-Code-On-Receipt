// src/components/organisms/qr-document-processor/components/ExcelQRProcessor.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useDropzone } from "react-dropzone";
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet,
  AlertCircle, 
  CheckCircle,
  Info,
  Eye,
  Settings,
  Link,
  File
} from "lucide-react";

interface ExcelQRProcessorProps {
  onDocumentUpload: (file: File) => void;
  uploadedDocument: File | null;
  onBatchProcess?: (data: {
    excelData: any[];
    selectedColumns: string[];
    matchingColumn: string;
    documentMappings: DocumentMapping[];
  }) => void;
}

interface ExcelData {
  columns: string[];
  rows: any[];
  selectedColumns: string[];
  matchingColumn: string;
}

interface DocumentMapping {
  file: File;
  matchingValue: string;
  status: 'pending' | 'matched' | 'unmatched';
}

export const ExcelQRProcessor: React.FC<ExcelQRProcessorProps> = ({
  onDocumentUpload,
  uploadedDocument,
  onBatchProcess
}) => {
  // State
  const [activeTab, setActiveTab] = useState<"excel" | "documents" | "mapping">("excel");
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentMappings, setDocumentMappings] = useState<DocumentMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Excel upload dropzone
  const excelDropzone = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    onDrop: handleExcelUpload
  });

  // Documents upload dropzone
  const documentsDropzone = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    },
    multiple: true,
    onDrop: handleDocumentsUpload
  });

  // Handle Excel upload
  async function handleExcelUpload(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error("Le fichier Excel doit contenir au moins une ligne d'en-têtes et une ligne de données");
      }

      const columns = jsonData[0] as string[];
      const rows = jsonData.slice(1).map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col, index) => {
          obj[col] = row[index] || '';
        });
        return obj;
      });

      setExcelData({
        columns,
        rows,
        selectedColumns: [],
        matchingColumn: ''
      });

      setActiveTab("documents");
    } catch (error) {
      console.error('Error processing Excel file:', error);
      alert('Erreur lors du traitement du fichier Excel: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsProcessing(false);
    }
  }

  // Handle documents upload
  function handleDocumentsUpload(acceptedFiles: File[]) {
    setDocumentFiles(prev => [...prev, ...acceptedFiles]);
    
    // Auto-create mappings
    const newMappings = acceptedFiles.map(file => ({
      file,
      matchingValue: extractMatchingValueFromFilename(file.name),
      status: 'pending' as const
    }));
    
    setDocumentMappings(prev => [...prev, ...newMappings]);
    setActiveTab("mapping");
  }

  // Extract matching value from filename (simple heuristic)
  function extractMatchingValueFromFilename(filename: string): string {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Try to extract number patterns
    const numberMatch = nameWithoutExt.match(/\d+/);
    if (numberMatch) {
      return numberMatch[0];
    }
    
    // Return cleaned filename
    return nameWithoutExt.replace(/[_-]/g, ' ').trim();
  }

  // Handle column selection for QR data
  const handleColumnSelection = useCallback((column: string, checked: boolean) => {
    if (!excelData) return;
    
    setExcelData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedColumns: checked 
          ? [...prev.selectedColumns, column]
          : prev.selectedColumns.filter(col => col !== column)
      };
    });
  }, [excelData]);

  // Handle matching column selection
  const handleMatchingColumnChange = useCallback((column: string) => {
    if (!excelData) return;
    
    setExcelData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        matchingColumn: column
      };
    });

    // Update document mappings to check for matches
    updateDocumentMatching(column);
  }, [excelData]);

  // Update document matching status
  const updateDocumentMatching = useCallback((matchingColumn: string) => {
    if (!excelData) return;

    setDocumentMappings(prev => prev.map(mapping => {
      const matchExists = excelData.rows.some(row => 
        String(row[matchingColumn]).toLowerCase().includes(mapping.matchingValue.toLowerCase()) ||
        mapping.matchingValue.toLowerCase().includes(String(row[matchingColumn]).toLowerCase())
      );
      
      return {
        ...mapping,
        status: matchExists ? 'matched' : 'unmatched'
      };
    }));
  }, [excelData]);

  // Handle manual matching value change
  const handleMatchingValueChange = useCallback((fileIndex: number, newValue: string) => {
    setDocumentMappings(prev => prev.map((mapping, index) => 
      index === fileIndex 
        ? { ...mapping, matchingValue: newValue }
        : mapping
    ));
  }, []);

  // Generate QR data for a specific row
  const generateQRDataForRow = useCallback((row: any): string => {
    if (!excelData) return '';
    
    const selectedData = excelData.selectedColumns.map(column => 
      `${column}: ${row[column]}`
    ).join('\n');
    
    return selectedData;
  }, [excelData]);

  // Get data preview
  const getDataPreview = useCallback(() => {
    if (!excelData || excelData.rows.length === 0) return null;
    
    const sampleRow = excelData.rows[0];
    return generateQRDataForRow(sampleRow);
  }, [excelData, generateQRDataForRow]);

  // Handle batch processing request
  const handleBatchProcessRequest = useCallback(() => {
    if (!excelData || !onBatchProcess) return;
    
    onBatchProcess({
      excelData: excelData.rows,
      selectedColumns: excelData.selectedColumns,
      matchingColumn: excelData.matchingColumn,
      documentMappings
    });
  }, [excelData, documentMappings, onBatchProcess]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Fichier Excel
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Correspondance
          </TabsTrigger>
        </TabsList>

        {/* Excel Upload Tab */}
        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Fichier de Données Excel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!excelData ? (
                <div
                  {...excelDropzone.getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${excelDropzone.isDragActive 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <input {...excelDropzone.getInputProps()} />
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    {excelDropzone.isDragActive ? 'Déposez le fichier Excel ici' : 'Chargez votre fichier Excel'}
                  </p>
                  <p className="text-sm text-gray-500">
                    XLSX, XLS, CSV - Contient les données pour générer les QR codes
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Fichier Excel chargé</p>
                        <p className="text-sm text-green-600">
                          {excelData.rows.length} ligne(s) de données, {excelData.columns.length} colonne(s)
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("documents")}
                    >
                      Charger Documents
                    </Button>
                  </div>

                  {/* Column Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Sélection des Colonnes pour QR Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Choisissez les colonnes dont les données seront incluses dans le QR code :
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {excelData.columns.map((column) => (
                            <div key={column} className="flex items-center space-x-2">
                              <Checkbox
                                id={`column-${column}`}
                                checked={excelData.selectedColumns.includes(column)}
                                onCheckedChange={(checked) => handleColumnSelection(column, checked as boolean)}
                              />
                              <Label htmlFor={`column-${column}`} className="text-sm">
                                {column}
                              </Label>
                            </div>
                          ))}
                        </div>
                        
                        {excelData.selectedColumns.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-2">Aperçu du contenu QR :</p>
                            <pre className="text-xs text-blue-700 whitespace-pre-wrap">
                              {getDataPreview()}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Matching Column */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Colonne de Correspondance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Label>Colonne pour identifier les documents</Label>
                        <Select value={excelData.matchingColumn} onValueChange={handleMatchingColumnChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez la colonne de correspondance" />
                          </SelectTrigger>
                          <SelectContent>
                            {excelData.columns.map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          Cette colonne sera utilisée pour faire correspondre les documents avec les données Excel
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Upload Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents à Traiter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documentFiles.length === 0 ? (
                  <div
                    {...documentsDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${documentsDropzone.isDragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <input {...documentsDropzone.getInputProps()} />
                    <File className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">
                      {documentsDropzone.isDragActive ? 'Déposez les documents ici' : 'Chargez vos documents'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, PNG, JPG - Sélectionnez plusieurs fichiers à traiter en lot
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {documentFiles.length} document(s) chargé(s)
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("mapping")}
                        disabled={!excelData || !excelData.matchingColumn}
                      >
                        Configurer Correspondance
                      </Button>
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {documentFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {!excelData && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Chargez d'abord un fichier Excel pour configurer la correspondance.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping Tab */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Correspondance Documents-Données
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentMappings.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Chargez des documents et configurez un fichier Excel pour voir la correspondance.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
                    <span>Document</span>
                    <span>Valeur de correspondance</span>
                    <span>Statut</span>
                  </div>
                  
                  {documentMappings.map((mapping, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm truncate">{mapping.file.name}</span>
                      </div>
                      <input
                        type="text"
                        value={mapping.matchingValue}
                        onChange={(e) => handleMatchingValueChange(index, e.target.value)}
                        className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Valeur de correspondance"
                      />
                      <Badge
                        variant={mapping.status === 'matched' ? 'default' : 'destructive'}
                        className={mapping.status === 'matched' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {mapping.status === 'matched' ? 'Correspondance trouvée' : 'Aucune correspondance'}
                      </Badge>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {documentMappings.filter(m => m.status === 'matched').length} / {documentMappings.length} documents appariés
                      </div>
                      {excelData && excelData.selectedColumns.length > 0 && (
                        <Button 
                          variant="default" 
                          size="sm"
                          disabled={documentMappings.filter(m => m.status === 'matched').length === 0}
                          onClick={handleBatchProcessRequest}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Traitement en Lot
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};