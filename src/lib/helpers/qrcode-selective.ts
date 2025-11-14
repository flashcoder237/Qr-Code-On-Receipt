// src/lib/helpers/qrcode-selective.ts - Version avec chiffrement sélectif
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
 * Seules les données sensibles sont chiffrées, le reste reste en clair
 */
export function getQrCodePayloadWithSelectiveEncryption(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true,
  displaySessions: boolean = true
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
      return generateTraditionalQRContent(sanitizedStudent, documentType, displaySessions);
    }

    // Mode avec chiffrement sélectif
    try {
      console.log('🔐 Début du processus de chiffrement sélectif...');
      
      // Créer les données publiques et sensibles
      const { publicData, sensitiveData } = createSelectiveDataFromStudent(sanitizedStudent, documentType, displaySessions);
      console.log('📋 Données séparées en publiques et sensibles');
      console.log('📢 Données publiques:', Object.keys(publicData));
      console.log('🔒 Données sensibles:', Object.keys(sensitiveData));
      
      // Créer la structure QR avec chiffrement sélectif
      const qrData = createSelectiveQRCodeData(publicData, sensitiveData);
      console.log('🔒 Structure QR avec chiffrement sélectif créée');
      
      // Formater pour affichage
      const formattedContent = formatSelectiveQRCodeForDisplay(qrData, displaySessions);
      
      console.log('✅ QR Code avec chiffrement sélectif généré');
      return formattedContent;
    } catch (encryptionError) {
      console.error('❌ Erreur de chiffrement sélectif, utilisation du mode traditionnel:', encryptionError);
      return generateTraditionalQRContent(sanitizedStudent, documentType, displaySessions) + '\n\n⚠️ Erreur de chiffrement - Données en mode traditionnel';
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération du contenu QR sélectif:', error);
    throw error;
  }
}

/**
 * Génère le contenu QR traditionnel (sans chiffrement)
 */
function generateTraditionalQRContent(
  student: StudentExcelRecord,
  documentType: 'releve' | 'attestation' | 'diplome',
  displaySessions: boolean = true
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
Niveau: ${student.NIVEAU}${displaySessions ? `
Semestre: ${student.SEMESTRE}` : ''}
Filière: ${student.FILIERE}
Option: ${student.OPTION}
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
export async function generateQrCodeBase64WithSelectiveEncryption(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true,
  displaySessions: boolean = true
): Promise<string> {
  try {
    console.log(`🔄 Génération QR Code base64 sélectif pour ${student.MATRICULE}`);
    
    const qrContent = getQrCodePayloadWithSelectiveEncryption(student, documentType, encryptionEnabled, displaySessions);
    console.log('📋 Contenu QR sélectif généré, longueur:', qrContent.length);
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 800, // Augmenté de 300 à 800 pour une meilleure qualité
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ QR Code base64 sélectif généré (${qrCodeDataUrl.length} caractères)`);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code base64 sélectif:', error);
    throw error;
  }
}

/**
 * Génère un QR code sous forme d'ArrayBuffer pour les PDFs avec chiffrement sélectif
 */
export async function generateQrCodeWithSelectiveEncryption(
  student: StudentExcelRecord, 
  documentType: 'releve' | 'attestation' | 'diplome',
  encryptionEnabled: boolean = true,
  displaySessions: boolean = true
): Promise<ArrayBuffer> {
  try {
    console.log(`🔄 Génération QR Code ArrayBuffer sélectif pour ${student.MATRICULE}`);
    
    const qrContent = getQrCodePayloadWithSelectiveEncryption(student, documentType, encryptionEnabled, displaySessions);
    
    const qrCodeBuffer = await QRCode.toBuffer(qrContent, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 800, // Augmenté de 300 à 800 pour une meilleure qualité
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ QR Code ArrayBuffer sélectif généré (${qrCodeBuffer.length} bytes)`);
    return qrCodeBuffer.buffer.slice(
      qrCodeBuffer.byteOffset,
      qrCodeBuffer.byteOffset + qrCodeBuffer.byteLength
    );
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code ArrayBuffer sélectif:', error);
    throw error;
  }
}

