// src/lib/attestation-generator/html-to-pdf.ts - Version corrigée sans require
import { StudentExcelRecord } from '../helpers/qrcode';
import { generateAttestationHTML } from './html-generator';
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import QRCode from 'qrcode';

interface SchoolSettings {
  establishmentType: string;
  nameFrench: string;
  nameEnglish: string;
  nameAbreviation: string;
  postalBox: string;
  postalBoxEn: string;
  email: string;
  logo?: string;
  universityLogo?: string;
  facultyLogo?: string;
  themeColor?: string;
  themeFont?: string;
}

interface GenerationOptions {
  qrCodeImage?: ArrayBuffer;
  qrCodePosition?: {
    x: number;
    y: number;
  };
}

/**
 * Génère un PDF d'attestation de réussite pour un étudiant en utilisant HTML
 */
export async function generateAttestationPDF(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: GenerationOptions = {}
): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      // Convertir le QR code en base64 si fourni
      let qrCodeBase64 = '';
      if (options.qrCodeImage) {
        // Convertir le ArrayBuffer en base64
        const buffer = Buffer.from(options.qrCodeImage as ArrayBuffer);
        qrCodeBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
      } else {
        // Générer un QR code si non fourni
        try {
          // Créer les données QR pour l'attestation
          const qrData = `Établissement: ${settings.nameFrench}
Nom: ${student.NOM}
Prénom: ${student.PRENOM}
Matricule: ${student.MATRICULE}
Date de naissance: ${student["DATE DE NAISSANCE"]}
Lieu de naissance: ${student["LIEU DE NAISSANCE"]}
Parcours: ${student.PARCOURS || ""}
Spécialité: ${student.SPECIALITE || ""}
Option: ${student.OPTION || ""}
Moyenne: ${student.MOYENNE}
Grade: ${student.GRADE}
Mention: ${student.MENTION}
Année académique: ${student["ANNEE ACADEMIQUE"]}`;
          
          qrCodeBase64 = await QRCode.toDataURL(qrData);
        } catch (qrError) {
          console.error("Erreur lors de la génération du QR code:", qrError);
          // Continuer sans QR code
        }
      }

      // Générer le HTML de l'attestation
      const html = await generateAttestationHTML(student, settings, {
        qrCodeImage: qrCodeBase64,
        qrCodePosition: options.qrCodePosition
      });

      // Créer un fichier HTML temporaire
      const tempDir = os.tmpdir();
      const htmlPath = path.join(tempDir, `attestation-${Date.now()}.html`);
      
      // Écrire le HTML dans le fichier temporaire
      await fs.writeFile(htmlPath, html);

      // Créer une fenêtre de navigateur cachée pour générer le PDF
      const win = new BrowserWindow({
        width: 595, // A4 width in pixels at 72 DPI
        height: 842, // A4 height in pixels at 72 DPI
        show: false, // Fenêtre cachée
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      try {
        // Charger le fichier HTML
        await win.loadFile(htmlPath);

        // Attendre que le contenu soit complètement chargé
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Générer le PDF
        const pdfData = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          pageRanges: '1-1',
          margins: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        });

        // Fermer la fenêtre
        win.close();

        // Supprimer le fichier temporaire
        try {
          await fs.unlink(htmlPath);
        } catch (cleanupError) {
          console.warn('Erreur lors de la suppression du fichier HTML temporaire:', cleanupError);
          // Continuer l'exécution même si le nettoyage échoue
        }

        console.log(`PDF d'attestation généré avec succès, taille: ${pdfData.byteLength} bytes`);

        // Résoudre avec les données PDF
        resolve(Buffer.from(pdfData));
      } catch (error) {
        win.close();
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF d\'attestation:', error);
      reject(error);
    }
  });
}