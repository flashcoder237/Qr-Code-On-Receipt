// src/components/organisms/template-export/TemplateConfigDialog.tsx
// Modal de configuration pour personnaliser les modèles Excel avant export

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Info, Loader2 } from 'lucide-react';
import { TemplateType } from '@/lib/helpers/excel-template-generator';
import { ClassConfig } from '@/components/organisms/configs/types';

export interface TemplateConfig {
  type: TemplateType | 'grade-entry';
  // Paramètres généraux
  numberOfStudents: number;
  includeInstructions: boolean;
  includeExamples: boolean;

  // Paramètres spécifiques aux relevés
  includeSessions?: boolean;

  // Paramètres pour le masque de saisie de notes
  classConfigId?: string;

  // Type d'établissement
  establishmentType?: string;
}

interface TemplateConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: TemplateConfig) => void;
  templateType: TemplateType | 'grade-entry';
  establishmentType?: string;
  classConfigs?: ClassConfig[];
}

export const TemplateConfigDialog: React.FC<TemplateConfigDialogProps> = ({
  open,
  onClose,
  onConfirm,
  templateType,
  establishmentType,
  classConfigs = []
}) => {
  const [config, setConfig] = useState<TemplateConfig>({
    type: templateType,
    numberOfStudents: 30,
    includeInstructions: true,
    includeExamples: false,
    includeSessions: templateType === 'releve',
    establishmentType
  });

  // Réinitialiser la config quand le type change
  useEffect(() => {
    setConfig({
      type: templateType,
      numberOfStudents: 30,
      includeInstructions: true,
      includeExamples: false,
      includeSessions: templateType === 'releve',
      establishmentType
    });
  }, [templateType, establishmentType]);

  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  const getTemplateLabel = () => {
    const labels: Record<TemplateType | 'grade-entry', string> = {
      'releve': 'Relevé de Notes',
      'attestation': 'Attestation de Réussite',
      'diploma': 'Diplôme',
      'grade-entry': 'Masque de Saisie de Notes'
    };
    return labels[templateType];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Configuration du Modèle
          </DialogTitle>
          <DialogDescription>
            Personnalisez les paramètres du modèle Excel pour {getTemplateLabel()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type de modèle */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {getTemplateLabel()}
            </Badge>
            {establishmentType && (
              <Badge variant="secondary" className="text-xs">
                {establishmentType}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Nombre d'étudiants */}
          <div className="space-y-2">
            <Label htmlFor="numberOfStudents" className="text-sm font-medium">
              Nombre de lignes pour saisie
            </Label>
            <Input
              id="numberOfStudents"
              type="number"
              min={1}
              max={1000}
              value={config.numberOfStudents}
              onChange={(e) => setConfig({ ...config, numberOfStudents: parseInt(e.target.value) || 30 })}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Le modèle contiendra {config.numberOfStudents} lignes vides pour la saisie des données
            </p>
          </div>

          {/* Masque de saisie de notes - Sélection de configuration */}
          {templateType === 'grade-entry' && (
            <div className="space-y-2">
              <Label htmlFor="classConfig" className="text-sm font-medium">
                Configuration de Classe
              </Label>
              <Select
                value={config.classConfigId}
                onValueChange={(value) => setConfig({ ...config, classConfigId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez une configuration..." />
                </SelectTrigger>
                <SelectContent>
                  {classConfigs.map((cfg) => (
                    <SelectItem key={cfg.id} value={cfg.id}>
                      {cfg.name} - {cfg.academicYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Le modèle contiendra toutes les colonnes de notes (ECs) de la configuration sélectionnée
              </p>
            </div>
          )}

          {/* Options d'inclusion */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Options d'inclusion</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeInstructions" className="text-sm">
                  Inclure les instructions
                </Label>
                <p className="text-xs text-gray-500">
                  Feuille séparée avec guide d'utilisation détaillé
                </p>
              </div>
              <Switch
                id="includeInstructions"
                checked={config.includeInstructions}
                onCheckedChange={(checked) => setConfig({ ...config, includeInstructions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeExamples" className="text-sm">
                  Inclure des exemples
                </Label>
                <p className="text-xs text-gray-500">
                  Données fictives pour comprendre le format
                </p>
              </div>
              <Switch
                id="includeExamples"
                checked={config.includeExamples}
                onCheckedChange={(checked) => setConfig({ ...config, includeExamples: checked })}
              />
            </div>

            {/* Option sessions pour relevés */}
            {templateType === 'releve' && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeSessions" className="text-sm">
                    Inclure les colonnes de sessions
                  </Label>
                  <p className="text-xs text-gray-500">
                    Colonnes S/[EC] pour identifier la session d'examen (N/année ou R/année)
                  </p>
                </div>
                <Switch
                  id="includeSessions"
                  checked={config.includeSessions}
                  onCheckedChange={(checked) => setConfig({ ...config, includeSessions: checked })}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Informations récapitulatives */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-blue-900">Récapitulatif</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• {config.numberOfStudents} lignes pour la saisie</li>
                  <li>• Instructions: {config.includeInstructions ? 'Oui' : 'Non'}</li>
                  <li>• Exemples: {config.includeExamples ? 'Oui' : 'Non'}</li>
                  {templateType === 'releve' && (
                    <li>• Sessions: {config.includeSessions ? 'Oui' : 'Non'}</li>
                  )}
                  {templateType === 'grade-entry' && config.classConfigId && (
                    <li>• Configuration sélectionnée: {classConfigs.find(c => c.id === config.classConfigId)?.name}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={templateType === 'grade-entry' && !config.classConfigId}
          >
            Générer le Modèle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
