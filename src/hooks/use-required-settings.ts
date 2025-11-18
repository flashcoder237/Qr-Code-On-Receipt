// src/hooks/use-required-settings.ts
import { useMemo } from 'react';
import type { TranscriptSettingsPayload } from '@/lib/form-schemas/settings';

export interface RequiredSettingsValidation {
  isValid: boolean;
  missingFields: string[];
  hasEstablishmentInfo: boolean;
  hasLogos: boolean;
  hasUserInfo: boolean;
}

/**
 * Hook pour vérifier si les paramètres obligatoires sont remplis après activation de licence
 */
export function useRequiredSettings(settings: TranscriptSettingsPayload | null): RequiredSettingsValidation {
  return useMemo(() => {
    const missingFields: string[] = [];

    if (!settings) {
      return {
        isValid: false,
        missingFields: ['Aucun paramètre configuré'],
        hasEstablishmentInfo: false,
        hasLogos: false,
        hasUserInfo: false,
      };
    }

    // Vérifier les informations établissement
    const hasEstablishmentInfo =
      !!settings.nameFrench &&
      !!settings.nameEnglish &&
      !!settings.postalBox &&
      !!settings.postalBoxEn &&
      !!settings.email;

    if (!settings.nameFrench) missingFields.push('Nom de l\'établissement (français)');
    if (!settings.nameEnglish) missingFields.push('Nom de l\'établissement (anglais)');
    if (!settings.postalBox) missingFields.push('Boîte postale (français)');
    if (!settings.postalBoxEn) missingFields.push('Boîte postale (anglais)');
    if (!settings.email) missingFields.push('Email de l\'établissement');

    // Vérifier qu'au moins un logo est présent
    const hasLogos =
      !!settings.logo ||
      !!settings.universityLogo ||
      !!settings.facultyLogo;

    if (!hasLogos) {
      missingFields.push('Au moins un logo (établissement, université ou faculté)');
    }

    // Vérifier les informations utilisateur
    const hasUserInfo = !!settings.userFullName;

    if (!settings.userFullName) {
      missingFields.push('Nom complet de l\'utilisateur');
    }

    const isValid = hasEstablishmentInfo && hasLogos && hasUserInfo;

    return {
      isValid,
      missingFields,
      hasEstablishmentInfo,
      hasLogos,
      hasUserInfo,
    };
  }, [settings]);
}

/**
 * Vérifie si les paramètres obligatoires sont remplis depuis localStorage
 */
export function checkRequiredSettings(): RequiredSettingsValidation {
  try {
    const storedSettings = localStorage.getItem('settings');
    if (!storedSettings) {
      return {
        isValid: false,
        missingFields: ['Aucun paramètre configuré'],
        hasEstablishmentInfo: false,
        hasLogos: false,
        hasUserInfo: false,
      };
    }

    const settings: TranscriptSettingsPayload = JSON.parse(storedSettings);

    const missingFields: string[] = [];

    // Vérifier les informations établissement
    const hasEstablishmentInfo =
      !!settings.nameFrench &&
      !!settings.nameEnglish &&
      !!settings.postalBox &&
      !!settings.postalBoxEn &&
      !!settings.email;

    if (!settings.nameFrench) missingFields.push('Nom de l\'établissement (français)');
    if (!settings.nameEnglish) missingFields.push('Nom de l\'établissement (anglais)');
    if (!settings.postalBox) missingFields.push('Boîte postale (français)');
    if (!settings.postalBoxEn) missingFields.push('Boîte postale (anglais)');
    if (!settings.email) missingFields.push('Email de l\'établissement');

    // Vérifier qu'au moins un logo est présent
    const hasLogos =
      !!settings.logo ||
      !!settings.universityLogo ||
      !!settings.facultyLogo;

    if (!hasLogos) {
      missingFields.push('Au moins un logo (établissement, université ou faculté)');
    }

    // Vérifier les informations utilisateur
    const hasUserInfo = !!settings.userFullName;

    if (!settings.userFullName) {
      missingFields.push('Nom complet de l\'utilisateur');
    }

    const isValid = hasEstablishmentInfo && hasLogos && hasUserInfo;

    return {
      isValid,
      missingFields,
      hasEstablishmentInfo,
      hasLogos,
      hasUserInfo,
    };
  } catch (error) {
    return {
      isValid: false,
      missingFields: ['Erreur lors de la lecture des paramètres'],
      hasEstablishmentInfo: false,
      hasLogos: false,
      hasUserInfo: false,
    };
  }
}

/**
 * Marque les paramètres comme configurés dans localStorage
 */
export function markSettingsAsConfigured(): void {
  localStorage.setItem('settings_configured', 'true');
}

/**
 * Vérifie si les paramètres ont déjà été configurés
 */
export function areSettingsConfigured(): boolean {
  return localStorage.getItem('settings_configured') === 'true';
}
