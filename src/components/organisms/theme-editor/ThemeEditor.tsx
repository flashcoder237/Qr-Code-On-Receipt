import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Undo, Eye } from "lucide-react";
import { ThemeSettingsPayload, defaultTheme } from "@/lib/form-schemas/theme-settings";
import { TranscriptSettingsPayload, getCompleteTheme } from "@/lib/form-schemas/settings";
import ThemePreview from "./ThemePreview";

interface ThemeEditorProps {
  settings: TranscriptSettingsPayload;
  onSave: (settings: TranscriptSettingsPayload) => void;
  onPreview: () => void;
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({ settings, onSave, onPreview }) => {
  const [activeTab, setActiveTab] = useState("colors");
  const [currentTheme, setCurrentTheme] = useState<ThemeSettingsPayload>(
    getCompleteTheme(settings)
  );
  const [isModified, setIsModified] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setCurrentTheme(getCompleteTheme(settings));
    setIsModified(false);
  }, [settings]);

  const updateTheme = (field: keyof ThemeSettingsPayload, value: any) => {
    setCurrentTheme(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleSave = () => {
    // Mettre à jour à la fois les anciens champs et le nouveau thème
    onSave({
      ...settings,
      themeColor: currentTheme.primaryColor,
      themeFont: currentTheme.mainFont,
      theme: currentTheme
    });
    setIsModified(false);
  };

  const resetToDefaults = () => {
    setCurrentTheme(defaultTheme);
    setIsModified(true);
  };
  
  const handlePreview = () => {
    setShowPreview(!showPreview);
    if (onPreview) {
      onPreview();
    }
  };

  const fontOptions = [
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Helvetica, sans-serif", label: "Helvetica" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Verdana, sans-serif", label: "Verdana" },
    { value: "Domine, sans-serif", label: "Domine" },
    { value: "Calibri, sans-serif", label: "Calibri" },
    { value: "Cambria, serif", label: "Cambria" },
  ];

  const borderStyleOptions = [
    { value: "solid", label: "Continu" },
    { value: "dashed", label: "Tirets" },
    { value: "dotted", label: "Pointillés" },
    { value: "double", label: "Double" },
    { value: "groove", label: "Rainuré" },
    { value: "ridge", label: "Relief" },
  ];

  const layoutOptions = [
    { value: "standard", label: "Standard" },
    { value: "compact", label: "Compact" },
    { value: "étendu", label: "Étendu" },
  ];

  const studentInfoLayoutOptions = [
    { value: "grille", label: "Grille" },
    { value: "colonnes", label: "Colonnes" },
    { value: "ligne", label: "Ligne" },
  ];

  const signatureStyleOptions = [
    { value: "standard", label: "Standard" },
    { value: "encadré", label: "Encadré" },
    { value: "souligné", label: "Souligné" },
  ];

  const ColorPicker = ({ label, value, onChange }) => (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div
          className="w-8 h-8 border border-gray-300 rounded-md"
          style={{ backgroundColor: value }}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12"
        />
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Personnalisation du thème de relevé</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="colors">Couleurs</TabsTrigger>
            <TabsTrigger value="typography">Typographie</TabsTrigger>
            <TabsTrigger value="layout">Mise en page</TabsTrigger>
            <TabsTrigger value="borders">Bordures</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker
                label="Couleur principale"
                value={currentTheme.primaryColor}
                onChange={(value) => updateTheme('primaryColor', value)}
              />
              <ColorPicker
                label="Couleur secondaire"
                value={currentTheme.secondaryColor}
                onChange={(value) => updateTheme('secondaryColor', value)}
              />
              <ColorPicker
                label="Couleur d'accent"
                value={currentTheme.accentColor}
                onChange={(value) => updateTheme('accentColor', value)}
              />
              <ColorPicker
                label="Couleur d'en-tête de tableau"
                value={currentTheme.tableHeaderBgColor}
                onChange={(value) => updateTheme('tableHeaderBgColor', value)}
              />
              <ColorPicker
                label="Couleur de bordure"
                value={currentTheme.tableBorderColor}
                onChange={(value) => updateTheme('tableBorderColor', value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Police principale</Label>
                <Select
                  value={currentTheme.mainFont}
                  onValueChange={(value: typeof currentTheme.mainFont) => updateTheme('mainFont', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une police" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Police d'en-tête</Label>
                <Select
                  value={currentTheme.headerFont}
                  onValueChange={(value: typeof currentTheme.headerFont) => updateTheme('headerFont', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une police" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Taille des titres: {currentTheme.titleFontSize}px</Label>
                <Slider
                  value={[currentTheme.titleFontSize]}
                  min={8}
                  max={24}
                  step={1}
                  onValueChange={(value) => updateTheme('titleFontSize', value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Taille des en-têtes: {currentTheme.headerFontSize}px</Label>
                <Slider
                  value={[currentTheme.headerFontSize]}
                  min={6}
                  max={16}
                  step={1}
                  onValueChange={(value) => updateTheme('headerFontSize', value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Taille du contenu: {currentTheme.contentFontSize}px</Label>
                <Slider
                  value={[currentTheme.contentFontSize]}
                  min={6}
                  max={14}
                  step={1}
                  onValueChange={(value) => updateTheme('contentFontSize', value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Taille du pied de page: {currentTheme.footerFontSize}px</Label>
                <Slider
                  value={[currentTheme.footerFontSize]}
                  min={6}
                  max={12}
                  step={1}
                  onValueChange={(value) => updateTheme('footerFontSize', value[0])}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Disposition de l'en-tête</Label>
                <Select
                  value={currentTheme.headerLayout}
                  onValueChange={(value: typeof currentTheme.headerLayout) => updateTheme('headerLayout', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une disposition" />
                  </SelectTrigger>
                  <SelectContent>
                    {layoutOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Disposition des informations de l'étudiant</Label>
                <Select
                  value={currentTheme.studentInfoLayout}
                  onValueChange={(value: typeof currentTheme.studentInfoLayout) => updateTheme('studentInfoLayout', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une disposition" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentInfoLayoutOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Style de signature</Label>
                <Select
                  value={currentTheme.signatureStyle}
                  onValueChange={(value: typeof currentTheme.signatureStyle) => updateTheme('signatureStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un style" />
                  </SelectTrigger>
                  <SelectContent>
                    {signatureStyleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Opacité du filigrane: {Math.round(currentTheme.watermarkOpacity * 100)}%</Label>
                <Slider
                  value={[currentTheme.watermarkOpacity * 100]}
                  min={5}
                  max={50}
                  step={1}
                  onValueChange={(value) => updateTheme('watermarkOpacity', value[0] / 100)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="borders" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Style de bordure</Label>
                <Select
                  value={currentTheme.borderStyle}
                  onValueChange={(value: typeof currentTheme.borderStyle) => updateTheme('borderStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un style" />
                  </SelectTrigger>
                  <SelectContent>
                    {borderStyleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Épaisseur de bordure: {currentTheme.borderWidth}px</Label>
                <Slider
                  value={[currentTheme.borderWidth]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(value) => updateTheme('borderWidth', value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label>Marge interne des cellules: {currentTheme.tableCellPadding}px</Label>
                <Slider
                  value={[currentTheme.tableCellPadding]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => updateTheme('tableCellPadding', value[0])}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-watermark">Afficher le filigrane</Label>
                    <Switch
                      id="show-watermark"
                      checked={currentTheme.showWatermark}
                      onCheckedChange={(checked) => updateTheme('showWatermark', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-qrcode">Afficher le code QR</Label>
                    <Switch
                      id="show-qrcode"
                      checked={currentTheme.showQRCode}
                      onCheckedChange={(checked) => updateTheme('showQRCode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-grade-scale">Afficher l'échelle de notation</Label>
                    <Switch
                      id="show-grade-scale"
                      checked={currentTheme.showGradeScale}
                      onCheckedChange={(checked) => updateTheme('showGradeScale', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="highlight-validated-ue">Mettre en évidence les UE validées</Label>
                    <Switch
                      id="highlight-validated-ue"
                      checked={currentTheme.highlightValidatedUE}
                      onCheckedChange={(checked) => updateTheme('highlightValidatedUE', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <div className="mb-2">
                  <Label>Aperçu du thème</Label>
                </div>
                <ThemePreview theme={currentTheme} />
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={handlePreview}>
                    <Eye className="mr-2 h-4 w-4" />
                    Aperçu complet
                  </Button>
                </div>
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
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Aperçu
          </Button>
          <Button onClick={handleSave} disabled={!isModified}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ThemeEditor;