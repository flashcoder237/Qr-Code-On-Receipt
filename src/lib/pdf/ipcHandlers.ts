/**
 * Gestionnaires d'événements IPC pour la génération de PDF
 */

import { ipcMain } from 'electron';
import { StudentRecord } from "@/types/student";
import { TranscriptSettingsPayload } from "@/lib/form-schemas/settings";
import { generateTranscriptPDF } from './pdfConverter';
import { saveHeaderSettings } from './settings';

/**
 * Configure les gestionnaires d'événements IPC pour la génération de PDF
 */
export function setupPDFGenerationHandlers(): void {
  // Gestionnaire pour la génération de relevé de notes en PDF
  ipcMain.handle('generate-transcript-pdf', async (event, args) => {
    try {
      const { studentData, headerSettings } = args;
      const pdfData = await generateTranscriptPDF(studentData, headerSettings);
      return pdfData.buffer;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  });

  // Gestionnaire pour la sauvegarde des paramètres d'en-tête
  ipcMain.handle('save-header-settings', async (event, settings: TranscriptSettingsPayload) => {
    try {
      saveHeaderSettings(settings);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      throw error;
    }
  });
}