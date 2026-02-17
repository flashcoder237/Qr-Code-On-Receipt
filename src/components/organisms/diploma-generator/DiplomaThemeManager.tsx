// src/components/organisms/diploma-generator/DiplomaThemeManager.tsx
// Composant de gestion des thèmes de diplômes

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save,
  Trash2,
  Eye,
  Plus,
  Edit,
  Check,
  X,
  Palette,
  Download,
  Upload,
} from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import {
  DiplomaThemeSettingsPayload,
  defaultDiplomaTheme,
  diplomaThemePresets,
  mergeDiplomaTheme,
} from '@/lib/form-schemas/diploma-theme-settings';
import { SavedDiplomaTheme } from '@/lib/diploma-generator/types';
import { Textarea } from '@/components/ui/textarea';

interface DiplomaThemeManagerProps {
  currentTheme: DiplomaThemeSettingsPayload;
  onThemeSelect: (theme: DiplomaThemeSettingsPayload) => void;
  onPreview?: () => void;
}

export const DiplomaThemeManager: React.FC<DiplomaThemeManagerProps> = ({
  currentTheme,
  onThemeSelect,
  onPreview,
}) => {
  const [savedThemes, setSavedThemes] = useLocalStorage<SavedDiplomaTheme[]>(
    'diploma-saved-themes',
    []
  );

  const [editingTheme, setEditingTheme] = useState<SavedDiplomaTheme | null>(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDescription, setNewThemeDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sauvegarder le thème actuel
  const handleSaveCurrentTheme = () => {
    if (!newThemeName.trim()) {
      setError('Veuillez entrer un nom pour le thème');
      return;
    }

    // Vérifier si le nom existe déjà
    const existingTheme = savedThemes.find(t => t.name === newThemeName.trim());
    if (existingTheme && !editingTheme) {
      setError('Un thème avec ce nom existe déjà');
      return;
    }

    const now = new Date().toISOString();

    if (editingTheme) {
      // Mise à jour d'un thème existant
      const updatedThemes = savedThemes.map(t =>
        t.id === editingTheme.id
          ? {
              ...t,
              name: newThemeName.trim(),
              description: newThemeDescription.trim(),
              theme: currentTheme,
              updatedAt: now,
            }
          : t
      );
      setSavedThemes(updatedThemes);
    } else {
      // Nouveau thème
      const newTheme: SavedDiplomaTheme = {
        id: crypto.randomUUID(),
        name: newThemeName.trim(),
        description: newThemeDescription.trim(),
        theme: currentTheme,
        createdAt: now,
        updatedAt: now,
      };
      setSavedThemes([...savedThemes, newTheme]);
    }

    // Réinitialiser
    setNewThemeName('');
    setNewThemeDescription('');
    setEditingTheme(null);
    setShowSaveDialog(false);
    setError(null);
  };

  // Supprimer un thème
  const handleDeleteTheme = (themeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce thème ?')) {
      setSavedThemes(savedThemes.filter(t => t.id !== themeId));
    }
  };

  // Charger un thème (fusionné avec les valeurs par défaut pour les nouvelles propriétés)
  const handleLoadTheme = (theme: Partial<DiplomaThemeSettingsPayload>) => {
    onThemeSelect(mergeDiplomaTheme(theme));
  };

  // Éditer un thème existant
  const handleEditTheme = (theme: SavedDiplomaTheme) => {
    setEditingTheme(theme);
    setNewThemeName(theme.name);
    setNewThemeDescription(theme.description || '');
    onThemeSelect(theme.theme);
    setShowSaveDialog(true);
  };

  // Exporter les thèmes
  const handleExportThemes = () => {
    const dataStr = JSON.stringify(savedThemes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diploma-themes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Importer des thèmes
  const handleImportThemes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as SavedDiplomaTheme[];
        // Fusionner avec les thèmes existants
        const merged = [...savedThemes, ...imported];
        // Dédupliquer par nom
        const unique = merged.reduce((acc, theme) => {
          if (!acc.find(t => t.name === theme.name)) {
            acc.push(theme);
          }
          return acc;
        }, [] as SavedDiplomaTheme[]);
        setSavedThemes(unique);
      } catch (error) {
        setError('Erreur lors de l\'importation des thèmes');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Thèmes préréglés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Thèmes Préréglés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(diplomaThemePresets).map(([key, theme]) => (
              <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium capitalize">{key}</h4>
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      Police: {theme.mainFont.split(',')[0]}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoadTheme(theme)}
                        className="flex-1"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Utiliser
                      </Button>
                      {onPreview && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleLoadTheme(theme);
                            setTimeout(onPreview, 100);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thèmes sauvegardés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Mes Thèmes ({savedThemes.length})
            </CardTitle>
            <div className="flex gap-2">
              <label htmlFor="import-themes">
                <Button size="sm" variant="outline" as="span">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </Button>
                <input
                  id="import-themes"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportThemes}
                />
              </label>
              {savedThemes.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleExportThemes}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setShowSaveDialog(true);
                  setEditingTheme(null);
                  setNewThemeName('');
                  setNewThemeDescription('');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {savedThemes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Aucun thème sauvegardé. Créez votre premier thème personnalisé !
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedThemes.map((theme) => (
                <Card key={theme.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <h4 className="font-medium">{theme.name}</h4>
                        {theme.description && (
                          <p className="text-xs text-gray-600 mt-1">{theme.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Modifié: {new Date(theme.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.theme.primaryColor }}
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: theme.theme.accentColor }}
                        />
                      </div>

                      <div className="text-xs text-gray-600">
                        <div>Police: {theme.theme.mainFont.split(',')[0]}</div>
                        <div>Taille titre: {theme.theme.titleFontSize}pt</div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadTheme(theme.theme)}
                          className="flex-1"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Charger
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTheme(theme)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {onPreview && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleLoadTheme(theme.theme);
                              setTimeout(onPreview, 100);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTheme(theme.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de sauvegarde */}
      {showSaveDialog && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingTheme ? 'Modifier le thème' : 'Sauvegarder le thème actuel'}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowSaveDialog(false);
                  setEditingTheme(null);
                  setError(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="theme-name">Nom du thème *</Label>
              <Input
                id="theme-name"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="Mon thème personnalisé"
              />
            </div>

            <div>
              <Label htmlFor="theme-description">Description (optionnelle)</Label>
              <Textarea
                id="theme-description"
                value={newThemeDescription}
                onChange={(e) => setNewThemeDescription(e.target.value)}
                placeholder="Description du thème..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveCurrentTheme} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {editingTheme ? 'Mettre à jour' : 'Sauvegarder'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setEditingTheme(null);
                  setError(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
