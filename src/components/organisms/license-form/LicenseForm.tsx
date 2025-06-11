import React, { useState, useEffect } from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { validateLicenseFormat } from '../../../lib/licence/license-validator';
import { Key, AlertTriangle, CheckCircle, Info, Copy, HelpCircle, Mail } from 'lucide-react';

interface LicenseFormProps {
  licenseKey: string;
  onLicenseKeyChange: (value: string) => void;
  onActivate: () => void;
  onEnterDemo: () => void;
  error: string | null;
  isLoading: boolean;
  expectedFormat: string;
  licenseExample: string;
}

export const LicenseForm: React.FC<LicenseFormProps> = ({
  licenseKey,
  onLicenseKeyChange,
  onActivate,
  onEnterDemo,
  error,
  isLoading,
  expectedFormat,
  licenseExample
}) => {
  const [formatValidation, setFormatValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [showDemoDetails, setShowDemoDetails] = useState(false);

  // Valider le format en temps réel
  useEffect(() => {
    if (licenseKey.trim()) {
      const validation = validateLicenseFormat(licenseKey);
      setFormatValidation(validation);
    } else {
      setFormatValidation(null);
    }
  }, [licenseKey]);

  // Copier l'exemple dans le presse-papier
  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(licenseExample);
      setShowExample(true);
      setTimeout(() => setShowExample(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  // Copier l'email de support
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('cedrictefoye@gmail.com');
      // Optionnel: afficher une confirmation
    } catch (error) {
      console.error('Erreur lors de la copie de l\'email:', error);
    }
  };

  // Safe fallback for expectedFormat
  const safeExpectedFormat = expectedFormat || 'XXXXX-XXXXX-XXXXX';
  const placeholderText = `Ex: ${safeExpectedFormat.replace('XXXXX...', 'ABC123')}`;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
      {/* En-tête compact */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 flex-shrink-0">
          <img src="./logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="text-left">
          <h2 className="text-lg font-bold text-gray-700">Activation de licence</h2>
          <p className="text-xs text-gray-500">Année {new Date().getFullYear()} - Générateur académique</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Section licence principale */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Clé de licence</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyExample}
              className="ml-auto text-xs text-blue-600 hover:bg-blue-50 px-2 py-1"
            >
              <Copy className="h-3 w-3 mr-1" />
              {showExample ? "Copié!" : "Exemple"}
            </Button>
          </div>
          
          <div className="relative">
            <Input
              className={`w-full px-3 py-2 border rounded-md text-center font-mono text-sm ${
                formatValidation?.isValid 
                  ? 'border-green-300 bg-green-50' 
                  : licenseKey.trim() && formatValidation 
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
              }`}
              type="text"
              value={licenseKey}
              onChange={(e) => onLicenseKeyChange(e.target.value.toUpperCase())}
              placeholder={placeholderText}
              disabled={isLoading}
              aria-label="Clé de licence"
            />
            
            {/* Icône de validation dans l'input */}
            {licenseKey.trim() && formatValidation && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {formatValidation.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          
          {/* Message d'erreur format compact */}
          {licenseKey.trim() && formatValidation && !formatValidation.isValid && (
            <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <span>Format: {safeExpectedFormat}</span>
            </div>
          )}
          
          <Button
            onClick={onActivate}
            className="mt-3 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 text-sm"
            disabled={isLoading || !licenseKey.trim() || (formatValidation && !formatValidation.isValid)}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Activation...
              </div>
            ) : (
              'Activer la licence'
            )}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-400">ou</span>
          </div>
        </div>

        {/* Section démo compacte */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600">Mode démo</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDemoDetails(!showDemoDetails)}
              className="ml-auto text-xs text-orange-600 hover:bg-orange-50 px-2 py-1"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              {showDemoDetails ? "Masquer" : "Détails"}
            </Button>
          </div>
          
          {showDemoDetails && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-2 mb-3">
              <div className="text-xs text-orange-800 space-y-1">
                <p className="font-medium">Limitations:</p>
                <p>• Filigrane "DÉMO" • QR Codes désactivés • Non officiel</p>
              </div>
            </div>
          )}
          
          <Button
            onClick={onEnterDemo}
            variant="outline"
            className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 text-sm py-2"
            disabled={isLoading}
          >
            Continuer en mode démo
          </Button>
        </div>
      </div>
      
      {/* Erreurs */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Support contact */}
      <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-blue-600" />
            <span className="text-xs text-blue-800 font-medium">Besoin d'aide ?</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyEmail}
            className="text-xs text-blue-600 hover:bg-blue-100 px-2 py-1"
          >
            <Copy className="h-3 w-3 mr-1" />
            cedrictefoye@gmail.com
          </Button>
        </div>
      </div>

      {/* Info importante en footer compact */}
      <div className="mt-2 p-2 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600 text-center">
          <Key className="h-3 w-3 inline mr-1" />
          Licence valide uniquement pour {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};