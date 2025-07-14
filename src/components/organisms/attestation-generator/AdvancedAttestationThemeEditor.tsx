// src/components/organisms/attestation-generator/AdvancedAttestationThemeEditor.tsx
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
  AdvancedAttestationConfig, 
  defaultAdvancedAttestationConfig 
} from "@/lib/form-schemas/advanced-typography";

interface AdvancedAttestationThemeEditorProps {
  config: AdvancedAttestationConfig;
  onChange: (config: AdvancedAttestationConfig) => void;
  onSave: () => void;
  onPreview?: () => void;
}

export const AdvancedAttestationThemeEditor: React.FC<AdvancedAttestationThemeEditorProps> = ({
  config,
  onChange,
  onSave,
  onPreview
}) => {
  const [activeTab, setActiveTab] = useState("typography");
  const [isModified, setIsModified] = useState(false);
  const [openFontSections, setOpenFontSections] = useState<Record<string, boolean>>({});
  const [openBorderSections, setOpenBorderSections] = useState<Record<string, boolean>>({});

  const updateConfig = (field: keyof AdvancedAttestationConfig, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
    setIsModified(true);
  };

  const resetToDefaults = () => {
    onChange(defaultAdvancedAttestationConfig);
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
    { key: 'mainTitle', label: 'Titre principal', preview: 'ATTESTATION DE REUSSITE' },
    { key: 'subtitle', label: 'Sous-titre', preview: 'ATTESTATION OF COMPLETION OF STUDIES' },
    { key: 'headerInfo', label: 'Informations d\'en-tête', preview: 'REPUBLIQUE DU CAMEROUN' },
    { key: 'studentInfo', label: 'Informations étudiant', preview: 'M./Mme/Mlle EXEMPLE Jean' },
    { key: 'tableHeader', label: 'En-têtes de tableau', preview: 'Domaine | Parcours | Spécialité' },
    { key: 'tableContent', label: 'Contenu de tableau', preview: 'SCIENCES MEDICO-SANITAIRES' },
    { key: 'footer', label: 'Corps du texte', preview: 'En foi de quoi la présente Attestation...' },
    { key: 'signature', label: 'Signatures', preview: 'Le Directeur de l\'IPES' },
    { key: 'disclaimer', label: 'Clause de non-responsabilité', preview: 'Cette Attestation ne tient pas lieu de Diplôme...' },
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
              Configuration typographique avancée
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Personnalisation détaillée des polices et bordures pour les attestations
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
                Activer la configuration typographique avancée
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Utilise les configurations détaillées ci-dessous au lieu des paramètres de thème standard
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
              La configuration avancée est désactivée. Les paramètres du thème principal sont utilisés.
              Activez l'option ci-dessus pour utiliser les configurations typographiques détaillées.
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
              CSS Avancé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="typography" className="space-y-4">
            <div className="space-y-2">
              {fontSections.map((section) => (
                <AdvancedFontEditor
                  key={section.key}
                  label={section.label}
                  value={config[section.key as keyof AdvancedAttestationConfig] as any}
                  onChange={(value) => updateConfig(section.key as keyof AdvancedAttestationConfig, value)}
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Appliquer une police uniforme à tous les éléments
                  const uniformFont = "Times New Roman, serif";
                  fontSections.forEach(section => {
                    const currentConfig = config[section.key as keyof AdvancedAttestationConfig] as any;
                    updateConfig(section.key as keyof AdvancedAttestationConfig, {
                      ...currentConfig,
                      fontFamily: uniformFont
                    });
                  });
                }}
              >
                Police uniforme
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="borders" className="space-y-4">
            <div className="space-y-2">
              {borderSections.map((section) => (
                <AdvancedBorderEditor
                  key={section.key}
                  label={section.label}
                  value={config[section.key as keyof AdvancedAttestationConfig] as any}
                  onChange={(value) => updateConfig(section.key as keyof AdvancedAttestationConfig, value)}
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

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Appliquer des bordures uniformes
                  const uniformBorder = { style: 'solid' as const, width: 1, color: '#000000' };
                  borderSections.forEach(section => {
                    updateConfig(section.key as keyof AdvancedAttestationConfig, uniformBorder);
                  });
                }}
              >
                Bordures uniformes
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Supprimer toutes les bordures
                  const noBorder = { style: 'none' as const, width: 0, color: '#000000' };
                  borderSections.forEach(section => {
                    updateConfig(section.key as keyof AdvancedAttestationConfig, noBorder);
                  });
                }}
              >
                Aucune bordure
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>CSS personnalisé pour attestations</Label>
                <Textarea
                  value={config.customCSS || ""}
                  onChange={(e) => updateConfig('customCSS', e.target.value)}
                  placeholder="/* CSS personnalisé pour les attestations */
.main-title {
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.student-name {
  background: linear-gradient(135deg, #f0f0f0, #ffffff);
  padding: 5px;
  border-radius: 3px;
}

.signature-area {
  border-top: 2px solid #000;
  margin-top: 20px;
  padding-top: 10px;
}"
                  className="font-mono text-sm"
                  rows={12}
                />
                <p className="text-xs text-gray-500">
                  Ajoutez du CSS personnalisé pour des modifications avancées du style des attestations
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Classes CSS principales pour les attestations :</strong>
                  <ul className="mt-2 text-xs space-y-1">
                    <li><code>.main-title</code> - Titre principal de l'attestation</li>
                    <li><code>.student-info</code> - Informations de l'étudiant</li>
                    <li><code>.academic-table</code> - Tableaux académiques</li>
                    <li><code>.signature-area</code> - Zone des signatures</li>
                    <li><code>.disclaimer</code> - Clause de non-responsabilité</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Exemples de styles populaires</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        updateConfig('customCSS', 
`/* Style élégant avec ombres */
.main-title {
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  letter-spacing: 2px;
}

.student-info p {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  padding: 8px;
  border-left: 4px solid #007bff;
  margin: 5px 0;
}`
                        );
                      }}
                    >
                      Style élégant
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        updateConfig('customCSS',
`/* Style minimaliste */
.container {
  box-shadow: none;
}

.academic-table {
  border: none;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
}

.signature-area {
  border-top: 1px solid #ccc;
  font-style: italic;
}`
                        );
                      }}
                    >
                      Style minimaliste
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Conseils d'utilisation</h4>
                  <ul className="text-sm space-y-2 text-gray-600">
                    <li>• Testez toujours vos modifications avec l'aperçu</li>
                    <li>• Utilisez les unités CSS appropriées (px, em, %)</li>
                    <li>• Évitez les couleurs trop vives pour l'impression</li>
                    <li>• Conservez une bonne lisibilité</li>
                  </ul>
                </Card>
              </div>
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