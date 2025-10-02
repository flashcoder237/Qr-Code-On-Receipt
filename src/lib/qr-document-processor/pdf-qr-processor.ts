// src/lib/qr-document-processor/pdf-qr-processor.ts
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

export interface QRProcessingSettings {
  size: "small" | "medium" | "large" | "custom";
  customSize?: number; // Size in pixels when size is "custom"
  position: { x: number; y: number };
  errorCorrection: "L" | "M" | "Q" | "H";
}

export interface ProcessingResult {
  success: boolean;
  filename: string;
  data?: Uint8Array;
  error?: string;
}

// QR size mapping in pixels
const QR_SIZES = {
  small: 60,
  medium: 80,
  large: 100
};

// Function to get actual QR code size in pixels
function getActualQRSize(settings: QRProcessingSettings): number {
  if (settings.size === "custom") {
    return settings.customSize || 80;
  }
  return QR_SIZES[settings.size];
}

/**
 * Generate QR code image as canvas and return as Uint8Array
 */
export async function generateQRCodeImage(
  content: string, 
  settings: QRProcessingSettings
): Promise<Uint8Array> {
  const qrSize = getActualQRSize(settings);
  
  // Create a canvas for QR code
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, content, {
    width: qrSize,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: settings.errorCorrection
  });
  
  // Convert canvas to blob then to array buffer
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        resolve(new Uint8Array(arrayBuffer));
      } else {
        reject(new Error('Impossible de générer le QR code'));
      }
    }, 'image/png');
  });
}

/**
 * Process a single PDF document with QR code embedding
 */
