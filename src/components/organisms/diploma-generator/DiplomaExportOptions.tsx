// src/components/organisms/diploma-generator/DiplomaExportOptions.tsx
// Options d'export pour les diplômes avec filtrage automatique

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Archive, FileText, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DiplomaStudentRecord } from '@/lib/diploma-generator/types';
import { DiplomaThemeSettingsPayload } from '@/lib/form-schemas/diploma-theme-settings';
import { validateDiplomaList } from './diploma-validator';

interface DiplomaExportOptionsProps {
  students: DiplomaStudentRecord[];
  schoolSettings: any;
  diplomaTheme: DiplomaThemeSettingsPayload;
  exportFormat: string;
  useCompression: boolean;
  onExportFormatChange: (format: string) => void;
  onUseCompressionChange: (enabled: boolean) => void;
  onGenerateDiplomas: (validStudents: DiplomaStudentRecord[]) => void;
  isLoading: boolean;
}

export const DiplomaExportOptions: React.FC<DiplomaExportOptionsProps> = ({
  students,
  schoolSettings,
  diplomaTheme,
  exportFormat,
  useCompression,
  onExportFormatChange,
  onUseCompressionChange,
  onGenerateDiplomas,
  isLoading
}) => {
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Valider les diplômes
  const validation = validateDiplomaList(students);
  const { valid, invalid, stats } = validation;

  const handleGenerate = () => {
    // Ne génère que les diplômes valides
    const validStudents = valid.map(v => v.student);
    onGenerateDiplomas(validStudents);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Options de Génération
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques de validation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Validation automatique
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded p-3 border">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>

            <div className="bg-white rounded p-3 border border-green-300">
              <div className="text-xs text-green-600">Générables</div>
              <div className="text-2xl font-bold text-green-900">{stats.canGenerate}</div>
            </div>

            <div className="bg-white rounded p-3 border border-yellow-300">
              <div className="text-xs text-yellow-600">Données manquantes</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.missingData}</div>
            </div>

            <div className="bg-white rounded p-3 border border-orange-300">
              <div className="text-xs text-orange-600">Moyenne &lt; 10</div>
              <div className="text-2xl font-bold text-orange-900">{stats.insufficientAverage}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              {stats.canGenerate} diplôme(s) seront généré(s)
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowValidationDetails(!showValidationDetails)}
              className="text-blue-600 h-auto p-0"
            >
              {showValidationDetails ? 'Masquer les détails' : 'Voir les détails'}
            </Button>
          </div>

          {showValidationDetails && invalid.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <h5 className="font-medium text-sm text-gray-700 mb-2">Diplômes exclus :</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {invalid.map((result, index) => (
                  <div key={index} className="text-xs bg-white p-2 rounded border">
                    <div className="font-medium">
                      {result.student.NOM} {result.student.PRENOM} ({result.student.MATRICULE})
                    </div>
                    <div className="text-yellow-700 mt-1">{result.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alertes */}
        {stats.canGenerate === 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Aucun diplôme ne peut être généré. Tous les étudiants ont soit des données manquantes,
              soit une moyenne inférieure à 10/20.
            </AlertDescription>
          </Alert>
        )}

        {stats.canGenerate > 0 && stats.canGenerate < stats.total && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>{stats.total - stats.canGenerate} diplôme(s)</strong> seront exclus de la génération
              (données incomplètes ou moyenne &lt; 10). Un rapport détaillé sera généré.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Format d'export */}
          <div className="space-y-2">
            <Label>Format d'export</Label>
            <Select value={exportFormat} onValueChange={onExportFormatChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zip">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archive ZIP
                  </div>
                </SelectItem>
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Fichiers individuels
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF unique
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compression */}
          <div className="flex items-center justify-between">
            <Label htmlFor="diploma-compression">Compression avancée</Label>
            <Switch
              id="diploma-compression"
              checked={useCompression}
              onCheckedChange={onUseCompressionChange}
            />
          </div>
        </div>

        {/* Critères de génération */}
        <div className="bg-gray-50 border rounded-lg p-3 text-sm">
          <h4 className="font-semibold text-gray-900 mb-2">Critères de génération automatique :</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Tous les champs obligatoires doivent être remplis (15 champs)</li>
            <li>La moyenne doit être supérieure ou égale à 10/20</li>
            <li>Les diplômes non conformes seront listés dans le rapport</li>
          </ul>
        </div>

        {/* Bouton de génération */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleGenerate}
            disabled={isLoading || stats.canGenerate === 0}
            size="lg"
            className="min-w-48"
          >
            {isLoading ? (
              <>Génération en cours...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {exportFormat === 'pdf'
                  ? `Générer PDF unique (${stats.canGenerate})`
                  : exportFormat === 'zip'
                  ? `Générer Archive ZIP (${stats.canGenerate})`
                  : `Générer Fichiers (${stats.canGenerate})`
                }
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
