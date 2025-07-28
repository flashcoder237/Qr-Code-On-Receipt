// src/lib/helpers/qrcode.ts - Version corrigée pour navigateur
import QRCode from 'qrcode';
import { 
  createCompactDataFromStudent,
  createCompactQRCodeData,
  formatCompactQRCodeForDisplay,
  PublicData,
  CompactSensitiveData,
  CompactQRCodeData,
  testCompactEncryption
} from '../crypto/compact-encryption';

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
      sanitized[field] = 'N/D';
    }
  });
  
  // Traitement spécial pour la moyenne
  if (sanitized.MOYENNE === undefined || sanitized.MOYENNE === null || sanitized.MOYENNE === '') {
    sanitized.MOYENNE = '0.00';
  }
  
  // Traitement spécial pour la date de naissance - correction du format
  if (sanitized["DATE DE NAISSANCE"] && sanitized["DATE DE NAISSANCE"] !== 'N/D') {
    const dateValue = sanitized["DATE DE NAISSANCE"];
    
    // Si c'est un nombre (numéro de série Excel)
    if (typeof dateValue === 'number') {
      console.log(`🔄 Conversion date Excel pour ${sanitized.MATRICULE}: ${dateValue}`);
      try {
        // Conversion du numéro de série Excel en date
        const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
        const day = String(excelDate.getUTCDate()).padStart(2, "0");
        const month = String(excelDate.getUTCMonth() + 1).padStart(2, "0");
        const year = excelDate.getUTCFullYear();
        sanitized["DATE DE NAISSANCE"] = `${day}/${month}/${year}`;
        console.log(`✅ Date convertie pour ${sanitized.MATRICULE}: ${sanitized["DATE DE NAISSANCE"]}`);
      } catch (error) {
        console.error(`❌ Erreur conversion date pour ${sanitized.MATRICULE}:`, error);
        sanitized["DATE DE NAISSANCE"] = 'N/D';
      }
    } 
    // Si c'est une chaîne, vérifier et corriger le format si nécessaire
    else if (typeof dateValue === 'string') {
      const dateStr = dateValue.toString();
      console.log(`🔍 Vérification format date pour ${sanitized.MATRICULE}: ${dateStr}`);
      
      // Vérifier si le format est déjà correct (DD/MM/YYYY)
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        try {
          // Essayer de parser avec différents formats
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            const day = String(parsedDate.getDate()).padStart(2, "0");
            const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
            const year = parsedDate.getFullYear();
            sanitized["DATE DE NAISSANCE"] = `${day}/${month}/${year}`;
            console.log(`✅ Date reformatée pour ${sanitized.MATRICULE}: ${sanitized["DATE DE NAISSANCE"]}`);
          } else {
            console.warn(`⚠️ Format de date non reconnu pour ${sanitized.MATRICULE}: ${dateStr}`);
          }
        } catch (error) {
          console.error(`❌ Erreur parsing date pour ${sanitized.MATRICULE}:`, error);
        }
      } else {
        console.log(`✅ Date déjà au bon format pour ${sanitized.MATRICULE}: ${dateStr}`);
      }
    }
  }
  
  return sanitized;
}

/**
 * Génère le contenu du QR code avec chiffrement compact
 */
