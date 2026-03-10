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
import { Eye, RefreshCw, Type, Palette as PaletteIcon, Image as ImageIcon, Settings, FileText } from 'lucide-react';
import { DiplomaThemeSettingsPayload } from '@/lib/form-schemas/diploma-theme-settings';

// Liste des polices disponibles
const fontOptions = [
  // Serif classiques
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Garamond, serif", label: "Garamond" },
  { value: "Palatino, serif", label: "Palatino" },
  { value: "Cambria, serif", label: "Cambria" },
  { value: "Baskerville, serif", label: "Baskerville" },
  { value: "Book Antiqua, serif", label: "Book Antiqua" },
  { value: "Didot, serif", label: "Didot" },
  { value: "Bodoni MT, serif", label: "Bodoni MT" },
  { value: "Constantia, serif", label: "Constantia" },
  // Sans-serif classiques
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Calibri, sans-serif", label: "Calibri" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
  { value: "Segoe UI, sans-serif", label: "Segoe UI" },
  // Sans-serif modernes
  { value: "Open Sans, sans-serif", label: "Open Sans" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "Lato, sans-serif", label: "Lato" },
  { value: "Montserrat, sans-serif", label: "Montserrat" },
  { value: "Source Sans Pro, sans-serif", label: "Source Sans Pro" },
];

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
        <TabsList className="grid grid-cols-5 w-full">
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
          <TabsTrigger value="values">
            <FileText className="h-4 w-4 mr-2" />
            Valeurs
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
              <CardTitle>Polices par élément</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Police principale (fallback)</Label>
                  <Select
                    value={theme.mainFont}
                    onValueChange={(value) => updateTheme({ mainFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police titre diplôme</Label>
                  <Select
                    value={theme.titleFont}
                    onValueChange={(value) => updateTheme({ titleFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police sous-titre (version EN)</Label>
                  <Select
                    value={theme.subtitleFont}
                    onValueChange={(value) => updateTheme({ subtitleFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police header (République...)</Label>
                  <Select
                    value={theme.headerFont}
                    onValueChange={(value) => updateTheme({ headerFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police texte légal (Vu le décret...)</Label>
                  <Select
                    value={theme.legalTextFont}
                    onValueChange={(value) => updateTheme({ legalTextFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police nom étudiant</Label>
                  <Select
                    value={theme.studentNameFont}
                    onValueChange={(value) => updateTheme({ studentNameFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police infos étudiant (date, lieu...)</Label>
                  <Select
                    value={theme.studentInfoFont}
                    onValueChange={(value) => updateTheme({ studentInfoFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police mention/grade</Label>
                  <Select
                    value={theme.mentionFont}
                    onValueChange={(value) => updateTheme({ mentionFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police signatures</Label>
                  <Select
                    value={theme.signatureFont}
                    onValueChange={(value) => updateTheme({ signatureFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police pied de page</Label>
                  <Select
                    value={theme.footerFont}
                    onValueChange={(value) => updateTheme({ footerFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Police N° réf. & matricule</Label>
                  <Select
                    value={theme.referenceFont}
                    onValueChange={(value) => updateTheme({ referenceFont: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Interligne header: {theme.headerLineHeight}</Label>
                <Slider
                  value={[theme.headerLineHeight]}
                  onValueChange={([value]) => updateTheme({ headerLineHeight: value })}
                  min={1}
                  max={2}
                  step={0.05}
                />
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

          <Card>
            <CardHeader>
              <CardTitle>Titre avancé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Interligne titre: {theme.titleLineHeight}</Label>
                <Slider
                  value={[theme.titleLineHeight]}
                  onValueChange={([value]) => updateTheme({ titleLineHeight: value })}
                  min={0.8}
                  max={2}
                  step={0.1}
                />
              </div>

              <div>
                <Label>Espacement lettres titre: {theme.titleLetterSpacing}px</Label>
                <Slider
                  value={[theme.titleLetterSpacing]}
                  onValueChange={([value]) => updateTheme({ titleLetterSpacing: value })}
                  min={-2}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Ombre du titre</Label>
                <Switch
                  checked={theme.titleTextShadow}
                  onCheckedChange={(checked) => updateTheme({ titleTextShadow: checked })}
                />
              </div>

              {theme.titleTextShadow && (
                <div className="pl-4 border-l-2 border-blue-200 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Décalage X: {theme.titleShadowOffsetX}px</Label>
                      <Slider
                        value={[theme.titleShadowOffsetX]}
                        onValueChange={([value]) => updateTheme({ titleShadowOffsetX: value })}
                        min={0}
                        max={10}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Décalage Y: {theme.titleShadowOffsetY}px</Label>
                      <Slider
                        value={[theme.titleShadowOffsetY]}
                        onValueChange={([value]) => updateTheme({ titleShadowOffsetY: value })}
                        min={0}
                        max={10}
                        step={1}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Flou: {theme.titleShadowBlur}px</Label>
                    <Slider
                      value={[theme.titleShadowBlur]}
                      onValueChange={([value]) => updateTheme({ titleShadowBlur: value })}
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label>Couleur de l'ombre</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={theme.titleShadowColor}
                        onChange={(e) => updateTheme({ titleShadowColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={theme.titleShadowColor}
                        onChange={(e) => updateTheme({ titleShadowColor: e.target.value })}
                        placeholder="#000080"
                      />
                    </div>
                  </div>
                </div>
              )}
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
              <CardTitle>Positions des logos (px)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo FMSP X: {theme.fmspLogoOffsetX}px</Label>
                  <Slider
                    value={[theme.fmspLogoOffsetX]}
                    onValueChange={([value]) => updateTheme({ fmspLogoOffsetX: value })}
                    min={-50}
                    max={100}
                    step={5}
                  />
                </div>
                <div>
                  <Label>Logo FMSP Y: {theme.fmspLogoOffsetY}px</Label>
                  <Slider
                    value={[theme.fmspLogoOffsetY]}
                    onValueChange={([value]) => updateTheme({ fmspLogoOffsetY: value })}
                    min={-30}
                    max={30}
                    step={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Armoiries X: {theme.coatOfArmsOffsetX}px</Label>
                  <Slider
                    value={[theme.coatOfArmsOffsetX]}
                    onValueChange={([value]) => updateTheme({ coatOfArmsOffsetX: value })}
                    min={-50}
                    max={50}
                    step={5}
                  />
                </div>
                <div>
                  <Label>Armoiries Y: {theme.coatOfArmsOffsetY}px</Label>
                  <Slider
                    value={[theme.coatOfArmsOffsetY]}
                    onValueChange={([value]) => updateTheme({ coatOfArmsOffsetY: value })}
                    min={-30}
                    max={30}
                    step={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo MINESUP X: {theme.minesupLogoOffsetX}px</Label>
                  <Slider
                    value={[theme.minesupLogoOffsetX]}
                    onValueChange={([value]) => updateTheme({ minesupLogoOffsetX: value })}
                    min={-100}
                    max={50}
                    step={5}
                  />
                </div>
                <div>
                  <Label>Logo MINESUP Y: {theme.minesupLogoOffsetY}px</Label>
                  <Slider
                    value={[theme.minesupLogoOffsetY]}
                    onValueChange={([value]) => updateTheme({ minesupLogoOffsetY: value })}
                    min={-30}
                    max={30}
                    step={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>QR Code X: {theme.qrCodeOffsetX}px</Label>
                  <Slider
                    value={[theme.qrCodeOffsetX]}
                    onValueChange={([value]) => updateTheme({ qrCodeOffsetX: value })}
                    min={-100}
                    max={100}
                    step={5}
                  />
                </div>
                <div>
                  <Label>QR Code Y: {theme.qrCodeOffsetY}px</Label>
                  <Slider
                    value={[theme.qrCodeOffsetY]}
                    onValueChange={([value]) => updateTheme({ qrCodeOffsetY: value })}
                    min={-50}
                    max={50}
                    step={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>N° Référence et Matricule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Taille N° référence: {theme.referenceNumberFontSize}pt</Label>
                <Slider
                  value={[theme.referenceNumberFontSize]}
                  onValueChange={([value]) => updateTheme({ referenceNumberFontSize: value })}
                  min={7}
                  max={14}
                  step={0.5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Position X: {theme.referenceNumberOffsetX}px</Label>
                  <Slider
                    value={[theme.referenceNumberOffsetX]}
                    onValueChange={([value]) => updateTheme({ referenceNumberOffsetX: value })}
                    min={-50}
                    max={50}
                    step={5}
                  />
                </div>
                <div>
                  <Label>Position Y: {theme.referenceNumberOffsetY}px</Label>
                  <Slider
                    value={[theme.referenceNumberOffsetY]}
                    onValueChange={([value]) => updateTheme({ referenceNumberOffsetY: value })}
                    min={-20}
                    max={20}
                    step={2}
                  />
                </div>
              </div>

              <div>
                <Label>Taille matricule: {theme.matriculeFontSize}pt</Label>
                <Slider
                  value={[theme.matriculeFontSize]}
                  onValueChange={([value]) => updateTheme({ matriculeFontSize: value })}
                  min={7}
                  max={14}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Interligne matricule: {theme.matriculeLineHeight}</Label>
                <Slider
                  value={[theme.matriculeLineHeight]}
                  onValueChange={([value]) => updateTheme({ matriculeLineHeight: value })}
                  min={1}
                  max={2}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blocs et espacements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hauteur min header: {theme.headerBlockMinHeight === 0 ? 'Auto' : `${theme.headerBlockMinHeight}px`}</Label>
                <Slider
                  value={[theme.headerBlockMinHeight]}
                  onValueChange={([value]) => updateTheme({ headerBlockMinHeight: value })}
                  min={0}
                  max={150}
                  step={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Marge titre haut: {theme.titleBlockMarginTop}mm</Label>
                  <Slider
                    value={[theme.titleBlockMarginTop]}
                    onValueChange={([value]) => updateTheme({ titleBlockMarginTop: value })}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Marge titre bas: {theme.titleBlockMarginBottom}mm</Label>
                  <Slider
                    value={[theme.titleBlockMarginBottom]}
                    onValueChange={([value]) => updateTheme({ titleBlockMarginBottom: value })}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
              </div>

              <div>
                <Label>Marge section ministre: {theme.ministerBlockMarginBottom}mm</Label>
                <Slider
                  value={[theme.ministerBlockMarginBottom]}
                  onValueChange={([value]) => updateTheme({ ministerBlockMarginBottom: value })}
                  min={0}
                  max={15}
                  step={1}
                />
              </div>

              <div>
                <Label>Marge section destinataire: {theme.recipientBlockMarginBottom}mm</Label>
                <Slider
                  value={[theme.recipientBlockMarginBottom]}
                  onValueChange={([value]) => updateTheme({ recipientBlockMarginBottom: value })}
                  min={0}
                  max={15}
                  step={1}
                />
              </div>

              <div>
                <Label>Marge section signatures: {theme.signatureBlockMarginTop}mm</Label>
                <Slider
                  value={[theme.signatureBlockMarginTop]}
                  onValueChange={([value]) => updateTheme({ signatureBlockMarginTop: value })}
                  min={0}
                  max={15}
                  step={1}
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

        {/* VALEURS (styles par champ Excel) */}
        <TabsContent value="values" className="space-y-6">
          {/* Nom complet */}
          <Card>
            <CardHeader>
              <CardTitle>Nom complet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police (héritée de "Police nom étudiant")</Label>
                <Select
                  value={theme.studentNameFont}
                  onValueChange={(value) => updateTheme({ studentNameFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taille (héritée): {theme.studentNameFontSize}pt</Label>
                <Slider
                  value={[theme.studentNameFontSize]}
                  onValueChange={([value]) => updateTheme({ studentNameFontSize: value })}
                  min={10}
                  max={20}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.fullNameColor}
                    onChange={(e) => updateTheme({ fullNameColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={theme.fullNameColor}
                    onChange={(e) => updateTheme({ fullNameColor: e.target.value })}
                    placeholder="#000080"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date/Lieu de naissance */}
          <Card>
            <CardHeader>
              <CardTitle>Date / Lieu de naissance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police</Label>
                <Select
                  value={theme.birthInfoFont}
                  onValueChange={(value) => updateTheme({ birthInfoFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taille: {theme.birthInfoFontSize}pt</Label>
                <Slider
                  value={[theme.birthInfoFontSize]}
                  onValueChange={([value]) => updateTheme({ birthInfoFontSize: value })}
                  min={8}
                  max={20}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.birthInfoColor}
                    onChange={(e) => updateTheme({ birthInfoColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={theme.birthInfoColor}
                    onChange={(e) => updateTheme({ birthInfoColor: e.target.value })}
                    placeholder="#000080"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matricule */}
          <Card>
            <CardHeader>
              <CardTitle>Matricule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police</Label>
                <Select
                  value={theme.matriculeFont}
                  onValueChange={(value) => updateTheme({ matriculeFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taille: {theme.matriculeFontSize}pt</Label>
                <Slider
                  value={[theme.matriculeFontSize]}
                  onValueChange={([value]) => updateTheme({ matriculeFontSize: value })}
                  min={8}
                  max={18}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.matriculeColor}
                    onChange={(e) => updateTheme({ matriculeColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={theme.matriculeColor}
                    onChange={(e) => updateTheme({ matriculeColor: e.target.value })}
                    placeholder="#000080"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mention */}
          <Card>
            <CardHeader>
              <CardTitle>Mention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police (héritée de "Police mention/grade")</Label>
                <Select
                  value={theme.mentionFont}
                  onValueChange={(value) => updateTheme({ mentionFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taille: {theme.mentionFontSize}pt</Label>
                <Slider
                  value={[theme.mentionFontSize]}
                  onValueChange={([value]) => updateTheme({ mentionFontSize: value })}
                  min={8}
                  max={18}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.mentionColor}
                    onChange={(e) => updateTheme({ mentionColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={theme.mentionColor}
                    onChange={(e) => updateTheme({ mentionColor: e.target.value })}
                    placeholder="#000080"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Titre diplôme (valeur) */}
          <Card>
            <CardHeader>
              <CardTitle>Titre diplôme (valeur)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police</Label>
                <Select
                  value={theme.diplomaTitleValueFont}
                  onValueChange={(value) => updateTheme({ diplomaTitleValueFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taille: {theme.diplomaTitleValueFontSize}pt</Label>
                <Slider
                  value={[theme.diplomaTitleValueFontSize]}
                  onValueChange={([value]) => updateTheme({ diplomaTitleValueFontSize: value })}
                  min={10}
                  max={24}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.diplomaTitleValueColor}
                    onChange={(e) => updateTheme({ diplomaTitleValueColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={theme.diplomaTitleValueColor}
                    onChange={(e) => updateTheme({ diplomaTitleValueColor: e.target.value })}
                    placeholder="#000080"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Option */}
          <Card>
            <CardHeader>
              <CardTitle>Option / Spécialité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police</Label>
                <Select
                  value={theme.optionFont}
                  onValueChange={(value) => updateTheme({ optionFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taille: {theme.optionFontSize}pt</Label>
                <Slider
                  value={[theme.optionFontSize]}
                  onValueChange={([value]) => updateTheme({ optionFontSize: value })}
                  min={8}
                  max={20}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.optionColor}
                    onChange={(e) => updateTheme({ optionColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={theme.optionColor}
                    onChange={(e) => updateTheme({ optionColor: e.target.value })}
                    placeholder="#000080"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Année d'obtention */}
          <Card>
            <CardHeader>
              <CardTitle>Année d'obtention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police</Label>
                <Select
                  value={theme.yearObtentionFont}
                  onValueChange={(value) => updateTheme({ yearObtentionFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taille: {theme.yearObtentionFontSize}pt</Label>
                <Slider
                  value={[theme.yearObtentionFontSize]}
                  onValueChange={([value]) => updateTheme({ yearObtentionFontSize: value })}
                  min={7}
                  max={16}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.yearObtentionColor}
                    onChange={(e) => updateTheme({ yearObtentionColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={theme.yearObtentionColor}
                    onChange={(e) => updateTheme({ yearObtentionColor: e.target.value })}
                    placeholder="#000080"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates jury */}
          <Card>
            <CardHeader>
              <CardTitle>Dates jury</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Police</Label>
                <Select
                  value={theme.juryDatesFont}
                  onValueChange={(value) => updateTheme({ juryDatesFont: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Taille: {theme.juryDatesFontSize}pt</Label>
                <Slider
                  value={[theme.juryDatesFontSize]}
                  onValueChange={([value]) => updateTheme({ juryDatesFontSize: value })}
                  min={6}
                  max={12}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={theme.juryDatesColor}
                    onChange={(e) => updateTheme({ juryDatesColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={theme.juryDatesColor}
                    onChange={(e) => updateTheme({ juryDatesColor: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
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
                <div className="pl-4 border-l-2 border-blue-200 space-y-4">
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

                  <div>
                    <Label>Taille texte watermark: {theme.watermarkTextSize}pt</Label>
                    <Slider
                      value={[theme.watermarkTextSize]}
                      onValueChange={([value]) => updateTheme({ watermarkTextSize: value })}
                      min={12}
                      max={40}
                      step={1}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Couleur watermark</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={theme.watermarkColor}
                          onChange={(e) => updateTheme({ watermarkColor: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          type="text"
                          value={theme.watermarkColor}
                          onChange={(e) => updateTheme({ watermarkColor: e.target.value })}
                          placeholder="#000080"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Couleur texte watermark</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={theme.watermarkTextColor}
                          onChange={(e) => updateTheme({ watermarkTextColor: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          type="text"
                          value={theme.watermarkTextColor}
                          onChange={(e) => updateTheme({ watermarkTextColor: e.target.value })}
                          placeholder="#000080"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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
