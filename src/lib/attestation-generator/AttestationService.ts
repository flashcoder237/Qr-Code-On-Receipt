// src/lib/attestation-generator/AttestationService.ts - Version mise à jour avec chiffrement
import { StudentExcelRecord } from '../helpers/qrcode';
import { generateAttestationHTML } from './html-generator';
import { generateAttestationPDF } from './html-to-pdf';
import { generateQrCodeBase64 } from '../helpers/qrcode';
import { encryptStudentData, StudentCryptoData } from '../crypto/encryption';

/**
 * Service centralisé pour la gestion des attestations avec support du chiffrement
 */
export class AttestationService {
  /**
   * Génère un code QR pour une attestation avec chiffrement
   */
  public static async generateQRCode(
    student: StudentExcelRecord, 
    schoolSettings: any,
    includeEncryption: boolean = true
  ): Promise<string> {
    try {
      return await generateQrCodeBase64(student, 'attestation', includeEncryption);
    } catch (error) {
      console.error("Erreur lors de la génération du QR code:", error);
      throw new Error(`Échec de génération du QR code: ${error.message}`);
    }
  }

  /**
   * Génère les données chiffrées pour une attestation
   */
  public static generateEncryptedData(student: StudentExcelRecord, schoolSettings: any): string {
    try {
      const cryptoData: StudentCryptoData = {
        etablissement: schoolSettings.nameFrench || student.ETABLISSEMENT,
        nom: student.NOM,
        prenom: student.PRENOM,
        matricule: student.MATRICULE,
        dateDeNaissance: student["DATE DE NAISSANCE"],
        lieuDeNaissance: student["LIEU DE NAISSANCE"],
        parcours: student.PARCOURS || "",
        specialite: student.SPECIALITE || "",
        option: student.OPTION || "",
        moyenne: student.MOYENNE,
        grade: student.GRADE,
        mention: student.MENTION,
        anneeAcademique: student["ANNEE ACADEMIQUE"],
        finalite: student.FINALITE || "",
        totalCredit: student["TOTAL CREDIT"] || "",
        domaine: student.DOMAINE || ""
      };

      return encryptStudentData(cryptoData, student.MATRICULE);
    } catch (error) {
      console.error("Erreur lors du chiffrement des données:", error);
      throw new Error(`Échec du chiffrement: ${error.message}`);
    }
  }

