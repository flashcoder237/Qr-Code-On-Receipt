// src/lib/helpers/qrcode.ts - Version mise à jour avec chiffrement intégré
import QRCode from "qrcode";
import { encryptStudentData, createCryptoDataFromStudent, StudentCryptoData } from '../crypto/encryption';

export type StudentExcelRecord = {
  ETABLISSEMENT: string;
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  NIVEAU?: string;
  SEMESTRE?: string;
  MOYENNE?: number | string;
  GRADE?: string;
  MENTION?: string;
  "ANNEE ACADEMIQUE"?: string;
  "ANNEE D'OBTENTION"?: string;
  PARCOURS?: string;
  SPECIALITE?: string;
  OPTION?: string;
  "DATE JURY"?: string;
  FINALITE?: string;
  "TOTAL CREDIT"?: string;
  "DOMAINE"?: string;
  CYCLE?: string;
  FILIERE?: string;
};

/**
 * Génère le contenu visible standard du QR code (inchangé pour rétrocompatibilité)
 */
export function getQrCodePayload(
  payload: StudentExcelRecord,
  documentType: "releve" | "attestation" | "diplome"
): string {
  if (documentType === "releve") {
    return `Établissement: ${payload.ETABLISSEMENT}
Nom: ${payload.NOM}
Prénom: ${payload.PRENOM}
Matricule: ${payload.MATRICULE}
Date de naissance: ${payload["DATE DE NAISSANCE"]}
Lieu de naissance: ${payload["LIEU DE NAISSANCE"]}
Niveau: ${payload.NIVEAU || ""}
Semestre: ${payload.SEMESTRE || ""}
Moyenne: ${payload.MOYENNE || ""}
Grade: ${payload.GRADE || ""}
Mention: ${payload.MENTION || ""}
Année académique: ${payload["ANNEE ACADEMIQUE"] || ""}`;
  } else if (documentType === "attestation") {
    return `Établissement: ${payload.ETABLISSEMENT}
Nom: ${payload.NOM}
Prénom: ${payload.PRENOM}
Matricule: ${payload.MATRICULE}
Date de naissance: ${payload["DATE DE NAISSANCE"]}
Lieu de naissance: ${payload["LIEU DE NAISSANCE"]}
Parcours: ${payload.PARCOURS || ""}
Spécialité: ${payload.SPECIALITE || ""}
Option: ${payload.OPTION || ""}
Moyenne: ${payload.MOYENNE || ""}
Grade: ${payload.GRADE || ""}
Mention: ${payload.MENTION || ""}
Année académique: ${payload["ANNEE ACADEMIQUE"] || ""}`;
  } else if (documentType === "diplome") {
    return `Établissement: ${payload.ETABLISSEMENT}
Nom: ${payload.NOM}
Prénom: ${payload.PRENOM}
Matricule: ${payload.MATRICULE}
Date de naissance: ${payload["DATE DE NAISSANCE"]}
Lieu de naissance: ${payload["LIEU DE NAISSANCE"]}
Parcours: ${payload.PARCOURS || ""}
Spécialité: ${payload.SPECIALITE || ""}
Option: ${payload.OPTION || ""}
Moyenne: ${payload.MOYENNE || ""}
Grade: ${payload.GRADE || ""}
Mention: ${payload.MENTION || ""}
Année d'obtention: ${payload["ANNEE D'OBTENTION"] || ""}
Site Web: https://fmsp-udo.cm`;
  }
  return "";
}

/**
 * Génère le contenu complet du QR code avec données chiffrées
 * Format: [Données visibles] + Informations cryptées: CRPY-[données chiffrées]
 */
export function getQrCodePayloadWithEncryption(
  payload: StudentExcelRecord,
  documentType: "releve" | "attestation" | "diplome"
): string {
  try {
    // 1. Générer le contenu visible standard
    const visibleContent = getQrCodePayload(payload, documentType);
    
    // 2. Créer les données crypto selon le type de document
    const cryptoData = createCryptoDataFromStudent(payload, documentType);
    
    // 3. Chiffrer les données
    const encryptedData = encryptStudentData(cryptoData, payload.MATRICULE);
    
    // 4. Combiner le contenu visible avec les données chiffrées
    const fullContent = `${visibleContent}

Informations cryptées: CRPY-${encryptedData}`;
    
    console.log(`📋 QR Code généré pour ${documentType}:`, {
      visibleLength: visibleContent.length,
      encryptedLength: encryptedData.length,
      totalLength: fullContent.length
    });
    
    return fullContent;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code avec chiffrement:', error);
    // En cas d'erreur, retourner au moins le contenu visible
    console.warn('⚠️ Fallback: génération du QR code sans chiffrement');
    return getQrCodePayload(payload, documentType);
  }
}

/**
 * Génère un QR code avec support du chiffrement
 */
