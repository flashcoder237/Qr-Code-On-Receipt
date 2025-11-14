// src/components/organisms/demo-mode-manager/DemoModeManager.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Key, 
  LogOut,
  Info,
  CheckCircle
} from 'lucide-react';

interface DemoModeManagerProps {
  onExitDemo?: () => void;
}

export const DemoModeManager: React.FC<DemoModeManagerProps> = ({ 
  onExitDemo 
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleExitDemo = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsExiting(true);
    try {
      // Supprimer le mode démo du localStorage
      localStorage.removeItem('demo_mode');
      
      
      
      // Callback optionnel
      if (onExitDemo) {
        onExitDemo();
      }
      
      // Recharger l'application pour revenir à l'écran de licence
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('❌ Erreur lors de la sortie du mode démo:', error);
      setIsExiting(false);
      setShowConfirmation(false);
    }
  };

  const limitations = [
    "Documents avec filigrane 'DÉMO'",
    "QR Codes sur PDF désactivés",
    "Fonctionnalités de sécurité limitées",
    "Documents non officiels"
  ];

  const benefits = [
    "Documents officiels sans filigrane",
    "QR Codes sécurisés avec chiffrement",
    "Toutes les fonctionnalités disponibles",
    "Support technique complet"
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Statut actuel */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Mode Démo Actif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-300 bg-orange-100">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              Vous utilisez actuellement l'application en mode démo avec des fonctionnalités limitées.
              Pour accéder à toutes les fonctionnalités, vous devez activer une licence valide.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Limitations actuelles */}
            <div>
              <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Limitations actuelles
              </h4>
              <ul className="space-y-1">
                {limitations.map((limitation, index) => (
                  <li key={index} className="text-sm text-orange-700 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>

            {/* Avantages de la licence */}
            <div>
              <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Avec une licence
              </h4>
              <ul className="space-y-1">
                {benefits.map((benefit, index) => (
                  <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action pour quitter le mode démo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Activer une licence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Pour bénéficier de toutes les fonctionnalités et générer des documents officiels, 
            vous devez activer une licence valide pour l'année {new Date().getFullYear()}.
          </p>

          {!showConfirmation ? (
            <Button 
              onClick={handleExitDemo}
              className="w-full"
              disabled={isExiting}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Quitter le mode démo et activer une licence
            </Button>
          ) : (
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Êtes-vous sûr de vouloir quitter le mode démo ? 
                  Vous serez redirigé vers l'écran d'activation de licence.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleExitDemo}
                  className="flex-1"
                  disabled={isExiting}
                >
                  {isExiting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sortie en cours...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Confirmer
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isExiting}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center border-t pt-3">
            Une fois la licence activée, vous pourrez générer des documents officiels 
            sans limitation et avec toutes les fonctionnalités de sécurité.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};