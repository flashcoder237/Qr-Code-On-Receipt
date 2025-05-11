export function setupElectronMocks() {
    if (typeof window !== 'undefined' && !window.ipcRenderer) {
      console.log('Setting up Electron API mocks');
      
      // Mock IPC Renderer
      window.ipcRenderer = {
        on: (channel, listener) => {
          console.log(`[MOCK] IPC on: ${channel}`);
        },
        
        off: (channel, listener) => {
          console.log(`[MOCK] IPC off: ${channel}`);
        },
        
        send: (channel, ...args) => {
          console.log(`[MOCK] IPC send: ${channel}`, args);
        },
        
        invoke: async (channel, ...args) => {
          console.log(`[MOCK] IPC invoke: ${channel}`, args);
          
          // Mock responses for different channels
          if (channel === 'generate-transcript-html') {
            return '<html><body><h1>Mock Transcript</h1></body></html>';
          }
          
          if (channel === 'generate-transcript-pdf') {
            // Return a small mock PDF bytes array
            return new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);
          }
          
          return null;
        }
      };
      
      // Mock FS module
      window.fs = {
        readFile: async (path, options = {}) => {
          console.log(`[MOCK] Reading file: ${path}`);
          return 'Mock file content';
        }
      };
    }
  }
  
  // Auto-setup
  setupElectronMocks();