export function getQrCodePayloadWithEncryption(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = false
): string {
  try {
    console.log(`🔄 Génération contenu QR compact pour ${student.MATRICULE} (Chiffrement: ${encryptionEnabled})`);
    
    const sanitizedStudent = sanitizeStudentData(student);
    
    if (!sanitizedStudent.ETABLISSEMENT || sanitizedStudent.ETABLISSEMENT === 'N/D') {
      sanitizedStudent.ETABLISSEMENT = 'ETABLISSEMENT NON DEFINI';
    }

    if (!encryptionEnabled) {
      console.log('📋 QR Code sans chiffrement généré');
      return generateTraditionalQRContent(sanitizedStudent, documentType);
    }

    try {
      console.log('🔐 Début du processus de chiffrement compact...');
      console.log('🔑 Clé basée uniquement sur le matricule:', sanitizedStudent.MATRICULE);
      
      const { publicData, sensitiveData } = createCompactDataFromStudent(sanitizedStudent, documentType);
      console.log('📋 Données séparées en publiques et sensibles');
      console.log('📢 Données publiques (non chiffrées):', Object.keys(publicData));
      console.log('🔒 Données sensibles (chiffrées):', Object.keys(sensitiveData));
      
      const qrData = createCompactQRCodeData(publicData, sensitiveData);
      console.log('🔒 Structure QR avec chiffrement compact créée');
      console.log('📊 Longueur du contenu chiffré:', qrData.encrypted.length, 'caractères');
      
      const formattedContent = formatCompactQRCodeForDisplay(qrData, documentType);
      
      console.log('✅ QR Code avec chiffrement compact généré');
      console.log('📊 Répartition: Données publiques visibles + Données sensibles chiffrées (compact)');
      console.log('📱 Longueur totale du contenu QR:', formattedContent.length, 'caractères');
      return formattedContent;
    } catch (encryptionError) {
      console.error('❌ Erreur de chiffrement compact, utilisation du mode traditionnel:', encryptionError);
      return generateTraditionalQRContent(sanitizedStudent, documentType) + '\n\n⚠️ Erreur de chiffrement - Données en mode traditionnel';
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération du contenu QR compact:', error);
    throw error;
  }
}

/**
 * Génère le contenu QR traditionnel (sans chiffrement) - pour compatibilité
 */
function generateTraditionalQRContent(
  student: StudentExcelRecord,
  documentType: 'releve' | 'attestation' | 'diplome'
): string {
  const visibleContent = `Établissement: ${student.ETABLISSEMENT}
Nom: ${student.NOM}
Prénom: ${student.PRENOM}
Matricule: ${student.MATRICULE}
Date de naissance: ${student["DATE DE NAISSANCE"]}
Lieu de naissance: ${student["LIEU DE NAISSANCE"]}`;

  let specificContent = '';
  switch (documentType) {
    case 'releve':
      specificContent = `
Niveau: ${student.NIVEAU}
Semestre: ${student.SEMESTRE}
Filière: ${student.FILIERE}
Cycle: ${student.CYCLE}`;
      break;
    case 'attestation':
      specificContent = `
Parcours: ${student.PARCOURS}
Spécialité: ${student.SPECIALITE}
Option: ${student.OPTION}
Finalité: ${student.FINALITE}`;
      break;
    case 'diplome':
      specificContent = `
Parcours: ${student.PARCOURS}
Spécialité: ${student.SPECIALITE}
Année d'obtention: ${student["ANNEE D'OBTENTION"]}`;
      break;
  }

  const moyenneNumber = typeof student.MOYENNE === 'number' ? student.MOYENNE : Number(student.MOYENNE);
  const commonContent = `
Moyenne: ${isNaN(moyenneNumber) ? 'N/D' : moyenneNumber.toFixed(2)}
Grade: ${student.GRADE}
Mention: ${student.MENTION}
Année académique: ${student["ANNEE ACADEMIQUE"]}`;

  return visibleContent + specificContent + commonContent;
}

/**
 * Génère un QR code sous forme de base64 avec chiffrement compact
 */
export async function generateQrCodeBase64(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = false
): Promise<string> {
  try {
    console.log(`🔄 Génération QR Code base64 compact pour ${student.MATRICULE}`);
    console.log(`🔐 Mode: ${encryptionEnabled ? 'Chiffrement compact activé' : 'Mode traditionnel'}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    console.log('📋 Contenu QR généré, longueur:', qrContent.length);
    
    if (encryptionEnabled) {
      console.log('📊 Structure: Données publiques visibles + Données sensibles chiffrées (compact)');
      console.log('🔑 Chiffrement basé uniquement sur le matricule');
    }
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ QR Code base64 compact généré (${qrCodeDataUrl.length} caractères)`);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code base64 compact:', error);
    throw error;
  }
}

/**
 * Convertit un data URL en ArrayBuffer
 */
function dataURLToArrayBuffer(dataURL: string): ArrayBuffer {
  const base64 = dataURL.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Génère un QR code sous forme d'ArrayBuffer pour les PDFs avec chiffrement compact
 * VERSION CORRIGÉE POUR NAVIGATEUR
 */
export async function generateQrCode(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = false
): Promise<ArrayBuffer> {
  try {
    console.log(`🔄 Génération QR Code ArrayBuffer compact pour ${student.MATRICULE}`);
    console.log(`🔐 Mode: ${encryptionEnabled ? 'Chiffrement compact activé' : 'Mode traditionnel'}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    
    // Utiliser toDataURL au lieu de toBuffer pour la compatibilité navigateur
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Convertir le data URL en ArrayBuffer
    const arrayBuffer = dataURLToArrayBuffer(qrCodeDataUrl);
    
    console.log(`✅ QR Code ArrayBuffer compact généré (${arrayBuffer.byteLength} bytes)`);
    return arrayBuffer;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code ArrayBuffer compact:', error);
    throw error;
  }
}

/**
 * VERSION ALTERNATIVE: Génère directement un Blob pour les PDFs
 */
export async function generateQrCodeBlob(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = false
): Promise<Blob> {
  try {
    console.log(`🔄 Génération QR Code Blob pour ${student.MATRICULE}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Convertir en Blob
    const response = await fetch(qrCodeDataUrl);
    const blob = await response.blob();
    
    console.log(`✅ QR Code Blob généré (${blob.size} bytes)`);
    return blob;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code Blob:', error);
    throw error;
  }
}

/**
 * VERSION CANVAS: Génère une image via Canvas (plus efficace)
 */
export async function generateQrCodeCanvas(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = false
): Promise<{ canvas: HTMLCanvasElement; arrayBuffer: ArrayBuffer }> {
  try {
    console.log(`🔄 Génération QR Code Canvas pour ${student.MATRICULE}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    
    // Créer un canvas
    const canvas = document.createElement('canvas');
    
    // Générer le QR code directement sur le canvas
    await QRCode.toCanvas(canvas, qrContent, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Convertir le canvas en ArrayBuffer
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Impossible de créer le blob depuis le canvas'));
        }
      }, 'image/png');
    });
    
    const arrayBuffer = await blob.arrayBuffer();
    
    console.log(`✅ QR Code Canvas généré (${arrayBuffer.byteLength} bytes)`);
    return { canvas, arrayBuffer };
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code Canvas:', error);
    throw error;
  }
}

/**
 * Fonction de test pour le chiffrement compact
 */
export function testStudentEncryptionCompact(student: StudentExcelRecord, documentType: 'releve' | 'attestation' | 'diplome'): boolean {
  try {
    console.log('🧪 Test de génération QR avec chiffrement compact...');
    console.log('🔑 Chiffrement basé uniquement sur le matricule:', student.MATRICULE);
    console.log('🔐 Données sensibles chiffrées: matricule complet, date naissance, lieu naissance, moyenne, timestamp');
    console.log('📢 Données publiques visibles: établissement, nom, prénom, grade, mention, informations académiques de base');
    
    const sanitizedStudent = sanitizeStudentData(student);
    const { publicData, sensitiveData } = createCompactDataFromStudent(sanitizedStudent, documentType);
    
    console.log('📋 Données publiques générées:', Object.keys(publicData));
    console.log('🔒 Données sensibles générées:', Object.keys(sensitiveData));
    
    const testResult = testCompactEncryption(publicData, sensitiveData);
    
    if (testResult) {
      console.log('✅ Test de chiffrement compact réussi');
      console.log('📊 Répartition confirmée: Données publiques lisibles + Données sensibles sécurisées (compact)');
      console.log('🔑 Clé basée uniquement sur:', sensitiveData.m);
    } else {
      console.log('❌ Test de chiffrement compact échoué');
    }
    
    return testResult;
  } catch (error) {
    console.error('❌ Test QR compact échoué:', error);
    return false;
  }
}

/**
 * Export pour compatibilité avec l'ancien système
 * @deprecated Utilisez createCompactDataFromStudent
 */
export { createCompactDataFromStudent as createCryptoDataFromStudent } from '../crypto/compact-encryption';

/**
 * Export des types pour utilisation externe
 */
export type { PublicData, CompactSensitiveData, CompactQRCodeData } from '../crypto/compact-encryption';

/**
 * Fonction utilitaire pour obtenir un aperçu de la répartition des données
 */
export function getDataDistributionInfo(
  student: StudentExcelRecord,
  documentType: 'releve' | 'attestation' | 'diplome'
): {
  publicFields: string[];
  sensitiveFields: string[];
  documentType: string;
  encryptionMethod: string;
  keySource: string;
  estimatedEncryptedSize: string;
} {
  const { publicData, sensitiveData } = createCompactDataFromStudent(student, documentType);
  
  return {
    publicFields: Object.keys(publicData).filter(key => publicData[key] !== 'N/D'),
    sensitiveFields: Object.keys(sensitiveData),
    documentType,
    encryptionMethod: 'AES-128-ECB',
    keySource: 'Matricule étudiant',
    estimatedEncryptedSize: '50-80 caractères'
  };
}

/**
 * Fonction utilitaire pour obtenir des statistiques sur la taille du QR code
 */
export function getQRCodeSizeEstimate(
  student: StudentExcelRecord,
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = false
): {
  totalContentLength: number;
  publicDataLength: number;
  encryptedDataLength: number;
  estimatedQRSize: 'Small' | 'Medium' | 'Large';
  recommendations: string[];
} {
  const content = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
  const { publicData, sensitiveData } = createCompactDataFromStudent(student, documentType);
  
  const publicContent = Object.values(publicData).join(' ');
  const encryptedLength = encryptionEnabled ? 
    (sensitiveData ? 60 : 0) :
    Object.values(sensitiveData || {}).join(' ').length;
  
  const totalLength = content.length;
  
  let estimatedQRSize: 'Small' | 'Medium' | 'Large';
  const recommendations: string[] = [];
  
  if (totalLength < 300) {
    estimatedQRSize = 'Small';
    recommendations.push('✅ Taille optimale pour QR codes');
  } else if (totalLength < 600) {
    estimatedQRSize = 'Medium';
    recommendations.push('⚠️ Taille moyenne - QR code lisible');
  } else {
    estimatedQRSize = 'Large';
    recommendations.push('❌ QR code volumineux - risque de lisibilité');
    recommendations.push('💡 Considérer réduire les données publiques');
  }
  
  if (encryptionEnabled) {
    recommendations.push('🔐 Chiffrement compact activé - taille optimisée');
  } else {
    recommendations.push('📋 Mode sans chiffrement - taille plus importante');
  }
  
  return {
    totalContentLength: totalLength,
    publicDataLength: publicContent.length,
    encryptedDataLength: encryptedLength,
    estimatedQRSize,
    recommendations
  };
}