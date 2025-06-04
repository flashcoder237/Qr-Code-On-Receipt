// src/lib/helpers/qrcode.ts - Version mise à jour avec chiffrement compact
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
 * Génère le contenu du QR code avec chiffrement compact
 * NOUVELLES RÈGLES :
 * - Chiffrement basé uniquement sur le matricule
 * - Contenu chiffré très court (50-80 caractères typiquement)
 * - Données publiques visibles, données sensibles chiffrées
 */
export function getQrCodePayloadWithEncryption(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): string {
  try {
    console.log(`🔄 Génération contenu QR compact pour ${student.MATRICULE} (Chiffrement: ${encryptionEnabled})`);
    
    // Sanitiser les données de l'étudiant
    const sanitizedStudent = sanitizeStudentData(student);
    
    // S'assurer que l'établissement est défini
    if (!sanitizedStudent.ETABLISSEMENT || sanitizedStudent.ETABLISSEMENT === 'N/D') {
      sanitizedStudent.ETABLISSEMENT = 'ETABLISSEMENT NON DEFINI';
    }

    if (!encryptionEnabled) {
      // Mode sans chiffrement - affichage traditionnel
      console.log('📋 QR Code sans chiffrement généré');
      return generateTraditionalQRContent(sanitizedStudent, documentType);
    }

    // Mode avec chiffrement compact
    try {
      console.log('🔐 Début du processus de chiffrement compact...');
      console.log('🔑 Clé basée uniquement sur le matricule:', sanitizedStudent.MATRICULE);
      
      // Créer les données publiques et sensibles selon les nouvelles règles
      const { publicData, sensitiveData } = createCompactDataFromStudent(sanitizedStudent, documentType);
      console.log('📋 Données séparées en publiques et sensibles');
      console.log('📢 Données publiques (non chiffrées):', Object.keys(publicData));
      console.log('🔒 Données sensibles (chiffrées):', Object.keys(sensitiveData));
      
      // Créer la structure QR avec chiffrement compact
      const qrData = createCompactQRCodeData(publicData, sensitiveData);
      console.log('🔒 Structure QR avec chiffrement compact créée');
      console.log('📊 Longueur du contenu chiffré:', qrData.encrypted.length, 'caractères');
      
      // Formater pour affichage avec section claire des données publiques
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
  // Contenu visible standard
  const visibleContent = `Établissement: ${student.ETABLISSEMENT}
Nom: ${student.NOM}
Prénom: ${student.PRENOM}
Matricule: ${student.MATRICULE}
Date de naissance: ${student["DATE DE NAISSANCE"]}
Lieu de naissance: ${student["LIEU DE NAISSANCE"]}`;

  // Contenu spécifique selon le type de document
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

  // Informations communes
  const commonContent = `
Moyenne: ${student.MOYENNE}
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
  encryptionEnabled: boolean = true
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
      errorCorrectionLevel: 'M', // Niveau moyen (au lieu de H) pour QR plus compact
      margin: 1, // Marge réduite pour compacité
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
 * Génère un QR code sous forme d'ArrayBuffer pour les PDFs avec chiffrement compact
 */
export async function generateQrCode(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): Promise<ArrayBuffer> {
  try {
    console.log(`🔄 Génération QR Code ArrayBuffer compact pour ${student.MATRICULE}`);
    console.log(`🔐 Mode: ${encryptionEnabled ? 'Chiffrement compact activé' : 'Mode traditionnel'}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    
    const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
      errorCorrectionLevel: 'M', // Niveau moyen pour optimiser la taille
      margin: 1, // Marge réduite
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ QR Code ArrayBuffer compact généré (${qrCodeBuffer.length} bytes)`);
    return qrCodeBuffer.buffer.slice(
      qrCodeBuffer.byteOffset,
      qrCodeBuffer.byteOffset + qrCodeBuffer.byteLength
    );
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code ArrayBuffer compact:', error);
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
    keySource: 'xxxxxxxxxx',
    estimatedEncryptedSize: '50-80 caractères'
  };
}

/**
 * Fonction utilitaire pour obtenir des statistiques sur la taille du QR code
 */
export function getQRCodeSizeEstimate(
  student: StudentExcelRecord,
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): {
  totalContentLength: number;
  publicDataLength: number;
  encryptedDataLength: number;
  estimatedQRSize: 'Small' | 'Medium' | 'Large';
  recommendations: string[];
} {
  const content = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
  const { publicData, sensitiveData } = createCompactDataFromStudent(student, documentType);
  
  // Estimer les longueurs
  const publicContent = Object.values(publicData).join(' ');
  const encryptedLength = encryptionEnabled ? 
    (sensitiveData ? 60 : 0) : // Estimation compact
    Object.values(sensitiveData || {}).join(' ').length;
  
  const totalLength = content.length;
  
  // Déterminer la taille estimée du QR code
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