import { supabase } from './supabaseClient';
import { License } from './types';

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
 * Récupère toutes les licences depuis Supabase.
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
    data.forEach((license: License) => {
      licenses[license.key] = {
        status: license.status,
        key: license.key,
        created_at: license.created_at,
        number_user: license.number_user,
      };
    });

    return licenses;
  });
};

/**
 * Met à jour une licence spécifique et décrémente son compteur d'utilisation.
 */
export const updateAndDecrementLicense = async (licenseKey: string): Promise<boolean> => {
  return retryOperation(async () => {
    const { data: license, error: fetchError } = await supabase
      .from('license')
      .select('number_user, status')
      .eq('key', licenseKey)
      .single();

    if (fetchError || !license) {
      throw new Error('Licence non trouvée ou erreur dans la récupération');
    }

    const { number_user } = license;

    if (number_user <= 0) {
      throw new Error('La licence a déjà été utilisée au maximum');
    }

    const newNumberUser = number_user - 1;
    const newStatus = newNumberUser === 0 ? 'used' : 'unused';

    const { error: updateError } = await supabase
      .from('license')
      .update({ 
        number_user: newNumberUser, 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('key', licenseKey);

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
    }

    return true;
  });
};
