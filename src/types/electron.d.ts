interface IpcRenderer {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
    off(channel: string, listener?: (event: any, ...args: any[]) => void): void;
    send(channel: string, ...args: any[]): void;
  }

  declare global {
    interface Window {
      ipcRenderer: IpcRenderer;
      fs: {
        readFile(path: string, options?: { encoding?: string }): Promise<any>;
      };
      electron: {
        renderHistoryPDF(htmlContent: string): Promise<Buffer>;
        generateCentreAttestations?(options: any): Promise<void>;
        generateCentreAttestationPDF?(html: string, student: any): Promise<Uint8Array>;
      };
    }
  }

  export {};