export async function generateQrCode(
  payload: StudentExcelRecord,
  documentType: "releve" | "attestation" | "diplome" = "releve",
  includeEncryption: boolean = true
): Promise<ArrayBuffer> {
  try {
    // Choisir le contenu selon si le chiffrement est activé
    const qrContent = includeEncryption 
      ? getQrCodePayloadWithEncryption(payload, documentType)
      : getQrCodePayload(payload, documentType);
    
    console.log(`🔄 Génération QR Code pour ${payload.MATRICULE} (${documentType})`, {
      encryption: includeEncryption,
      contentLength: qrContent.length
    });
    
    // Générer le QR code avec un niveau de correction d'erreur élevé
    // pour supporter plus de données (chiffrées)
    const qrCodeDataURL = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H', // High - supporte jusqu'à 30% d'erreur
      margin: 1,
      width: 400, // Augmenté pour supporter plus de données
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Convertir en ArrayBuffer
    const qrCodeImage = await fetch(qrCodeDataURL).then((res) =>
      res.arrayBuffer()
    );
    
    console.log(`✅ QR Code généré avec succès (${qrCodeImage.byteLength} bytes)`);
    return qrCodeImage;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code:', error);
    
    // En cas d'erreur avec chiffrement, essayer sans chiffrement
    if (includeEncryption) {
      console.warn('🔄 Tentative de génération sans chiffrement...');
      return generateQrCode(payload, documentType, false);
    }
    
    throw new Error('Impossible de générer le QR code');
  }
}

/**
 * Génère un QR code au format base64 avec support du chiffrement
 */
export async function generateQrCodeBase64(
  payload: StudentExcelRecord,
  documentType: "releve" | "attestation" | "diplome" = "releve",
  includeEncryption: boolean = true
): Promise<string> {
  try {
    const qrContent = includeEncryption 
      ? getQrCodePayloadWithEncryption(payload, documentType)
      : getQrCodePayload(payload, documentType);
    
    const dataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`✅ QR Code base64 généré pour ${payload.MATRICULE}`);
    return dataUrl;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code base64:', error);
    
    // Fallback sans chiffrement
    if (includeEncryption) {
      console.warn('🔄 Fallback: génération base64 sans chiffrement...');
      return generateQrCodeBase64(payload, documentType, false);
    }
    
    throw new Error('Impossible de générer le QR code base64');
  }
}

/**
 * Extrait les données chiffrées d'un contenu QR code
 */
export function extractEncryptedData(qrContent: string): string | null {
  try {
    // Rechercher le pattern "CRPY-" suivi des données chiffrées
    const match = qrContent.match(/Informations cryptées: CRPY-(.+)$/m);
    if (match && match[1]) {
      console.log('📤 Données chiffrées extraites:', match[1].substring(0, 20) + '...');
      return match[1];
    }
    
    console.warn('⚠️ Aucune donnée chiffrée trouvée dans le QR code');
    return null;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction des données chiffrées:', error);
    return null;
  }
}

/**
 * Vérifie si un QR code contient des données chiffrées
 */
export function hasEncryptedData(qrContent: string): boolean {
  return qrContent.includes('Informations cryptées: CRPY-');
}

/**
 * Extrait les informations visibles d'un QR code (sans chiffrement)
 */
export function extractVisibleData(qrContent: string): Record<string, string> {
  const data: Record<string, string> = {};
  
  try {
    // Séparer le contenu visible des données chiffrées
    const visiblePart = qrContent.split('Informations cryptées:')[0].trim();
    
    // Parser chaque ligne
    const lines = visiblePart.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        data[key] = value;
      }
    });
    
    console.log('📊 Données visibles extraites:', Object.keys(data).length, 'champs');
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction des données visibles:', error);
    return data;
  }
}

/**
 * Fonction utilitaire pour créer un QR code de test avec chiffrement
 */
export async function createTestQRCode(
  studentData: Partial<StudentExcelRecord>,
  documentType: "releve" | "attestation" | "diplome" = "attestation"
): Promise<string> {
  // Données de test par défaut
  const defaultStudent: StudentExcelRecord = {
    ETABLISSEMENT: "INSTITUT SUPERIEUR DES SCIENCES, ARTS ET METIERS",
    NOM: "BIKINDOU LUCA",
    PRENOM: "JUSTE-AMOUR", 
    MATRICULE: "18A1008-ABO",
    "DATE DE NAISSANCE": "14/10/1999",
    "LIEU DE NAISSANCE": "BRAZZAVILLE",
    PARCOURS: "",
    SPECIALITE: "",
    OPTION: "",
    MOYENNE: 15.2,
    GRADE: "B+",
    MENTION: "Bien",
    "ANNEE ACADEMIQUE": "2022/2023",
    ...studentData
  };
  
  console.log('🧪 Création d\'un QR code de test...');
  return await generateQrCodeBase64(defaultStudent, documentType, true);
}

// Export des types pour utilisation dans d'autres modules
export type { StudentCryptoData } from '../crypto/encryption';