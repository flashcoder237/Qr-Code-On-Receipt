// src/lib/attestation-generator/preview.ts - Version avec support du chiffrement QR
import { StudentExcelRecord, sanitizeStudentData, generateQrCodeBase64 } from '../helpers/qrcode';
import { generateAttestationHTML } from './html-generator';
import { AttestationThemeSettingsPayload } from '../form-schemas/attestation-theme-settings';

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

interface PreviewOptions {
  qrCodePosition?: {
    x: number;
    y: number;
  };
  qrCodeImage?: string; // Base64 encoded QR code image
  theme?: AttestationThemeSettingsPayload;
  encryptionEnabled?: boolean; // Support du chiffrement
}

/**
 * Ouvre une nouvelle fenêtre avec la prévisualisation de l'attestation
 * avec support du chiffrement QR code
 */
export async function openAttestationPreview(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: PreviewOptions = {}
): Promise<boolean> {
  try {
    console.log('🔄 Début de la prévisualisation avec chiffrement:', options.encryptionEnabled);
    
    // Sanitiser les données de l'étudiant
    const sanitizedStudent = sanitizeStudentData(student);
    console.log('🧹 Données étudiant sanitisées');
    
    // Par défaut, le chiffrement est activé sauf indication contraire
    const encryptionEnabled = options.encryptionEnabled !== false;
    console.log(`🔐 Chiffrement: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);
    
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
    
    console.log('📊 Données étudiant pour prévisualisation:', {
      nom: sanitizedStudent.NOM,
      prenom: sanitizedStudent.PRENOM,
      matricule: sanitizedStudent.MATRICULE,
      etablissement: sanitizedStudent.ETABLISSEMENT,
      encryptionEnabled
    });
    
    // Générer ou utiliser un QR code avec chiffrement
    let qrCodeBase64 = options.qrCodeImage || '';
    
    if (!qrCodeBase64 && (settings.theme?.showQRCode !== false)) {
      try {
        console.log(`🔄 Génération QR Code pour prévisualisation (Chiffrement: ${encryptionEnabled})`);
        
        // Utiliser la fonction generateQrCodeBase64 qui supporte le chiffrement
        qrCodeBase64 = await generateQrCodeBase64(sanitizedStudent, 'attestation', encryptionEnabled);
        
        if (encryptionEnabled) {
          console.log('✅ QR Code avec chiffrement généré pour la prévisualisation');
        } else {
          console.log('📋 QR Code sans chiffrement généré pour la prévisualisation');
        }
      } catch (qrError) {
        console.error("❌ Erreur lors de la génération du QR code pour la prévisualisation:", qrError);
        // Continuer sans QR code
        qrCodeBase64 = '';
      }
    }
    
    let htmlContent: string | null = null;
    
    // Approche hybride : essayer d'abord avec le renderer IPC, puis en fallback direct
    if (window.attestationRenderer) {
      try {
        console.log('🔄 Utilisation du renderer IPC pour prévisualisation...');
        htmlContent = await window.attestationRenderer.renderHTML({
          student: sanitizedStudent,
          settings,
          options: {
            ...options,
            qrCodeImage: qrCodeBase64,
            qrCodePosition: safeQrPosition,
            encryptionEnabled: encryptionEnabled
          }
        });
        console.log('✅ HTML généré via IPC pour prévisualisation');
      } catch (ipcError) {
        console.warn("⚠️ Échec du rendu via IPC, utilisation du fallback direct:", ipcError);
        // Continuer avec le fallback
      }
    }
    
    // Si htmlContent n'est pas défini, utiliser directement la fonction de génération HTML
    if (!htmlContent) {
      console.log('🔄 Utilisation du générateur HTML direct pour prévisualisation...');
      htmlContent = await generateAttestationHTML(sanitizedStudent, settings, {
        qrCodeImage: qrCodeBase64,
        qrCodePosition: safeQrPosition,
        theme: options.theme,
        encryptionEnabled: encryptionEnabled
      });
      console.log('✅ HTML généré directement pour prévisualisation');
    }
    
    if (!htmlContent) {
      throw new Error("Aucun contenu HTML généré pour la prévisualisation");
    }
    
    // Ajouter des informations de débogage dans le HTML si en mode développement
    if (process.env.NODE_ENV === 'development') {
      htmlContent = htmlContent.replace('</body>', `
        <div style="position: fixed; bottom: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 5px; font-size: 10px; z-index: 9999; border-radius: 3px;">
          🔐 Chiffrement: ${encryptionEnabled ? 'Activé' : 'Désactivé'}<br>
          📊 Étudiant: ${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM}<br>
          🏢 Établissement: ${sanitizedStudent.ETABLISSEMENT}<br>
          📋 QR Code: ${qrCodeBase64 ? 'Présent' : 'Absent'}
        </div>
      </body>`);
    }
    
    // Ouvrir la prévisualisation
    let success = false;
    
    // Essayer d'abord l'API IPC
    if (window.ipcRenderer) {
      try {
        console.log('🔄 Ouverture de la fenêtre de prévisualisation via IPC...');
        success = await window.ipcRenderer.invoke(
          'show-preview', 
          htmlContent, 
          `Prévisualisation de l'attestation - ${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM} ${encryptionEnabled ? '🔐' : ''}`
        );
        console.log('✅ Fenêtre de prévisualisation ouverte via IPC');
      } catch (showPreviewError) {
        console.warn("⚠️ Échec de l'ouverture via IPC, utilisation du fallback:", showPreviewError);
        // Continuer avec le fallback
      }
    }
    
    // Si l'API IPC n'est pas disponible ou a échoué, essayer d'ouvrir une nouvelle fenêtre
    if (!success) {
      console.log('🔄 Ouverture de la fenêtre de prévisualisation en fallback...');
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.title = `Prévisualisation de l'attestation - ${sanitizedStudent.NOM} ${sanitizedStudent.PRENOM} ${encryptionEnabled ? '🔐' : ''}`;
        previewWindow.document.close();
        success = true;
        console.log('✅ Fenêtre de prévisualisation ouverte en fallback');
      } else {
        throw new Error("Impossible d'ouvrir la fenêtre de prévisualisation. Vérifiez que les popups ne sont pas bloqués.");
      }
    }
    
    console.log('✅ Prévisualisation terminée avec succès');
    console.log(`🔐 Chiffrement QR: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);
    console.log(`📋 QR Code inclus: ${qrCodeBase64 ? 'Oui' : 'Non'}`);
    
    return success;
    
  } catch (error) {
    console.error("❌ Erreur lors de l'ouverture de la prévisualisation de l'attestation:", error);
    return false;
  }
}

/**
 * Version simplifiée pour la compatibilité arrière
 * @deprecated Utilisez openAttestationPreview avec encryptionEnabled dans options
 */
export async function openAttestationPreviewLegacy(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: Omit<PreviewOptions, 'encryptionEnabled'> = {}
): Promise<boolean> {
  console.warn('⚠️ Utilisation de la fonction legacy openAttestationPreviewLegacy. Migrez vers openAttestationPreview avec encryptionEnabled.');
  return openAttestationPreview(student, settings, { ...options, encryptionEnabled: true });
}

/**
 * Fonction utilitaire pour vérifier si le chiffrement est supporté
 */
export function isEncryptionSupported(): boolean {
  try {
    // Vérifier si les APIs nécessaires pour le chiffrement sont disponibles
    return typeof window !== 'undefined' && 
           typeof window.crypto !== 'undefined' && 
           typeof window.crypto.subtle !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Fonction utilitaire pour obtenir les options de chiffrement recommandées
 */
export function getRecommendedEncryptionOptions(): { encryptionEnabled: boolean; reason: string } {
  if (!isEncryptionSupported()) {
    return {
      encryptionEnabled: false,
      reason: "Chiffrement non supporté par le navigateur"
    };
  }
  
  // En production, toujours recommander le chiffrement
  if (process.env.NODE_ENV === 'production') {
    return {
      encryptionEnabled: true,
      reason: "Chiffrement recommandé en production pour la sécurité"
    };
  }
  
  // En développement, permettre le choix mais recommander le chiffrement
  return {
    encryptionEnabled: true,
    reason: "Chiffrement recommandé par défaut"
  };
}