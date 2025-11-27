// src/lib/diploma-generator/diploma-html-to-pdf.ts
// Génération de PDFs pour les diplômes avec support Electron

import { DiplomaStudentRecord } from './types';
import { generateDiplomaHTML } from './html-generator';
import { DiplomaThemeSettingsPayload } from '../form-schemas/diploma-theme-settings';
import { BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface DiplomaGenerationOptions {
  theme: DiplomaThemeSettingsPayload;
  demoMode?: boolean;
  qrCodeImage?: string;
  outputPath?: string;
  keepTempFile?: boolean;
}

interface DiplomaPDFGenerationResult {
  pdfData: Uint8Array;
  studentInfo: {
    nom: string;
    prenom: string;
    matricule: string;
  };
  fileSize: number;
}

/**
 * Génère un PDF de diplôme pour un étudiant
 */
export async function generateDiplomaPDF(
  student: DiplomaStudentRecord,
  settings: any,
  options: DiplomaGenerationOptions = {} as DiplomaGenerationOptions
): Promise<Uint8Array> {
  const result = await generateDiplomaPDFDetailed(student, settings, options);
  return result.pdfData;
}

/**
 * Version détaillée qui retourne des informations supplémentaires
 */
export async function generateDiplomaPDFDetailed(
  student: DiplomaStudentRecord,
  settings: any,
  options: DiplomaGenerationOptions = {} as DiplomaGenerationOptions
): Promise<DiplomaPDFGenerationResult> {
  return new Promise(async (resolve, reject) => {
    let win: BrowserWindow | null = null;
    let htmlPath: string | null = null;

    try {
      const startTime = Date.now();
      const studentIdLog = `${student.NOM}_${student.PRENOM}_${student.MATRICULE}`;
      console.log(`🎓 [DIPLOMA-PDF] START génération PDF pour: ${studentIdLog}`);

      // Générer le HTML du diplôme
      console.log(`📝 [DIPLOMA-PDF] ${studentIdLog}: Génération HTML...`);
      const html = await generateDiplomaHTML(
        student,
        settings,
        {
          theme: options.theme,
          demoMode: options.demoMode || false,
          qrCodeImage: options.qrCodeImage
        }
      );
      console.log(`✅ [DIPLOMA-PDF] ${studentIdLog}: HTML généré (${html.length} caractères)`);

      // Créer un fichier temporaire
      const tempDir = os.tmpdir();
      const timestamp = Date.now();
      const studentId = `${student.NOM}_${student.PRENOM}_${student.MATRICULE}`.replace(/[^a-zA-Z0-9]/g, '_');
      htmlPath = path.join(tempDir, `diploma-${studentId}-${timestamp}.html`);

      // Écrire le HTML dans le fichier temporaire
      await fs.writeFile(htmlPath, html, 'utf-8');
      console.log(`📄 [DIPLOMA-PDF] ${studentIdLog}: Fichier HTML temporaire créé: ${htmlPath}`);

      // Créer une fenêtre Electron cachée
      win = new BrowserWindow({
        width: 842,  // A4 paysage: largeur = 842px
        height: 595, // A4 paysage: hauteur = 595px
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // Charger le fichier HTML
      await win.loadFile(htmlPath);
      console.log(`🌐 [DIPLOMA-PDF] ${studentIdLog}: HTML chargé dans BrowserWindow`);

      // Attendre que le contenu soit complètement chargé
      const loadingDelay = options.demoMode ? 1500 : 1000;
      await new Promise(resolve => setTimeout(resolve, loadingDelay));

      // Générer le PDF
      console.log(`🖨️ [DIPLOMA-PDF] ${studentIdLog}: Génération PDF...`);
      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        landscape: true, // IMPORTANT: Format paysage pour les diplômes
        pageRanges: '1-1',
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
      });

      const resultData = Buffer.from(pdfData);
      const duration = Date.now() - startTime;
      console.log(`✅ [DIPLOMA-PDF] ${studentIdLog}: PDF généré avec succès en ${duration}ms (${resultData.length} bytes)`);

      // Résoudre avec les données du PDF
      resolve({
        pdfData: resultData,
        studentInfo: {
          nom: student.NOM,
          prenom: student.PRENOM,
          matricule: student.MATRICULE
        },
        fileSize: resultData.length
      });

    } catch (error) {
      console.error('❌ [DIPLOMA-PDF] Erreur lors de la génération du PDF de diplôme:', error);
      reject(error);
    } finally {
      console.log(`🧹 [DIPLOMA-PDF] Nettoyage des ressources...`);

      // Fermer et détruire la fenêtre
      if (win && !win.isDestroyed()) {
        win.close();
        win.destroy();
        win = null;
      }

      // Nettoyer le fichier temporaire (sauf si keepTempFile est activé)
      if (htmlPath && !options.keepTempFile) {
        try {
          await fs.unlink(htmlPath);
          console.log(`🗑️ [DIPLOMA-PDF] Fichier temporaire supprimé: ${htmlPath}`);
        } catch (cleanupError) {
          console.warn(`⚠️ [DIPLOMA-PDF] Impossible de supprimer le fichier temporaire:`, cleanupError);
        }
      }
    }
  });
}
