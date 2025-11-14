// src/lib/crypto/selective-encryption.ts
import CryptoJS from 'crypto-js';

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
    
    
    return qrCodeData;
  } catch (error) {
    console.error('❌ Erreur lors de la création du QR code sélectif:', error);
    throw error;
  }
}

/**
 * Convertit la structure QR en format lisible pour affichage
 */
export function formatSelectiveQRCodeForDisplay(qrData: QRCodeData): string {
  const publicSection = `INFORMATIONS PUBLIQUES:
Établissement: ${qrData.public.etablissement}
Nom: ${qrData.public.nom}
Prénom: ${qrData.public.prenom}`;

  const academicSection = qrData.public.parcours ? `
Parcours: ${qrData.public.parcours}
Spécialité: ${qrData.public.specialite}
Année académique: ${qrData.public.anneeAcademique}` : '';

  const additionalSection = qrData.public.niveau ? `
Niveau: ${qrData.public.niveau}
Semestre: ${qrData.public.semestre}
Filière: ${qrData.public.filiere}` : '';

  const gradeSection = qrData.public.grade ? `
Grade: ${qrData.public.grade}
Mention: ${qrData.public.mention}` : '';

  return `${publicSection}${academicSection}${additionalSection}${gradeSection}

DONNÉES SÉCURISÉES:
${qrData.encrypted}`;
}

/**
 * Valide l'intégrité d'un QR code avec chiffrement sélectif
 */
export function validateSelectiveQRCode(
  qrData: QRCodeData,
  expectedSensitiveData?: SensitiveData
): boolean {
  try {
    
    
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
  documentType: 'releve' | 'attestation' | 'diplome'
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
      publicData.semestre = student.SEMESTRE || student.semestre || 'N/D';
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
    
    
    // Créer la structure QR
    const qrData = createSelectiveQRCodeData(publicData, sensitiveData);
    
    
    // Tester le déchiffrement
    const decryptedSensitive = decryptSensitiveData(qrData.encrypted, publicData);
    
    
    // Valider l'intégrité
    const isValid = validateSelectiveQRCode(qrData, sensitiveData);
    
    
    // Tester le formatage pour affichage
    const displayFormat = formatSelectiveQRCodeForDisplay(qrData);
    
    
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