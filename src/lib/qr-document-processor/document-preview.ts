// src/lib/qr-document-processor/document-preview.ts
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
}

export interface DocumentPreview {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Generate a preview of the first page of a PDF document using PDF.js
 */
export async function generatePDFPreview(file: File): Promise<DocumentPreview> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF using PDF.js for rendering
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // Get first page
    
    // Get page dimensions
    const originalViewport = page.getViewport({ scale: 1 });
    const { width, height } = originalViewport;
    const aspectRatio = width / height;
    
    // Calculate optimal scale and canvas size
    const maxWidth = 600;
    const maxHeight = 800;
    let scale = 1;
    
    if (aspectRatio > 1) {
      // Landscape: limit by width
      scale = Math.min(maxWidth / width, maxHeight / height, 2); // Max scale of 2x
    } else {
      // Portrait: limit by height  
      scale = Math.min(maxHeight / height, maxWidth / width, 2);
    }
    
    const viewport = page.getViewport({ scale });
    
    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    // Get data URL from canvas
    const dataUrl = canvas.toDataURL('image/png');
    
    return {
      dataUrl,
      width,
      height,
      aspectRatio
    };
    
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    throw new Error('Impossible de générer l\'aperçu du PDF: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
  }
}

/**
 * Generate a preview of an image file
 */
export async function generateImagePreview(file: File): Promise<DocumentPreview> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        const { width, height } = img;
        const aspectRatio = width / height;
        
        // Create canvas for image preview
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Set canvas size maintaining aspect ratio
        const maxWidth = 600;
        const maxHeight = 800;
        let canvasWidth, canvasHeight;
        
        if (aspectRatio > 1) {
          canvasWidth = Math.min(maxWidth, width);
          canvasHeight = canvasWidth / aspectRatio;
        } else {
          canvasHeight = Math.min(maxHeight, height);
          canvasWidth = canvasHeight * aspectRatio;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Draw the image
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        URL.revokeObjectURL(url);
        
        resolve({
          dataUrl,
          width,
          height,
          aspectRatio
        });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de charger l\'image'));
    };
    
    img.src = url;
  });
}

/**
 * Generate document preview based on file type
 */
export async function generateDocumentPreview(file: File): Promise<DocumentPreview> {
  if (file.type === 'application/pdf') {
    return generatePDFPreview(file);
  } else if (file.type.startsWith('image/')) {
    return generateImagePreview(file);
  } else {
    throw new Error(`Type de fichier non supporté: ${file.type}`);
  }
}