// src/electron/preload.ts - Mise à jour pour inclure les gestionnaires d'attestation
import { ipcRenderer, contextBridge } from 'electron';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: any[]) => void) {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => 
      listener(...args);
    ipcRenderer.on(channel, subscription);
    
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  
  once(channel: string, listener: (...args: any[]) => void) {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => 
      listener(...args);
    ipcRenderer.once(channel, subscription);
  },
  
  off(channel: string, listener: (...args: any[]) => void) {
    if (listener) {
      // This is a workaround since we can't directly pass the original listener
      // due to the event wrapper we create in the 'on' method
      ipcRenderer.removeAllListeners(channel);
    }
  },
  
  send(channel: string, ...args: any[]) {
    
    ipcRenderer.send(channel, ...args);
  },
  
  invoke(channel: string, ...args: any[]) {
    
    
    return ipcRenderer.invoke(channel, ...args)
      .then(result => {
        console.log(`IPC Invoke Success: ${channel}`, 
          result instanceof ArrayBuffer ? `[ArrayBuffer: ${result.byteLength} bytes]` : '(with result)');
        return result;
      })
      .catch(error => {
        console.error(`IPC Invoke Error: ${channel}`, error);
        throw error; // Re-throw to be caught by the caller
      });
  }
});

// Extension pour le rendu des relevés de notes
contextBridge.exposeInMainWorld('transcriptRenderer', {
  async renderHTML(params: any) {
    try {
      return await ipcRenderer.invoke('render-transcript-html', params);
    } catch (err) {
      console.error('Error rendering HTML:', err);
      throw err;
    }
  }
});

// Nouvelle extension pour le rendu des attestations
contextBridge.exposeInMainWorld('attestationRenderer', {
  async renderHTML(params: any) {
    try {
      return await ipcRenderer.invoke('render-attestation-html', params);
    } catch (err) {
      console.error('Error rendering attestation HTML:', err);
      throw err;
    }
  }
});

// Add the file system API
contextBridge.exposeInMainWorld('fs', {
  async readFile(filePath: string, options?: { encoding?: string }) {
    try {
      return await ipcRenderer.invoke('fs:readFile', filePath, options);
    } catch (err) {
      console.error('Error reading file:', err);
      throw err;
    }
  }
});

// Grades Manager integration
contextBridge.exposeInMainWorld('gradesManager', {
  saveConfig: (config: any) => ipcRenderer.invoke('grades-manager:save-config', config),
  getConfig: () => ipcRenderer.invoke('grades-manager:get-config'),
  savePDF: (outputPath: string, pdfBuffer: Uint8Array) =>
    ipcRenderer.invoke('grades-manager:save-pdf', { outputPath, pdfBuffer }),
  saveManifest: (manifestPath: string, manifest: any) =>
    ipcRenderer.invoke('grades-manager:save-manifest', { manifestPath, manifest }),
  saveAcademicConfigs: (configs: any[]) =>
    ipcRenderer.invoke('grades-manager:save-academic-configs', configs),
  browseFile: (options: { filters?: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke('grades-manager:browse-file', options),
  browseDirectory: () => ipcRenderer.invoke('grades-manager:browse-directory'),
  getLocalIPs: () => ipcRenderer.invoke('grades-manager:get-local-ips'),
  onDeliberationSigned: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload);
    ipcRenderer.on('grades-manager:deliberation-signed', handler);
    return () => ipcRenderer.removeListener('grades-manager:deliberation-signed', handler);
  },
  onSemesterLocked: (callback: (payload: any) => void) => {
    const handler = (_event: any, payload: any) => callback(payload);
    ipcRenderer.on('grades-manager:semester-locked', handler);
    return () => ipcRenderer.removeListener('grades-manager:semester-locked', handler);
  },
  onAutoGenerationProgress: (callback: (data: { type: string; current: number; total: number; studentName: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('grades-manager:auto-generation-progress', handler);
    return () => ipcRenderer.removeListener('grades-manager:auto-generation-progress', handler);
  },
});

// Extension pour le rendu de l'historique des documents en PDF
contextBridge.exposeInMainWorld('electron', {
  async renderHistoryPDF(htmlContent: string) {
    try {
      return await ipcRenderer.invoke('render-history-pdf', htmlContent);
    } catch (err) {
      console.error('Error rendering history PDF:', err);
      throw err;
    }
  },

  async generateCentreAttestationPDF(html: string, student: any) {
    try {
      console.log('📜 [PRELOAD] Appel generateCentreAttestationPDF pour:', student.NOM);
      return await ipcRenderer.invoke('generateCentreAttestationPDF', html, student);
    } catch (err) {
      console.error('❌ [PRELOAD] Error generating centre attestation PDF:', err);
      throw err;
    }
  },

  async generateCentreAttestations(options: any) {
    try {
      console.log('📜 [PRELOAD] Appel generateCentreAttestations pour', options.students.length, 'étudiants');

      // Extraire la fonction onProgress (ne pas la passer via IPC)
      const onProgressCallback = options.onProgress;

      // Créer une copie des options SANS la fonction onProgress
      const { onProgress, ...serializableOptions } = options;

      // Écouter les événements de progression
      let progressHandler: any = null;
      if (onProgressCallback) {
        progressHandler = (_event: any, data: { current: number; total: number }) => {
          onProgressCallback(data.current, data.total);
        };
        ipcRenderer.on('centre-attestation-progress', progressHandler);
      }

      // Passer uniquement les options sérialisables (sans la fonction)
      const result = await ipcRenderer.invoke('generateCentreAttestations', serializableOptions);

      // Nettoyer l'écouteur de progression
      if (progressHandler) {
        ipcRenderer.removeListener('centre-attestation-progress', progressHandler);
      }

      return result;
    } catch (err) {
      console.error('❌ [PRELOAD] Error generating centre attestations batch:', err);
      // Nettoyer l'écouteur en cas d'erreur
      ipcRenderer.removeAllListeners('centre-attestation-progress');
      throw err;
    }
  }
});

