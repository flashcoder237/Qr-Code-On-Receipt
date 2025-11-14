// electron/main.ts - Version corrigée avec support du chiffrement et meilleure gestion des erreurs
import { app, BrowserWindow, ipcMain, Menu, MenuItem } from "electron";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setupPDFGenerationHandlers } from "../src/lib/pdfGenerator";
import os from "node:os";

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
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
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
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  // Open DevTools in development mode
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }

  // Gestion des erreurs de fenêtre
  win.webContents.on('crashed', () => {
    console.error('Le processus de rendu a planté');
  });

  win.webContents.on('unresponsive', () => {
    console.warn('Le processus de rendu ne répond plus');
  });


}

async function cleanupTempFiles() {
  try {
    const tempDir = os.tmpdir();
    const files = await fs.readdir(tempDir);
    
    // Cherche nos fichiers de prévisualisation temporaires
    const previewFiles = files.filter(file => 
      file.startsWith('preview-') && 
      (file.endsWith('.html') || file.endsWith('.pdf'))
    );
    
    // Supprime les fichiers plus anciens que 24 heures
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const file of previewFiles) {
      const filePath = path.join(tempDir, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs < oneDayAgo) {
          await fs.unlink(filePath);
          
        }
      } catch (e) {
        console.error(`Erreur lors du nettoyage du fichier temporaire ${filePath}:`, e);
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
  }
}

// Setup file system handlers for the IPC bridge
function setupFileSystemHandlers() {
  ipcMain.handle('fs:readFile', async (_, filePath, options) => {
    try {
      
      return await fs.readFile(filePath, options);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      throw error;
    }
  });
}

