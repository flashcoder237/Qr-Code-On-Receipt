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
 * Sanitise les données de l'étudiant en remplaçant les valeurs undefined/null par des chaînes vides
 */
export function sanitizeStudentData(student: StudentExcelRecord): StudentExcelRecord {
  const sanitized = { ...student };
  
  // Liste des champs à sanitiser
  const fieldsToSanitize = [
    'ETABLISSEMENT', 'NOM', 'PRENOM', 'MATRICULE', 'DATE DE NAISSANCE', 'LIEU DE NAISSANCE',
    'PARCOURS', 'SPECIALITE', 'OPTION', 'GRADE', 'MENTION', 'ANNEE ACADEMIQUE',
    'NIVEAU', 'SEMESTRE', 'CYCLE', 'FILIERE', 'FINALITE', 'TOTAL CREDIT', 'DOMAINE',
    'ANNEE D\'OBTENTION', 'DATE JURY'
  ];
  
  fieldsToSanitize.forEach(field => {
    if (sanitized[field] === undefined || sanitized[field] === null || sanitized[field] === '') {
      sanitized[field] = 'N/D'; // Remplacer par "Non Défini"
    }
  });
  
  // Traitement spécial pour la moyenne
  if (sanitized.MOYENNE === undefined || sanitized.MOYENNE === null || sanitized.MOYENNE === '') {
    sanitized.MOYENNE = '0.00';
  }
  
  return sanitized;
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
    
    // Sanitiser les données de l'étudiant
    const sanitizedStudent = sanitizeStudentData(student);
    
    // S'assurer que l'établissement est défini
    if (!sanitizedStudent.ETABLISSEMENT || sanitizedStudent.ETABLISSEMENT === 'N/D') {
      sanitizedStudent.ETABLISSEMENT = 'ETABLISSEMENT NON DEFINI';
    }

    // Contenu visible standard (toujours présent)
    const visibleContent = `Établissement: ${sanitizedStudent.ETABLISSEMENT}
Nom: ${sanitizedStudent.NOM}
Prénom: ${sanitizedStudent.PRENOM}
Matricule: ${sanitizedStudent.MATRICULE}
Date de naissance: ${sanitizedStudent["DATE DE NAISSANCE"]}
Lieu de naissance: ${sanitizedStudent["LIEU DE NAISSANCE"]}`;

    // Contenu spécifique selon le type de document
    let specificContent = '';
    switch (documentType) {
      case 'releve':
        specificContent = `
Niveau: ${sanitizedStudent.NIVEAU}
Semestre: ${sanitizedStudent.SEMESTRE}
Filière: ${sanitizedStudent.FILIERE}
Cycle: ${sanitizedStudent.CYCLE}`;
        break;
      case 'attestation':
        specificContent = `
Parcours: ${sanitizedStudent.PARCOURS}
Spécialité: ${sanitizedStudent.SPECIALITE}
Option: ${sanitizedStudent.OPTION}
Finalité: ${sanitizedStudent.FINALITE}`;
        break;
      case 'diplome':
        specificContent = `
Parcours: ${sanitizedStudent.PARCOURS}
Spécialité: ${sanitizedStudent.SPECIALITE}
Année d'obtention: ${sanitizedStudent["ANNEE D'OBTENTION"]}`;
        break;
    }

    // Informations communes
    const commonContent = `
Moyenne: ${sanitizedStudent.MOYENNE}
Grade: ${sanitizedStudent.GRADE}
Mention: ${sanitizedStudent.MENTION}
Année académique: ${sanitizedStudent["ANNEE ACADEMIQUE"]}`;

    const fullVisibleContent = visibleContent + specificContent + commonContent;

    if (!encryptionEnabled) {
      console.log('📋 QR Code sans chiffrement généré');
      return fullVisibleContent;
    }

    // Chiffrement activé
    try {
      console.log('🔐 Début du processus de chiffrement...');
      const cryptoData = createCryptoDataFromStudent(sanitizedStudent, documentType);
      console.log('📋 Données crypto créées:', Object.keys(cryptoData));
      
      const encryptedData = encryptStudentData(cryptoData, sanitizedStudent.MATRICULE);
      console.log('🔒 Données chiffrées générées, longueur:', encryptedData.length);
      
      const fullQRContent = `${fullVisibleContent}

🔐 DONNÉES SÉCURISÉES:
${encryptedData}
`;
      
      console.log('✅ QR Code avec chiffrement généré');
      return fullQRContent;
    } catch (encryptionError) {
      console.error('❌ Erreur de chiffrement, utilisation du mode non chiffré:', encryptionError);
      return fullVisibleContent + '\n\n⚠️ Erreur de chiffrement - Données non sécurisées';
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
    console.log('📋 Contenu QR généré, longueur:', qrContent.length);
    
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