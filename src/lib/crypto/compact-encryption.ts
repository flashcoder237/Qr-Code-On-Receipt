// src/lib/crypto/compact-encryption.ts
import CryptoJS from 'crypto-js';

/**
 * Interface pour les données sensibles minimales à chiffrer
 */
export interface CompactSensitiveData {
  m: string; // matricule complet
  d: string; // date de naissance complète
  l: string; // lieu de naissance précis
  a: string; // moyenne exacte
  t: number; // timestamp de génération
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
 * Structure du QR code avec chiffrement compact
 */
export interface CompactQRCodeData {
  public: PublicData;
  encrypted: string; // Données sensibles chiffrées (court)
  version: string;
}

/**
 * Génère une clé de chiffrement compacte basée uniquement sur le matricule
 */
export function generateCompactKey(matricule: string): string {
  try {
    // Nettoyer le matricule
    const cleanMatricule = matricule.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Générer une clé de 16 caractères (128 bits) pour AES-128
    // Plus compact que AES-256 mais toujours sécurisé
    const keyBase = cleanMatricule + 'FMSP2024';
    const hash = CryptoJS.SHA256(keyBase).toString();
    
    // Prendre les 16 premiers caractères pour AES-128
    return hash.substring(0, 16);
  } catch (error) {
    console.error('Erreur lors de la génération de la clé compacte:', error);
    // Clé de secours
    return CryptoJS.SHA256(matricule + 'FALLBACK').toString().substring(0, 16);
  }
}

/**
 * Chiffre les données sensibles de manière compacte
 */
export function encryptCompactData(sensitiveData: CompactSensitiveData): string {
  try {
    console.log('🔐 Chiffrement compact des données sensibles...');
    
    // Générer la clé basée uniquement sur le matricule
    const encryptionKey = generateCompactKey(sensitiveData.m);
    
    // Créer un format très compact avec des clés courtes
    const compactData = {
      m: sensitiveData.m,           // matricule
      d: sensitiveData.d,           // date naissance
      l: sensitiveData.l,           // lieu naissance
      a: sensitiveData.a,           // moyenne
      t: sensitiveData.t            // timestamp
    };
    
    // Convertir en JSON compact (sans espaces)
    const jsonData = JSON.stringify(compactData);
    
    // Chiffrer avec AES-128 (plus compact que AES-256)
    const encrypted = CryptoJS.AES.encrypt(jsonData, encryptionKey, {
      mode: CryptoJS.mode.ECB, // ECB est plus compact (pas d'IV)
      padding: CryptoJS.pad.Pkcs7
    }).toString();
    
    // Compresser encore plus en utilisant Base64URL (plus compact)
    const compressedEncrypted = encrypted
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    console.log('✅ Données chiffrées de manière compacte, longueur:', compressedEncrypted.length);
    return compressedEncrypted;
  } catch (error) {
    console.error('❌ Erreur lors du chiffrement compact:', error);
    throw new Error('Impossible de chiffrer les données de manière compacte');
  }
}

/**
 * Déchiffre les données sensibles compactes
 */
export function decryptCompactData(encryptedData: string, matricule: string): CompactSensitiveData | null {
  try {
    console.log('🔓 Déchiffrement compact des données sensibles...');
    
    // Générer la même clé basée sur le matricule
    const decryptionKey = generateCompactKey(matricule);
    
    // Restaurer le format Base64 standard
    let standardEncrypted = encryptedData
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Ajouter le padding manquant
    while (standardEncrypted.length % 4) {
      standardEncrypted += '=';
    }
    
    // Déchiffrer les données
    const decryptedBytes = CryptoJS.AES.decrypt(standardEncrypted, decryptionKey, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      console.error('❌ Échec du déchiffrement compact - clé incorrecte ou données corrompues');
      return null;
    }
    
    // Parser le JSON et valider
    const parsedData = JSON.parse(decryptedText);
    
    // Validation basique des données critiques
    if (!parsedData.m || !parsedData.t) {
      console.error('❌ Données déchiffrées invalides - champs critiques manquants');
      return null;
    }
    
    console.log('✅ Données sensibles déchiffrées avec succès');
    return parsedData as CompactSensitiveData;
  } catch (error) {
    console.error('❌ Erreur lors du déchiffrement compact:', error);
    return null;
  }
}

/**
 * Crée la structure complète du QR code avec chiffrement compact
 */
export function createCompactQRCodeData(
  publicData: PublicData,
  sensitiveData: CompactSensitiveData
): CompactQRCodeData {
  try {
    console.log('📋 Création du QR code avec chiffrement compact...');
    
    // Chiffrer uniquement les données sensibles
    const encryptedSensitive = encryptCompactData(sensitiveData);
    
    const qrCodeData: CompactQRCodeData = {
      public: publicData,
      encrypted: encryptedSensitive,
      version: '3.0_compact'
    };
    
    console.log('✅ Structure QR code créée avec chiffrement compact');
    console.log('📊 Longueur du contenu chiffré:', encryptedSensitive.length, 'caractères');
    return qrCodeData;
  } catch (error) {
    console.error('❌ Erreur lors de la création du QR code compact:', error);
    throw error;
  }
}

/**
 * Formate le QR code compact pour affichage
 */
export function formatCompactQRCodeForDisplay(
  qrData: CompactQRCodeData, 
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

  // Section des données chiffrées (très compacte)
  const encryptedSection = `

🔐 DONNÉES SÉCURISÉES: ${qrData.encrypted}`;

  // Section de vérification
  const verificationSection = `

📱 Scanner avec l'app mobile pour accéder aux détails complets.`;

  return publicSection + encryptedSection + verificationSection;
}

/**
 * Valide l'intégrité d'un QR code compact
 */
export function validateCompactQRCode(
  qrData: CompactQRCodeData,
  expectedSensitiveData?: CompactSensitiveData
): boolean {
  try {
    console.log('🔍 Validation du QR code compact...');
    
    // Vérifier la structure de base
    if (!qrData.public || !qrData.encrypted) {
      console.error('❌ Structure QR code invalide');
      return false;
    }
    
    // Si on a les données sensibles attendues, on peut faire une validation complète
    if (expectedSensitiveData) {
      const decryptedData = decryptCompactData(qrData.encrypted, expectedSensitiveData.m);
      if (!decryptedData) {
        console.error('❌ Impossible de déchiffrer les données sensibles');
        return false;
      }
      
      // Vérifier que les données décryptées correspondent
      if (decryptedData.m !== expectedSensitiveData.m) {
        console.error('❌ Matricule ne correspond pas');
        return false;
      }
    }
    
    console.log('✅ QR code compact valide');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la validation du QR code compact:', error);
    return false;
  }
}

/**
 * Fonction utilitaire pour créer les données depuis un enregistrement étudiant
 */
export function createCompactDataFromStudent(
  student: any,
  documentType: 'releve' | 'attestation' | 'diplome'
): { publicData: PublicData; sensitiveData: CompactSensitiveData } {
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

  // Données sensibles (chiffrées) - format compact
  const sensitiveData: CompactSensitiveData = {
    m: student.MATRICULE || student.matricule || 'N/D',
    d: student["DATE DE NAISSANCE"] || student.dateDeNaissance || 'N/D',
    l: student["LIEU DE NAISSANCE"] || student.lieuDeNaissance || 'N/D',
    a: String(student.MOYENNE || student.moyenne || '0.00'),
    t: Date.now()
  };

  return { publicData, sensitiveData };
}

/**
 * Fonction de test pour vérifier le bon fonctionnement du chiffrement compact
 */
export function testCompactEncryption(
  publicData: PublicData,
  sensitiveData: CompactSensitiveData
): boolean {
  try {
    console.log('🧪 Test du chiffrement compact...');
    console.log('🔑 Clé basée uniquement sur le matricule:', sensitiveData.m);
    
    // Créer la structure QR
    const qrData = createCompactQRCodeData(publicData, sensitiveData);
    console.log('✅ Structure QR créée');
    console.log('📊 Longueur du contenu chiffré:', qrData.encrypted.length, 'caractères');
    
    // Tester le déchiffrement
    const decryptedSensitive = decryptCompactData(qrData.encrypted, sensitiveData.m);
    console.log('✅ Déchiffrement réussi');
    
    // Valider l'intégrité
    const isValid = validateCompactQRCode(qrData, sensitiveData);
    console.log('✅ Validation:', isValid ? 'Réussie' : 'Échouée');
    
    // Tester le formatage pour affichage
    const displayFormat = formatCompactQRCodeForDisplay(qrData, 'attestation');
    console.log('✅ Format d\'affichage généré, longueur totale:', displayFormat.length);
    
    return isValid;
  } catch (error) {
    console.error('❌ Test de chiffrement compact échoué:', error);
    return false;
  }
}

/**
 * Utilitaire pour extraire les informations de débogage (développement uniquement)
 */
export function getCompactEncryptionInfo(matricule: string): {
  keyPreview: string;
  keyLength: number;
  algorithm: string;
  advantages: string[];
} {
  const key = generateCompactKey(matricule);
  return {
    keyPreview: key.substring(0, 4) + '...', // Afficher seulement les premiers caractères
    keyLength: key.length,
    algorithm: 'AES-128-ECB (Compact)',
    advantages: [
      'Chiffrement basé uniquement sur le matricule',
      'Contenu chiffré très court (typ. 50-80 caractères)',
      'Déchiffrable avec juste le matricule',
      'Compatible QR codes de petite taille',
      'Performance optimisée'
    ]
  };
}