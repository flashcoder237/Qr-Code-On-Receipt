// src/lib/attestation-generator/html-to-pdf.ts - Version avec support du chiffrement QR
import { StudentExcelRecord, sanitizeStudentData, generateQrCodeBase64 } from '../helpers/qrcode';
import { generateAttestationHTML } from './html-generator';
import { AttestationThemeSettingsPayload } from '../form-schemas/attestation-theme-settings';
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

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
  theme?: AttestationThemeSettingsPayload;
}

interface GenerationOptions {
  qrCodeImage?: ArrayBuffer | string; // Support des deux formats
  qrCodePosition?: {
    x: number;
    y: number;
  };
  theme?: AttestationThemeSettingsPayload;
  encryptionEnabled?: boolean; // Support du chiffrement
  outputPath?: string; // Chemin de sortie optionnel
  keepTempFile?: boolean; // Garder le fichier temporaire pour débogage
}

interface PDFGenerationResult {
  pdfData: Uint8Array;
  studentInfo: {
    nom: string;
    prenom: string;
    matricule: string;
  };
  encryptionStatus: {
    enabled: boolean;
    qrCodeIncluded: boolean;
  };
  fileSize: number;
}

/**
 * Génère un PDF d'attestation de réussite pour un étudiant avec support du chiffrement QR
 */
export async function generateAttestationPDF(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: GenerationOptions = {}
): Promise<Uint8Array> {
  const result = await generateAttestationPDFDetailed(student, settings, options);
  return result.pdfData;
}

/**
 * Version détaillée qui retourne des informations supplémentaires
 */
