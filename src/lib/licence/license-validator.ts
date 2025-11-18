// src/lib/licence/license-validator.ts - Validation des licences multi-types
import type { LicenseType } from './types';

export interface LicenseValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    hasCorrectPrefix: boolean;
    year: string;
    expectedPrefix: string;
    actualPrefix: string;
    licenseType?: LicenseType;
    expirationDate?: string;
  };
}

// Préfixes selon les types de licences
export const LICENSE_PREFIXES: Record<LicenseType, string> = {
  establishment: 'EST',    // Licence établissement
  single_user: 'USR',      // Licence utilisateur unique
  feature_based: 'FEA',    // Licence par fonctionnalité
  temporary: 'TMP',        // Licence temporaire
};

// Ancien préfixe pour rétrocompatibilité
const LEGACY_PREFIX = 'QRCODE';

/**
 * Extrait le type de licence depuis la clé
 */
export function extractLicenseType(licenseKey: string): LicenseType | null {
  if (!licenseKey) return null;

  const cleanKey = licenseKey.trim().toUpperCase();
  const parts = cleanKey.split('-');

  if (parts.length < 3) return null;

  const typeCode = parts[1];

  // Vérifier les nouveaux préfixes
  for (const [type, prefix] of Object.entries(LICENSE_PREFIXES)) {
    if (typeCode === prefix) {
      return type as LicenseType;
    }
  }

  // Rétrocompatibilité avec ancien format QRCODE -> single_user
  if (typeCode === LEGACY_PREFIX) {
    return 'single_user';
  }

  return null;
}

/**
 * Extrait la date d'expiration pour les licences temporaires
 * Format: YYYY-TMP-XXXXX-MMDDYYYY
 */
export function extractExpirationDate(licenseKey: string): string | null {
  if (!licenseKey) return null;

  const cleanKey = licenseKey.trim().toUpperCase();
  const parts = cleanKey.split('-');

  // Pour les licences temporaires, la date est à la fin
  if (parts.length >= 4 && parts[1] === 'TMP') {
    const dateStr = parts[parts.length - 1];
    // Format: MMDDYYYY (8 chiffres)
    if (/^\d{8}$/.test(dateStr)) {
      const month = dateStr.substring(0, 2);
      const day = dateStr.substring(2, 4);
      const year = dateStr.substring(4, 8);

      // Validation basique de la date
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }

  return null;
}

/**
 * Valide le format d'une clé de licence (multi-types)
 * Formats supportés:
 * - YYYY-EST-XXXXX (établissement)
 * - YYYY-USR-XXXXX (utilisateur unique)
 * - YYYY-FEA-XXXXX (par fonctionnalité)
 * - YYYY-TMP-XXXXX-MMDDYYYY (temporaire avec expiration)
 * - YYYY-QRCODE-XXXXX (ancien format, rétrocompatible)
 */
export function validateLicenseFormat(licenseKey: string): LicenseValidationResult {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return {
      isValid: false,
      error: 'Clé de licence vide ou invalide'
    };
  }

  // Nettoyer la clé (supprimer les espaces)
  const cleanKey = licenseKey.trim().toUpperCase();

  if (cleanKey.length < 10) {
    return {
      isValid: false,
      error: 'Clé de licence trop courte'
    };
  }

  // Obtenir l'année actuelle
  const currentYear = new Date().getFullYear().toString();

  // Extraire les parties de la clé
  const parts = cleanKey.split('-');
  if (parts.length < 3) {
    return {
      isValid: false,
      error: 'Format de licence invalide. Format attendu: YYYY-TYPE-XXXXX'
    };
  }

  const [year, typeCode, ...rest] = parts;

  // Vérifier l'année
  if (year !== currentYear) {
    return {
      isValid: false,
      error: `Année de licence invalide. La clé doit commencer par ${currentYear}`
    };
  }

  // Vérifier le type
  const licenseType = extractLicenseType(cleanKey);
  if (!licenseType) {
    const validTypes = Object.values(LICENSE_PREFIXES).concat(LEGACY_PREFIX).join(', ');
    return {
      isValid: false,
      error: `Type de licence invalide "${typeCode}". Types valides: ${validTypes}`
    };
  }

  // Pour les licences temporaires, vérifier la date d'expiration
  if (licenseType === 'temporary') {
    if (parts.length < 4) {
      return {
        isValid: false,
        error: 'Licence temporaire incomplète. Format: YYYY-TMP-XXXXX-MMDDYYYY'
      };
    }

    const expirationDate = extractExpirationDate(cleanKey);
    if (!expirationDate) {
      return {
        isValid: false,
        error: 'Date d\'expiration invalide. Format attendu: MMDDYYYY'
      };
    }

    // Vérifier si la licence n'est pas déjà expirée
    if (new Date(expirationDate) < new Date()) {
      return {
        isValid: false,
        error: 'Cette licence temporaire est expirée'
      };
    }
  }

  // Vérifier qu'il y a bien du contenu après le type
  const suffix = rest.join('-');
  if (suffix.length < 5) {
    return {
      isValid: false,
      error: 'Clé de licence incomplète après le type'
    };
  }

  // Vérifier que le suffixe ne contient que des caractères autorisés
  const validSuffixPattern = /^[A-Z0-9-]+$/;
  if (!validSuffixPattern.test(suffix)) {
    return {
      isValid: false,
      error: 'Format de licence invalide. Seuls les lettres majuscules, chiffres et tirets sont autorisés'
    };
  }

  const expectedPrefix = `${currentYear}-${typeCode}-`;

  return {
    isValid: true,
    details: {
      hasCorrectPrefix: true,
      year: currentYear,
      expectedPrefix,
      actualPrefix: expectedPrefix,
      licenseType,
      expirationDate: licenseType === 'temporary' ? extractExpirationDate(cleanKey) ?? undefined : undefined
    }
  };
}

