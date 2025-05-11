// src/utils/mockIpcRenderer.ts
// This file provides a mock implementation of the IPC renderer for development

class MockInvocationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'MockInvocationError';
    }
  }
  
  // Create mock implementations of PDF generation functionality
  const mockPdfGenerator = {
    'generate-transcript-pdf': async (params: any) => {
      console.log('Mock PDF generation called with:', params);
      
      // Simulate PDF generation with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return mock PDF data (as Uint8Array)
      const mockPdfData = new Uint8Array(1000).fill(0xFF);
      return mockPdfData;
    }
  };
  
  // Create a mock ipcRenderer for development/testing
  export const mockIpcRenderer = {
    on(channel: string, listener: (...args: any[]) => void) {
      console.log(`[MOCK] Registering listener for channel: ${channel}`);
      // In a real implementation, we would store the listener
      return () => {
        console.log(`[MOCK] Removing listener for channel: ${channel}`);
      };
    },
    
    once(channel: string, listener: (...args: any[]) => void) {
      console.log(`[MOCK] Registering one-time listener for channel: ${channel}`);
    },
    
    off(channel: string, listener?: (...args: any[]) => void) {
      console.log(`[MOCK] Removing ${listener ? 'specific' : 'all'} listeners for channel: ${channel}`);
    },
    
    send(channel: string, ...args: any[]) {
      console.log(`[MOCK] Sending to channel: ${channel}`, args);
    },
    
    async invoke(channel: string, ...args: any[]) {
      console.log(`[MOCK] Invoking channel: ${channel}`, args);
      
      // Simulate a delay to mimic async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Handle specific mock implementations
      if (channel === 'generate-transcript-pdf') {
        return await mockPdfGenerator[channel](args[0]);
      }
      
      if (channel === 'fs:readFile') {
        const [filePath, options] = args;
        console.log(`[MOCK] Reading file: ${filePath}`, options);
        return new Uint8Array(100);
      }
      
      // Default behavior for unhandled channels
      console.warn(`[MOCK] No mock implementation for channel: ${channel}`);
      throw new MockInvocationError(`No mock implementation for channel: ${channel}`);
    }
  };
  
  // Create a mock fs for development/testing
  export const mockFs = {
    async readFile(filePath: string, options?: { encoding?: string }) {
      console.log(`[MOCK] Reading file: ${filePath}`, options);
      
      if (options?.encoding === 'utf8') {
        return 'Mock file content';
      }
      
      return new Uint8Array(100);
    }
  };
  
  // Initialize the global objects if not already defined (for development environment)
  export function initMockIpc() {
    if (typeof window !== 'undefined') {
      if (!window.ipcRenderer) {
        console.log('[MOCK] Initializing mock IPC renderer');
        window.ipcRenderer = mockIpcRenderer;
      }
      
      if (!window.fs) {
        console.log('[MOCK] Initializing mock fs');
        window.fs = mockFs;
      }
    }
  }