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

