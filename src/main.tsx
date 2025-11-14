import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initMockIpc } from './utils/mockIpcRenderer';

// Make initMockIpc globally available for components that need it
if (typeof window !== 'undefined') {
  window.initMockIpc = initMockIpc;
}

// Initialize mock IPC if in development environment without Electron
if (process.env.NODE_ENV === 'development' && !window.ipcRenderer) {
  
  initMockIpc();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Set up event listener for main process messages if ipcRenderer exists
if (window.ipcRenderer) {
  window.ipcRenderer.on('main-process-message', (message) => {
    console.log('Message from main process:', message);
  });
}