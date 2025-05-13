// src/electron/main.ts - Mise à jour pour inclure les gestionnaires d'attestation
import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setupPDFGenerationHandlers } from "../src/lib/pdfGenerator";
import os from "node:os"; // Ajouter cette ligne pour importer os correctement

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Setup basic file system handlers
  setupFileSystemHandlers();

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  // Open DevTools in development mode
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }
}

// Setup file system handlers for the IPC bridge
function setupFileSystemHandlers() {
  ipcMain.handle('fs:readFile', async (_, filePath, options) => {
    try {
      return await fs.readFile(filePath, options);
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });
}

// Configuration des gestionnaires IPC
function setupPreviewHandlers() {
  // Gestionnaire pour la prévisualisation HTML
  ipcMain.handle('show-preview', async (_, htmlContent: string, title = 'Prévisualisation') => {
  try {
    // Ajouter des styles pour permettre le défilement
    const enhancedHtml = htmlContent.replace('</head>', `
      <style>
        html, body {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow-y: auto !important; /* Assurer le défilement vertical */
        }
        body {
          min-height: 100%;
          box-sizing: border-box;
          padding: 10px;
        }
        @media print {
          body {
            height: auto;
            overflow: visible !important;
          }
        }
      </style>
    </head>`);
    
    // Créer un fichier temporaire
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `preview-${Date.now()}.html`);
    
    // Écrire le contenu HTML amélioré dans le fichier temporaire
    await fs.writeFile(tempPath, enhancedHtml, 'utf8');
    
    // Créer une nouvelle fenêtre
    const previewWindow = new BrowserWindow({
      width: 800,
      height: 1000,
      title,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });
    
    // Charger le fichier HTML
    await previewWindow.loadFile(tempPath);
    
    // Activer le défilement dans le webContents
    previewWindow.webContents.executeJavaScript(`
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
      
      // Ajouter un écouteur d'événements pour les touches fléchées pour faciliter le défilement
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          window.scrollBy(0, 50);
        } else if (e.key === 'ArrowUp') {
          window.scrollBy(0, -50);
        }
      });
    `);
    
    // Ajouter un menu d'impression
    const { Menu, MenuItem } = require('electron');
    const menu = new Menu();
    menu.append(new MenuItem({
      label: 'Fichier',
      submenu: [
        {
          label: 'Imprimer',
          accelerator: 'CmdOrCtrl+P',
          click: () => { previewWindow.webContents.print(); }
        },
        { type: 'separator' },
        {
          label: 'Fermer',
          accelerator: 'CmdOrCtrl+W',
          click: () => { previewWindow.close(); }
        }
      ]
    }));
    
    // Ajouter un menu pour le zoom et le défilement
    menu.append(new MenuItem({
      label: 'Affichage',
      submenu: [
        {
          label: 'Zoom avant',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => { previewWindow.webContents.zoomFactor += 0.1; }
        },
        {
          label: 'Zoom arrière',
          accelerator: 'CmdOrCtrl+-',
          click: () => { previewWindow.webContents.zoomFactor -= 0.1; }
        },
        {
          label: 'Réinitialiser le zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => { previewWindow.webContents.zoomFactor = 1.0; }
        }
      ]
    }));
    
    Menu.setApplicationMenu(menu);
    
    // Activer la molette de la souris pour faciliter le défilement
    previewWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'mouseWheel') {
        // Rien à faire, mais cela garantit que l'événement est bien capturé
      }
    });
    
    // Nettoyer le fichier temporaire quand la fenêtre se ferme
    previewWindow.on('closed', async () => {
      try {
        await fs.unlink(tempPath);
      } catch (err) {
        console.error('Erreur lors de la suppression du fichier temporaire:', err);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'affichage de la prévisualisation:', error);
    return false;
  }
});
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  // Configurer les gestionnaires PDF pour les relevés ET les attestations
  setupPreviewHandlers()
  setupPDFGenerationHandlers();
  createWindow();
});