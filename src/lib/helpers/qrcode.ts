// src/lib/helpers/qrcode.ts - Version corrigée avec chiffrement fonctionnel
import QRCode from 'qrcode';
import { 
  createCryptoDataFromStudent, 
  encryptStudentData, 
  StudentCryptoData 
} from '../crypto/encryption';

export interface StudentExcelRecord {
  ETABLISSEMENT?: string;
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  PARCOURS?: string;
  SPECIALITE?: string;
  OPTION?: string;
  MOYENNE?: number | string;
  GRADE?: string;
  MENTION?: string;
  "ANNEE ACADEMIQUE"?: string;
  NIVEAU?: string;
  SEMESTRE?: string;
  CYCLE?: string;
  FILIERE?: string;
  FINALITE?: string;
  "TOTAL CREDIT"?: string;
  DOMAINE?: string;
  "ANNEE D'OBTENTION"?: string;
  "DATE JURY"?: string;
  [key: string]: any;
}

/**
 * Génère le contenu du QR code avec ou sans chiffrement
 */
export function getQrCodePayloadWithEncryption(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): string {
  try {
    console.log(`🔄 Génération contenu QR pour ${student.MATRICULE} (Chiffrement: ${encryptionEnabled})`);
    
    // S'assurer que l'établissement est défini
    const studentWithEstablishment = {
      ...student,
      ETABLISSEMENT: student.ETABLISSEMENT || 'ETABLISSEMENT NON DEFINI'
    };

    // Contenu visible standard (toujours présent)
    const visibleContent = `Établissement: ${studentWithEstablishment.ETABLISSEMENT}
Nom: ${studentWithEstablishment.NOM}
Prénom: ${studentWithEstablishment.PRENOM}
Matricule: ${studentWithEstablishment.MATRICULE}
Date de naissance: ${studentWithEstablishment["DATE DE NAISSANCE"]}
Lieu de naissance: ${studentWithEstablishment["LIEU DE NAISSANCE"]}`;

    // Contenu spécifique selon le type de document
    let specificContent = '';
    switch (documentType) {
      case 'releve':
        specificContent = `
Niveau: ${studentWithEstablishment.NIVEAU || ''}
Semestre: ${studentWithEstablishment.SEMESTRE || ''}
Filière: ${studentWithEstablishment.FILIERE || ''}
Cycle: ${studentWithEstablishment.CYCLE || ''}`;
        break;
      case 'attestation':
        specificContent = `
Parcours: ${studentWithEstablishment.PARCOURS || ''}
Spécialité: ${studentWithEstablishment.SPECIALITE || ''}
Option: ${studentWithEstablishment.OPTION || ''}
Finalité: ${studentWithEstablishment.FINALITE || ''}`;
        break;
      case 'diplome':
        specificContent = `
Parcours: ${studentWithEstablishment.PARCOURS || ''}
Spécialité: ${studentWithEstablishment.SPECIALITE || ''}
Année d'obtention: ${studentWithEstablishment["ANNEE D'OBTENTION"] || ''}`;
        break;
    }

    // Informations communes
    const commonContent = `
Moyenne: ${studentWithEstablishment.MOYENNE || ''}
Grade: ${studentWithEstablishment.GRADE || ''}
Mention: ${studentWithEstablishment.MENTION || ''}
Année académique: ${studentWithEstablishment["ANNEE ACADEMIQUE"] || ''}`;

    const fullVisibleContent = visibleContent + specificContent + commonContent;

    if (!encryptionEnabled) {
      console.log('📋 QR Code sans chiffrement généré');
      return fullVisibleContent;
    }

    // Chiffrement activé
    try {
      const cryptoData = createCryptoDataFromStudent(studentWithEstablishment, documentType);
      const encryptedData = encryptStudentData(cryptoData, studentWithEstablishment.MATRICULE);
      
      const fullQRContent = `${fullVisibleContent}

🔐 Données sécurisées: ${encryptedData}`;
      
      console.log('🔐 QR Code avec chiffrement généré');
      return fullQRContent;
    } catch (encryptionError) {
      console.error('❌ Erreur de chiffrement, utilisation du mode non chiffré:', encryptionError);
      return fullVisibleContent;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération du contenu QR:', error);
    throw error;
  }
}

/**
 * Génère un QR code sous forme de base64 avec support du chiffrement
 */
export async function generateQrCodeBase64(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): Promise<string> {
  try {
    console.log(`🔄 Génération QR Code base64 pour ${student.MATRICULE}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ QR Code base64 généré (${qrCodeDataUrl.length} caractères)`);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code base64:', error);
    throw error;
  }
}

/**
 * Génère un QR code sous forme d'ArrayBuffer pour les PDFs
 */
export async function generateQrCode(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): Promise<ArrayBuffer> {
  try {
    console.log(`🔄 Génération QR Code ArrayBuffer pour ${student.MATRICULE}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    
    const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ QR Code ArrayBuffer généré (${qrCodeBuffer.length} bytes)`);
    return qrCodeBuffer.buffer.slice(
      qrCodeBuffer.byteOffset,
      qrCodeBuffer.byteOffset + qrCodeBuffer.byteLength
    );
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code ArrayBuffer:', error);
    throw error;
  }
}

/**
 * Version simplifiée pour compatibilité descendante
 */
export { createCryptoDataFromStudent } from '../crypto/encryption';