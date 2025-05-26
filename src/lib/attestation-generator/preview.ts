// src/lib/attestation-generator/preview.ts
import { StudentExcelRecord } from '../helpers/qrcode';
import { generateAttestationHTML } from './html-generator';
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

interface PreviewOptions {
  qrCodePosition?: {
    x: number;
    y: number;
  };
  qrCodeImage?: string; // Base64 encoded QR code image
}

/**
 * Ouvre une nouvelle fenêtre avec la prévisualisation de l'attestation
 * en utilisant la même approche que pour les relevés
 */
export async function openAttestationPreview(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: PreviewOptions = {}
): Promise<boolean> {
  try {
    // Générer ou utiliser un QR code
    let qrCodeBase64 = options.qrCodeImage || '';
    
    if (!qrCodeBase64) {
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
        console.error("Erreur lors de la génération du QR code pour la prévisualisation:", qrError);
        // Continuer sans QR code
      }
    }
    
    // Utiliser le renderer d'attestations dans la fenêtre Electron
    let htmlContent: string | null = null;
    
    if (window.attestationRenderer) {
      // Utiliser le renderer via IPC (méthode préférée en mode Electron)
      htmlContent = await window.attestationRenderer.renderHTML({
        student,
        settings,
        options: {
          ...options,
          qrCodeImage: qrCodeBase64
        }
      });
    } else {
      // Fallback au générateur HTML direct si le renderer n'est pas disponible
      htmlContent = await generateAttestationHTML(student, settings, {
        qrCodeImage: qrCodeBase64,
        qrCodePosition: options.qrCodePosition
      });
    }
    
    if (!htmlContent) {
      throw new Error("Impossible de générer le HTML de l'attestation");
    }
    
    // Utiliser l'API IPC pour ouvrir une nouvelle fenêtre avec le contenu HTML
    // comme pour les relevés
    if (window.ipcRenderer) {
      const success = await window.ipcRenderer.invoke(
        'show-preview', 
        htmlContent, 
        'Prévisualisation de l\'attestation'
      );
      return success;
    } else {
      // Si l'API IPC n'est pas disponible, essayer d'ouvrir une nouvelle fenêtre
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.title = 'Prévisualisation de l\'attestation';
        previewWindow.document.close();
        return true;
      }
      throw new Error("L'API IPC n'est pas disponible");
    }
  } catch (error) {
    console.error("Erreur lors de l'ouverture de la prévisualisation de l'attestation:", error);
    return false;
  }
}