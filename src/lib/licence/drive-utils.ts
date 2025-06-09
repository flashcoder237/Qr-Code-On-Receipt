import { supabase } from './supabaseClient';
import { License } from './types';
import { validateLicenseFormat } from './license-validator';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await delay(RETRY_DELAY);
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
};

/**
 * Récupère toutes les licences depuis Supabase avec validation du format.
 */
export const fetchLicenses = async (): Promise<Record<string, License>> => {
  return retryOperation(async () => {
    const { data, error } = await supabase
      .from('license')
      .select('key, status, created_at, number_user');

    if (error) {
      throw new Error(`Erreur de récupération des licences: ${error.message}`);
    }

    if (!data) {
      throw new Error('Aucune donnée de licence trouvée');
    }

    const licenses: Record<string, License> = {};
    const currentYear = new Date().getFullYear().toString();
    
    data.forEach((license: License) => {
      // Valider le format de chaque licence récupérée
      const validation = validateLicenseFormat(license.key);
      
      if (validation.isValid) {
        // Vérifier que la licence est pour l'année actuelle
        const licenseYear = license.key.split('-')[0];
        if (licenseYear === currentYear) {
          licenses[license.key] = {
            status: license.status,
            key: license.key,
            created_at: license.created_at,
            number_user: license.number_user,
          };
        } else {
          console.warn(`Licence ignorée (année ${licenseYear} != ${currentYear}):`, license.key);
        }
      } else {
        console.warn(`Licence ignorée (format invalide):`, license.key, validation.error);
      }
    });

    console.log(`Licences valides récupérées pour ${currentYear}:`, Object.keys(licenses).length);
    return licenses;
  });
};

/**
 * Met à jour une licence spécifique et décrémente son compteur d'utilisation.
 * Inclut une validation du format avant traitement.
 */
export const updateAndDecrementLicense = async (licenseKey: string): Promise<boolean> => {
  return retryOperation(async () => {
    // Nettoyer et valider le format de la licence
    const cleanLicenseKey = licenseKey.trim().toUpperCase();
    const validation = validateLicenseFormat(cleanLicenseKey);
    
    if (!validation.isValid) {
      throw new Error(`Format de licence invalide: ${validation.error}`);
    }

    // Vérifier l'année
    const currentYear = new Date().getFullYear().toString();
    const licenseYear = cleanLicenseKey.split('-')[0];
    
    if (licenseYear !== currentYear) {
      throw new Error(`Licence expirée. Cette licence est pour l'année ${licenseYear}, nous sommes en ${currentYear}.`);
    }

    // Récupérer la licence depuis la base de données
    const { data: license, error: fetchError } = await supabase
      .from('license')
      .select('number_user, status')
      .eq('key', cleanLicenseKey)
      .single();

    if (fetchError || !license) {
      throw new Error(`Licence non trouvée: ${cleanLicenseKey}`);
    }

    const { number_user, status } = license;

    // Vérifier le statut
    if (status === 'used') {
      throw new Error('Cette licence a déjà été entièrement utilisée');
    }

    if (number_user <= 0) {
      throw new Error('La licence a déjà été utilisée au maximum');
    }

    // Calculer le nouveau nombre d'utilisateurs et statut
    const newNumberUser = number_user - 1;
    const newStatus = newNumberUser === 0 ? 'used' : 'unused';

    // Mettre à jour la licence
    const { error: updateError } = await supabase
      .from('license')
      .update({ 
        number_user: newNumberUser, 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('key', cleanLicenseKey);

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
    }

    console.log(`✅ Licence activée avec succès: ${cleanLicenseKey} (${newNumberUser} utilisations restantes)`);
    return true;
  });
};

/**
 * Vérifie si une licence existe et est disponible sans la consommer.
 */
export const checkLicenseAvailability = async (licenseKey: string): Promise<{
  exists: boolean;
  available: boolean;
  remainingUses: number;
  status: string;
  error?: string;
}> => {
  try {
    const cleanLicenseKey = licenseKey.trim().toUpperCase();
    
    // Valider le format
    const validation = validateLicenseFormat(cleanLicenseKey);
    if (!validation.isValid) {
      return {
        exists: false,
        available: false,
        remainingUses: 0,
        status: 'invalid_format',
        error: validation.error
      };
    }

    // Vérifier l'année
    const currentYear = new Date().getFullYear().toString();
    const licenseYear = cleanLicenseKey.split('-')[0];
    
    if (licenseYear !== currentYear) {
      return {
        exists: false,
        available: false,
        remainingUses: 0,
        status: 'expired',
        error: `Licence expirée (année ${licenseYear})`
      };
    }

    // Vérifier dans la base de données
    const { data: license, error } = await supabase
      .from('license')
      .select('number_user, status')
      .eq('key', cleanLicenseKey)
      .single();

    if (error || !license) {
      return {
        exists: false,
        available: false,
        remainingUses: 0,
        status: 'not_found',
        error: 'Licence non trouvée'
      };
    }

    return {
      exists: true,
      available: license.number_user > 0 && license.status === 'unused',
      remainingUses: license.number_user,
      status: license.status
    };
    
  } catch (error) {
    return {
      exists: false,
      available: false,
      remainingUses: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

/**
 * Génère des statistiques sur les licences pour l'année en cours.
 */
export const getLicenseStatistics = async (): Promise<{
  totalLicenses: number;
  activeLicenses: number;
  usedLicenses: number;
  totalRemainingUses: number;
  currentYear: string;
}> => {
  try {
    const currentYear = new Date().getFullYear().toString();
    
    const { data, error } = await supabase
      .from('license')
      .select('status, number_user, key')
      .like('key', `${currentYear}-QRCODE-%`);

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }

    const totalLicenses = data?.length || 0;
    const activeLicenses = data?.filter(l => l.status === 'unused' && l.number_user > 0).length || 0;
    const usedLicenses = data?.filter(l => l.status === 'used' || l.number_user === 0).length || 0;
    const totalRemainingUses = data?.reduce((sum, l) => sum + (l.number_user || 0), 0) || 0;

    return {
      totalLicenses,
      activeLicenses,
      usedLicenses,
      totalRemainingUses,
      currentYear
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    return {
      totalLicenses: 0,
      activeLicenses: 0,
      usedLicenses: 0,
      totalRemainingUses: 0,
      currentYear: new Date().getFullYear().toString()
    };
  }
};