import { ipcRenderer, contextBridge } from 'electron';

// Expose les fonctions IPC au processus de rendu
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel, listener) {
    const wrappedListener = (_event, ...args) => listener(...args);
    ipcRenderer.on(channel, wrappedListener);
    return () => ipcRenderer.removeListener(channel, wrappedListener);
  },
  
  off(channel, listener) {
    ipcRenderer.removeListener(channel, listener);
  },
  
  send(channel, ...args) {
    console.log(`IPC Send: ${channel}`, ...args);
    ipcRenderer.send(channel, ...args);
  },
  
  async invoke(channel, ...args) {
    console.log(`IPC Invoke: ${channel}`, args.length > 0 ? '(with params)' : '');
    try {
      const result = await ipcRenderer.invoke(channel, ...args);
      console.log(`IPC Invoke Success: ${channel}`);
      return result;
    } catch (error) {
      console.error(`IPC Invoke Error: ${channel}`, error);
      throw error;
    }
  }
});

// Configurer l'accès au système de fichiers
contextBridge.exposeInMainWorld('fs', {
  readFile: async (filePath, options = {}) => {
    try {
      return await ipcRenderer.invoke('fs:readFile', filePath, options);
    } catch (error) {
      console.error('Error reading file via preload:', error);
      throw error;
    }
  }
});

console.log('Preload script loaded successfully');