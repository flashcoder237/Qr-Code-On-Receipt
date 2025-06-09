// src/lib/licence/license-validator.ts - Nouveau fichier pour la validation
export interface LicenseValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    hasCorrectPrefix: boolean;
    year: string;
    expectedPrefix: string;
    actualPrefix: string;
  };
}

/**
 * Valide le format d'une clé de licence
 * Format requis: ANNEE-QRCODE-xxxxx (ex: 2025-QRCODE-ABC123DEF456)
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
  const expectedPrefix = `${currentYear}-QRCODE-`;

  // Vérifier si la clé commence par le bon préfixe
  if (!cleanKey.startsWith(expectedPrefix)) {
    const actualPrefix = cleanKey.split('-').slice(0, 2).join('-') + '-';
    
    return {
      isValid: false,
      error: `Format de licence invalide. La clé doit commencer par "${expectedPrefix}"`,
      details: {
        hasCorrectPrefix: false,
        year: currentYear,
        expectedPrefix,
        actualPrefix
      }
    };
  }

  // Vérifier qu'il y a bien du contenu après le préfixe
  const suffix = cleanKey.substring(expectedPrefix.length);
  if (suffix.length < 5) {
    return {
      isValid: false,
      error: 'Clé de licence incomplète après le préfixe'
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

  return {
    isValid: true,
    details: {
      hasCorrectPrefix: true,
      year: currentYear,
      expectedPrefix,
      actualPrefix: expectedPrefix
    }
  };
}

/**
 * Génère un exemple de clé de licence valide pour l'année en cours
 */
export function generateLicenseExample(): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase() + 
                      Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${currentYear}-QRCODE-${randomSuffix}`;
}

/**
 * Obtient le format attendu pour l'année en cours
 */
export function getExpectedLicenseFormat(): string {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-QRCODE-XXXXX...`;
}

/**
 * Vérifie si une licence est expirée (année différente de l'année actuelle)
 */
export function isLicenseExpired(licenseKey: string): boolean {
  if (!licenseKey) return true;
  
  const currentYear = new Date().getFullYear().toString();
  const cleanKey = licenseKey.trim().toUpperCase();
  
  // Extraire l'année de la licence
  const yearMatch = cleanKey.match(/^(\d{4})-QRCODE-/);
  if (!yearMatch) return true;
  
  const licenseYear = yearMatch[1];
  return licenseYear !== currentYear;
}

/**
 * Extrait l'année d'une clé de licence
 */
export function extractLicenseYear(licenseKey: string): string | null {
  if (!licenseKey) return null;
  
  const cleanKey = licenseKey.trim().toUpperCase();
  const yearMatch = cleanKey.match(/^(\d{4})-QRCODE-/);
  
  return yearMatch ? yearMatch[1] : null;
}