// drive-utils.ts
import { supabase } from './supabaseClient';
import { License } from './types';

/**
 * Récupère toutes les licences depuis Supabase.
 */
export const fetchLicenses = async (): Promise<Record<string, License>> => {
  try {
    const { data, error } = await supabase
      .from('license')
      .select('key, status, created_at, number_user'); // Sélectionnez toutes les colonnes nécessaires

    if (error) {
      throw new Error(error.message);
    }

    // Si les données sont présentes, construisez l'objet avec les propriétés attendues
    const licenses: Record<string, License> = {};
    data?.forEach((license: any) => {
      licenses[license.key] = {
        status: license.status,
        key: license.key,
        created_at: license.created_at,
        number_user: license.number_user,
      };
    });

    return licenses;
  } catch (error) {
    console.error('Erreur lors de la récupération des licences:', error);
    throw new Error('Impossible de récupérer les licences.');
  }
};

/**
 * Met à jour une licence spécifique en modifiant son statut dans Supabase.
 */
/**
 * Met à jour une licence spécifique et décrémente son compteur d'utilisation.
 */
export const updateAndDecrementLicense = async (licenseKey: string): Promise<boolean> => {
  try {
    // Récupérer la licence existante
    const { data, error } = await supabase
      .from("license")
      .select("number_user, status")
      .eq("key", licenseKey)
      .single();

    if (error || !data) {
      throw new Error("Licence non trouvée ou erreur dans la récupération.");
    }

    const { number_user, status } = data;

    if (number_user <= 0) {
      throw new Error("La licence a déjà été utilisée au maximum.");
    }

    // Décrémenter le compteur d'utilisation
    const newNumberUser = number_user - 1;

    // Mettre à jour le statut si nécessaire
    const newStatus = newNumberUser === 0 ? "used" : status;

    const { error: updateError } = await supabase
      .from("license")
      .update({ number_user: newNumberUser, status: newStatus })
      .eq("key", licenseKey);

    if (updateError) {
      throw new Error(updateError.message);
    }

    console.log(
      `Licence ${licenseKey} mise à jour avec succès. Statut: ${newStatus}, Utilisations restantes: ${newNumberUser}`
    );
    return true; // Succès
  } catch (error) {
    console.error("Erreur lors de la mise à jour et décrémentation de la licence :", error);
    return false; // En cas d'erreur
  }
};
