// src/lib/helpers/qrcode.ts - Version mise à jour avec chiffrement
import QRCode from "qrcode";
import { encryptStudentData, StudentCryptoData } from '../crypto/encryption';

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
};

/**
 * Convertit les données Excel en format crypto
 */
function convertToCryptoData(payload: StudentExcelRecord, documentType: "releve" | "attestation" | "diplome"): StudentCryptoData {
  const baseData: StudentCryptoData = {
    etablissement: payload.ETABLISSEMENT,
    nom: payload.NOM,
    prenom: payload.PRENOM,
    matricule: payload.MATRICULE,
    dateDeNaissance: payload["DATE DE NAISSANCE"],
    lieuDeNaissance: payload["LIEU DE NAISSANCE"],
    moyenne: payload.MOYENNE,
    grade: payload.GRADE,
    mention: payload.MENTION
  };

  // Ajouter des champs spécifiques selon le type de document
  switch (documentType) {
    case "releve":
      return {
        ...baseData,
        niveau: payload.NIVEAU,
        semestre: payload.SEMESTRE,
        anneeAcademique: payload["ANNEE ACADEMIQUE"]
      };
    
    case "attestation":
      return {
        ...baseData,
        parcours: payload.PARCOURS,
        specialite: payload.SPECIALITE,
        option: payload.OPTION,
        anneeAcademique: payload["ANNEE ACADEMIQUE"],
        finalite: payload.FINALITE,
        totalCredit: payload["TOTAL CREDIT"],
        domaine: payload.DOMAINE
      };
    
    case "diplome":
      return {
        ...baseData,
        parcours: payload.PARCOURS,
        specialite: payload.SPECIALITE,
        option: payload.OPTION,
        anneeObtention: payload["ANNEE D'OBTENTION"],
        finalite: payload.FINALITE,
        domaine: payload.DOMAINE
      };
    
    default:
      return baseData;
  }
}

/**
 * Génère le contenu visible du QR code (inchangé)
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
Niveau: ${payload.NIVEAU}
Semestre: ${payload.SEMESTRE}
Moyenne: ${payload.MOYENNE}
Grade: ${payload.GRADE}
Mention: ${payload.MENTION}
Année académique: ${payload["ANNEE ACADEMIQUE"]}`;
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
Moyenne: ${payload.MOYENNE}
Grade: ${payload.GRADE}
Mention: ${payload.MENTION}
Année académique: ${payload["ANNEE ACADEMIQUE"]}`;
  } else if (documentType === "diplome") {
    return `Établissement: ${payload.ETABLISSEMENT}
Nom: ${payload.NOM}
Prénom: ${payload.PRENOM}
Matricule: ${payload.MATRICULE}
Date de naissance: ${payload["DATE DE NAISSANCE"]}
Lieu de naissance: ${payload["LIEU DE NAISSANCE"]}
Moyenne: ${payload.MOYENNE}
Grade: ${payload.GRADE}
Mention: ${payload.MENTION}
Année d'obtention: ${payload["ANNEE D'OBTENTION"]}
Site Web: https://fmsp-udo.cm`;
  }
  return "";
}

/**
 * Génère le contenu complet du QR code avec données chiffrées
 */
export function getQrCodePayloadWithEncryption(
  payload: StudentExcelRecord,
  documentType: "releve" | "attestation" | "diplome"
): string {
  try {
    // Générer le contenu visible standard
    const visibleContent = getQrCodePayload(payload, documentType);
    
    // Convertir en format crypto et chiffrer
    const cryptoData = convertToCryptoData(payload, documentType);
    const encryptedData = encryptStudentData(cryptoData, payload.MATRICULE);
    
    // Combiner le contenu visible avec les données chiffrées
    const fullContent = `${visibleContent}

Informations cryptées: CRPY-${encryptedData}`;
    
    return fullContent;
  } catch (error) {
    console.error('Erreur lors de la génération du QR code avec chiffrement:', error);
    // En cas d'erreur, retourner au moins le contenu visible
    return getQrCodePayload(payload, documentType);
  }
}

/**
 * Génère un QR code avec chiffrement
 */
export async function generateQrCode(
  payload: StudentExcelRecord,
  documentType: "releve" | "attestation" | "diplome" = "releve",
  includeEncryption: boolean = true
) {
  try {
    // Choisir le contenu selon si le chiffrement est activé
    const qrContent = includeEncryption 
      ? getQrCodePayloadWithEncryption(payload, documentType)
      : getQrCodePayload(payload, documentType);
    
    const qrCodeDataURL = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H', // Niveau de correction d'erreur élevé pour gérer plus de données
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    const qrCodeImage = await fetch(qrCodeDataURL).then((res) =>
      res.arrayBuffer()
    );
    
    return qrCodeImage;
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error);
    throw new Error('Impossible de générer le QR code');
  }
}

/**
 * Génère un QR code au format base64 avec chiffrement
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
    
    return await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du QR code base64:', error);
    throw new Error('Impossible de générer le QR code base64');
  }
}

/**
 * Extrait les données chiffrées d'un contenu QR code
 */
export function extractEncryptedData(qrContent: string): string | null {
  try {
    const match = qrContent.match(/Informations cryptées: CRPY-(.+)$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Erreur lors de l\'extraction des données chiffrées:', error);
    return null;
  }
}

/**
 * Valide si un QR code contient des données chiffrées
 */
export function hasEncryptedData(qrContent: string): boolean {
  return qrContent.includes('Informations cryptées: CRPY-');
}