// src/lib/crypto/encryption.ts - Version améliorée
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
  dateJury?: string;
}

/**
 * Génère une clé de chiffrement dynamique basée sur le matricule et d'autres informations
 */
export function generateDynamicKey(matricule: string, dateDeNaissance: string = '', additionalSalt: string = 'FMSP_UDO_2024'): string {
  try {
    // Nettoyer et normaliser les données d'entrée
    const cleanMatricule = matricule.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanDate = dateDeNaissance.replace(/[^0-9]/g, ''); // Garder seulement les chiffres
    
    console.log(`🔑 Génération clé dynamique:`, {
      matricule: cleanMatricule,
      dateLength: cleanDate.length,
      salt: additionalSalt
    });
    
    // Combiner les éléments pour créer une base unique
    const keyBase = cleanMatricule + cleanDate + additionalSalt;
    
    // Créer une clé robuste en utilisant plusieurs algorithmes de hachage
    const hash1 = CryptoJS.SHA256(keyBase).toString();
    const hash2 = CryptoJS.MD5(keyBase + 'SALT_2024').toString();
    const hash3 = CryptoJS.SHA1(keyBase + cleanMatricule).toString();
    
    // Combiner et tronquer pour obtenir une clé de 32 caractères (256 bits)
    const combinedKey = (hash1 + hash2 + hash3).substring(0, 32);
    
    console.log(`✅ Clé dynamique générée (longueur: ${combinedKey.length})`);
    return combinedKey;
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la clé dynamique:', error);
    // Clé de secours en cas d'erreur
    return CryptoJS.SHA256(matricule + 'FALLBACK_KEY').toString().substring(0, 32);
  }
}

/**
 * Chiffre les données de l'étudiant avec AES-256
 */
