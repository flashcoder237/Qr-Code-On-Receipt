/**
 * Gestion des paramètres d'en-tête pour les relevés de notes
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { TranscriptSettingsPayload } from "@/lib/form-schemas/settings";

/**
 * Charge les paramètres d'en-tête depuis le stockage local
 * @returns Les paramètres d'en-tête pour les relevés de notes
 */
export const loadHeaderSettings = (): TranscriptSettingsPayload => {
    try {
        const userDataPath = app.getPath('userData');
        const settingsPath = path.join(userDataPath, 'transcript-settings.json');
        
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            return JSON.parse(settingsData);
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

/**
 * Enregistre les paramètres d'en-tête dans le stockage local
 * @param settings Les paramètres à enregistrer
 */
export const saveHeaderSettings = (settings: TranscriptSettingsPayload): void => {
    try {
        const userDataPath = app.getPath('userData');
        const settingsPath = path.join(userDataPath, 'transcript-settings.json');
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf8');
    } catch (error) {
        console.error("Erreur lors de l'enregistrement des paramètres d'en-tête:", error);
    }
};