// src/components/dev/LicenseReset.tsx - Version mise à jour
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, RefreshCw, Key, AlertTriangle, Shield, Eye, EyeOff, Plus, CheckCircle, Copy } from 'lucide-react';
import LicenseDB from '@/lib/licence/database';
import { 
  validateLicenseFormat, 
  generateLicenseExample, 
  getExpectedLicenseFormat,
  extractLicenseYear,
  isLicenseExpired 
} from '@/lib/licence/license-validator';

export const LicenseReset: React.FC = () => {
  const [licenseStatus, setLicenseStatus] = React.useState<string>('Vérification...');
  const [demoStatus, setDemoStatus] = React.useState<string>('Vérification...');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showLicenseKey, setShowLicenseKey] = React.useState(false);
  const [licenseKey, setLicenseKey] = React.useState<string>('');
  const [licenseDetails, setLicenseDetails] = React.useState<{
    year?: string;
    isExpired?: boolean;
    isValidFormat?: boolean;
  }>({});
  const [testLicenseKey, setTestLicenseKey] = React.useState<string>('');

  const expectedFormat = getExpectedLicenseFormat();
  const exampleLicense = generateLicenseExample();

  // Vérifier l'état actuel
  const checkStatus = async () => {
    try {
      const license = await LicenseDB.get();
      const demoMode = localStorage.getItem('demo_mode');
      
      if (license) {
        setLicenseStatus('PRÉSENTE');
        setLicenseKey(license);
        
        // Analyser la licence
        const year = extractLicenseYear(license);
        const isExpired = isLicenseExpired(license);
        const formatValidation = validateLicenseFormat(license);
        
        setLicenseDetails({
          year: year || 'Inconnu',
          isExpired,
          isValidFormat: formatValidation.isValid
        });
      } else {
        setLicenseStatus('ABSENTE');
        setLicenseKey('');
        setLicenseDetails({});
      }
      
      setDemoStatus(demoMode === 'true' ? 'ACTIVÉ' : 'DÉSACTIVÉ');
    } catch (error) {
      setLicenseStatus('ERREUR');
      setDemoStatus('ERREUR');
    }
  };

  React.useEffect(() => {
    checkStatus();
  }, []);

  // Supprimer la licence
  const removeLicense = async () => {
    setIsLoading(true);
    try {
      await LicenseDB.delete();
      localStorage.removeItem('demo_mode');
      console.log('✅ Licence supprimée');
      await checkStatus();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Activer le mode démo directement
  const activateDemoMode = () => {
    setIsLoading(true);
    try {
      localStorage.setItem('demo_mode', 'true');
      localStorage.removeItem('license');
      console.log('✅ Mode démo activé');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Erreur lors de l\'activation du mode démo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Injecter une licence de test
  const injectTestLicense = async () => {
    if (!testLicenseKey.trim()) return;
    
    setIsLoading(true);
    try {
      const validation = validateLicenseFormat(testLicenseKey);
      if (!validation.isValid) {
        alert(`Format invalide: ${validation.error}`);
        return;
      }
      
      await LicenseDB.save(testLicenseKey.trim().toUpperCase());
      localStorage.removeItem('demo_mode');
      console.log('✅ Licence de test injectée');
      await checkStatus();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Erreur lors de l\'injection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Générer une licence exemple
  const generateAndInjectExample = async () => {
    setIsLoading(true);
    try {
      const exampleKey = generateLicenseExample();
      await LicenseDB.save(exampleKey);
      localStorage.removeItem('demo_mode');
      console.log('✅ Licence exemple générée et injectée:', exampleKey);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Copier un exemple
  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(exampleLicense);
      alert('Exemple copié dans le presse-papier!');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  // Réinitialiser tout
  const resetAll = async () => {
    setIsLoading(true);
    try {
      await LicenseDB.delete();
      localStorage.removeItem('demo_mode');
      localStorage.removeItem('current_path');
      localStorage.removeItem('academicConfigs');
      localStorage.removeItem('settings');
      localStorage.removeItem('notifications');
      console.log('✅ Tout réinitialisé');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Basculer vers le mode licence
  const switchToLicenseMode = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem('demo_mode');
      await LicenseDB.delete();
      console.log('✅ Basculement vers mode licence');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Erreur lors du basculement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testValidation = validateLicenseFormat(testLicenseKey);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Gestion des Licences (DEV) - {new Date().getFullYear()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Outil de développement pour tester les licences avec validation du format.
            <strong> Format requis: {expectedFormat}</strong>
          </AlertDescription>
        </Alert>

        {/* État actuel */}
        <div className="space-y-3">
          <h4 className="font-medium">État actuel :</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Licence :</span>
              <Badge variant={licenseStatus === 'PRÉSENTE' ? 'default' : 'secondary'}>
                <Shield className="h-3 w-3 mr-1" />
                {licenseStatus}
              </Badge>
            </div>
            
            {licenseKey && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Clé :</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      {showLicenseKey ? licenseKey : '•'.repeat(Math.min(licenseKey.length, 20))}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLicenseKey(!showLicenseKey)}
                    >
                      {showLicenseKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Année :</span>
                  <Badge variant={licenseDetails.isExpired ? 'destructive' : 'default'}>
                    {licenseDetails.year}
                    {licenseDetails.isExpired && ' (EXPIRÉE)'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Format :</span>
                  <Badge variant={licenseDetails.isValidFormat ? 'default' : 'destructive'}>
                    {licenseDetails.isValidFormat ? 'VALIDE' : 'INVALIDE'}
                  </Badge>
                </div>
              </>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Mode démo :</span>
              <Badge variant={demoStatus === 'ACTIVÉ' ? 'destructive' : 'secondary'}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {demoStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Outils de test de licence */}
        <div className="space-y-3 border-t pt-3">
          <h4 className="font-medium">Outils de test :</h4>
          
          {/* Exemple de licence */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Exemple valide :</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyExample}
                className="text-blue-600 hover:bg-blue-100"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copier
              </Button>
            </div>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded font-mono text-blue-800">
              {exampleLicense}
            </code>
          </div>

          {/* Injection de licence de test */}
          <div className="space-y-2">
            <Label htmlFor="test-license" className="text-sm font-medium">
              Injecter une licence de test :
            </Label>
            <div className="flex gap-2">
              <Input
                id="test-license"
                type="text"
                value={testLicenseKey}
                onChange={(e) => setTestLicenseKey(e.target.value.toUpperCase())}
                placeholder={expectedFormat}
                className={`font-mono text-sm ${
                  testLicenseKey.trim() && testValidation.isValid 
                    ? 'border-green-300 bg-green-50' 
                    : testLicenseKey.trim() && !testValidation.isValid
                      ? 'border-red-300 bg-red-50'
                      : ''
                }`}
                disabled={isLoading}
              />
              <Button
                onClick={injectTestLicense}
                disabled={isLoading || !testLicenseKey.trim() || !testValidation.isValid}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {testLicenseKey.trim() && (
              <div className="text-xs">
                {testValidation.isValid ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Format valide
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {testValidation.error}
                  </span>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={generateAndInjectExample}
            disabled={isLoading}
            variant="outline"
            className="w-full border-green-400 text-green-600 hover:bg-green-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? 'Génération...' : 'Générer et injecter un exemple'}
          </Button>
        </div>

        {/* Actions selon l'état */}
        <div className="space-y-3 border-t pt-3">
          <h4 className="font-medium">Actions :</h4>
          
          {licenseStatus === 'PRÉSENTE' && demoStatus === 'DÉSACTIVÉ' && (
            <>
              <Button
                onClick={activateDemoMode}
                disabled={isLoading}
                variant="outline"
                className="w-full border-orange-400 text-orange-600 hover:bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {isLoading ? 'Activation...' : 'Basculer en mode démo'}
              </Button>
              
              <Button
                onClick={removeLicense}
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Suppression...' : 'Supprimer la licence'}
              </Button>
            </>
          )}
          
          {demoStatus === 'ACTIVÉ' && (
            <Button
              onClick={switchToLicenseMode}
              disabled={isLoading}
              variant="outline"
              className="w-full border-blue-400 text-blue-600 hover:bg-blue-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isLoading ? 'Basculement...' : 'Basculer en mode licence'}
            </Button>
          )}
          
          {licenseStatus === 'ABSENTE' && demoStatus === 'DÉSACTIVÉ' && (
            <div className="text-center text-sm text-gray-500 py-4">
              État normal - Écran de licence affiché
            </div>
          )}

          <Button
            onClick={resetAll}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isLoading ? 'Réinitialisation...' : 'Réinitialisation complète'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
          <p><strong>Format requis :</strong> {expectedFormat}</p>
          <p><strong>Année actuelle :</strong> {new Date().getFullYear()} (les licences d'autres années sont rejetées)</p>
          <p><strong>Validation :</strong> Format + année + existence en base de données</p>
          <p><strong>Mode démo :</strong> Fonctionnalités limitées, filigrane sur documents</p>
        </div>
      </CardContent>
    </Card>
  );
};