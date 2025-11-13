// src/components/organisms/receipts/MultiSemesterGenerator.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Layers, AlertCircle, CheckCircle, Info } from "lucide-react";
import { ClassConfig } from "@/components/organisms/configs/types";

interface MultiSemesterGeneratorProps {
  config: ClassConfig;
  onGenerateMultiple: (semesterIds: string[]) => Promise<void>;
  onSemesterSelectionChange?: (semesterIds: string[]) => void;
  isLoading: boolean;
}

export const MultiSemesterGenerator: React.FC<MultiSemesterGeneratorProps> = ({
  config,
  onGenerateMultiple,
  onSemesterSelectionChange,
  isLoading
}) => {
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  // NOUVEAU: Synchroniser avec la sélection du parent au montage
  useEffect(() => {
    // Au montage, vérifier si tous les semestres sont déjà sélectionnés
    // (cas "Tous les semestres" sélectionné depuis le sélecteur)
    if (config && config.semesters.length > 0 && selectedSemesters.length === 0) {
      // Chercher dans le localStorage ou utiliser une prop
      const allSemesterIds = config.semesters.map(s => s.id);
      // Vérifier si on doit présélectionner (via localStorage par exemple)
      const savedSelection = localStorage.getItem(`multi-semester-selection-${config.id}`);
      if (savedSelection) {
        try {
          const parsed = JSON.parse(savedSelection);
          setSelectedSemesters(parsed);
          if (onSemesterSelectionChange) {
            onSemesterSelectionChange(parsed);
          }
        } catch (e) {
          console.error('Erreur parsing selection:', e);
        }
      }
    }
  }, [config]);

  const toggleSemester = useCallback((semesterId: string) => {
    setSelectedSemesters(prev => {
      const newSelection = prev.includes(semesterId)
        ? prev.filter(id => id !== semesterId)
        : [...prev, semesterId];

      // Sauvegarder dans localStorage
      if (config) {
        localStorage.setItem(`multi-semester-selection-${config.id}`, JSON.stringify(newSelection));
      }

      // Notifier le parent du changement
      if (onSemesterSelectionChange) {
        onSemesterSelectionChange(newSelection);
      }

      return newSelection;
    });
  }, [config, onSemesterSelectionChange]);

  const selectAll = useCallback(() => {
    const allIds = config.semesters.map(s => s.id);
    setSelectedSemesters(allIds);

    // Sauvegarder dans localStorage
    localStorage.setItem(`multi-semester-selection-${config.id}`, JSON.stringify(allIds));

    // Notifier le parent
    if (onSemesterSelectionChange) {
      onSemesterSelectionChange(allIds);
    }
  }, [config, onSemesterSelectionChange]);

  const deselectAll = useCallback(() => {
    setSelectedSemesters([]);

    // Sauvegarder dans localStorage
    if (config) {
      localStorage.setItem(`multi-semester-selection-${config.id}`, JSON.stringify([]));
    }

    // Notifier le parent
    if (onSemesterSelectionChange) {
      onSemesterSelectionChange([]);
    }
  }, [config, onSemesterSelectionChange]);

  const handleGenerate = useCallback(async () => {
    if (selectedSemesters.length === 0) return;

    setGenerating(true);
    try {
      await onGenerateMultiple(selectedSemesters);
    } finally {
      setGenerating(false);
    }
  }, [selectedSemesters, onGenerateMultiple]);

  if (!config || config.semesters.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Aucun semestre disponible pour cette configuration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Layers className="h-5 w-5" />
          Génération multi-semestres
        </CardTitle>
        <p className="text-sm text-purple-700 mt-2">
          Générez les relevés de notes pour plusieurs semestres à la fois. Les relevés seront organisés par semestre dans l'archive finale.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions groupées */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={isLoading || generating}
          >
            Tout sélectionner
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={isLoading || generating}
          >
            Tout désélectionner
          </Button>
          <Badge variant="secondary" className="ml-auto">
            {selectedSemesters.length} / {config.semesters.length} sélectionné(s)
          </Badge>
        </div>

        {/* Liste des semestres */}
        <div className="space-y-2">
          {config.semesters.map((semester) => {
            const totalCredits = semester.ues.reduce((sum, ue) => sum + (ue.credits || 0), 0);
            const totalUEs = semester.ues.length;
            const totalECs = semester.ues.reduce((sum, ue) => sum + ue.ecs.length, 0);

            return (
              <div
                key={semester.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedSemesters.includes(semester.id)
                    ? 'bg-purple-100 border-purple-400'
                    : 'bg-white border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => toggleSemester(semester.id)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedSemesters.includes(semester.id)}
                    onCheckedChange={() => toggleSemester(semester.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{semester.name}</h4>
                      {semester.isComposite && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                          Composite
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{totalUEs} UE{totalUEs > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{totalECs} EC{totalECs > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{totalCredits} crédits</span>
                    </div>
                  </div>
                  {selectedSemesters.includes(semester.id) && (
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Informations et bouton de génération */}
        {selectedSemesters.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-purple-200">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Génération prévue :</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{selectedSemesters.length} semestre{selectedSemesters.length > 1 ? 's' : ''} sélectionné{selectedSemesters.length > 1 ? 's' : ''}</li>
                  <li>Les relevés seront regroupés par semestre dans des dossiers séparés</li>
                  <li>Une archive ZIP globale sera créée avec tous les relevés</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleGenerate}
              disabled={isLoading || generating || selectedSemesters.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {generating ? 'Génération en cours...' : `Générer les relevés (${selectedSemesters.length} semestre${selectedSemesters.length > 1 ? 's' : ''})`}
            </Button>
          </div>
        )}

        {selectedSemesters.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sélectionnez au moins un semestre pour générer des relevés.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
