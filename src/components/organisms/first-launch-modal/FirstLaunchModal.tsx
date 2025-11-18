// src/components/organisms/first-launch-modal/FirstLaunchModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Settings } from 'lucide-react';
import { checkRequiredSettings, markSettingsAsConfigured } from '@/hooks/use-required-settings';
import { useLicense } from '@/hooks/use-license';

interface FirstLaunchModalProps {
  onSettingsClick: () => void;
}

export function FirstLaunchModal({ onSettingsClick }: FirstLaunchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [validation, setValidation] = useState(checkRequiredSettings());
  const { isLicensed } = useLicense();

  useEffect(() => {
    // Vérifier si l'utilisateur est licencié et si les paramètres ne sont pas configurés
    if (isLicensed) {
      const settingsValidation = checkRequiredSettings();
      setValidation(settingsValidation);

      // Ouvrir la modal si les paramètres ne sont pas valides
      if (!settingsValidation.isValid) {
        setIsOpen(true);
      }
    }
  }, [isLicensed]);

  const handleContinue = () => {
    if (validation.isValid) {
      markSettingsAsConfigured();
      setIsOpen(false);
    }
  };

  const handleGoToSettings = () => {
    setIsOpen(false);
    onSettingsClick();
  };

  // Rafraîchir la validation quand la modal est ouverte
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setValidation(checkRequiredSettings());
    }
    setIsOpen(open);
  };

  if (!isLicensed) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuration requise
          </DialogTitle>
          <DialogDescription>
            Veuillez compléter les informations obligatoires pour utiliser l'application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Statut des informations établissement */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            {validation.hasEstablishmentInfo ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Informations établissement</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Nom, boîte postale et email de l'établissement
              </p>
              {!validation.hasEstablishmentInfo && (
                <ul className="text-xs text-red-600 mt-2 space-y-1">
                  {validation.missingFields
                    .filter(f =>
                      f.includes('établissement') ||
                      f.includes('postale') ||
                      f.includes('Email')
                    )
                    .map((field, idx) => (
                      <li key={idx}>• {field}</li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Statut des logos */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            {validation.hasLogos ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Logos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Au moins un logo doit être configuré (établissement, université ou faculté)
              </p>
              {!validation.hasLogos && (
                <p className="text-xs text-red-600 mt-2">
                  • Aucun logo configuré
                </p>
              )}
            </div>
          </div>

          {/* Statut des informations utilisateur */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            {validation.hasUserInfo ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Informations utilisateur</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Nom complet de l'utilisateur
              </p>
              {!validation.hasUserInfo && (
                <p className="text-xs text-red-600 mt-2">
                  • Nom complet de l'utilisateur
                </p>
              )}
            </div>
          </div>

          {/* Message global */}
          {!validation.isValid && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                Veuillez configurer tous les paramètres obligatoires dans la section Paramètres
                avant de pouvoir utiliser l'application.
              </AlertDescription>
            </Alert>
          )}

          {validation.isValid && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                Tous les paramètres obligatoires sont configurés. Vous pouvez continuer.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleGoToSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Aller aux paramètres
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!validation.isValid}
          >
            Continuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
