import React from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Alert } from '../../ui/alert';

interface LicenseFormProps {
  licenseKey: string;
  onLicenseKeyChange: (value: string) => void;
  onActivate: () => void;
  error: string | null;
  isLoading: boolean;
}

export const LicenseForm: React.FC<LicenseFormProps> = ({
  licenseKey,
  onLicenseKeyChange,
  onActivate,
  error,
  isLoading
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
      <div className="w-20 mx-auto mb-4">
        <img src="./logo.png" alt="Logo" className="w-full" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-700 mb-4">
        Entrez votre clé de licence :
      </h2>
      
      <Input
        className="w-full px-4 py-2 border rounded-lg text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
        type="text"
        value={licenseKey}
        onChange={(e) => onLicenseKeyChange(e.target.value)}
        placeholder="Clé de licence"
        disabled={isLoading}
        aria-label="Clé de licence"
      />
      
      <Button
        onClick={onActivate}
        className="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Activation en cours...' : 'Activer la licence'}
      </Button>
      
      <p className="italic text-xs text-gray-400 mt-2">
        Pour l'activation du logiciel, veuillez à ce que votre ordinateur
        soit connecté à Internet.
      </p>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          {error}
        </Alert>
      )}
    </div>
  );
};