/**
 * Fonctions compatibles avec l'ancienne API (pour rétrocompatibilité)
 */
export const generateQrCodeBase64 = generateQrCodeBase64WithSelectiveEncryption;
export const generateQrCode = generateQrCodeWithSelectiveEncryption;
export const getQrCodePayloadWithEncryption = getQrCodePayloadWithSelectiveEncryption;

/**
 * Fonction de test pour le chiffrement sélectif
 */
export function testSelectiveQRGeneration(student: StudentExcelRecord, documentType: 'releve' | 'attestation' | 'diplome', displaySessions: boolean = true): boolean {
  try {
    console.log('🧪 Test de génération QR avec chiffrement sélectif...');
    
    const sanitizedStudent = sanitizeStudentData(student);
    const { publicData, sensitiveData } = createSelectiveDataFromStudent(sanitizedStudent, documentType, displaySessions);
    
    return testSelectiveEncryption(publicData, sensitiveData);
  } catch (error) {
    console.error('❌ Test QR sélectif échoué:', error);
    return false;
  }
}

// Re-export des types pour compatibilité
export type { PublicData, SensitiveData, QRCodeData } from '../crypto/selective-encryption';

/**
 * Version mise à jour pour remplacer l'ancien système
 * Export principal pour maintenir la compatibilité avec le code existant
 */
export { createSelectiveDataFromStudent as createCryptoDataFromStudent } from '../crypto/selective-encryption';

/**
 * Interface pour les données sensibles à chiffrer uniquement
 */
export interface SensitiveData {
  matricule_complet: string;
  date_naissance_complete: string;
  lieu_naissance_precis: string;
  moyenne_exacte: number | string;
  credits_details: string;
  timestamp_generation: number;
}

/**
 * Interface pour les données publiques (non chiffrées)
 */
export interface PublicData {
  etablissement: string;
  nom: string;
  prenom: string;
  parcours?: string;
  specialite?: string;
  anneeAcademique?: string;
  niveau?: string;
  semestre?: string;
  cycle?: string;
  filiere?: string;
  domaine?: string;
  finalite?: string;
  grade?: string;
  mention?: string;
}

/**
 * Structure complète du QR code avec chiffrement sélectif
 */
export interface QRCodeData {
  public: PublicData;
  encrypted: string; // Données sensibles chiffrées
  verification: string; // Hash pour vérification d'intégrité
  version: string;
}

/**
 * Génère une clé de chiffrement basée sur des éléments publics
 * Cette clé sera dérivable côté application mobile avec les informations publiques
 */
export function generateSelectiveKey(
  nom: string, 
  prenom: string, 
  etablissement: string,
  additionalSalt: string = 'FMSP_UDO_2024_SELECTIVE'
): string {
  try {
    // Nettoyer et normaliser les données d'entrée
    const cleanNom = nom.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanPrenom = prenom.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanEtablissement = etablissement.toUpperCase().replace(/[^A-Z]/g, '');
    
    // Combiner les éléments publics pour créer une base unique
    const keyBase = cleanNom + cleanPrenom + cleanEtablissement + additionalSalt;
    
    // Créer une clé robuste en utilisant plusieurs algorithmes de hachage
    const hash1 = CryptoJS.SHA256(keyBase).toString();
    const hash2 = CryptoJS.MD5(keyBase + 'SELECTIVE_2024').toString();
    const hash3 = CryptoJS.SHA1(keyBase + cleanNom + cleanPrenom).toString();
    
    // Combiner et tronquer pour obtenir une clé de 32 caractères (256 bits)
    const combinedKey = (hash1 + hash2 + hash3).substring(0, 32);
    
    return combinedKey;
  } catch (error) {
    console.error('Erreur lors de la génération de la clé sélective:', error);
    // Clé de secours en cas d'erreur
    return CryptoJS.SHA256(nom + prenom + 'FALLBACK_SELECTIVE').toString().substring(0, 32);
  }
}

