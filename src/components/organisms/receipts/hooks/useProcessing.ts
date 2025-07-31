import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

interface ProcessingState {
  isLoading: boolean;
  progress: number;
  processedCount: number;
  totalCount: number;
  error: string | null;
  successMessage: string | null;
}

interface UseProcessingOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export const useProcessing = (options: UseProcessingOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<ProcessingState>({
    isLoading: false,
    progress: 0,
    processedCount: 0,
    totalCount: 0,
    error: null,
    successMessage: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fonction utilitaire pour générer des noms de fichiers significatifs
  const generateFileName = (item: any, prefix: string, nameFormat: 'default' | 'detailed'): string => {
    try {
      const student = item.student || item;
      const matricule = student.MATRICULE || 'UNKNOWN';
      const nom = student.NOM || 'Unknown';
      const prenom = student.PRENOM || 'Unknown';
      const semestre = student.SEMESTRE || 'S1';
      const niveau = student.NIVEAU || 'L1';
      const filiere = student.FILIERE || 'UNKNOWN';
      
      // Nettoyer les noms pour éviter les caractères problématiques
      const cleanNom = nom.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();
      const cleanPrenom = prenom.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();
      const cleanFiliere = filiere.replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase();
      
      if (nameFormat === 'detailed') {
        return `${prefix}_${cleanNom}_${cleanPrenom}_${matricule}_${niveau}_${semestre}_${cleanFiliere}.pdf`;
      } else {
        return `${prefix}_${cleanNom}_${cleanPrenom}_${matricule}.pdf`;
      }
    } catch (error) {
      console.warn('Erreur lors de la génération du nom de fichier:', error);
      return `${prefix}_${Date.now()}.pdf`;
    }
  };

  // Fonction pour combiner tous les PDFs en un seul
  const combinePDFsIntoSingle = async (
    files: Map<string, Uint8Array>,
    prefix: string,
    nameFormat: 'default' | 'detailed'
  ): Promise<Blob> => {
    try {
      const combinedPdf = await PDFDocument.create();
      
      for (const [key, pdfBytes] of files) {
        try {
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const pages = await combinedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach((page) => combinedPdf.addPage(page));
        } catch (error) {
          console.error('Erreur lors de l\'ajout d\'un PDF:', error);
        }
      }
      
      const combinedBytes = await combinedPdf.save();
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${prefix}_combined_${timestamp}.pdf`;
      
      return new Blob([combinedBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Erreur lors de la combinaison des PDFs:', error);
      throw new Error('Impossible de combiner les PDFs');
    }
  };

  const resetState = () => {
    setState({
      isLoading: false,
      progress: 0,
      processedCount: 0,
      totalCount: 0,
      error: null,
      successMessage: null
    });
  };

  const processWithRetry = async <T,>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return processWithRetry(operation, retryCount + 1);
      }
      throw error;
    }
  };

  const processBatch = async <T,>(
    items: T[],
    processItem: (item: T) => Promise<Uint8Array>,
    batchSize = 5
  ): Promise<Map<string, Uint8Array>> => {
    const results = new Map<string, Uint8Array>();
    const failedItems: string[] = [];

    setState(prev => ({
      ...prev,
      isLoading: true,
      totalCount: items.length,
      processedCount: 0,
      progress: 0
    }));

    abortControllerRef.current = new AbortController();

    try {
      for (let i = 0; i < items.length; i += batchSize) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Operation cancelled');
        }

        const batch = items.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (item) => {
            try {
              const result = await processWithRetry(() => processItem(item));
              results.set(JSON.stringify(item), result);
              setState(prev => ({
                ...prev,
                processedCount: prev.processedCount + 1,
                progress: ((prev.processedCount + 1) / prev.totalCount) * 100
              }));
            } catch (error) {
              failedItems.push(JSON.stringify(item));
            }
          })
        );
      }

      if (failedItems.length > 0) {
        setState(prev => ({
          ...prev,
          error: `Échec pour ${failedItems.length} élément(s)`
        }));
      }

      return results;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const generateZipFile = async (
    files: Map<string, Uint8Array>,
    prefix = 'document',
    options: {
      useCompression?: boolean;
      generateSinglePDF?: boolean;
      nameFormat?: 'default' | 'detailed';
    } = {}
  ): Promise<Blob> => {
    const {
      useCompression = true,
      generateSinglePDF = false,
      nameFormat = 'default'
    } = options;

    if (generateSinglePDF) {
      // Pour un seul PDF, on combine tous les PDF en un seul
      return combinePDFsIntoSingle(files, prefix, nameFormat);
    }

    const zip = new JSZip();
    
    files.forEach((content, key) => {
      try {
        const item = JSON.parse(key);
        const fileName = generateFileName(item, prefix, nameFormat);
        zip.file(fileName, content);
      } catch {
        const fileName = `${prefix}_${Date.now()}.pdf`;
        zip.file(fileName, content);
      }
    });

    return zip.generateAsync({
      type: 'blob',
      compression: useCompression ? 'DEFLATE' : 'STORE',
      compressionOptions: useCompression ? { level: 6 } : { level: 0 }
    });
  };

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      resetState();
    }
  };

  // Fonction pour télécharger plusieurs fichiers séparément (sans ZIP)
  const downloadFiles = async (
    files: Map<string, Uint8Array>,
    prefix = 'document',
    nameFormat: 'default' | 'detailed' = 'default'
  ): Promise<void> => {
    files.forEach((content, key) => {
      try {
        const item = JSON.parse(key);
        const fileName = generateFileName(item, prefix, nameFormat);
        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erreur lors du téléchargement du fichier:', error);
      }
    });
  };

  // Fonction pour télécharger un PDF unique combiné
  const downloadSinglePDF = async (
    files: Map<string, Uint8Array>,
    prefix = 'document',
    nameFormat: 'default' | 'detailed' = 'default'
  ): Promise<void> => {
    try {
      const combinedBlob = await combinePDFsIntoSingle(files, prefix, nameFormat);
      const url = URL.createObjectURL(combinedBlob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${prefix}_combined_${timestamp}.pdf`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF combiné:', error);
      throw error;
    }
  };

  return {
    state,
    processBatch,
    generateZipFile,
    downloadFiles,
    downloadSinglePDF,
    cancel,
    resetState
  };
};
