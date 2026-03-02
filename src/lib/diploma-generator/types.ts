// src/lib/diploma-generator/types.ts
// Types pour le générateur de diplômes

import { DiplomaThemeSettingsPayload } from '../form-schemas/diploma-theme-settings';

/**
 * Données d'un étudiant pour le diplôme
 * Données à récupérer depuis Excel
 */
export interface DiplomaStudentRecord {
  // Informations de base
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;

  // Informations académiques
  PARCOURS: string;
  SPECIALITE: string;
  OPTION?: string; // Optionnel
  "ANNEE OBTENTION": string;
  MOYENNE: number | string;
  GRADE: string;
  MENTION: string;

  // Titres du diplôme
  "TITRE DIPLOME FR": string; // Ex: "DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE"
  "TITRE DIPLOME EN": string; // Ex: "DOCTOR OF MEDICINE STATE DEGREE"

  // Traductions anglaises
  MENTION_EN?: string;
  OPTION_EN?: string;

  // Dates des jurys
  "DATE JURY ADMISSION": string;
  "DATE JURY DELIBERATION": string;
}

/**
 * Données pour le QR Code du diplôme
 */
export interface DiplomaQRData {
  nom: string;
  prenom: string;
  matricule: string;
  dateNaissance: string;
  lieuNaissance: string;
  parcours: string;
  specialite: string;
  anneeObtention: string;
  moyenne: number | string;
  grade: string;
  mention: string;
}

/**
 * Configuration de l'établissement pour les diplômes
 */
export interface DiplomaSchoolSettings {
  // Informations de base
  nameFrench: string;
  nameEnglish: string;
  nameAbreviation: string;

  // Logos
  logo?: string; // Logo FMSP
  universityLogo?: string; // Logo Université
  facultyLogo?: string; // Logo Faculté
  coatOfArms?: string; // Armoiries du Cameroun
  ministryLogo?: string; // Logo MINESUP
  watermarkLogo?: string; // Logo pour le fond

  // Thème
  theme?: DiplomaThemeSettingsPayload;
}

/**
 * Options de génération pour les diplômes
 */
export interface DiplomaGenerationOptions {
  qrCodeImage?: ArrayBuffer | string;
  qrCodePosition?: {
    x: number;
    y: number;
  };
  qrCodeSize?: number; // Taille du QR code en pixels
  theme?: DiplomaThemeSettingsPayload;
  demoMode?: boolean;
}

/**
 * Options de prévisualisation pour les diplômes
 */
export interface DiplomaPreviewOptions {
  qrCodePosition?: {
    x: number;
    y: number;
  };
  qrCodeSize?: number;
  qrCodeImage?: string; // Base64 encoded QR code image
  theme?: DiplomaThemeSettingsPayload;
  demoMode?: boolean;
}

/**
 * Thème sauvegardé pour les diplômes
 */
export interface SavedDiplomaTheme {
  id: string;
  name: string;
  description?: string;
  theme: DiplomaThemeSettingsPayload;
  createdAt: string;
  updatedAt: string;
}

/**
 * Données factices pour la prévisualisation
 */
export const FAKE_DIPLOMA_DATA: DiplomaStudentRecord = {
  NOM: "ANGOA SAAH",
  PRENOM: "GABRIELLE SANDRA",
  MATRICULE: "17MM019",
  "DATE DE NAISSANCE": "27/01/2000",
  "LIEU DE NAISSANCE": "YAOUNDE",
  PARCOURS: "MÉDECINE",
  SPECIALITE: "MÉDECINE GÉNÉRALE",
  OPTION: "N/D",
  "ANNEE OBTENTION": "2024",
  MOYENNE: 16.5,
  GRADE: "A+",
  MENTION: "TRES BIEN",
  "TITRE DIPLOME FR": "DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE GÉNÉRALE",
  "TITRE DIPLOME EN": "DOCTOR OF GENERAL MEDICINE STATE DEGREE",
  MENTION_EN: "VERY GOOD",
  OPTION_EN: "N/A",
  "DATE JURY ADMISSION": "13/10/2017",
  "DATE JURY DELIBERATION": "28/07/2024"
};
