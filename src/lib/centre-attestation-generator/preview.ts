// src/lib/centre-attestation-generator/preview.ts
// Fonctions de prévisualisation pour les attestations de centre

import { CentreAttestationStudentRecord } from './types';
import { Centre } from '../form-schemas/centre-settings';
import { CentreAttestationTheme } from '../form-schemas/centre-attestation-theme';
import { generateCentreAttestationHTML } from './html-generator';

interface CentreAttestationPreviewOptions {
  theme?: CentreAttestationTheme;
  demoMode?: boolean;
  qrCodeImage?: string;
}

/**
 * Ouvre une fenêtre de prévisualisation pour une attestation de centre
 */
export async function openCentreAttestationPreview(
  student: CentreAttestationStudentRecord,
  centre: Centre,
  options: CentreAttestationPreviewOptions = {}
): Promise<boolean> {
  try {
    // Générer le HTML
    const html = await generateCentreAttestationHTML(student, centre, {
      ...options,
      centre,
      isDemoMode: options.demoMode !== undefined ? options.demoMode : true, // Mode démo par défaut pour preview
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
    previewWindow.document.title = `Prévisualisation Attestation - ${student.NOM} ${student.PRENOM}`;

    return true;
  } catch (error) {
    console.error('Erreur lors de la prévisualisation de l\'attestation:', error);
    return false;
  }
}

export default {
  openCentreAttestationPreview
};
