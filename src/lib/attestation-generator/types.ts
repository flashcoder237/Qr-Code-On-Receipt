// src/lib/attestation-generator/types.ts
// Types partagés pour le générateur d'attestations

import { AttestationThemeSettingsPayload } from '../form-schemas/attestation-theme-settings';
import { AdvancedAttestationConfig } from '../form-schemas/advanced-typography';

/**
 * Configuration de l'établissement scolaire
 * Utilisée pour générer les en-têtes et pieds de page des attestations
 */
export interface SchoolSettings {
  establishmentType: string;
  nameFrench: string;
  nameEnglish: string;
  nameAbreviation: string;
  postalBox: string;
  postalBoxEn: string;
  email: string;
  logo?: string;
  universityLogo?: string;
  facultyLogo?: string;
  watermarkLogo?: string; // Logo personnalisé pour le fond des attestations
  themeColor?: string;
  themeFont?: string;
  theme?: AttestationThemeSettingsPayload;
  advancedConfig?: AdvancedAttestationConfig;
}

/**
 * Options de génération pour les attestations
 */
export interface GenerationOptions {
  qrCodeImage?: ArrayBuffer | string; // Support des deux formats
  qrCodePosition?: {
    x: number;
    y: number;
  };
  theme?: AttestationThemeSettingsPayload;
  encryptionEnabled?: boolean; // Support du chiffrement
  demoMode?: boolean;
}

/**
 * Options de prévisualisation
 */
export interface PreviewOptions {
  qrCodePosition?: {
    x: number;
    y: number;
  };
  qrCodeImage?: string; // Base64 encoded QR code image
  theme?: AttestationThemeSettingsPayload;
  encryptionEnabled?: boolean;
  demoMode?: boolean;
}