export function encryptStudentData(data: StudentCryptoData, matricule: string): string {
  try {
    console.log(`🔒 Début du chiffrement pour ${matricule}`);
    
    // Générer la clé dynamique basée sur le matricule et la date de naissance
    const encryptionKey = generateDynamicKey(matricule, data.dateDeNaissance || '');
    
    // Préparer les données à chiffrer dans un format structuré
    const dataToEncrypt = {
      // Informations de base (toujours présentes)
      etablissement: data.etablissement || '',
      nom: data.nom,
      prenom: data.prenom,
      matricule: data.matricule,
      dateDeNaissance: data.dateDeNaissance,
      lieuDeNaissance: data.lieuDeNaissance,
      
      // Informations académiques (peuvent varier selon le type de document)
      parcours: data.parcours || '',
      specialite: data.specialite || '',
      option: data.option || '',
      moyenne: data.moyenne || '',
      grade: data.grade || '',
      mention: data.mention || '',
      anneeAcademique: data.anneeAcademique || '',
      
      // Champs spécifiques aux relevés
      niveau: data.niveau || '',
      semestre: data.semestre || '',
      cycle: data.cycle || '',
      filiere: data.filiere || '',
      
      // Champs spécifiques aux attestations/diplômes
      finalite: data.finalite || '',
      totalCredit: data.totalCredit || '',
      domaine: data.domaine || '',
      anneeObtention: data.anneeObtention || '',
      dateJury: data.dateJury || '',
      
      // Métadonnées pour validation
      _timestamp: Date.now(),
      _version: '1.0'
    };
    
    console.log(`📊 Données préparées pour chiffrement:`, {
      etablissement: dataToEncrypt.etablissement ? 'Défini' : 'Non défini',
      nom: dataToEncrypt.nom,
      prenom: dataToEncrypt.prenom,
      matricule: dataToEncrypt.matricule,
      fieldsCount: Object.keys(dataToEncrypt).length
    });
    
    // Convertir en JSON puis chiffrer avec AES
    const jsonData = JSON.stringify(dataToEncrypt);
    console.log(`📝 JSON à chiffrer (${jsonData.length} caractères)`);
    
    const encrypted = CryptoJS.AES.encrypt(jsonData, encryptionKey, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();
    
    console.log(`✅ Chiffrement terminé (${encrypted.length} caractères)`);
    return encrypted;
  } catch (error) {
    console.error('❌ Erreur lors du chiffrement des données:', error);
    throw new Error('Impossible de chiffrer les données de l\'étudiant');
  }
}

/**
 * Déchiffre les données de l'étudiant (pour vérification côté application ou app mobile)
 */
export function decryptStudentData(encryptedData: string, matricule: string, dateDeNaissance: string = ''): StudentCryptoData | null {
  try {
    console.log(`🔓 Début du déchiffrement pour ${matricule}`);
    
    // Générer la même clé dynamique
    const decryptionKey = generateDynamicKey(matricule, dateDeNaissance);
    
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
    
    console.log(`📝 Déchiffrement réussi (${decryptedText.length} caractères)`);
    
    // Parser le JSON et valider
    const parsedData = JSON.parse(decryptedText);
    
    // Validation basique des données critiques
    if (!parsedData.nom || !parsedData.prenom || !parsedData.matricule) {
      console.error('❌ Données déchiffrées invalides - champs critiques manquants');
      return null;
    }
    
    console.log(`✅ Déchiffrement et validation réussis`);
    return parsedData as StudentCryptoData;
  } catch (error) {
    console.error('❌ Erreur lors du déchiffrement des données:', error);
    return null;
  }
}

/**
 * Valide l'intégrité des données chiffrées
 */
export function validateEncryptedData(encryptedData: string, originalData: StudentCryptoData): boolean {
  try {
    console.log(`🔍 Validation des données chiffrées pour ${originalData.matricule}`);
    
    const decrypted = decryptStudentData(encryptedData, originalData.matricule, originalData.dateDeNaissance);
    
    if (!decrypted) {
      console.error('❌ Validation échouée - déchiffrement impossible');
      return false;
    }
    
    // Vérifier que les données importantes correspondent
    const isValid = (
      decrypted.nom === originalData.nom &&
      decrypted.prenom === originalData.prenom &&
      decrypted.matricule === originalData.matricule &&
      decrypted.dateDeNaissance === originalData.dateDeNaissance
    );
    
    console.log(`${isValid ? '✅' : '❌'} Validation ${isValid ? 'réussie' : 'échouée'}`);
    return isValid;
  } catch (error) {
    console.error('❌ Erreur lors de la validation des données chiffrées:', error);
    return false;
  }
}

/**
 * Génère un hash de vérification pour s'assurer de l'intégrité des données
 */
export function generateVerificationHash(data: StudentCryptoData): string {
  const keyData = `${data.nom}_${data.prenom}_${data.matricule}_${data.dateDeNaissance}`;
  return CryptoJS.SHA256(keyData).toString().substring(0, 16);
}

/**
 * Fonction utilitaire pour créer les données crypto à partir des différents types de documents
 */
export function createCryptoDataFromStudent(student: any, documentType: 'releve' | 'attestation' | 'diplome'): StudentCryptoData {
  console.log(`🔄 Création des données crypto pour ${documentType}:`, {
    nom: student.NOM || student.nom,
    prenom: student.PRENOM || student.prenom,
    matricule: student.MATRICULE || student.matricule,
    etablissement: student.ETABLISSEMENT || student.etablissement
  });
  
  // Données de base communes à tous les types de documents
  const baseData: StudentCryptoData = {
    etablissement: student.ETABLISSEMENT || student.etablissement || '',
    nom: student.NOM || student.nom || '',
    prenom: student.PRENOM || student.prenom || '',
    matricule: student.MATRICULE || student.matricule || '',
    dateDeNaissance: student["DATE DE NAISSANCE"] || student.dateDeNaissance || '',
    lieuDeNaissance: student["LIEU DE NAISSANCE"] || student.lieuDeNaissance || '',
    moyenne: student.MOYENNE || student.moyenne || '',
    grade: student.GRADE || student.grade || '',
    mention: student.MENTION || student.mention || ''
  };

  // Ajouter des champs spécifiques selon le type de document
  switch (documentType) {
    case 'releve':
      return {
        ...baseData,
        niveau: student.NIVEAU || student.niveau || '',
        semestre: student.SEMESTRE || student.semestre || '',
        cycle: student.CYCLE || student.cycle || '',
        filiere: student.FILIERE || student.filiere || '',
        anneeAcademique: student["ANNEE ACADEMIQUE"] || student.anneeAcademique || ''
      };
    
    case 'attestation':
      return {
        ...baseData,
        parcours: student.PARCOURS || student.parcours || '',
        specialite: student.SPECIALITE || student.specialite || '',
        option: student.OPTION || student.option || '',
        anneeAcademique: student["ANNEE ACADEMIQUE"] || student.anneeAcademique || '',
        finalite: student.FINALITE || student.finalite || '',
        totalCredit: student["TOTAL CREDIT"] || student.totalCredit || '',
        domaine: student.DOMAINE || student.domaine || '',
        dateJury: student["DATE JURY"] || student.dateJury || ''
      };
    
    case 'diplome':
      return {
        ...baseData,
        parcours: student.PARCOURS || student.parcours || '',
        specialite: student.SPECIALITE || student.specialite || '',
        option: student.OPTION || student.option || '',
        anneeObtention: student["ANNEE D'OBTENTION"] || student.anneeObtention || '',
        finalite: student.FINALITE || student.finalite || '',
        domaine: student.DOMAINE || student.domaine || ''
      };
    
    default:
      return baseData;
  }
}

/**
 * Fonction de test pour vérifier le bon fonctionnement du chiffrement/déchiffrement
 */
export function testEncryptionDecryption(studentData: StudentCryptoData): boolean {
  try {
    console.log('🧪 Test de chiffrement/déchiffrement...');
    
    // Validation des données d'entrée
    if (!studentData.matricule || !studentData.nom || !studentData.prenom) {
      console.error('❌ Données de test invalides');
      return false;
    }
    
    console.log('📊 Données de test:', {
      matricule: studentData.matricule,
      nom: studentData.nom,
      prenom: studentData.prenom,
      etablissement: studentData.etablissement || 'Non défini'
    });
    
    // Chiffrer les données
    const encrypted = encryptStudentData(studentData, studentData.matricule);
    console.log('✅ Chiffrement réussi, longueur:', encrypted.length);
    
    // Déchiffrer les données
    const decrypted = decryptStudentData(encrypted, studentData.matricule, studentData.dateDeNaissance);
    console.log('✅ Déchiffrement réussi');
    
    // Valider l'intégrité
    const isValid = validateEncryptedData(encrypted, studentData);
    console.log('✅ Validation:', isValid ? 'Réussie' : 'Échouée');
    
    // Générer le hash de vérification
    const verificationHash = generateVerificationHash(studentData);
    console.log('✅ Hash de vérification:', verificationHash);
    
    return isValid;
  } catch (error) {
    console.error('❌ Test de chiffrement échoué:', error);
    return false;
  }
}

/**
 * Utilitaire pour extraire les informations de débogage (développement uniquement)
 */
export function getEncryptionInfo(matricule: string, dateDeNaissance: string = ''): {
  key: string;
  keyLength: number;
  algorithm: string;
} {
  const key = generateDynamicKey(matricule, dateDeNaissance);
  return {
    key: key.substring(0, 8) + '...', // Afficher seulement les premiers caractères pour la sécurité
    keyLength: key.length,
    algorithm: 'AES-256-CBC'
  };
}

/**
 * Fonction utilitaire pour créer un exemple de test complet
 */
export function createTestExample(): string {
  console.log('🧪 Création d\'un exemple de test complet...');
  
  const testStudent: StudentCryptoData = {
    etablissement: "INSTITUT SUPERIEUR DES SCIENCES, ARTS ET METIERS",
    nom: "BIKINDOU",
    prenom: "JUSTE-AMOUR",
    matricule: "18A1008-ABO",
    dateDeNaissance: "14/10/1999",
    lieuDeNaissance: "BRAZZAVILLE",
    parcours: "",
    specialite: "",
    option: "",
    moyenne: "15.2",
    grade: "B+",
    mention: "Bien",
    anneeAcademique: "2022/2023"
  };
  
  try {
    // Test du chiffrement
    const testResult = testEncryptionDecryption(testStudent);
    
    if (testResult) {
      // Créer un exemple de contenu QR complet
      const visibleContent = `Établissement: ${testStudent.etablissement}
Nom: ${testStudent.nom}
Prénom: ${testStudent.prenom}
Matricule: ${testStudent.matricule}
Date de naissance: ${testStudent.dateDeNaissance}
Lieu de naissance: ${testStudent.lieuDeNaissance}
Parcours: ${testStudent.parcours}
Spécialité: ${testStudent.specialite}
Option: ${testStudent.option}
Moyenne: ${testStudent.moyenne}
Grade: ${testStudent.grade}
Mention: ${testStudent.mention}
Année académique: ${testStudent.anneeAcademique}`;

      const encryptedData = encryptStudentData(testStudent, testStudent.matricule);
      
      const fullQRContent = `${visibleContent}

Informations cryptées: CRPY-${encryptedData}`;
      
      console.log('✅ Exemple de test créé avec succès');
      console.log('📏 Longueur totale:', fullQRContent.length);
      
      return fullQRContent;
    } else {
      throw new Error('Test de chiffrement échoué');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'exemple:', error);
    throw error;
  }
}