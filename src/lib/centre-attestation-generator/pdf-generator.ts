// src/lib/centre-attestation-generator/pdf-generator.ts
// Génération de PDFs pour les attestations de centre avec support Electron

import { CentreAttestationStudentRecord, CentreAttestationGenerationOptions } from './types';
import { generateCentreAttestationHTML } from './html-generator';

// Types disponibles uniquement côté Electron
declare const window: {
  electron?: {
    generateCentreAttestationPDF?: (
      html: string,
      student: CentreAttestationStudentRecord
    ) => Promise<Uint8Array>;
  };
};

interface CentreAttestationPDFGenerationResult {
  pdfData: Uint8Array;
  studentInfo: {
    nom: string;
    prenom: string;
    matricule: string;
  };
  fileSize: number;
}

/**
 * Génère un PDF d'attestation pour un étudiant
 */
export async function generateCentreAttestationPDF(
  student: CentreAttestationStudentRecord,
  options: CentreAttestationGenerationOptions
): Promise<Uint8Array> {
  const result = await generateCentreAttestationPDFDetailed(student, options);
  return result.pdfData;
}

/**
 * Version détaillée qui retourne des informations supplémentaires
 */
export async function generateCentreAttestationPDFDetailed(
  student: CentreAttestationStudentRecord,
  options: CentreAttestationGenerationOptions
): Promise<CentreAttestationPDFGenerationResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const startTime = Date.now();
      const studentIdLog = `${student.NOM}_${student.PRENOM}_${student.MATRICULE}`;
      console.log(`📜 [ATTESTATION-PDF] START génération PDF pour: ${studentIdLog}`);

      // Générer le HTML de l'attestation
      console.log(`📝 [ATTESTATION-PDF] ${studentIdLog}: Génération HTML...`);
      const html = await generateCentreAttestationHTML(
        student,
        options.centre,
        options
      );
      console.log(`✅ [ATTESTATION-PDF] ${studentIdLog}: HTML généré (${html.length} caractères)`);

      // Utiliser l'API Electron pour générer le PDF
      if (window.electron?.generateCentreAttestationPDF) {
        console.log(`🖨️ [ATTESTATION-PDF] ${studentIdLog}: Génération PDF via Electron...`);
        const pdfData = await window.electron.generateCentreAttestationPDF(html, student);

        const duration = Date.now() - startTime;
        console.log(`✅ [ATTESTATION-PDF] ${studentIdLog}: PDF généré avec succès en ${duration}ms (${pdfData.length} bytes)`);

        resolve({
          pdfData,
          studentInfo: {
            nom: student.NOM,
            prenom: student.PRENOM,
            matricule: student.MATRICULE
          },
          fileSize: pdfData.length
        });
      } else {
        throw new Error('API Electron non disponible. Vérifiez que l\'application est exécutée dans Electron.');
      }

    } catch (error) {
      console.error('❌ [ATTESTATION-PDF] Erreur lors de la génération du PDF:', error);
      reject(error);
    }
  });
}

/**
 * Génère plusieurs PDFs d'attestations
 */
export async function generateMultipleCentreAttestationPDFs(
  students: CentreAttestationStudentRecord[],
  options: CentreAttestationGenerationOptions,
  onProgress?: (current: number, total: number) => void
): Promise<CentreAttestationPDFGenerationResult[]> {
  const results: CentreAttestationPDFGenerationResult[] = [];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    try {
      const result = await generateCentreAttestationPDFDetailed(student, options);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, students.length);
      }
    } catch (error) {
      console.error(`❌ Erreur génération PDF pour ${student.NOM} ${student.PRENOM}:`, error);
      throw error;
    }
  }

  return results;
}

export default {
  generateCentreAttestationPDF,
  generateCentreAttestationPDFDetailed,
  generateMultipleCentreAttestationPDFs
};
