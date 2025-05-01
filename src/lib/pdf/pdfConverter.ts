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
 * @param headerSettings Les paramètres d'en-tête du relevé
 * @returns Une promesse résolue avec les données du PDF en Uint8Array
 */
export async function generateTranscriptPDF(
  student: StudentRecord, 
  headerSettings?: TranscriptSettingsPayload
): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a temporary HTML file with the transcript content
      const html = createTranscriptHTML(student);
      const tempDir = app.getPath('temp');
      const htmlPath = path.join(tempDir, `transcript-${Date.now()}.html`);
      
      // Write HTML to temp file
      fs.writeFileSync(htmlPath, html);
      
      // Create a hidden browser window
      const win = new BrowserWindow({
        width: 595, // A4 width in pixels at 72 DPI
        height: 842, // A4 height in pixels at 72 DPI
        show: false, // Keep window hidden
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      
      // Load the HTML file
      await win.loadFile(htmlPath);
      
      // Wait for content to load completely
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate PDF
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
      
      // Close the window
      win.close();
      
      // Clean up temp HTML file
      try {
        fs.unlinkSync(htmlPath);
      } catch (error) {
        console.warn('Failed to clean up temporary HTML file:', error);
      }
      
      resolve(pdfData);
    } catch (error) {
      reject(error);
    }
  });
}