// Configuration des gestionnaires IPC améliorés
function setupPreviewHandlers() {
  // Gestionnaire pour la prévisualisation HTML amélioré
  ipcMain.handle('show-preview', async (_, htmlContent: string, title = 'Prévisualisation') => {
    try {
      
      
      // Ajouter des styles pour permettre le défilement et améliorer l'affichage
      const enhancedHtml = htmlContent.replace('</head>', `
        <style>
          html, body {
            overflow-y: auto !important;
            overflow-x: auto !important;
          }
          body {
            box-sizing: border-box;
            padding: 10px;
          }
          @media print {
            body {
              overflow: visible !important;
            }
          }
          /* Amélioration de l'affichage des QR codes chiffrés */
          .encryption-indicator {
            background: rgba(0, 128, 0, 0.1) !important;
            border: 1px solid rgba(0, 128, 0, 0.3) !important;
            color: #006400 !important;
            font-size: 10px !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            z-index: 1000 !important;
          }
        </style>
      </head>`);
      
      // Créer un fichier temporaire avec un nom unique
      const tempDir = os.tmpdir();
      const timestamp = Date.now();
      const tempPath = path.join(tempDir, `preview-${timestamp}.html`);
      
      // Écrire le contenu HTML amélioré dans le fichier temporaire
      await fs.writeFile(tempPath, enhancedHtml, 'utf8');
      
      
      // Créer une nouvelle fenêtre de prévisualisation
      const previewWindow = new BrowserWindow({
        width: 900,
        height: 1100,
        title,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true
        },
        show: false, // Masquer jusqu'à ce que le contenu soit chargé
      });
      
      // Charger le fichier HTML
      await previewWindow.loadFile(tempPath);
      
      // Afficher la fenêtre une fois le contenu chargé
      previewWindow.show();
      
      // Activer le défilement et améliorer l'interaction
      await previewWindow.webContents.executeJavaScript(`
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.height = 'auto';
        
        // Ajouter un écouteur d'événements pour les touches fléchées
        document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            window.scrollBy(0, 50);
          } else if (e.key === 'ArrowUp') {
            window.scrollBy(0, -50);
          } else if (e.key === 'PageDown') {
            window.scrollBy(0, window.innerHeight * 0.8);
          } else if (e.key === 'PageUp') {
            window.scrollBy(0, -window.innerHeight * 0.8);
          }
        });
        
        // Améliorer l'affichage des indicateurs de chiffrement
        const indicators = document.querySelectorAll('.encryption-indicator');
        indicators.forEach(indicator => {
          indicator.style.display = 'block';
          indicator.style.visibility = 'visible';
        });
        
        
      `);
      
      // Créer un menu contextuel pour la fenêtre de prévisualisation
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Fichier',
          submenu: [
            {
              label: 'Imprimer',
              accelerator: 'CmdOrCtrl+P',
              click: () => { 
                previewWindow.webContents.print({
                  silent: false,
                  printBackground: true,
                  margins: { marginType: 'minimum' }
                }); 
              }
            },
            {
              label: 'Sauvegarder en PDF',
              accelerator: 'CmdOrCtrl+S',
              click: async () => {
                try {
                  const { dialog } = require('electron');
                  const result = await dialog.showSaveDialog(previewWindow, {
                    defaultPath: `document-${timestamp}.pdf`,
                    filters: [{ name: 'PDF', extensions: ['pdf'] }]
                  });
                  
                  if (!result.canceled && result.filePath) {
                    const pdfData = await previewWindow.webContents.printToPDF({
                      printBackground: true,
                      pageSize: 'A4'
                    });
                    await fs.writeFile(result.filePath, pdfData);
                    
                  }
                } catch (error) {
                  console.error('Erreur lors de la sauvegarde PDF:', error);
                }
              }
            },
            { type: 'separator' },
            {
              label: 'Fermer',
              accelerator: 'CmdOrCtrl+W',
              click: () => { previewWindow.close(); }
            }
          ]
        },
        {
          label: 'Affichage',
          submenu: [
            {
              label: 'Adapter au format A4',
              accelerator: 'CmdOrCtrl+0',
              click: () => { 
                previewWindow.webContents.executeJavaScript('adaptA4Scale()');
              }
            },
            {
              label: 'Zoom 50%',
              click: () => { previewWindow.webContents.setZoomFactor(0.5); }
            },
            {
              label: 'Zoom 75%',
              click: () => { previewWindow.webContents.setZoomFactor(0.75); }
            },
            {
              label: 'Zoom 100%',
              click: () => { previewWindow.webContents.setZoomFactor(1.0); }
            },
            {
              label: 'Zoom 125%',
              click: () => { previewWindow.webContents.setZoomFactor(1.25); }
            }
          ]
        }
      ]);
      
      previewWindow.setMenu(contextMenu);
      
      // Gestion des erreurs de la fenêtre de prévisualisation
      previewWindow.webContents.on('crashed', () => {
        console.error('La fenêtre de prévisualisation a planté');
      });
      
      previewWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Échec du chargement de la prévisualisation: ${errorCode} - ${errorDescription}`);
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
      console.error('❌ Erreur lors de l\'affichage de la prévisualisation:', error);
      return false;
    }
  });
}

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  console.error('Exception non gérée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée:', reason);
});

// Quit when all windows are closed, except on macOS
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

// Gestion des erreurs de l'application
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Empêcher la navigation vers des URLs externes en mode production
    if (parsedUrl.origin !== new URL(contents.getURL()).origin) {
      navigationEvent.preventDefault();
      console.warn(`Navigation bloquée vers: ${navigationUrl}`);
    }
  });
});

// Initialisation de l'application
app.whenReady().then(async () => {
  try {
    
    
    // Nettoyer les fichiers temporaires au démarrage
    await cleanupTempFiles();
    
    // Configurer les gestionnaires de prévisualisation
    setupPreviewHandlers();
    
    // Configurer les gestionnaires PDF pour les relevés ET les attestations avec support du chiffrement
    setupPDFGenerationHandlers();
    
    // Créer la fenêtre principale
    createWindow();
    
    
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    app.quit();
  }
});

// Planification du nettoyage des fichiers temporaires toutes les heures
setInterval(async () => {
  try {
    await cleanupTempFiles();
  } catch (error) {
    console.error('Erreur lors du nettoyage automatique:', error);
  }
}, 60 * 60 * 1000); // 1 heure