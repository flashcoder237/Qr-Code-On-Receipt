// src/lib/centre-attestation-generator/types.ts
// Types pour la génération des attestations de centres

import { Centre } from '../form-schemas/centre-settings';
import { CentreAttestationTheme } from '../form-schemas/centre-attestation-theme';

/**
 * Interface pour les données d'un étudiant dans une attestation de centre
 */
export interface CentreAttestationStudentRecord {
  // Informations de base (compatibles avec système existant)
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  MOYENNE: number | string;
  MENTION: string;
  MENTION_EN?: string;
  GRADE: string;

  // Spécifique aux attestations de centres
  SPECIALITE: string;
  SPECIALITE_EN?: string;
  SPECIALITE_ABR?: string;        // Abréviation de la spécialité
  SESSION_EXAMEN: string;         // Ex: "septembre 2025"
  NUMERO_ORDRE?: string;          // Ou NUMERO_JURY
  LIEU_DELIVRANCE: string;        // Ex: "Douala"
  TITRE_ATTESTATION_FR?: string;  // Titre de l'attestation en français
  TITRE_ATTESTATION_EN?: string;  // Titre de l'attestation en anglais

  // Optionnels supplémentaires
  OPTION?: string;
  OPTION_EN?: string;
  ANNEE_ACADEMIQUE?: string;
}

/**
 * Options de génération des attestations
 */
export interface CentreAttestationGenerationOptions {
  centre: Centre;
  theme?: CentreAttestationTheme;
  isDemoMode?: boolean;
  useCompactQR?: boolean;
  includeQRCode?: boolean;
  includeWatermark?: boolean;
}

/**
 * Données pour le QR code
 */
export interface CentreAttestationQRData {
  mat: string;                    // Matricule
  nom: string;                    // Nom complet
  date: string;                   // Date de naissance
  spec: string;                   // Spécialité
  sess: string;                   // Session d'examen
  moy: number | string;           // Moyenne
  ment: string;                   // Mention
}

/**
 * Résultat de validation d'un étudiant
 */
export interface CentreAttestationValidationResult {
  isValid: boolean;
  student: CentreAttestationStudentRecord;
  errors: string[];
  warnings: string[];
}

/**
 * Statistiques de validation
 */
export interface CentreAttestationValidationStats {
  total: number;
  valid: number;
  invalid: number;
  validStudents: CentreAttestationStudentRecord[];
  invalidStudents: Array<{
    student: Partial<CentreAttestationStudentRecord>;
    errors: string[];
  }>;
}

/**
 * Options d'export
 */
export interface CentreAttestationExportOptions {
  format: 'zip' | 'individual' | 'single';
  students: CentreAttestationStudentRecord[];
  centre: Centre;
  theme?: CentreAttestationTheme;
  isDemoMode?: boolean;
  useCompactQR?: boolean;
  advancedCompression?: boolean;
}

/**
 * Résultat de génération
 */
export interface CentreAttestationGenerationResult {
  success: boolean;
  fileName?: string;
  filePath?: string;
  count: number;
  errors?: string[];
}

/**
 * Mapping des colonnes Excel
 */
export interface CentreAttestationColumnMapping {
  [key: string]: string;  // Clé: champ requis, Valeur: colonne Excel
}

/**
 * Configuration sauvegardée
 */
export interface SavedCentreAttestationConfig {
  id: string;
  name: string;
  centreId: string;
  columnMapping: CentreAttestationColumnMapping;
  lastUsed: string;
  createdAt: string;
}

// Champs requis pour la validation
export const REQUIRED_FIELDS = [
  'NOM',
  'PRENOM',
  'MATRICULE',
  'DATE DE NAISSANCE',
  'LIEU DE NAISSANCE',
  'SPECIALITE',
  'SESSION_EXAMEN',
  'LIEU_DELIVRANCE',
  'MENTION',
  'GRADE',
  'MOYENNE',
] as const;

export type RequiredField = typeof REQUIRED_FIELDS[number];

// Champs optionnels
export const OPTIONAL_FIELDS = [
  'SPECIALITE_EN',
  'MENTION_EN',
  'NUMERO_ORDRE',
  'OPTION',
  'OPTION_EN',
  'ANNEE_ACADEMIQUE',
] as const;

export type OptionalField = typeof OPTIONAL_FIELDS[number];
