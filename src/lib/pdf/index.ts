/**
 * Point d'entrée pour le module de génération de PDF
 * Centralise les exports des autres fichiers du module
 */

// Exporter les fonctions et types publics
export { loadHeaderSettings, saveHeaderSettings } from './settings';
export { createTranscriptHTML } from './htmlGenerator';
export { generateTranscriptPDF } from './pdfConverter';
export { setupPDFGenerationHandlers } from './ipcHandlers';

// Ré-exporter les types utilisés dans le module
export type { TranscriptSettingsPayload } from '@/lib/form-schemas/settings';
export type { StudentRecord } from '@/types/student';