export async function processPDFWithQRCode(
  documentFile: File,
  qrContent: string,
  settings: QRProcessingSettings
): Promise<ProcessingResult> {
  try {
    // Generate QR code image
    const qrImageBuffer = await generateQRCodeImage(qrContent, settings);
    
    // Load the PDF document
    const arrayBuffer = await documentFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Embed QR code image
    const qrImage = await pdfDoc.embedPng(qrImageBuffer);
    
    // Get first page for QR placement
    const [firstPage] = pdfDoc.getPages();
    const pageWidth = firstPage.getWidth();
    const pageHeight = firstPage.getHeight();
    
    // Calculate position based on percentage
    const qrSize = getActualQRSize(settings);
    const xPosition = (settings.position.x / 100) * pageWidth - (qrSize / 2);
    const yPosition = pageHeight - ((settings.position.y / 100) * pageHeight) - (qrSize / 2);
    
    // Draw QR code on the page
    firstPage.drawImage(qrImage, {
      x: xPosition,
      y: yPosition,
      width: qrSize,
      height: qrSize,
    });
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Generate output filename
    const originalName = documentFile.name.replace(/\.[^/.]+$/, "");
    const outputFilename = `${originalName}_avec_QR.pdf`;
    
    return {
      success: true,
      filename: outputFilename,
      data: modifiedPdfBytes
    };
    
  } catch (error) {
    console.error('Error processing PDF with QR code:', error);
    return {
      success: false,
      filename: documentFile.name,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Format value based on column type
 */
function formatValue(value: any, column: string, columnFormats?: { [column: string]: { type: 'text' | 'date' | 'number'; dateFormat?: string } }): string {
  if (value === null || value === undefined || value === '') return '';

  const format = columnFormats?.[column];
  if (!format) return String(value);

  switch (format.type) {
    case 'date':
      if (typeof value === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        const dateFormat = format.dateFormat || 'DD/MM/YYYY';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return dateFormat
          .replace('DD', day)
          .replace('MM', month)
          .replace('YYYY', String(year));
      }
      return String(value);

    case 'number':
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          return String(value);
        } else {
          return Number(value.toFixed(2)).toString();
        }
      }
      return String(value);

    case 'text':
    default:
      return String(value);
  }
}

/**
 * Process multiple documents in batch mode with Excel data
 */
export async function processBatchDocuments(
  documents: File[],
  excelData: any[],
  selectedColumns: string[],
  matchingColumn: string,
  documentMappings: { file: File; matchingValue: string; status: string }[],
  settings: QRProcessingSettings,
  columnFormats?: { [column: string]: { type: 'text' | 'date' | 'number'; dateFormat?: string } }
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  for (const mapping of documentMappings) {
    if (mapping.status !== 'matched') {
      results.push({
        success: false,
        filename: mapping.file.name,
        error: 'Aucune correspondance trouvée dans les données Excel'
      });
      continue;
    }

    // Find matching row in Excel data
    const matchingRow = excelData.find(row =>
      String(row[matchingColumn]).toLowerCase().includes(mapping.matchingValue.toLowerCase()) ||
      mapping.matchingValue.toLowerCase().includes(String(row[matchingColumn]).toLowerCase())
    );

    if (!matchingRow) {
      results.push({
        success: false,
        filename: mapping.file.name,
        error: 'Données correspondantes non trouvées'
      });
      continue;
    }

    // Generate QR content from selected columns with formatting
    const qrContent = selectedColumns
      .map(column => {
        const rawValue = matchingRow[column];
        const formattedValue = formatValue(rawValue, column, columnFormats);
        return `${column}: ${formattedValue}`;
      })
      .filter(line => !line.endsWith(': '))
      .join('\n');
    
    if (!qrContent.trim()) {
      results.push({
        success: false,
        filename: mapping.file.name,
        error: 'Aucun contenu QR généré'
      });
      continue;
    }
    
    // Process the document
    const result = await processPDFWithQRCode(mapping.file, qrContent, settings);
    results.push(result);
  }
  
  return results;
}

/**
 * Download processed document
 */
export function downloadProcessedDocument(result: ProcessingResult): void {
  if (!result.success || !result.data) {
    throw new Error('Document non traité ou données manquantes');
  }
  
  const blob = new Blob([result.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Download multiple documents as ZIP
 */
export async function downloadProcessedDocumentsAsZip(
  results: ProcessingResult[], 
  zipFilename: string = 'documents_avec_QR.zip'
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  const successfulResults = results.filter(r => r.success && r.data);
  
  if (successfulResults.length === 0) {
    throw new Error('Aucun document traité avec succès');
  }
  
  // Add each successful document to the ZIP
  successfulResults.forEach(result => {
    if (result.data) {
      zip.file(result.filename, result.data);
    }
  });
  
  // Generate and download ZIP
  const zipContent = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipContent);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Validate document file type
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/bmp'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non supporté: ${file.type}. Formats acceptés: PDF, PNG, JPG, JPEG, GIF, BMP`
    };
  }
  
  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB. Taille maximale: 50MB`
    };
  }
  
  return { valid: true };
}

/**
 * Process image files (convert to PDF first, then add QR)
 */
export async function processImageWithQRCode(
  imageFile: File,
  qrContent: string,
  settings: QRProcessingSettings
): Promise<ProcessingResult> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed the image
    let embeddedImage;
    if (imageFile.type.includes('png')) {
      const imageBytes = await imageFile.arrayBuffer();
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      const imageBytes = await imageFile.arrayBuffer();
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    }
    
    // Create a page with image dimensions
    const { width: imageWidth, height: imageHeight } = embeddedImage.scale(1);
    const page = pdfDoc.addPage([imageWidth, imageHeight]);
    
    // Draw the image to fill the page
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight,
    });
    
    // Generate and embed QR code
    const qrImageBuffer = await generateQRCodeImage(qrContent, settings);
    const qrImage = await pdfDoc.embedPng(qrImageBuffer);
    
    // Calculate QR position
    const qrSize = getActualQRSize(settings);
    const xPosition = (settings.position.x / 100) * imageWidth - (qrSize / 2);
    const yPosition = imageHeight - ((settings.position.y / 100) * imageHeight) - (qrSize / 2);
    
    // Draw QR code on the page
    page.drawImage(qrImage, {
      x: xPosition,
      y: yPosition,
      width: qrSize,
      height: qrSize,
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Generate output filename
    const originalName = imageFile.name.replace(/\.[^/.]+$/, "");
    const outputFilename = `${originalName}_avec_QR.pdf`;
    
    return {
      success: true,
      filename: outputFilename,
      data: pdfBytes
    };
    
  } catch (error) {
    console.error('Error processing image with QR code:', error);
    return {
      success: false,
      filename: imageFile.name,
      error: error instanceof Error ? error.message : 'Erreur lors du traitement de l\'image'
    };
  }
}