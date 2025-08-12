// src/components/organisms/attestation-generator/AttestationAdvancedStyler.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Move3D, 
  Table, 
  Eye, 
  RotateCcw, 
  Save,
  Layers,
  Square,
  PaintBucket,
  Settings2,
  Wand2,
  Monitor
} from 'lucide-react';
import { AdvancedAttestationConfig, AdvancedSpacingConfig, AdvancedTableConfig, BORDER_STYLES } from '@/lib/form-schemas/advanced-typography';
import { getTableDesignPresets, applyTableDesignPreset } from '@/utils/advanced-css-generator';
import { AttestationThemeSettingsPayload } from '@/lib/form-schemas/attestation-theme-settings';

interface AttestationAdvancedStylerProps {
  config: AdvancedAttestationConfig;
  onChange: (config: AdvancedAttestationConfig) => void;
  onPreview: () => void;
  isPreviewMode: boolean;
}

export const AttestationAdvancedStyler: React.FC<AttestationAdvancedStylerProps> = ({
  config,
  onChange,
  onPreview,
  isPreviewMode
}) => {
  const [activeTab, setActiveTab] = useState<string>('spacing');
  const [selectedPreset, setSelectedPreset] = useState<string>('classic');

  const tableDesignPresets = getTableDesignPresets();

  // Fonction pour mettre à jour l'espacement
  const updateSpacing = (field: keyof AdvancedSpacingConfig, value: number) => {
    const newSpacing = {
      ...config.spacing,
      [field]: value
    };
    onChange({
      ...config,
      spacing: newSpacing
    });
  };

  // Fonction pour mettre à jour le design de tableau
  const updateTableDesign = (field: keyof AdvancedTableConfig, value: any) => {
    const newTableDesign = {
      ...config.tableDesign,
      [field]: value
    };
    onChange({
      ...config,
      tableDesign: newTableDesign
    });
  };

  // Appliquer un preset de design de tableau
  const applyPreset = (presetName: string) => {
    const presetConfig = applyTableDesignPreset(presetName as any);
    setSelectedPreset(presetName);
    onChange({
      ...config,
      tableDesign: presetConfig
    });
  };

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = () => {
    const defaultSpacing: AdvancedSpacingConfig = {
      titleSpacing: 8,
      subtitleSpacing: 6,
      headerSpacing: 15,
      studentInfoSpacing: 10,
      tableSpacing: 8,
      paragraphSpacing: 6,
      sectionSpacing: 20,
      footerSpacing: 15,
      signatureSpacing: 25,
    };

    onChange({
      ...config,
      spacing: defaultSpacing,
      tableDesign: applyTableDesignPreset('classic')
    });
    setSelectedPreset('classic');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Style Avancé des Attestations
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className={isPreviewMode ? "bg-blue-50 border-blue-200" : ""}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? "Mode Aperçu" : "Aperçu"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="spacing" className="flex items-center gap-2">
              <Move3D className="h-4 w-4" />
              Espacements
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Design Tableau
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Modèles
            </TabsTrigger>
          </TabsList>

          {/* Onglet Espacements */}
          <TabsContent value="spacing" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Espacements entre blocs
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Espacement après le titre principal ({config.spacing?.titleSpacing || 8}px)</Label>
                  <Slider
                    value={[config.spacing?.titleSpacing || 8]}
                    onValueChange={(value) => updateSpacing('titleSpacing', value[0])}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Espacement après le sous-titre ({config.spacing?.subtitleSpacing || 6}px)</Label>
                  <Slider
                    value={[config.spacing?.subtitleSpacing || 6]}
                    onValueChange={(value) => updateSpacing('subtitleSpacing', value[0])}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Espacement après l'en-tête ({config.spacing?.headerSpacing || 15}px)</Label>
                  <Slider
                    value={[config.spacing?.headerSpacing || 15]}
                    onValueChange={(value) => updateSpacing('headerSpacing', value[0])}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Espacement après les infos étudiant ({config.spacing?.studentInfoSpacing || 10}px)</Label>
                  <Slider
                    value={[config.spacing?.studentInfoSpacing || 10]}
                    onValueChange={(value) => updateSpacing('studentInfoSpacing', value[0])}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Espacement entre tableaux ({config.spacing?.tableSpacing || 8}px)</Label>
                  <Slider
                    value={[config.spacing?.tableSpacing || 8]}
                    onValueChange={(value) => updateSpacing('tableSpacing', value[0])}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Espacement entre sections ({config.spacing?.sectionSpacing || 20}px)</Label>
                  <Slider
                    value={[config.spacing?.sectionSpacing || 20]}
                    onValueChange={(value) => updateSpacing('sectionSpacing', value[0])}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Espacement avant pied de page ({config.spacing?.footerSpacing || 15}px)</Label>
                  <Slider
                    value={[config.spacing?.footerSpacing || 15]}
                    onValueChange={(value) => updateSpacing('footerSpacing', value[0])}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Espacement entre signatures ({config.spacing?.signatureSpacing || 25}px)</Label>
                  <Slider
                    value={[config.spacing?.signatureSpacing || 25]}
                    onValueChange={(value) => updateSpacing('signatureSpacing', value[0])}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Design Tableau */}
          <TabsContent value="table" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PaintBucket className="h-4 w-4" />
                Couleurs et arrière-plans
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Couleur d'arrière-plan des en-têtes</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.tableDesign?.headerBackgroundColor || "#f0f0f0"}
                      onChange={(e) => updateTableDesign('headerBackgroundColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={config.tableDesign?.headerBackgroundColor || "#f0f0f0"}
                      onChange={(e) => updateTableDesign('headerBackgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Opacité en-têtes ({Math.round((config.tableDesign?.headerBackgroundOpacity || 1) * 100)}%)</Label>
                  <Slider
                    value={[config.tableDesign?.headerBackgroundOpacity || 1]}
                    onValueChange={(value) => updateTableDesign('headerBackgroundOpacity', value[0])}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Couleur d'arrière-plan des lignes</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.tableDesign?.rowBackgroundColor || "#ffffff"}
                      onChange={(e) => updateTableDesign('rowBackgroundColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={config.tableDesign?.rowBackgroundColor || "#ffffff"}
                      onChange={(e) => updateTableDesign('rowBackgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couleur lignes alternées</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.tableDesign?.alternateRowBackgroundColor || "#f9f9f9"}
                      onChange={(e) => updateTableDesign('alternateRowBackgroundColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={config.tableDesign?.alternateRowBackgroundColor || "#f9f9f9"}
                      onChange={(e) => updateTableDesign('alternateRowBackgroundColor', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Square className="h-4 w-4" />
                Bordures et structure
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="outer-border"
                    checked={config.tableDesign?.enableOuterBorder || false}
                    onCheckedChange={(checked) => updateTableDesign('enableOuterBorder', checked)}
                  />
                  <Label htmlFor="outer-border">Bordure extérieure</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="inner-border"
                    checked={config.tableDesign?.enableInnerBorder || false}
                    onCheckedChange={(checked) => updateTableDesign('enableInnerBorder', checked)}
                  />
                  <Label htmlFor="inner-border">Bordures intérieures</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="header-border"
                    checked={config.tableDesign?.enableHeaderBorder || false}
                    onCheckedChange={(checked) => updateTableDesign('enableHeaderBorder', checked)}
                  />
                  <Label htmlFor="header-border">Bordure en-têtes</Label>
                </div>
              </div>

              {config.tableDesign?.enableOuterBorder && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Style bordure extérieure</Label>
                    <Select
                      value={config.tableDesign?.outerBorderStyle || "solid"}
                      onValueChange={(value) => updateTableDesign('outerBorderStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BORDER_STYLES.map(style => (
                          <SelectItem key={style} value={style}>{style}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Épaisseur ({config.tableDesign?.outerBorderWidth || 1}px)</Label>
                    <Slider
                      value={[config.tableDesign?.outerBorderWidth || 1]}
                      onValueChange={(value) => updateTableDesign('outerBorderWidth', value[0])}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur bordure extérieure</Label>
                    <Input
                      type="color"
                      value={config.tableDesign?.outerBorderColor || "#000000"}
                      onChange={(e) => updateTableDesign('outerBorderColor', e.target.value)}
                      className="w-full h-10 p-1"
                    />
                  </div>
                </div>
              )}

              <Separator />

              <h3 className="text-lg font-semibold">Effets visuels</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-shadow"
                    checked={config.tableDesign?.enableShadow || false}
                    onCheckedChange={(checked) => updateTableDesign('enableShadow', checked)}
                  />
                  <Label htmlFor="enable-shadow">Ombre portée</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-radius"
                    checked={config.tableDesign?.enableRadius || false}
                    onCheckedChange={(checked) => updateTableDesign('enableRadius', checked)}
                  />
                  <Label htmlFor="enable-radius">Coins arrondis</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-striped"
                    checked={config.tableDesign?.enableStriped || false}
                    onCheckedChange={(checked) => updateTableDesign('enableStriped', checked)}
                  />
                  <Label htmlFor="enable-striped">Lignes alternées</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-hover"
                    checked={config.tableDesign?.enableHover || false}
                    onCheckedChange={(checked) => updateTableDesign('enableHover', checked)}
                  />
                  <Label htmlFor="enable-hover">Effet survol</Label>
                </div>
              </div>

              {config.tableDesign?.enableRadius && (
                <div className="space-y-2">
                  <Label>Rayon des coins ({config.tableDesign?.borderRadius || 0}px)</Label>
                  <Slider
                    value={[config.tableDesign?.borderRadius || 0]}
                    onValueChange={(value) => updateTableDesign('borderRadius', value[0])}
                    max={20}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Padding des cellules ({config.tableDesign?.cellPadding || 4}px)</Label>
                  <Slider
                    value={[config.tableDesign?.cellPadding || 4]}
                    onValueChange={(value) => updateTableDesign('cellPadding', value[0])}
                    max={20}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Padding des en-têtes ({config.tableDesign?.headerCellPadding || 6}px)</Label>
                  <Slider
                    value={[config.tableDesign?.headerCellPadding || 6]}
                    onValueChange={(value) => updateTableDesign('headerCellPadding', value[0])}
                    max={20}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Modèles prédéfinis */}
          <TabsContent value="presets" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Designs prédéfinis
              </h3>
              <p className="text-sm text-gray-600">
                Sélectionnez un design prédéfini pour votre tableau, vous pourrez ensuite le personnaliser dans l'onglet "Design Tableau".
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tableDesignPresets.map((preset) => (
                  <Card 
                    key={preset.key}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPreset === preset.key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => applyPreset(preset.key)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{preset.name}</h4>
                          {selectedPreset === preset.key && (
                            <Badge variant="default" className="text-xs">Actuel</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-tight">
                          {preset.description}
                        </p>
                        
                        {/* Aperçu visuel simple */}
                        <div className="mt-3 p-2 bg-white rounded border">
                          <div className="text-xs space-y-1">
                            <div className={`p-1 text-center font-bold ${
                              preset.key === 'modern' ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded' :
                              preset.key === 'elegant' ? 'bg-purple-100 rounded' :
                              preset.key === 'formal' ? 'bg-gray-200 border-2 border-black' :
                              preset.key === 'minimal' ? 'border-b-2 border-black' :
                              preset.key === 'borderless' ? 'bg-gray-100' :
                              'bg-gray-100 border border-black'
                            }`}>
                              En-tête
                            </div>
                            <div className={`p-1 text-center ${
                              preset.key === 'modern' ? 'bg-gray-50 rounded' :
                              preset.key === 'elegant' ? 'bg-purple-50' :
                              preset.key === 'formal' ? 'border border-gray-400' :
                              preset.key === 'borderless' ? 'bg-gray-50' :
                              'border border-black'
                            }`}>
                              Contenu
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};