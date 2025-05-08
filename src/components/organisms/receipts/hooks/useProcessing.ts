import { useState, useRef, useCallback } from 'react';
import JSZip from 'jszip';

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
    prefix = 'document'
  ): Promise<Blob> => {
    const zip = new JSZip();
    
    files.forEach((content, key) => {
      try {
        const item = JSON.parse(key);
        const fileName = `${prefix}_${item.MATRICULE || item.id || Date.now()}.pdf`;
        zip.file(fileName, content);
      } catch {
        const fileName = `${prefix}_${Date.now()}.pdf`;
        zip.file(fileName, content);
      }
    });

    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
  };

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      resetState();
    }
  };

  return {
    state,
    processBatch,
    generateZipFile,
    cancel,
    resetState
  };
};