  /**
   * Crée le contenu QR complet avec données visibles et chiffrées
   */
  public static createQRContent(student: StudentExcelRecord, schoolSettings: any): string {
    // Partie visible
    const visibleContent = `Établissement: ${schoolSettings.nameFrench || student.ETABLISSEMENT}
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

    // Partie chiffrée
    const encryptedData = this.generateEncryptedData(student, schoolSettings);
    
    return `${visibleContent}

Informations cryptées: CRPY-${encryptedData}`;
  }

  /**
   * Prévisualise une attestation avec QR code chiffré
   */
  public static async previewAttestation(
    student: StudentExcelRecord, 
    settings: any, 
    options: any = {}
  ): Promise<boolean> {
    try {
      // Générer le QR code avec chiffrement si non fourni
      if (!options.qrCodeImage) {
        options.qrCodeImage = await this.generateQRCode(student, settings, true);
      }
      
      // Générer le HTML pour l'attestation
      let htmlContent: string;
      
      // Approche hybride : essayer d'abord avec le renderer IPC
      if (window.attestationRenderer) {
        try {
          htmlContent = await window.attestationRenderer.renderHTML({
            student,
            settings,
            options
          });
        } catch (error) {
          console.warn("Échec du rendu via IPC, utilisation du fallback direct:", error);
          htmlContent = await generateAttestationHTML(student, settings, options);
        }
      } else {
        htmlContent = await generateAttestationHTML(student, settings, options);
      }
      
      if (!htmlContent) {
        throw new Error("Aucun contenu HTML généré pour l'attestation");
      }
      
      // Ouvrir la prévisualisation
      let success = false;
      
      // Essayer d'abord l'API IPC (Electron)
      if (window.ipcRenderer) {
        try {
          success = await window.ipcRenderer.invoke(
            'show-preview', 
            htmlContent, 
            'Prévisualisation de l\'attestation'
          );
        } catch (error) {
          console.warn("Échec de l'ouverture via IPC, utilisation du fallback:", error);
        }
      }
      
      // Fallback: ouvrir dans une nouvelle fenêtre de navigateur
      if (!success) {
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(htmlContent);
          previewWindow.document.title = 'Prévisualisation de l\'attestation';
          previewWindow.document.close();
          success = true;
        } else {
          throw new Error("Impossible d'ouvrir la fenêtre de prévisualisation. Les popups peuvent être bloqués.");
        }
      }
      
      return success;
    } catch (error) {
      console.error("Erreur lors de la prévisualisation de l'attestation:", error);
      throw error;
    }
  }

  /**
   * Génère un PDF d'attestation avec QR code chiffré
   */
  public static async generatePDF(
    student: StudentExcelRecord, 
    settings: any, 
    options: any = {}
  ): Promise<Uint8Array> {
    try {
      // Générer le QR code avec chiffrement si non fourni
      if (!options.qrCodeImage) {
        const qrCodeBase64 = await this.generateQRCode(student, settings, true);
        // Convertir le base64 en ArrayBuffer
        const qrCodeData = qrCodeBase64.split(',')[1];
        options.qrCodeImage = Buffer.from(qrCodeData, 'base64');
      }
      
      // Utiliser l'API IPC pour générer le PDF (Electron)
      if (window.ipcRenderer) {
        try {
          const params = { student, settings, options };
          return await window.ipcRenderer.invoke('generate-attestation-pdf', params);
        } catch (error) {
          console.warn("Échec de la génération via IPC, utilisation du fallback direct:", error);
        }
      }
      
      // Fallback: utiliser le générateur direct
      return await generateAttestationPDF(student, settings, options);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF d'attestation:", error);
      throw error;
    }
  }

  /**
   * Génère plusieurs attestations en lot avec QR codes chiffrés
   */
  public static async generateBatch(
    students: StudentExcelRecord[], 
    settings: any, 
    options: any = {},
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<Blob> {
    try {
      // Importer JSZip dynamiquement pour éviter les problèmes dans les environnements non-Node
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      let processedCount = 0;
      const total = students.length;
      
      for (const student of students) {
        try {
          // Générer le PDF pour cet étudiant avec QR code chiffré
          const pdfBytes = await this.generatePDF(student, settings, options);
          
          // Ajouter au ZIP avec un nom de fichier approprié
          const sanitizedName = this.sanitizeFileName(student.NOM);
          const sanitizedFirstName = this.sanitizeFileName(student.PRENOM);
          const fileName = `${student.MATRICULE}_${sanitizedName}_${sanitizedFirstName}_Attestation.pdf`;
          
          zip.file(fileName, pdfBytes);
          
          // Mettre à jour la progression
          processedCount++;
          if (onProgress) {
            onProgress((processedCount / total) * 100, processedCount, total);
          }
        } catch (error) {
          console.error(`Erreur lors de la génération de l'attestation pour ${student.MATRICULE}:`, error);
          // Continuer avec l'étudiant suivant plutôt que d'interrompre le lot entier
        }
      }
      
      // Générer le ZIP
      return await zip.generateAsync({ type: "blob" });
    } catch (error) {
      console.error("Erreur lors de la génération par lot des attestations:", error);
      throw error;
    }
  }
  
  /**
   * Sanitize un nom de fichier en retirant les caractères spéciaux
   */
  private static sanitizeFileName(fileName: string): string {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]/gi, '_')     // Remplacer les caractères spéciaux par des underscores
      .replace(/_+/g, '_')             // Remplacer les multiples underscores par un seul
      .replace(/^_|_$/g, '')           // Enlever les underscores au début et à la fin
      .toLowerCase();
  }

  /**
   * Méthode utilitaire pour tester le chiffrement/déchiffrement
   */
  public static testEncryption(student: StudentExcelRecord, settings: any): boolean {
    try {
      const encryptedData = this.generateEncryptedData(student, settings);
      console.log('Données chiffrées générées:', encryptedData.substring(0, 50) + '...');
      
      // Pour tester le déchiffrement, vous devrez implémenter cette fonction
      // dans votre application mobile
      return true;
    } catch (error) {
      console.error('Test de chiffrement échoué:', error);
      return false;
    }
  }
}