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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useDropzone } from "react-dropzone";
import * as XLSX from 'xlsx';
import { useNotifications } from "@/components/ui/notification-system";
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
  File,
  X
} from "lucide-react";
import { DocumentMappingTable } from "./DocumentMappingTable";

interface ExcelQRProcessorProps {
  onDocumentUpload: (file: File) => void;
  uploadedDocument: File | null;
  onBatchProcess?: (data: {
    excelData: any[];
    selectedColumns: string[];
    matchingColumn: string;
    columnFormats: { [column: string]: ColumnFormat };
    documentMappings: DocumentMapping[];
  }) => void;
}

export interface ColumnFormat {
  type: 'text' | 'date' | 'number';
  dateFormat?: string;
}

interface ExcelData {
  columns: string[];
  rows: any[];
  selectedColumns: string[];
  matchingColumn: string;
  columnFormats: { [column: string]: ColumnFormat };
}

interface DocumentMapping {
  file: File;
  matchingValue: string;
  status: 'pending' | 'matched' | 'unmatched';
  excelRow?: any;
}

export const ExcelQRProcessor: React.FC<ExcelQRProcessorProps> = ({
  onDocumentUpload,
  uploadedDocument,
  onBatchProcess
}) => {
  // Notifications
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotifications();

  // State
  const [activeTab, setActiveTab] = useState<"excel" | "documents" | "mapping">("excel");
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentMappings, setDocumentMappings] = useState<DocumentMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      const workbook = XLSX.read(data, { cellDates: false, cellNF: false, cellText: false });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Get raw data with header
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });

      if (jsonData.length < 2) {
        throw new Error("Le fichier Excel doit contenir au moins une ligne d'en-têtes et une ligne de données");
      }

      const columns = jsonData[0] as string[];
      const rows = jsonData.slice(1).map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col, index) => {
          // Store raw value (including Excel date numbers)
          obj[col] = row[index] !== undefined ? row[index] : '';
        });
        return obj;
      });

      

      // Initialize column formats with smart auto-detection
      const columnFormats: { [column: string]: ColumnFormat } = {};
      const dateKeywords = [
        'date', 'naissance', 'birth', 'né', 'née', 'jour', 'day',
        'année', 'year', 'mois', 'month', 'jury', 'soutenance',
        'début', 'fin', 'start', 'end', 'delivery', 'livraison'
      ];

      columns.forEach(col => {
        const sampleValue = rows[0]?.[col];
        const columnNameLower = col.toLowerCase().trim();

        // Check if column name contains date-related keywords
        const hasDateKeyword = dateKeywords.some(keyword =>
          columnNameLower.includes(keyword.toLowerCase())
        );

        if (typeof sampleValue === 'number') {
          // Only auto-detect as date if:
          // 1. Column name suggests it's a date
          // 2. AND value is in typical Excel date range (> 1000 for dates after ~1902)
          if (hasDateKeyword && sampleValue > 1000 && sampleValue < 100000) {
            columnFormats[col] = { type: 'date', dateFormat: 'DD/MM/YYYY' };
            
          } else if (sampleValue >= 0 && sampleValue <= 20) {
            // Small numbers are likely grades/scores, not dates
            columnFormats[col] = { type: 'number' };
            
          } else {
            // For large numbers without date keywords, still default to number
            columnFormats[col] = { type: 'number' };
            
          }
        } else {
          columnFormats[col] = { type: 'text' };
        }
      });

      setExcelData({
        columns,
        rows,
        selectedColumns: [],
        matchingColumn: '',
        columnFormats
      });

      setActiveTab("documents");
    } catch (error) {
      console.error('Error processing Excel file:', error);
      notifyError(
        'Erreur de traitement Excel',
        error instanceof Error ? error.message : 'Erreur inconnue lors du traitement du fichier'
      );
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

  // Format value based on column type
  const formatValue = useCallback((value: any, column: string): string => {
    if (value === null || value === undefined || value === '') return '';

    const format = excelData?.columnFormats?.[column];
    if (!format) return String(value);

    

    switch (format.type) {
      case 'date':
        // Excel stores dates as numbers (days since 1900-01-01)
        if (typeof value === 'number') {
          // Excel date serial number conversion
          const excelEpoch = new Date(1899, 11, 30); // Excel epoch is Dec 30, 1899
          const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
          const dateFormat = format.dateFormat || 'DD/MM/YYYY';

          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();

          const formatted = dateFormat
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', String(year));

          
          return formatted;
        } else if (value instanceof Date) {
          const dateFormat = format.dateFormat || 'DD/MM/YYYY';
          const day = String(value.getDate()).padStart(2, '0');
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const year = value.getFullYear();

          return dateFormat
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', String(year));
        }
        
        return String(value);

      case 'number':
        if (typeof value === 'number') {
          // Format intelligently: show decimals only if needed
          if (Number.isInteger(value)) {
            return String(value); // No decimals for integers
          } else {
            // Show up to 2 decimals, remove trailing zeros
            return Number(value.toFixed(2)).toString();
          }
        }
        return String(value);

      case 'text':
      default:
        return String(value);
    }
  }, [excelData]);

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

  // Handle column format change
  const handleColumnFormatChange = useCallback((column: string, formatType: 'text' | 'date' | 'number', dateFormat?: string) => {
    if (!excelData) return;

    setExcelData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        columnFormats: {
          ...prev.columnFormats,
          [column]: { type: formatType, dateFormat }
        }
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
    if (!excelData || !matchingColumn) {
      
      return;
    }

    
    
    
    

    setDocumentMappings(prev => {
      

      return prev.map(mapping => {
        // Normalize both values for comparison
        const normalizedMappingValue = String(mapping.matchingValue).toLowerCase().trim();

        
        

        // Check if any row has a matching value
        const matchedRow = excelData.rows.find(row => {
          const rowValue = String(row[matchingColumn] || '').toLowerCase().trim();

          // Exact match
          if (rowValue === normalizedMappingValue) {
            
            return true;
          }

          // Partial match (contains)
          if (rowValue && normalizedMappingValue && (
            rowValue.includes(normalizedMappingValue) ||
            normalizedMappingValue.includes(rowValue)
          )) {
            
            return true;
          }

          return false;
        });

        

        return {
          ...mapping,
          excelRow: matchedRow,
          status: matchedRow ? 'matched' as const : 'unmatched' as const
        };
      });
    });
  }, [excelData]);

  // Handle manual matching value change
  const handleMatchingValueChange = useCallback((fileIndex: number, newValue: string) => {
    setDocumentMappings(prev => prev.map((mapping, index) =>
      index === fileIndex
        ? { ...mapping, matchingValue: newValue }
        : mapping
    ));

    // Re-check matching after manual change
    if (excelData?.matchingColumn) {
      setTimeout(() => updateDocumentMatching(excelData.matchingColumn), 100);
    }
  }, [excelData, updateDocumentMatching]);

  // Auto-update matching when matching column changes
  useEffect(() => {
    if (excelData?.matchingColumn) {
      
      updateDocumentMatching(excelData.matchingColumn);
    }
  }, [excelData?.matchingColumn, updateDocumentMatching]);

  // Also update matching when document mappings are added
  useEffect(() => {
    if (excelData?.matchingColumn && documentMappings.length > 0) {
      
      updateDocumentMatching(excelData.matchingColumn);
    }
  }, [documentMappings.length, excelData?.matchingColumn, updateDocumentMatching]);

  // Generate QR data for a specific row
  const generateQRDataForRow = useCallback((row: any): string => {
    if (!excelData) return '';

    const selectedData = excelData.selectedColumns.map(column => {
      const formattedValue = formatValue(row[column], column);
      return `${column}: ${formattedValue}`;
    }).join('\n');

    return selectedData;
  }, [excelData, formatValue]);

  // Get data preview
  const getDataPreview = useCallback(() => {
    if (!excelData || excelData.rows.length === 0) return null;

    const sampleRow = excelData.rows[0];
    return generateQRDataForRow(sampleRow);
  }, [excelData, generateQRDataForRow]);

  // Check for missing important columns based on document type
  const getMissingColumns = useCallback(() => {
    if (!excelData || !documentMappings.length) return [];

    // Detect document type from first document
    const firstDoc = documentMappings[0]?.file;
    if (!firstDoc) return [];

    const fileName = firstDoc.name.toLowerCase();
    const missingColumns: string[] = [];

    // Define recommended columns for different document types
    const recommendedColumns: { [key: string]: string[] } = {
      attestation: ['NOM', 'PRENOM', 'DATE DE NAISSANCE', 'LIEU DE NAISSANCE'],
      diplome: ['NOM', 'PRENOM', 'DATE DE NAISSANCE', 'DIPLOME', 'MENTION'],
      releve: ['NOM', 'PRENOM', 'MATRICULE', 'MOYENNE'],
      certificat: ['NOM', 'PRENOM', 'DATE'],
    };

    // Detect document type
    let docType: string | null = null;
    if (fileName.includes('attestation')) docType = 'attestation';
    else if (fileName.includes('diplome') || fileName.includes('diplôme')) docType = 'diplome';
    else if (fileName.includes('releve') || fileName.includes('relevé')) docType = 'releve';
    else if (fileName.includes('certificat')) docType = 'certificat';

    if (docType && recommendedColumns[docType]) {
      const required = recommendedColumns[docType];
      const availableColumns = excelData.columns.map(c => c.toUpperCase());

      required.forEach(col => {
        const found = availableColumns.some(avail =>
          avail.includes(col) || col.includes(avail)
        );
        if (!found) {
          missingColumns.push(col);
        }
      });
    }

    return missingColumns;
  }, [excelData, documentMappings]);

  // Handle batch processing request
  const handleBatchProcessRequest = useCallback(() => {
    if (!excelData || !onBatchProcess) return;

    onBatchProcess({
      excelData: excelData.rows,
      selectedColumns: excelData.selectedColumns,
      matchingColumn: excelData.matchingColumn,
      columnFormats: excelData.columnFormats,
      documentMappings
    });
  }, [excelData, documentMappings, onBatchProcess]);

  // Handle document preview
  const handleViewDocument = useCallback((file: File) => {
    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  // Handle close preview
  const handleClosePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  // Handle remove mapping
  const handleRemoveMapping = useCallback((index: number) => {
    setDocumentMappings(prev => prev.filter((_, i) => i !== index));
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
                        <div className="space-y-3">
                          {excelData.columns.map((column) => {
                            const sampleValue = excelData.rows[0]?.[column];
                            const formattedValue = formatValue(sampleValue, column);

                            return (
                              <div key={column} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`column-${column}`}
                                    checked={excelData.selectedColumns.includes(column)}
                                    onCheckedChange={(checked) => handleColumnSelection(column, checked as boolean)}
                                  />
                                  <Label htmlFor={`column-${column}`} className="text-sm font-medium min-w-[150px]">
                                    {column}
                                  </Label>
                                </div>

                                <div className="flex items-center gap-2 flex-1">
                                  <Label className="text-xs text-gray-600">Type:</Label>
                                  <Select
                                    value={excelData.columnFormats[column]?.type || 'text'}
                                    onValueChange={(value) => handleColumnFormatChange(column, value as any)}
                                  >
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Texte</SelectItem>
                                      <SelectItem value="number">Nombre</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  {excelData.columnFormats[column]?.type === 'date' && (
                                    <>
                                      <Label className="text-xs text-gray-600">Format:</Label>
                                      <Select
                                        value={excelData.columnFormats[column]?.dateFormat || 'DD/MM/YYYY'}
                                        onValueChange={(value) => handleColumnFormatChange(column, 'date', value)}
                                      >
                                        <SelectTrigger className="w-[140px] h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                                          <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA</SelectItem>
                                          <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                                          <SelectItem value="DD-MM-YYYY">JJ-MM-AAAA</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </>
                                  )}

                                  <div className="ml-auto text-xs text-gray-500">
                                    Brut: <code className="bg-white px-1 py-0.5 rounded">{String(sampleValue)}</code>
                                    {' → '}
                                    <code className="bg-blue-50 px-1 py-0.5 rounded">{formattedValue}</code>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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
          {documentMappings.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Correspondance Documents-Données
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Chargez des documents et configurez un fichier Excel pour voir la correspondance.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(() => {
                const missingCols = getMissingColumns();
                return missingCols.length > 0 && (
                  <Alert variant="warning" className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      <p className="font-medium text-orange-900">Colonnes recommandées manquantes :</p>
                      <p className="text-sm text-orange-700 mt-1">
                        {missingCols.join(', ')}
                      </p>
                      <p className="text-xs text-orange-600 mt-2">
                        Ces colonnes sont généralement nécessaires pour ce type de document. Assurez-vous que votre fichier Excel les contient.
                      </p>
                    </AlertDescription>
                  </Alert>
                );
              })()}

              <DocumentMappingTable
                mappings={documentMappings.map(m => ({
                  ...m,
                  excelRow: m.excelRow
                }))}
                onRemoveMapping={handleRemoveMapping}
                onViewDocument={handleViewDocument}
                onEditMatchingValue={handleMatchingValueChange}
              />

              <div className="flex items-center justify-between">
                {excelData && excelData.selectedColumns.length > 0 && (
                  <Button
                    variant="default"
                    size="lg"
                    disabled={documentMappings.filter(m => m.status === 'matched').length === 0}
                    onClick={handleBatchProcessRequest}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Lancer le Traitement en Lot ({documentMappings.filter(m => m.status === 'matched').length} documents)
                  </Button>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Prévisualisation : {previewFile?.name}
            </DialogTitle>
            <DialogDescription>
              Aperçu du document avant traitement
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewUrl && previewFile && (
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                {previewFile.type === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh]"
                    title="PDF Preview"
                  />
                ) : previewFile.type.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt={previewFile.name}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4" />
                    <p>Prévisualisation non disponible pour ce type de fichier</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};