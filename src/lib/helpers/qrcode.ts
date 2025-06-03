// src/lib/helpers/qrcode.ts - Version mise à jour avec chiffrement sélectif
import QRCode from 'qrcode';
import { 
  createSelectiveDataFromStudent,
  createSelectiveQRCodeData,
  formatSelectiveQRCodeForDisplay,
  PublicData,
  SensitiveData,
  QRCodeData,
  testSelectiveEncryption
} from '../crypto/selective-encryption';

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
 * Génère le contenu du QR code avec chiffrement sélectif
 * NOUVELLES RÈGLES :
 * - Données publiques (non chiffrées): établissement, nom, prénom, grade, mention, informations académiques de base
 * - Données sensibles (chiffrées): matricule_complet, date_naissance_complete, lieu_naissance_precis, moyenne_exacte, credits_details, timestamp_generation
 */
export function getQrCodePayloadWithEncryption(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): string {
  try {
    console.log(`🔄 Génération contenu QR sélectif pour ${student.MATRICULE} (Chiffrement: ${encryptionEnabled})`);
    
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

    // Mode avec chiffrement sélectif
    try {
      console.log('🔐 Début du processus de chiffrement sélectif...');
      
      // Créer les données publiques et sensibles selon les nouvelles règles
      const { publicData, sensitiveData } = createSelectiveDataFromStudent(sanitizedStudent, documentType);
      console.log('📋 Données séparées en publiques et sensibles');
      console.log('📢 Données publiques (non chiffrées):', Object.keys(publicData));
      console.log('🔒 Données sensibles (chiffrées):', Object.keys(sensitiveData));
      
      // Créer la structure QR avec chiffrement sélectif
      const qrData = createSelectiveQRCodeData(publicData, sensitiveData);
      console.log('🔒 Structure QR avec chiffrement sélectif créée');
      
      // Formater pour affichage avec section claire des données publiques
      const formattedContent = formatSelectiveQRForDisplayWithSeparation(qrData, documentType);
      
      console.log('✅ QR Code avec chiffrement sélectif généré');
      console.log('📊 Répartition: Données publiques visibles + Données sensibles chiffrées');
      return formattedContent;
    } catch (encryptionError) {
      console.error('❌ Erreur de chiffrement sélectif, utilisation du mode traditionnel:', encryptionError);
      return generateTraditionalQRContent(sanitizedStudent, documentType) + '\n\n⚠️ Erreur de chiffrement - Données en mode traditionnel';
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération du contenu QR sélectif:', error);
    throw error;
  }
}

/**
 * Formate le QR code avec séparation claire entre données publiques et chiffrées
 */
function formatSelectiveQRForDisplayWithSeparation(
  qrData: QRCodeData, 
  documentType: 'releve' | 'attestation' | 'diplome'
): string {
  // Section des informations publiques (toujours visibles)
  let publicSection = `📋 INFORMATIONS PUBLIQUES:
Établissement: ${qrData.public.etablissement}
Nom: ${qrData.public.nom}
Prénom: ${qrData.public.prenom}`;

  // Ajouter les informations académiques publiques selon le type de document
  if (documentType === 'releve') {
    if (qrData.public.niveau) publicSection += `\nNiveau: ${qrData.public.niveau}`;
    if (qrData.public.semestre) publicSection += `\nSemestre: ${qrData.public.semestre}`;
    if (qrData.public.filiere) publicSection += `\nFilière: ${qrData.public.filiere}`;
    if (qrData.public.cycle) publicSection += `\nCycle: ${qrData.public.cycle}`;
  } else if (documentType === 'attestation' || documentType === 'diplome') {
    if (qrData.public.parcours) publicSection += `\nParcours: ${qrData.public.parcours}`;
    if (qrData.public.specialite) publicSection += `\nSpécialité: ${qrData.public.specialite}`;
    if (qrData.public.domaine) publicSection += `\nDomaine: ${qrData.public.domaine}`;
    if (qrData.public.finalite) publicSection += `\nFinalité: ${qrData.public.finalite}`;
  }

  // Informations générales publiques
  if (qrData.public.anneeAcademique) publicSection += `\nAnnée académique: ${qrData.public.anneeAcademique}`;
  if (qrData.public.grade) publicSection += `\nGrade: ${qrData.public.grade}`;
  if (qrData.public.mention) publicSection += `\nMention: ${qrData.public.mention}`;

  // Section des données chiffrées
  const encryptedSection = `

🔐 DONNÉES SENSIBLES CHIFFRÉES:
Les informations suivantes sont sécurisées :
• Matricule complet
• Date de naissance complète  
• Lieu de naissance précis
• Moyenne exacte
• Détails des crédits
• Horodatage de génération

Données chiffrées: ${qrData.encrypted}`;

  // Section de vérification
  const verificationSection = `

🔍 Vérification: ${qrData.verification}
📱 Scanner avec l'app mobile officielle pour accéder aux détails complets et déchiffrer les données sensibles.`;

  return publicSection + encryptedSection + verificationSection;
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
 * Génère un QR code sous forme de base64 avec chiffrement sélectif
 */
export async function generateQrCodeBase64(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): Promise<string> {
  try {
    console.log(`🔄 Génération QR Code base64 sélectif pour ${student.MATRICULE}`);
    console.log(`🔐 Mode: ${encryptionEnabled ? 'Chiffrement sélectif activé' : 'Mode traditionnel'}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    console.log('📋 Contenu QR généré, longueur:', qrContent.length);
    
    if (encryptionEnabled) {
      console.log('📊 Structure: Données publiques visibles + Données sensibles chiffrées');
    }
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H', // Niveau élevé pour supporter plus de données
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
 * Génère un QR code sous forme d'ArrayBuffer pour les PDFs avec chiffrement sélectif
 */
export async function generateQrCode(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true
): Promise<ArrayBuffer> {
  try {
    console.log(`🔄 Génération QR Code ArrayBuffer sélectif pour ${student.MATRICULE}`);
    console.log(`🔐 Mode: ${encryptionEnabled ? 'Chiffrement sélectif activé' : 'Mode traditionnel'}`);
    
    const qrContent = getQrCodePayloadWithEncryption(student, documentType, encryptionEnabled);
    
    const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
      errorCorrectionLevel: 'H', // Niveau élevé pour supporter plus de données
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
 * Fonction de test pour le chiffrement sélectif
 */
export function testStudentEncryptionSelective(student: StudentExcelRecord, documentType: 'releve' | 'attestation' | 'diplome'): boolean {
  try {
    console.log('🧪 Test de génération QR avec chiffrement sélectif...');
    console.log('🔐 Données sensibles chiffrées: matricule_complet, date_naissance_complete, lieu_naissance_precis, moyenne_exacte, credits_details, timestamp_generation');
    console.log('📢 Données publiques visibles: établissement, nom, prénom, grade, mention, informations académiques de base');
    
    const sanitizedStudent = sanitizeStudentData(student);
    const { publicData, sensitiveData } = createSelectiveDataFromStudent(sanitizedStudent, documentType);
    
    console.log('📋 Données publiques générées:', Object.keys(publicData));
    console.log('🔒 Données sensibles générées:', Object.keys(sensitiveData));
    
    const testResult = testSelectiveEncryption(publicData, sensitiveData);
    
    if (testResult) {
      console.log('✅ Test de chiffrement sélectif réussi');
      console.log('📊 Répartition confirmée: Données publiques lisibles + Données sensibles sécurisées');
    } else {
      console.log('❌ Test de chiffrement sélectif échoué');
    }
    
    return testResult;
  } catch (error) {
    console.error('❌ Test QR sélectif échoué:', error);
    return false;
  }
}

/**
 * Export pour compatibilité avec l'ancien système
 * @deprecated Utilisez createSelectiveDataFromStudent
 */
export { createSelectiveDataFromStudent as createCryptoDataFromStudent } from '../crypto/selective-encryption';

/**
 * Export des types pour utilisation externe
 */
export type { PublicData, SensitiveData, QRCodeData } from '../crypto/selective-encryption';

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
} {
  const { publicData, sensitiveData } = createSelectiveDataFromStudent(student, documentType);
  
  return {
    publicFields: Object.keys(publicData).filter(key => publicData[key] !== 'N/D'),
    sensitiveFields: Object.keys(sensitiveData),
    documentType,
    encryptionMethod: 'AES-256-CBC (Sélectif)'
  };
}