/**
 * Gestion des paramètres d'en-tête pour les relevés de notes
 */

import { TranscriptSettingsPayload } from "@/lib/form-schemas/settings";
import { useLocalStorage } from "usehooks-ts";

/**
 * Charge les paramètres d'en-tête depuis le localStorage
 * @returns Les paramètres d'en-tête pour les relevés de notes
 */
export const loadHeaderSettings = (): TranscriptSettingsPayload => {
    try {
        const [storedSettings, setStoredSettings] =
        useLocalStorage<TranscriptSettingsPayload>("settings", {
          nameFrench: "",
          nameEnglish: "",
          postalBox: "",
          email: "",
          logo: "",
        });
    
        if (storedSettings) {
            return JSON.parse(storedSettings);
        }
    } catch (error) {
        console.error("Erreur lors du chargement des paramètres d'en-tête:", error);
    }
    
    // Valeurs par défaut si les paramètres ne sont pas trouvés
    return {
        nameFrench: "Nom de l'établissement",
        nameEnglish: "Institution Name",
        postalBox: "B.P. 0000",
        email: "contact@example.com",
        logo: "",
    };
};