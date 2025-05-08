import { useState, useEffect, useCallback } from 'react';
import { fetchLicenses, updateAndDecrementLicense } from '../lib/licence/drive-utils';
import LicenseDB from '../lib/licence/database';

interface UseLicenseReturn {
  isLicensed: boolean;
  isLoading: boolean;
  error: string | null;
  licenseKey: string;
  setLicenseKey: (key: string) => void;
  activateLicense: () => Promise<void>;
}

export const useLicense = (): UseLicenseReturn => {
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkStoredLicense = async () => {
      setIsLoading(true);
      try {
        const storedLicense = await LicenseDB.get();
        if (storedLicense) {
          setIsLicensed(true);
          setLicenseKey(storedLicense);
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

      const licenses = await fetchLicenses();

      if (!licenses[licenseKey]) {
        throw new Error('Licence invalide');
      }

      if (licenses[licenseKey]?.status !== 'unused') {
        throw new Error('Cette licence a déjà été utilisée');
      }

      const success = await updateAndDecrementLicense(licenseKey);

      if (!success) {
        throw new Error("Erreur lors de l'activation de la licence");
      }

      await LicenseDB.save(licenseKey);
      setIsLicensed(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur inattendue s'est produite");
      console.error('License activation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [licenseKey]);

  return {
    isLicensed,
    isLoading,
    error,
    licenseKey,
    setLicenseKey,
    activateLicense
  };
};