export async function generateAttestationPDFDetailed(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: GenerationOptions = {}
): Promise<PDFGenerationResult> {
  return new Promise(async (resolve, reject) => {
    let win: BrowserWindow | null = null;
    let htmlPath: string | null = null;
    
    try {
      console.log('🔄 Début de la génération PDF avec chiffrement:', options.encryptionEnabled);
      
      // Sanitiser les données de l'étudiant
      const sanitizedStudent = sanitizeStudentData(student);
      console.log('🧹 Données étudiant sanitisées pour PDF');
      
      // Par défaut, le chiffrement est activé sauf indication contraire
      const encryptionEnabled = options.encryptionEnabled !== false;
      console.log(`🔐 Chiffrement PDF: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);
      
      // Vérification de sécurité pour la position du QR code
      const safeQrPosition = options.qrCodePosition && 
        typeof options.qrCodePosition.x === 'number' && 
        typeof options.qrCodePosition.y === 'number' 
        ? options.qrCodePosition 
        : { x: 470, y: 220 };
      
      // S'assurer que l'étudiant a un établissement défini
      if (!sanitizedStudent.ETABLISSEMENT || sanitizedStudent.ETABLISSEMENT === 'N/D') {
        sanitizedStudent.ETABLISSEMENT = settings.nameFrench || "ETABLISSEMENT NON DEFINI";
      }
      
      console.log('📊 Données étudiant pour PDF:', {
        nom: sanitizedStudent.NOM,
        prenom: sanitizedStudent.PRENOM,
        matricule: sanitizedStudent.MATRICULE,
        etablissement: sanitizedStudent.ETABLISSEMENT,
        encryptionEnabled
      });

      // Gérer le QR code avec chiffrement
      let qrCodeBase64 = '';
      let qrCodeIncluded = false;
      
      if (options.qrCodeImage) {
        // Utiliser le QR code fourni
        if (typeof options.qrCodeImage === 'string') {
          qrCodeBase64 = options.qrCodeImage.startsWith('data:') 
            ? options.qrCodeImage 
            : `data:image/png;base64,${options.qrCodeImage}`;
        } else {
          // Convertir le ArrayBuffer en base64
          const buffer = Buffer.from(options.qrCodeImage as ArrayBuffer);
          qrCodeBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
        }
        qrCodeIncluded = true;
        console.log('📋 QR Code fourni utilisé pour le PDF');
      } else if (settings.theme?.showQRCode !== false) {
        // Générer un QR code avec chiffrement
        try {
          console.log(`🔄 Génération QR Code pour PDF (Chiffrement: ${encryptionEnabled})`);
          
          qrCodeBase64 = await generateQrCodeBase64(sanitizedStudent, 'attestation', encryptionEnabled);
          qrCodeIncluded = true;
          
          if (encryptionEnabled) {
            console.log('✅ QR Code avec chiffrement généré pour le PDF');
          } else {
            console.log('📋 QR Code sans chiffrement généré pour le PDF');
          }
        } catch (qrError) {
          console.error("❌ Erreur lors de la génération du QR code pour le PDF:", qrError);
          // Continuer sans QR code
          qrCodeBase64 = '';
          qrCodeIncluded = false;
        }
      }

      // Générer le HTML de l'attestation avec chiffrement
      console.log('🔄 Génération HTML pour PDF...');
      const html = await generateAttestationHTML(sanitizedStudent, settings, {
        qrCodeImage: qrCodeBase64,
        qrCodePosition: safeQrPosition,
        theme: options.theme,
        encryptionEnabled: encryptionEnabled
      });
      console.log('✅ HTML généré pour PDF');

      // Créer un fichier HTML temporaire
      const tempDir = os.tmpdir();
      const timestamp = Date.now();
      const studentId = `${sanitizedStudent.NOM}_${sanitizedStudent.PRENOM}_${sanitizedStudent.MATRICULE}`.replace(/[^a-zA-Z0-9]/g, '_');
      htmlPath = path.join(tempDir, `attestation-${studentId}-${timestamp}.html`);
      
      // Écrire le HTML dans le fichier temporaire
      await fs.writeFile(htmlPath, html, 'utf8');
      console.log(`📄 Fichier HTML temporaire créé: ${htmlPath}`);

      // Créer une fenêtre de navigateur cachée pour générer le PDF
      win = new BrowserWindow({
        width: 595, // A4 width in pixels at 72 DPI
        height: 842, // A4 height in pixels at 72 DPI
        show: false, // Fenêtre cachée
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          webSecurity: true
        }
      });

      console.log('🔄 Chargement du HTML dans la fenêtre cachée...');

      try {
        // Charger le fichier HTML
        await win.loadFile(htmlPath);
        console.log('✅ HTML chargé dans la fenêtre');

        // Attendre que le contenu soit complètement chargé
        // Plus de temps pour les QR codes chiffrés
        const loadingDelay = encryptionEnabled ? 2000 : 1000;
        await new Promise(resolve => setTimeout(resolve, loadingDelay));
        console.log(`⏱️ Attente de ${loadingDelay}ms pour le chargement complet`);

        // Générer le PDF
        console.log('🔄 Génération du PDF...');
        const pdfData = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          pageRanges: '1-1',
          margins: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          },
          landscape: false,
          preferCSSPageSize: true
        });

        // Fermer la fenêtre
        win.close();
        win = null;
        console.log('✅ PDF généré et fenêtre fermée');

        // Sauvegarder dans le chemin spécifié si demandé
        if (options.outputPath) {
          try {
            await fs.writeFile(options.outputPath, pdfData);
            console.log(`💾 PDF sauvegardé: ${options.outputPath}`);
          } catch (saveError) {
            console.warn('⚠️ Erreur lors de la sauvegarde du PDF:', saveError);
            // Continuer sans interrompre le processus
          }
        }

        // Supprimer le fichier temporaire sauf si demandé de le garder
        if (!options.keepTempFile && htmlPath) {
          try {
            await fs.unlink(htmlPath);
            console.log('🧹 Fichier HTML temporaire supprimé');
          } catch (cleanupError) {
            console.warn('⚠️ Erreur lors de la suppression du fichier HTML temporaire:', cleanupError);
            // Continuer l'exécution même si le nettoyage échoue
          }
        } else if (options.keepTempFile && htmlPath) {
          console.log(`🔍 Fichier HTML temporaire conservé pour débogage: ${htmlPath}`);
        }

        const resultData = Buffer.from(pdfData);
        const result: PDFGenerationResult = {
          pdfData: resultData,
          studentInfo: {
            nom: sanitizedStudent.NOM,
            prenom: sanitizedStudent.PRENOM,
            matricule: sanitizedStudent.MATRICULE
          },
          encryptionStatus: {
            enabled: encryptionEnabled,
            qrCodeIncluded: qrCodeIncluded
          },
          fileSize: resultData.byteLength
        };

        console.log(`✅ PDF d'attestation généré avec succès`);
        console.log(`📊 Taille: ${result.fileSize} bytes`);
        console.log(`🔐 Chiffrement QR: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);
        console.log(`📋 QR Code inclus: ${qrCodeIncluded ? 'Oui' : 'Non'}`);

        // Résoudre avec les données PDF et les métadonnées
        resolve(result);
        
      } catch (error) {
        if (win) {
          win.close();
          win = null;
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF d\'attestation:', error);
      
      // Nettoyage en cas d'erreur
      if (win) {
        try {
          win.close();
        } catch (closeError) {
          console.warn('⚠️ Erreur lors de la fermeture de la fenêtre:', closeError);
        }
      }
      
      if (htmlPath && !options.keepTempFile) {
        try {
          await fs.unlink(htmlPath);
          console.log('🧹 Fichier HTML temporaire supprimé après erreur');
        } catch (cleanupError) {
          console.warn('⚠️ Erreur lors du nettoyage après erreur:', cleanupError);
        }
      }
      
      reject(error);
    }
  });
}

/**
 * Génère plusieurs PDFs d'attestation en lot avec chiffrement
 */
export async function generateMultipleAttestationPDFs(
  students: StudentExcelRecord[],
  settings: SchoolSettings,
  options: GenerationOptions = {}
): Promise<PDFGenerationResult[]> {
  console.log(`🔄 Génération en lot de ${students.length} attestations PDF`);
  
  const results: PDFGenerationResult[] = [];
  const errors: Array<{ student: StudentExcelRecord; error: Error }> = [];
  
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    try {
      console.log(`🔄 Génération PDF ${i + 1}/${students.length} pour ${student.NOM} ${student.PRENOM}`);
      
      const result = await generateAttestationPDFDetailed(student, settings, {
        ...options,
        keepTempFile: false // Ne pas garder les fichiers temporaires en lot
      });
      
      results.push(result);
      console.log(`✅ PDF ${i + 1}/${students.length} généré avec succès`);
      
    } catch (error) {
      console.error(`❌ Erreur PDF ${i + 1}/${students.length} pour ${student.NOM} ${student.PRENOM}:`, error);
      errors.push({ student, error: error as Error });
    }
    
    // Petite pause entre les générations pour éviter la surcharge
    if (i < students.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} erreurs lors de la génération en lot`);
    // Vous pouvez choisir de throw une erreur ou de retourner les résultats partiels
  }
  
  console.log(`✅ Génération en lot terminée: ${results.length} succès, ${errors.length} erreurs`);
  return results;
}

/**
 * Fonction utilitaire pour vérifier la disponibilité d'Electron
 */
export function isElectronAvailable(): boolean {
  try {
    return typeof BrowserWindow !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Fonction utilitaire pour estimer la taille finale du PDF
 */
export function estimatePDFSize(student: StudentExcelRecord, includeQR: boolean = true): number {
  // Estimation basée sur des tests empiriques
  const baseSize = 150000; // ~150KB pour une attestation basique
  const qrCodeSize = includeQR ? 25000 : 0; // ~25KB pour un QR code
  const studentDataSize = JSON.stringify(student).length * 10; // Approximation
  
  return baseSize + qrCodeSize + studentDataSize;
}