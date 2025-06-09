import React, { useState, useEffect } from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { validateLicenseFormat } from '../../../lib/licence/license-validator';
import { Key, AlertTriangle, CheckCircle, Info, Copy } from 'lucide-react';

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

  // Safe fallback for expectedFormat
  const safeExpectedFormat = expectedFormat || 'XXXXX-XXXXX-XXXXX';
  const placeholderText = `Ex: ${safeExpectedFormat.replace('XXXXX...', 'ABC123')}`;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg text-center">
      <div className="w-20 mx-auto mb-4">
        <img src="./logo.png" alt="Logo" className="w-full" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-700 mb-2">
        Activation de licence
      </h2>
      
      <p className="text-sm text-gray-500 mb-6">
        Année {new Date().getFullYear()} - Générateur de documents académiques
      </p>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-600 mb-4">
            Entrez votre clé de licence :
          </h3>
          
          {/* Format attendu */}
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Format requis:</span>
              </div>
              <code className="text-sm text-blue-800 bg-blue-100 px-2 py-1 rounded">
                {safeExpectedFormat}
              </code>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyExample}
                  className="text-xs text-blue-600 hover:bg-blue-100"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copier un exemple
                </Button>
                {showExample && (
                  <span className="text-xs text-green-600">✓ Copié!</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Input
            className={`w-full px-4 py-3 border rounded-lg text-center text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent font-mono ${
              formatValidation?.isValid 
                ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                : licenseKey.trim() && formatValidation 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-gray-500'
            }`}
            type="text"
            value={licenseKey}
            onChange={(e) => onLicenseKeyChange(e.target.value.toUpperCase())}
            placeholder={placeholderText}
            disabled={isLoading}
            aria-label="Clé de licence"
          />
          
          {/* Validation en temps réel */}
          {licenseKey.trim() && formatValidation && (
            <div className="mt-2 text-left">
              {formatValidation.isValid ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Format valide</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{formatValidation.error}</span>
                </div>
              )}
            </div>
          )}
          
          <Button
            onClick={onActivate}
            className="mt-4 w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            disabled={isLoading || !licenseKey.trim() || (formatValidation && !formatValidation.isValid)}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Activation en cours...
              </div>
            ) : (
              'Activer la licence'
            )}
          </Button>
          
          <div className="mt-3 text-xs text-gray-400 space-y-1">
            <p>✓ Clé de licence valide pour l'année {new Date().getFullYear()}</p>
            <p>✓ Connexion Internet requise pour l'activation</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Utiliser en mode démo
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Accédez au logiciel avec des fonctionnalités limitées et un filigrane "DÉMO" sur vos documents.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-800">
                <p className="font-medium mb-1">Limitations du mode démo:</p>
                <ul className="space-y-1">
                  <li>• Filigrane "DÉMO" sur tous les documents</li>
                  <li>• QR Codes sur PDF désactivés</li>
                  <li>• Documents non officiels</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Button
            onClick={onEnterDemo}
            variant="outline"
            className="w-full border-orange-400 text-orange-600 hover:bg-orange-50"
            disabled={isLoading}
          >
            Continuer en mode démo
          </Button>
        </div>
      </div>
      
      {/* Erreurs */}
      {error && (
        <Alert variant="destructive" className="mt-6 text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-wrap">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Informations sur les années */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Information importante</span>
        </div>
        <p className="text-xs text-gray-600">
          Les licences sont valides uniquement pour l'année d'émission. 
          Une licence {new Date().getFullYear()} ne fonctionnera qu'en {new Date().getFullYear()}.
        </p>
      </div>
    </div>
  );
};