/**
 * Chiffre uniquement les données sensibles
 */
export function encryptSensitiveData(
  sensitiveData: SensitiveData,
  publicData: PublicData
): string {
  try {
    console.log('🔐 Chiffrement des données sensibles uniquement...');
    
    // Générer la clé basée sur les données publiques
    const encryptionKey = generateSelectiveKey(
      publicData.nom,
      publicData.prenom,
      publicData.etablissement
    );
    
    // Préparer les données sensibles à chiffrer
    const dataToEncrypt = {
      matricule_complet: sensitiveData.matricule_complet,
      date_naissance_complete: sensitiveData.date_naissance_complete,
      lieu_naissance_precis: sensitiveData.lieu_naissance_precis,
      moyenne_exacte: sensitiveData.moyenne_exacte,
      credits_details: sensitiveData.credits_details,
      timestamp_generation: sensitiveData.timestamp_generation,
      
      // Métadonnées pour validation
      _version: '2.0_selective',
      _type: 'sensitive_data_only'
    };
    
    // Convertir en JSON puis chiffrer avec AES
    const jsonData = JSON.stringify(dataToEncrypt);
    const encrypted = CryptoJS.AES.encrypt(jsonData, encryptionKey, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();
    
    console.log('✅ Données sensibles chiffrées avec succès');
    return encrypted;
  } catch (error) {
    console.error('❌ Erreur lors du chiffrement des données sensibles:', error);
    throw new Error('Impossible de chiffrer les données sensibles');
  }
}

/**
 * Déchiffre les données sensibles
 */
export function decryptSensitiveData(
  encryptedData: string,
  publicData: PublicData
): SensitiveData | null {
  try {
    console.log('🔓 Déchiffrement des données sensibles...');
    
    // Générer la même clé basée sur les données publiques
    const decryptionKey = generateSelectiveKey(
      publicData.nom,
      publicData.prenom,
      publicData.etablissement
    );
    
    // Déchiffrer les données
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, decryptionKey, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      console.error('❌ Échec du déchiffrement - clé incorrecte ou données corrompues');
      return null;
    }
    
    // Parser le JSON et valider
    const parsedData = JSON.parse(decryptedText);
    
    // Validation basique des données critiques
    if (!parsedData.matricule_complet || !parsedData.timestamp_generation) {
      console.error('❌ Données déchiffrées invalides - champs critiques manquants');
      return null;
    }
    
    console.log('✅ Données sensibles déchiffrées avec succès');
    return parsedData as SensitiveData;
  } catch (error) {
    console.error('❌ Erreur lors du déchiffrement des données sensibles:', error);
    return null;
  }
}

/**
 * Génère un hash de vérification pour l'intégrité des données
 */
export function generateVerificationHash(
  publicData: PublicData,
  sensitiveData: SensitiveData
): string {
  const keyData = `${publicData.nom}_${publicData.prenom}_${sensitiveData.matricule_complet}_${sensitiveData.timestamp_generation}`;
  return CryptoJS.SHA256(keyData).toString().substring(0, 16);
}

/**
 * Crée la structure complète du QR code avec chiffrement sélectif
 */
export function createSelectiveQRCodeData(
  publicData: PublicData,
  sensitiveData: SensitiveData
): QRCodeData {
  try {
    console.log('📋 Création du QR code avec chiffrement sélectif...');
    
    // Chiffrer uniquement les données sensibles
    const encryptedSensitive = encryptSensitiveData(sensitiveData, publicData);
    
    // Générer le hash de vérification
    const verificationHash = generateVerificationHash(publicData, sensitiveData);
    
    const qrCodeData: QRCodeData = {
      public: publicData,
      encrypted: encryptedSensitive,
      verification: verificationHash,
      version: '2.0_selective'
    };
    
    console.log('✅ Structure QR code créée avec chiffrement sélectif');
    return qrCodeData;
  } catch (error) {
    console.error('❌ Erreur lors de la création du QR code sélectif:', error);
    throw error;
  }
}

