// src/components/organisms/diploma-generator/DiplomaThemeEditor.tsx
// Éditeur de thème pour les diplômes avec tous les paramètres personnalisables

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, RefreshCw, Type, Palette as PaletteIcon, Image as ImageIcon, Settings } from 'lucide-react';
import { DiplomaThemeSettingsPayload } from '@/lib/form-schemas/diploma-theme-settings';

interface DiplomaThemeEditorProps {
  theme: DiplomaThemeSettingsPayload;
  onThemeChange: (theme: DiplomaThemeSettingsPayload) => void;
  onPreview?: () => void;
  onReset?: () => void;
}

export const DiplomaThemeEditor: React.FC<DiplomaThemeEditorProps> = ({
  theme,
  onThemeChange,
  onPreview,
  onReset,
}) => {
  const updateTheme = (updates: Partial<DiplomaThemeSettingsPayload>) => {
    onThemeChange({ ...theme, ...updates });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {onReset && (
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        )}
        {onPreview && (
          <Button onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Prévisualiser
          </Button>
        )}
      </div>

      <Tabs defaultValue="typography">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typographie
          </TabsTrigger>
          <TabsTrigger value="colors">
            <PaletteIcon className="h-4 w-4 mr-2" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="sizes">
            <ImageIcon className="h-4 w-4 mr-2" />
            Tailles
          </TabsTrigger>
          <TabsTrigger value="options">
            <Settings className="h-4 w-4 mr-2" />
            Options
          </TabsTrigger>
        </TabsList>

        {/* TYPOGRAPHIE */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Polices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police principale</Label>
                <Select
                  value={theme.mainFont}
                  onValueChange={(value) => updateTheme({ mainFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Garamond, serif">Garamond</SelectItem>
                    <SelectItem value="Palatino, serif">Palatino</SelectItem>
                    <SelectItem value="Cambria, serif">Cambria</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Calibri, sans-serif">Calibri</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Police des titres</Label>
                <Select
                  value={theme.titleFont}
                  onValueChange={(value) => updateTheme({ titleFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Garamond, serif">Garamond</SelectItem>
                    <SelectItem value="Didot, serif">Didot</SelectItem>
                    <SelectItem value="Bodoni MT, serif">Bodoni MT</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tailles de texte (pt)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Titre principal: {theme.titleFontSize}pt</Label>
                <Slider
                  value={[theme.titleFontSize]}
                  onValueChange={([value]) => updateTheme({ titleFontSize: value })}
                  min={16}
                  max={32}
                  step={1}
                />
              </div>

              <div>
                <Label>Sous-titre: {theme.subtitleFontSize}pt</Label>
                <Slider
                  value={[theme.subtitleFontSize]}
                  onValueChange={([value]) => updateTheme({ subtitleFontSize: value })}
                  min={12}
                  max={24}
                  step={1}
                />
              </div>

              <div>
                <Label>Nom étudiant: {theme.studentNameFontSize}pt</Label>
                <Slider
                  value={[theme.studentNameFontSize]}
                  onValueChange={([value]) => updateTheme({ studentNameFontSize: value })}
                  min={10}
                  max={20}
                  step={0.5}
                />
              </div>

              <div>
                <Label>En-tête: {theme.headerFontSize}pt</Label>
                <Slider
                  value={[theme.headerFontSize]}
                  onValueChange={([value]) => updateTheme({ headerFontSize: value })}
                  min={7}
                  max={14}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Contenu: {theme.contentFontSize}pt</Label>
                <Slider
                  value={[theme.contentFontSize]}
                  onValueChange={([value]) => updateTheme({ contentFontSize: value })}
                  min={8}
                  max={16}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Infos étudiant: {theme.studentInfoFontSize}pt</Label>
                <Slider
                  value={[theme.studentInfoFontSize]}
                  onValueChange={([value]) => updateTheme({ studentInfoFontSize: value })}
                  min={8}
                  max={14}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Texte légal: {theme.legalTextFontSize}pt</Label>
                <Slider
                  value={[theme.legalTextFontSize]}
                  onValueChange={([value]) => updateTheme({ legalTextFontSize: value })}
                  min={6}
                  max={12}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Pied de page: {theme.footerFontSize}pt</Label>
                <Slider
                  value={[theme.footerFontSize]}
                  onValueChange={([value]) => updateTheme({ footerFontSize: value })}
                  min={7}
                  max={12}
                  step={0.5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COULEURS */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Palette de couleurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Couleur principale (bordures, titres)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      placeholder="#000080"
                    />
                  </div>
                </div>

                <div>
                  <Label>Couleur secondaire</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={theme.secondaryColor}
                      onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={theme.secondaryColor}
                      onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div>
                  <Label>Couleur d'accent</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => updateTheme({ accentColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={theme.accentColor}
                      onChange={(e) => updateTheme({ accentColor: e.target.value })}
                      placeholder="#000080"
                    />
                  </div>
                </div>

                <div>
                  <Label>Couleur bordure externe</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={theme.outerBorderColor}
                      onChange={(e) => updateTheme({ outerBorderColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={theme.outerBorderColor}
                      onChange={(e) => updateTheme({ outerBorderColor: e.target.value })}
                      placeholder="#000080"
                    />
                  </div>
                </div>

                <div>
                  <Label>Couleur bordure interne</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={theme.innerBorderColor}
                      onChange={(e) => updateTheme({ innerBorderColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={theme.innerBorderColor}
                      onChange={(e) => updateTheme({ innerBorderColor: e.target.value })}
                      placeholder="#000080"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAILLES */}
        <TabsContent value="sizes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bordures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Largeur bordure externe: {theme.outerBorderWidth}px</Label>
                <Slider
                  value={[theme.outerBorderWidth]}
                  onValueChange={([value]) => updateTheme({ outerBorderWidth: value })}
                  min={1}
                  max={15}
                  step={1}
                />
              </div>

              <div>
                <Label>Largeur bordure interne: {theme.innerBorderWidth}px</Label>
                <Slider
                  value={[theme.innerBorderWidth]}
                  onValueChange={([value]) => updateTheme({ innerBorderWidth: value })}
                  min={0}
                  max={5}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logos (px)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo FMSP: {theme.fmspLogoSize}px</Label>
                <Slider
                  value={[theme.fmspLogoSize]}
                  onValueChange={([value]) => updateTheme({ fmspLogoSize: value })}
                  min={30}
                  max={100}
                  step={5}
                />
              </div>

              <div>
                <Label>Logo Université: {theme.universityLogoSize}px</Label>
                <Slider
                  value={[theme.universityLogoSize]}
                  onValueChange={([value]) => updateTheme({ universityLogoSize: value })}
                  min={60}
                  max={150}
                  step={5}
                />
              </div>

              <div>
                <Label>Logo MINESUP: {theme.minesupLogoSize}px</Label>
                <Slider
                  value={[theme.minesupLogoSize]}
                  onValueChange={([value]) => updateTheme({ minesupLogoSize: value })}
                  min={40}
                  max={120}
                  step={5}
                />
              </div>

              <div>
                <Label>Armoiries: {theme.coatOfArmsSize}px</Label>
                <Slider
                  value={[theme.coatOfArmsSize]}
                  onValueChange={([value]) => updateTheme({ coatOfArmsSize: value })}
                  min={60}
                  max={150}
                  step={5}
                />
              </div>

              <div>
                <Label>Logo watermark central: {theme.watermarkLogoSize}px</Label>
                <Slider
                  value={[theme.watermarkLogoSize]}
                  onValueChange={([value]) => updateTheme({ watermarkLogoSize: value })}
                  min={200}
                  max={600}
                  step={20}
                />
              </div>

              <div>
                <Label>QR Code: {theme.qrCodeSize}px</Label>
                <Slider
                  value={[theme.qrCodeSize]}
                  onValueChange={([value]) => updateTheme({ qrCodeSize: value })}
                  min={40}
                  max={100}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marges du document (mm)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Marge supérieure: {theme.documentMarginTop}mm</Label>
                <Slider
                  value={[theme.documentMarginTop]}
                  onValueChange={([value]) => updateTheme({ documentMarginTop: value })}
                  min={3}
                  max={15}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Marge inférieure: {theme.documentMarginBottom}mm</Label>
                <Slider
                  value={[theme.documentMarginBottom]}
                  onValueChange={([value]) => updateTheme({ documentMarginBottom: value })}
                  min={3}
                  max={15}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Marge gauche: {theme.documentMarginLeft}mm</Label>
                <Slider
                  value={[theme.documentMarginLeft]}
                  onValueChange={([value]) => updateTheme({ documentMarginLeft: value })}
                  min={3}
                  max={15}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Marge droite: {theme.documentMarginRight}mm</Label>
                <Slider
                  value={[theme.documentMarginRight]}
                  onValueChange={([value]) => updateTheme({ documentMarginRight: value })}
                  min={3}
                  max={15}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Espacement entre sections: {theme.sectionSpacing}mm</Label>
                <Slider
                  value={[theme.sectionSpacing]}
                  onValueChange={([value]) => updateTheme({ sectionSpacing: value })}
                  min={2}
                  max={10}
                  step={0.5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPTIONS */}
        <TabsContent value="options" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Options d'affichage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Afficher le QR Code</Label>
                <Switch
                  checked={theme.showQRCode}
                  onCheckedChange={(checked) => updateTheme({ showQRCode: checked })}
                />
              </div>

              {theme.showQRCode && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-blue-200 bg-blue-50 p-3 rounded">
                  <div>
                    <Label className="text-blue-900">QR Code compact</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Activé:</strong> 6 champs essentiels (mat, nom, date, dipl, moy, ment)<br />
                      <strong>Désactivé:</strong> 11 champs complets (format original)
                    </p>
                  </div>
                  <Switch
                    checked={theme.useCompactQR}
                    onCheckedChange={(checked) => updateTheme({ useCompactQR: checked })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Afficher le watermark</Label>
                <Switch
                  checked={theme.showWatermark}
                  onCheckedChange={(checked) => updateTheme({ showWatermark: checked })}
                />
              </div>

              {theme.showWatermark && (
                <>
                  <div>
                    <Label>Opacité logo watermark: {(theme.watermarkOpacity * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[theme.watermarkOpacity]}
                      onValueChange={([value]) => updateTheme({ watermarkOpacity: value })}
                      min={0.05}
                      max={0.3}
                      step={0.01}
                    />
                  </div>

                  <div>
                    <Label>Opacité texte watermark: {(theme.watermarkTextOpacity * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[theme.watermarkTextOpacity]}
                      onValueChange={([value]) => updateTheme({ watermarkTextOpacity: value })}
                      min={0.02}
                      max={0.1}
                      step={0.01}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <Label>Afficher le texte bilingue</Label>
                <Switch
                  checked={theme.showBilingualText}
                  onCheckedChange={(checked) => updateTheme({ showBilingualText: checked })}
                />
              </div>

              <div>
                <Label>Langue principale</Label>
                <Select
                  value={theme.primaryLanguage}
                  onValueChange={(value) => updateTheme({ primaryLanguage: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="french">Français</SelectItem>
                    <SelectItem value="english">Anglais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