/**
 * Génère un exemple de clé de licence valide pour l'année en cours
 */
export function generateLicenseExample(type: LicenseType = 'single_user'): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase() +
                      Math.random().toString(36).substring(2, 8).toUpperCase();

  const prefix = LICENSE_PREFIXES[type];

  if (type === 'temporary') {
    // Ajouter une date d'expiration (6 mois dans le futur)
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + 6);
    const month = String(expDate.getMonth() + 1).padStart(2, '0');
    const day = String(expDate.getDate()).padStart(2, '0');
    const year = expDate.getFullYear();
    const dateStr = `${month}${day}${year}`;

    return `${currentYear}-${prefix}-${randomSuffix}-${dateStr}`;
  }

  return `${currentYear}-${prefix}-${randomSuffix}`;
}

/**
 * Obtient le format attendu pour l'année en cours selon le type
 */
export function getExpectedLicenseFormat(type?: LicenseType): string {
  const currentYear = new Date().getFullYear();

  if (!type) {
    return `${currentYear}-TYPE-XXXXX (TYPE: EST, USR, FEA, TMP)`;
  }

  const prefix = LICENSE_PREFIXES[type];

  if (type === 'temporary') {
    return `${currentYear}-${prefix}-XXXXX-MMDDYYYY`;
  }

  return `${currentYear}-${prefix}-XXXXX`;
}

/**
 * Vérifie si une licence est expirée (année différente de l'année actuelle ou date d'expiration dépassée)
 */
export function isLicenseExpired(licenseKey: string): boolean {
  if (!licenseKey) return true;

  const currentYear = new Date().getFullYear().toString();
  const cleanKey = licenseKey.trim().toUpperCase();

  // Extraire l'année de la licence
  const yearMatch = cleanKey.match(/^(\d{4})-/);
  if (!yearMatch) return true;

  const licenseYear = yearMatch[1];
  if (licenseYear !== currentYear) return true;

  // Vérifier la date d'expiration pour les licences temporaires
  const licenseType = extractLicenseType(cleanKey);
  if (licenseType === 'temporary') {
    const expirationDate = extractExpirationDate(cleanKey);
    if (!expirationDate) return true;

    return new Date(expirationDate) < new Date();
  }

  return false;
}

/**
 * Extrait l'année d'une clé de licence
 */
export function extractLicenseYear(licenseKey: string): string | null {
  if (!licenseKey) return null;

  const cleanKey = licenseKey.trim().toUpperCase();
  const yearMatch = cleanKey.match(/^(\d{4})-/);

  return yearMatch ? yearMatch[1] : null;
}

/**
 * Obtient le label lisible d'un type de licence
 */
export function getLicenseTypeLabel(type: LicenseType): string {
  const labels: Record<LicenseType, string> = {
    establishment: 'Licence Établissement',
    single_user: 'Licence Utilisateur Unique',
    feature_based: 'Licence par Fonctionnalité',
    temporary: 'Licence Temporaire',
  };

  return labels[type] || type;
}