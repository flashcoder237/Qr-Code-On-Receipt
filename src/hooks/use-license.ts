import { useState, useEffect, useCallback } from 'react';
import { fetchLicenses, updateAndDecrementLicense } from '../lib/licence/drive-utils';
import LicenseDB from '../lib/licence/database';
import { 
  validateLicenseFormat, 
  isLicenseExpired, 
  getExpectedLicenseFormat,
  generateLicenseExample 
} from '../lib/licence/license-validator';

interface UseLicenseReturn {
  isLicensed: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  error: string | null;
  licenseKey: string;
  setLicenseKey: (key: string) => void;
  activateLicense: () => Promise<void>;
  enterDemoMode: () => void;
  expectedFormat: string;
  licenseExample: string;
}

export const useLicense = (): UseLicenseReturn => {
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Obtenir le format attendu et un exemple
  const expectedFormat = getExpectedLicenseFormat();
  const licenseExample = generateLicenseExample();

  useEffect(() => {
    const checkStoredLicense = async () => {
      setIsLoading(true);
      try {
        const storedLicense = await LicenseDB.get();
        const demoMode = localStorage.getItem('demo_mode') === 'true';
        
        if (storedLicense) {
          // Vérifier le format de la licence stockée
          const formatValidation = validateLicenseFormat(storedLicense);
          
          if (!formatValidation.isValid) {
            console.warn('Licence stockée invalide (format):', formatValidation.error);
            // Supprimer la licence invalide
            await LicenseDB.delete();
            setError(`Licence expirée ou invalide: ${formatValidation.error}`);
            setIsLicensed(false);
            setIsDemoMode(false);
            return;
          }

          // Vérifier si la licence est expirée (année différente)
          if (isLicenseExpired(storedLicense)) {
            console.warn('Licence expirée (année)');
            await LicenseDB.delete();
            setError('Licence expirée. Une nouvelle licence est requise pour l\'année en cours.');
            setIsLicensed(false);
            setIsDemoMode(false);
            return;
          }

          setIsLicensed(true);
          setLicenseKey(storedLicense);
          setIsDemoMode(false);
        } else if (demoMode) {
          setIsDemoMode(true);
          setIsLicensed(false);
        } else {
          setIsLicensed(false);
          setIsDemoMode(false);
        }
      } catch (error) {
        setError('Erreur lors de la vérification de la licence');
        console.error('License check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredLicense();
  }, []);

  const activateLicense = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!licenseKey.trim()) {
        throw new Error('Veuillez entrer une clé de licence');
      }

      // Valider le format de la licence
      const formatValidation = validateLicenseFormat(licenseKey);
      if (!formatValidation.isValid) {
        throw new Error(formatValidation.error || 'Format de licence invalide');
      }

      // Nettoyer la clé (majuscules, suppression espaces)
      const cleanLicenseKey = licenseKey.trim().toUpperCase();

      // Vérifier que la licence existe dans la base de données
      const licenses = await fetchLicenses();

      if (!licenses[cleanLicenseKey]) {
        throw new Error(`Licence non trouvée. Format attendu: ${expectedFormat}`);
      }

      if (licenses[cleanLicenseKey]?.status !== 'unused') {
        throw new Error('Cette licence a déjà été utilisée');
      }

      // Activer la licence
      const success = await updateAndDecrementLicense(cleanLicenseKey);

      if (!success) {
        throw new Error("Erreur lors de l'activation de la licence");
      }

      await LicenseDB.save(cleanLicenseKey);
      localStorage.removeItem('demo_mode'); // Supprimer le mode démo
      setIsLicensed(true);
      setIsDemoMode(false);
      setLicenseKey(cleanLicenseKey);
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : "Une erreur inattendue s'est produite";
      
      // Ajouter des informations sur le format attendu si c'est une erreur de format
      if (errorMessage.includes('Format') || errorMessage.includes('commencer par')) {
        errorMessage += `\n\nFormat attendu: ${expectedFormat}\nExemple: ${licenseExample}`;
      }
      
      setError(errorMessage);
      console.error('License activation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [licenseKey, expectedFormat, licenseExample]);

  const enterDemoMode = useCallback(() => {
    localStorage.setItem('demo_mode', 'true');
    setIsDemoMode(true);
    setIsLicensed(false);
    setError(null);
  }, []);

  return {
    isLicensed,
    isDemoMode,
    isLoading,
    error,
    licenseKey,
    setLicenseKey,
    activateLicense,
    enterDemoMode,
    expectedFormat,
    licenseExample
  };
};