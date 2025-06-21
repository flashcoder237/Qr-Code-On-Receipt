// src/components/organisms/theme-editor/AdvancedTranscriptThemeEditor.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Undo, Eye, Type, Square, Wand2, Info } from "lucide-react";
import { AdvancedFontEditor } from "@/components/ui/advanced-font-editor/AdvancedFontEditor";
import { AdvancedBorderEditor } from "@/components/ui/advanced-border-editor/AdvancedBorderEditor";
import { 
  AdvancedTranscriptConfig, 
  defaultAdvancedTranscriptConfig 
} from "@/lib/form-schemas/advanced-typography";

interface AdvancedTranscriptThemeEditorProps {
  config: AdvancedTranscriptConfig;
  onChange: (config: AdvancedTranscriptConfig) => void;
  onSave: () => void;
  onPreview?: () => void;
}

export const AdvancedTranscriptThemeEditor: React.FC<AdvancedTranscriptThemeEditorProps> = ({
  config,
  onChange,
  onSave,
  onPreview
}) => {
  const [activeTab, setActiveTab] = useState("typography");
  const [isModified, setIsModified] = useState(false);
  const [openFontSections, setOpenFontSections] = useState<Record<string, boolean>>({});
  const [openBorderSections, setOpenBorderSections] = useState<Record<string, boolean>>({});

  const updateConfig = (field: keyof AdvancedTranscriptConfig, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
    setIsModified(true);
  };

  const resetToDefaults = () => {
    onChange(defaultAdvancedTranscriptConfig);
    setIsModified(true);
  };

  const handleSave = () => {
    onSave();
    setIsModified(false);
  };

  const toggleFontSection = (section: string) => {
    setOpenFontSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleBorderSection = (section: string) => {
    setOpenBorderSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fontSections = [
    { key: 'headerTitle', label: 'Titre principal', preview: 'RELEVE DE NOTES / TRANSCRIPT' },
    { key: 'headerSubtitle', label: 'Sous-titre', preview: 'Université de Douala' },
    { key: 'headerInfo', label: 'Informations d\'en-tête', preview: 'REPUBLIQUE DU CAMEROUN' },
    { key: 'studentInfo', label: 'Informations étudiant', preview: 'NOM ET PRENOM: EXEMPLE Jean' },
    { key: 'tableHeader', label: 'En-têtes de tableau', preview: 'CODE | UNITE D\'ENSEIGNEMENT' },
    { key: 'tableContent', label: 'Contenu de tableau', preview: 'INF101 | Informatique Générale' },
    { key: 'footer', label: 'Pied de page', preview: 'Il n\'est délivré qu\'un seul exemplaire...' },
    { key: 'signature', label: 'Signatures', preview: 'Le Doyen FMSP' },
  ];

  const borderSections = [
    { key: 'documentBorder', label: 'Bordure du document' },
    { key: 'tableBorder', label: 'Bordure principale du tableau' },
    { key: 'tableHeaderBorder', label: 'Bordure des en-têtes' },
    { key: 'tableCellBorder', label: 'Bordure des cellules' },
    { key: 'signatureBorder', label: 'Bordure des signatures', optional: true },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Configuration avancée des relevés
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Personnalisation détaillée des polices et bordures pour les relevés de notes
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isModified && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Modifications non sauvegardées
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Switch pour activer la configuration avancée */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-advanced" className="text-base font-medium">
                Activer la configuration avancée
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Utilise les configurations détaillées ci-dessous au lieu des paramètres de base
              </p>
            </div>
            <Switch
              id="enable-advanced"
              checked={config.enableAdvancedTypography}
              onCheckedChange={(checked) => updateConfig('enableAdvancedTypography', checked)}
            />
          </div>
        </div>

        {!config.enableAdvancedTypography && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              La configuration avancée est désactivée. Les paramètres de base du thème sont utilisés.
              Activez l'option ci-dessus pour utiliser les configurations détaillées.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typographie
            </TabsTrigger>
            <TabsTrigger value="borders" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Bordures
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Avancé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="typography" className="space-y-4">
            <div className="space-y-2">
              {fontSections.map((section) => (
                <AdvancedFontEditor
                  key={section.key}
                  label={section.label}
                  value={config[section.key as keyof AdvancedTranscriptConfig] as any}
                  onChange={(value) => updateConfig(section.key as keyof AdvancedTranscriptConfig, value)}
                  previewText={section.preview}
                  isOpen={openFontSections[section.key]}
                  onOpenChange={(open) => toggleFontSection(section.key)}
                />
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allOpen = fontSections.every(s => openFontSections[s.key]);
                  const newState = fontSections.reduce((acc, section) => ({
                    ...acc,
                    [section.key]: !allOpen
                  }), {});
                  setOpenFontSections(newState);
                }}
              >
                {fontSections.every(s => openFontSections[s.key]) ? 'Fermer tout' : 'Ouvrir tout'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="borders" className="space-y-4">
            <div className="space-y-2">
              {borderSections.map((section) => (
                <AdvancedBorderEditor
                  key={section.key}
                  label={section.label}
                  value={config[section.key as keyof AdvancedTranscriptConfig] as any}
                  onChange={(value) => updateConfig(section.key as keyof AdvancedTranscriptConfig, value)}
                  isOpen={openBorderSections[section.key]}
                  onOpenChange={(open) => toggleBorderSection(section.key)}
                  showRadius={section.key === 'signatureBorder'}
                />
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allOpen = borderSections.every(s => openBorderSections[s.key]);
                  const newState = borderSections.reduce((acc, section) => ({
                    ...acc,
                    [section.key]: !allOpen
                  }), {});
                  setOpenBorderSections(newState);
                }}
              >
                {borderSections.every(s => openBorderSections[s.key]) ? 'Fermer tout' : 'Ouvrir tout'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>CSS personnalisé</Label>
                <Textarea
                  value={config.customCSS || ""}
                  onChange={(e) => updateConfig('customCSS', e.target.value)}
                  placeholder="/* CSS personnalisé pour les relevés */
.custom-header {
  background: linear-gradient(45deg, #f0f0f0, #ffffff);
}

.highlight-grades {
  font-weight: bold;
  color: #2563eb;
}"
                  className="font-mono text-sm"
                  rows={10}
                />
                <p className="text-xs text-gray-500">
                  Ajoutez du CSS personnalisé pour des modifications avancées du style
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Conseil :</strong> Utilisez les outils de développement de votre navigateur 
                  pour identifier les classes CSS à modifier. Les modifications CSS personnalisées 
                  ont la priorité sur les autres paramètres.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" onClick={resetToDefaults}>
            <Undo className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
        <div className="flex gap-2">
          {onPreview && (
            <Button variant="outline" onClick={onPreview}>
              <Eye className="mr-2 h-4 w-4" />
              Aperçu
            </Button>
          )}
          <Button onClick={handleSave} disabled={!isModified}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};