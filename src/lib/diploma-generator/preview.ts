// src/lib/diploma-generator/preview.ts
// Fonctions de prévisualisation pour les diplômes

import { DiplomaStudentRecord, DiplomaSchoolSettings, DiplomaPreviewOptions } from './types';
import { generateDiplomaHTML } from './html-generator';

/**
 * Ouvre une fenêtre de prévisualisation pour un diplôme
 */
export async function openDiplomaPreview(
  student: DiplomaStudentRecord,
  settings: DiplomaSchoolSettings,
  options: DiplomaPreviewOptions = {}
): Promise<boolean> {
  try {
    // Générer le HTML
    const html = await generateDiplomaHTML(student, settings, {
      ...options,
      demoMode: options.demoMode !== undefined ? options.demoMode : true, // Mode démo par défaut pour preview
    });

    // Ouvrir une nouvelle fenêtre
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      console.error('Impossible d\'ouvrir la fenêtre de prévisualisation');
      return false;
    }

    // Écrire le HTML dans la fenêtre
    previewWindow.document.write(html);
    previewWindow.document.close();

    // Ajouter un titre à la fenêtre
    previewWindow.document.title = `Prévisualisation Diplôme - ${student.NOM} ${student.PRENOM}`;

    return true;
  } catch (error) {
    console.error('Erreur lors de la prévisualisation du diplôme:', error);
    return false;
  }
}

/**
 * Génère un PDF à partir du HTML du diplôme (pour utilisation avec puppeteer/ipcRenderer)
 */
export async function generateDiplomaPDFData(
  student: DiplomaStudentRecord,
  settings: DiplomaSchoolSettings,
  options: DiplomaPreviewOptions = {}
): Promise<{ student: DiplomaStudentRecord; settings: DiplomaSchoolSettings; options: DiplomaPreviewOptions }> {
  return {
    student,
    settings,
    options
  };
}
