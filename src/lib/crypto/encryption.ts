// src/lib/crypto/encryption.ts
import CryptoJS from 'crypto-js';

/**
 * Interface pour les données d'étudiant à chiffrer
 */
export interface StudentCryptoData {
  etablissement?: string;
  nom: string;
  prenom: string;
  matricule: string;
  dateDeNaissance: string;
  lieuDeNaissance: string;
  parcours?: string;
  specialite?: string;
  option?: string;
  moyenne?: number | string;
  grade?: string;
  mention?: string;
  anneeAcademique?: string;
  niveau?: string;
  semestre?: string;
  cycle?: string;
  filiere?: string;
  finalite?: string;
  totalCredit?: string;
  domaine?: string;
  anneeObtention?: string;
}

/**
 * Génère une clé de chiffrement dynamique basée sur le matricule et d'autres informations
 */
export function generateDynamicKey(matricule: string, additionalData: string = ''): string {
  // Utiliser le matricule comme base
  let keyBase = matricule.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Ajouter des données supplémentaires si fournies
  if (additionalData) {
    keyBase += additionalData.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  
  // Créer une clé plus complexe en utilisant plusieurs transformations
  const hash1 = CryptoJS.SHA256(keyBase).toString();
  const hash2 = CryptoJS.MD5(keyBase + 'FMSP_UDO_2024').toString();
  
  // Combiner les hashs pour créer une clé de 32 caractères
  const combinedKey = (hash1 + hash2).substring(0, 32);
  
  return combinedKey;
}

/**
 * Chiffre les données de l'étudiant
 */
export function encryptStudentData(data: StudentCryptoData, matricule: string): string {
  try {
    // Générer la clé dynamique
    const encryptionKey = generateDynamicKey(matricule, data.dateDeNaissance || '');
    
    // Préparer les données à chiffrer (même format que les données visibles)
    const dataToEncrypt = {
      etablissement: data.etablissement || '',
      nom: data.nom,
      prenom: data.prenom,
      matricule: data.matricule,
      dateDeNaissance: data.dateDeNaissance,
      lieuDeNaissance: data.lieuDeNaissance,
      parcours: data.parcours || '',
      specialite: data.specialite || '',
      option: data.option || '',
      moyenne: data.moyenne || '',
      grade: data.grade || '',
      mention: data.mention || '',
      anneeAcademique: data.anneeAcademique || '',
      // Champs supplémentaires selon le type de document
      niveau: data.niveau || '',
      semestre: data.semestre || '',
      cycle: data.cycle || '',
      filiere: data.filiere || '',
      finalite: data.finalite || '',
      totalCredit: data.totalCredit || '',
      domaine: data.domaine || '',
      anneeObtention: data.anneeObtention || ''
    };
    
    // Convertir en JSON puis chiffrer
    const jsonData = JSON.stringify(dataToEncrypt);
    const encrypted = CryptoJS.AES.encrypt(jsonData, encryptionKey).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Erreur lors du chiffrement des données:', error);
    throw new Error('Impossible de chiffrer les données de l\'étudiant');
  }
}

/**
 * Déchiffre les données de l'étudiant (pour vérification côté application)
 */
export function decryptStudentData(encryptedData: string, matricule: string, dateDeNaissance: string = ''): StudentCryptoData | null {
  try {
    // Générer la même clé dynamique
    const decryptionKey = generateDynamicKey(matricule, dateDeNaissance);
    
    // Déchiffrer
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, decryptionKey);
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      console.error('Échec du déchiffrement - clé incorrecte ou données corrompues');
      return null;
    }
    
    // Parser le JSON
    const parsedData = JSON.parse(decryptedText);
    return parsedData as StudentCryptoData;
  } catch (error) {
    console.error('Erreur lors du déchiffrement des données:', error);
    return null;
  }
}

/**
 * Valide l'intégrité des données chiffrées
 */
export function validateEncryptedData(encryptedData: string, originalData: StudentCryptoData): boolean {
  try {
    const decrypted = decryptStudentData(encryptedData, originalData.matricule, originalData.dateDeNaissance);
    
    if (!decrypted) return false;
    
    // Vérifier que les données importantes correspondent
    return (
      decrypted.nom === originalData.nom &&
      decrypted.prenom === originalData.prenom &&
      decrypted.matricule === originalData.matricule &&
      decrypted.dateDeNaissance === originalData.dateDeNaissance
    );
  } catch (error) {
    console.error('Erreur lors de la validation des données chiffrées:', error);
    return false;
  }
}

/**
 * Génère un identifiant unique pour le document (optionnel, pour la traçabilité)
 */
export function generateDocumentId(data: StudentCryptoData, documentType: string): string {
  const timestamp = Date.now().toString();
  const baseString = `${data.matricule}_${documentType}_${timestamp}`;
  return CryptoJS.SHA256(baseString).toString().substring(0, 16).toUpperCase();
}