/**
 * Convertit la structure QR en format lisible pour affichage
 */
export function formatSelectiveQRCodeForDisplay(qrData: QRCodeData, displaySessions: boolean = true): string {
  const publicSection = `INFORMATIONS PUBLIQUES:
Établissement: ${qrData.public.etablissement}
Nom: ${qrData.public.nom}
Prénom: ${qrData.public.prenom}`;

  const academicSection = qrData.public.parcours ? `
Parcours: ${qrData.public.parcours}
Spécialité: ${qrData.public.specialite}
Année académique: ${qrData.public.anneeAcademique}` : '';

  const additionalSection = qrData.public.niveau ? `
Niveau: ${qrData.public.niveau}${displaySessions ? `
Semestre: ${qrData.public.semestre}` : ''}
Filière: ${qrData.public.filiere}` : '';

  const gradeSection = qrData.public.grade ? `
Grade: ${qrData.public.grade}
Mention: ${qrData.public.mention}` : '';

  return `${publicSection}${academicSection}${additionalSection}${gradeSection}

🔐 DONNÉES SÉCURISÉES:
${qrData.encrypted}

🔍 Vérification: ${qrData.verification}
📱 Scanner avec l'app mobile pour accéder aux détails complets`;
}

/**
 * Valide l'intégrité d'un QR code avec chiffrement sélectif
 */
export function validateSelectiveQRCode(
  qrData: QRCodeData,
  expectedSensitiveData?: SensitiveData
): boolean {
  try {
    console.log('🔍 Validation du QR code sélectif...');
    
    // Vérifier la structure de base
    if (!qrData.public || !qrData.encrypted || !qrData.verification) {
      console.error('❌ Structure QR code invalide');
      return false;
    }
    
    // Si on a les données sensibles attendues, on peut faire une validation complète
    if (expectedSensitiveData) {
      const decryptedData = decryptSensitiveData(qrData.encrypted, qrData.public);
      if (!decryptedData) {
        console.error('❌ Impossible de déchiffrer les données sensibles');
        return false;
      }
      
      // Vérifier le hash d'intégrité
      const expectedHash = generateVerificationHash(qrData.public, expectedSensitiveData);
      if (qrData.verification !== expectedHash) {
        console.error('❌ Hash de vérification invalide');
        return false;
      }
      
      // Vérifier que les données décryptées correspondent
      if (decryptedData.matricule_complet !== expectedSensitiveData.matricule_complet) {
        console.error('❌ Matricule ne correspond pas');
        return false;
      }
    }
    
    console.log('✅ QR code sélectif valide');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la validation du QR code sélectif:', error);
    return false;
  }
}

/**
 * Fonction utilitaire pour créer les données depuis un enregistrement étudiant
 */
