/**
 * Convertisseur HTML vers PDF pour les relevés de notes
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { StudentRecord } from "@/types/student";
import { TranscriptSettingsPayload } from "@/lib/form-schemas/settings";
import { createTranscriptHTML } from './htmlGenerator';

/**
 * Génère un fichier PDF à partir des données d'un étudiant
 * @param student Les données de l'étudiant
 * @param headerSettings Les paramètres d'en-tête du relevé (optionnel)
 * @returns Une promesse résolue avec les données du PDF en Uint8Array
 */
export async function generateTranscriptPDF(
  student: StudentRecord, 
  headerSettings?: TranscriptSettingsPayload
): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      // Créer un fichier HTML temporaire avec le contenu du relevé
      const html = createTranscriptHTML(student);
      const tempDir = app.getPath('temp');
      const htmlPath = path.join(tempDir, `transcript-${Date.now()}.html`);
      
      // Écrire le HTML dans un fichier temporaire
      fs.writeFileSync(htmlPath, html);
      
      // Créer une fenêtre de navigateur cachée
      const win = new BrowserWindow({
        width: 595, // Largeur A4 en pixels à 72 DPI
        height: 842, // Hauteur A4 en pixels à 72 DPI
        show: false, // Garder la fenêtre cachée
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      
      // Charger le fichier HTML
      await win.loadFile(htmlPath);
      
      // Attendre que le contenu soit complètement chargé
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Générer le PDF
      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: {
          top: 0.4,
          bottom: 0.4,
          left: 0.4,
          right: 0.4
        }
      });
      
      // Fermer la fenêtre
      win.close();
      
      // Nettoyer le fichier HTML temporaire
      try {
        fs.unlinkSync(htmlPath);
      } catch (error) {
        console.warn('Échec du nettoyage du fichier HTML temporaire:', error);
      }
      
      resolve(pdfData);
    } catch (error) {
      reject(error);
    }
  });
}