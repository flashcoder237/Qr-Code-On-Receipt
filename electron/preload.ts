// electron/preload.ts - Enhanced version with better error handling

import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    console.log(`IPC Send: ${channel}`, ...omit)
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...params] = args
    console.log(`IPC Invoke: ${channel}`, params.length > 0 ? '(with params)' : '')
    
    return ipcRenderer.invoke(channel, ...params)
      .then(result => {
        if (channel === 'generate-transcript-html') {
          console.log(`IPC Invoke Success: ${channel}`, typeof result === 'string' ? 
            `[HTML: ${result.length} chars]` : '(unknown result type)')
        } else {
          console.log(`IPC Invoke Success: ${channel}`, result instanceof ArrayBuffer 
            ? `[ArrayBuffer: ${result.byteLength} bytes]` 
            : '(with result)')
        }
        return result
      })
      .catch(error => {
        console.error(`IPC Invoke Error: ${channel}`, error)
        throw error // Re-throw to be caught by the caller
      })
  }
})

// Setup file system access
contextBridge.exposeInMainWorld('fs', {
  // Method to read file contents
  readFile: async (filePath: string, options: { encoding?: string } = {}) => {
    try {
      return await ipcRenderer.invoke('fs:readFile', filePath, options)
    } catch (error) {
      console.error('Error reading file via preload:', error)
      throw error
    }
  }
})

// Notify the renderer process when preload script has finished loading
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded successfully')
})