export function createSelectiveDataFromStudent(
  student: any,
  documentType: 'releve' | 'attestation' | 'diplome',
  displaySessions: boolean = true
): { publicData: PublicData; sensitiveData: SensitiveData } {
  // Données publiques (non chiffrées)
  const publicData: PublicData = {
    etablissement: student.ETABLISSEMENT || student.etablissement || 'N/D',
    nom: student.NOM || student.nom || 'N/D',
    prenom: student.PRENOM || student.prenom || 'N/D',
    grade: student.GRADE || student.grade || 'N/D',
    mention: student.MENTION || student.mention || 'N/D'
  };

  // Ajouter des champs spécifiques selon le type de document
  switch (documentType) {
    case 'releve':
      publicData.niveau = student.NIVEAU || student.niveau || 'N/D';
      // Ne inclure le semestre que si displaySessions est true
      if (displaySessions) {
        publicData.semestre = student.SEMESTRE || student.semestre || 'N/D';
      }
      publicData.cycle = student.CYCLE || student.cycle || 'N/D';
      publicData.filiere = student.FILIERE || student.filiere || 'N/D';
      publicData.anneeAcademique = student["ANNEE ACADEMIQUE"] || student.anneeAcademique || 'N/D';
      break;
    
    case 'attestation':
      publicData.parcours = student.PARCOURS || student.parcours || 'N/D';
      publicData.specialite = student.SPECIALITE || student.specialite || 'N/D';
      publicData.anneeAcademique = student["ANNEE ACADEMIQUE"] || student.anneeAcademique || 'N/D';
      publicData.finalite = student.FINALITE || student.finalite || 'N/D';
      publicData.domaine = student.DOMAINE || student.domaine || 'N/D';
      break;
    
    case 'diplome':
      publicData.parcours = student.PARCOURS || student.parcours || 'N/D';
      publicData.specialite = student.SPECIALITE || student.specialite || 'N/D';
      publicData.finalite = student.FINALITE || student.finalite || 'N/D';
      publicData.domaine = student.DOMAINE || student.domaine || 'N/D';
      break;
  }

  // Données sensibles (chiffrées)
  const sensitiveData: SensitiveData = {
    matricule_complet: student.MATRICULE || student.matricule || 'N/D',
    date_naissance_complete: student["DATE DE NAISSANCE"] || student.dateDeNaissance || 'N/D',
    lieu_naissance_precis: student["LIEU DE NAISSANCE"] || student.lieuDeNaissance || 'N/D',
    moyenne_exacte: student.MOYENNE || student.moyenne || '0.00',
    credits_details: student["TOTAL CREDIT"] || student.totalCredit || student.credits || 'N/D',
    timestamp_generation: Date.now()
  };

  return { publicData, sensitiveData };
}

/**
 * Fonction de test pour vérifier le bon fonctionnement du chiffrement sélectif
 */
export function testSelectiveEncryption(
  publicData: PublicData,
  sensitiveData: SensitiveData
): boolean {
  try {
    console.log('🧪 Test du chiffrement sélectif...');
    
    // Créer la structure QR
    const qrData = createSelectiveQRCodeData(publicData, sensitiveData);
    console.log('✅ Structure QR créée');
    
    // Tester le déchiffrement
    const decryptedSensitive = decryptSensitiveData(qrData.encrypted, publicData);
    console.log('✅ Déchiffrement réussi');
    
    // Valider l'intégrité
    const isValid = validateSelectiveQRCode(qrData, sensitiveData);
    console.log('✅ Validation:', isValid ? 'Réussie' : 'Échouée');
    
    // Tester le formatage pour affichage
    const displayFormat = formatSelectiveQRCodeForDisplay(qrData);
    console.log('✅ Format d\'affichage généré');
    
    return isValid;
  } catch (error) {
    console.error('❌ Test de chiffrement sélectif échoué:', error);
    return false;
  }
}

/**
 * Utilitaire pour extraire les informations de débogage (développement uniquement)
 */
export function getSelectiveEncryptionInfo(
  publicData: PublicData
): {
  keyPreview: string;
  keyLength: number;
  algorithm: string;
  publicFields: string[];
  sensitiveFields: string[];
} {
  const key = generateSelectiveKey(publicData.nom, publicData.prenom, publicData.etablissement);
  return {
    keyPreview: key.substring(0, 8) + '...', // Afficher seulement les premiers caractères
    keyLength: key.length,
    algorithm: 'AES-256-CBC (Sélectif)',
    publicFields: [
      'etablissement', 'nom', 'prenom', 'parcours', 'specialite', 
      'anneeAcademique', 'niveau', 'semestre', 'cycle', 'filiere', 
      'domaine', 'finalite', 'grade', 'mention'
    ],
    sensitiveFields: [
      'matricule_complet', 'date_naissance_complete', 'lieu_naissance_precis',
      'moyenne_exacte', 'credits_details', 'timestamp_generation'
    ]
  };
}