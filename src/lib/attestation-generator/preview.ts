// src/lib/attestation-generator/preview.ts
import { StudentExcelRecord } from '../helpers/qrcode';
import { generateAttestationHTML } from './html-generator';
import QRCode from 'qrcode';

interface SchoolSettings {
  nameFrench: string;
  nameEnglish: string;
  nameAbreviation: string;
  universityName: string;
  universityNameEn: string;
  facultyName: string;
  facultyNameEn: string;
  postalBox: string;
  postalBoxEn: string;
  email: string;
  logo?: string;
  universityLogo?: string;
  facultyLogo?: string;
  themeColor?: string;
  themeFont?: string;
}

interface PreviewOptions {
  qrCodePosition?: {
    x: number;
    y: number;
  };
}

/**
 * Génère une prévisualisation HTML d'une attestation pour un étudiant
 */
export async function previewAttestation(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: PreviewOptions = {}
): Promise<string | null> {
  try {
    // Générer le QR code
    let qrCodeBase64 = '';
    try {
      // Dans un environnement navigateur, on peut générer le QR code directement
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
      console.error("Erreur lors de la génération du QR code pour la prévisualisation:", qrError);
      // Continuer sans QR code
    }

    // Afficher la prévisualisation en utilisant window.attestationRenderer si disponible
    if (window.attestationRenderer) {
      return await window.attestationRenderer.renderHTML({
        student,
        settings,
        options: {
          ...options,
          qrCodeImage: qrCodeBase64
        }
      });
    } else {
      // Fallback au cas où le renderer n'est pas disponible (mode développement sans Electron)
      return await generateAttestationHTML(student, settings, {
        qrCodeImage: qrCodeBase64,
        qrCodePosition: options.qrCodePosition
      });
    }
  } catch (error) {
    console.error("Erreur lors de la prévisualisation de l'attestation:", error);
    return null;
  }
}

/**
 * Ouvre une nouvelle fenêtre avec la prévisualisation de l'attestation
 */
export async function openAttestationPreview(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: PreviewOptions = {}
): Promise<boolean> {
  try {
    // Générer le HTML de l'attestation
    let htmlContent: string | null = null;
    
    // Utiliser le renderer d'attestations si disponible (Electron)
    if (window.attestationRenderer) {
      htmlContent = await window.attestationRenderer.renderHTML({
        student,
        settings,
        options: {
          ...options,
          qrCodeImage: options.qrCodeImage
        }
      });
    } else {
      // Fallback au cas où le renderer n'est pas disponible
      htmlContent = await generateAttestationHTML(student, settings, {
        qrCodeImage: options.qrCodeImage,
        qrCodePosition: options.qrCodePosition
      });
    }
    
    if (!htmlContent) {
      throw new Error("Impossible de générer le HTML de l'attestation");
    }
    
    // Utiliser l'API IPC pour ouvrir une nouvelle fenêtre avec le contenu HTML
    if (window.ipcRenderer) {
      const success = await window.ipcRenderer.invoke('show-preview', htmlContent, 'Prévisualisation de l\'attestation');
      return success;
    } else {
      throw new Error("L'API IPC n'est pas disponible");
    }
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la prévisualisation de l'attestation:", error);
    return false;
  }
}