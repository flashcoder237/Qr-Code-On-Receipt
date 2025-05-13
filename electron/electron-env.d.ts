/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Extend the Window interface
interface Window {
  ipcRenderer: {
    on(channel: string, listener: (...args: any[]) => void): () => void;
    once(channel: string, listener: (...args: any[]) => void): void;
    off(channel: string, listener?: (...args: any[]) => void): void;
    send(channel: string, ...args: any[]): void;
    invoke(channel: string, ...args: any[]): Promise<any>;
  };
  fs: {
    readFile(path: string, options?: { encoding?: string }): Promise<any>;
  };
  transcriptRenderer: {
    renderHTML(params: any): Promise<string>;
  };
  initMockIpc?: () => void;
}
