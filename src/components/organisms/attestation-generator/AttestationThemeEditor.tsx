// src/components/organisms/attestation-generator/AttestationThemeEditor.tsx - Version mise à jour
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Undo, Eye, Palette, Type, Layout, Settings, FileText, Wand2 } from "lucide-react";
import { AttestationThemeSettingsPayload, defaultAttestationTheme, getAdvancedAttestationConfig } from "@/lib/form-schemas/attestation-theme-settings";
import { AttestationThemePreview } from "./AttestationThemePreview";
import { ThemePresetSelector } from "./ThemePresetSelector";
import { motion, AnimatePresence } from "framer-motion";

interface AttestationThemeEditorProps {
  theme: AttestationThemeSettingsPayload;
  onThemeChange: (theme: AttestationThemeSettingsPayload) => void;
  onSave: () => void;
  onPreview: () => void;
}

export const AttestationThemeEditor: React.FC<AttestationThemeEditorProps> = ({
  theme,
  onThemeChange,
  onSave,
  onPreview
}) => {
  const [activeTab, setActiveTab] = useState("colors");
  const [isModified, setIsModified] = useState(false);
  const [showPresetSelector, setShowPresetSelector] = useState(false);

  const updateTheme = (field: keyof AttestationThemeSettingsPayload, value: any) => {
    const newTheme = { ...theme, [field]: value };
    onThemeChange(newTheme);
    setIsModified(true);
  };

  const resetToDefaults = () => {
    onThemeChange(defaultAttestationTheme);
    setIsModified(true);
  };

  const handleSave = () => {
    onSave();
    setIsModified(false);
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    }
  };

  const handlePresetSelect = (newTheme: AttestationThemeSettingsPayload) => {
    onThemeChange(newTheme);
    setIsModified(true);
    setShowPresetSelector(false);
  };


  const ColorPicker = ({ label, value, onChange }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <div
          className="w-8 h-8 border border-gray-300 rounded-md cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(`color-${label}`)?.click()}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
        <input
          id={`color-${label}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 border-0 rounded"
          style={{ appearance: 'none', backgroundColor: 'transparent' }}
        />
      </div>
    </div>
  );

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personnalisation de l'attestation
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Personnalisez l'apparence et la mise en page de vos attestations
              </p>
            </div>
            <div className="flex gap-2">
              {isModified && (
                <Badge variant="secondary" className="text-xs">
                  Modifications non sauvegardées
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPresetSelector(!showPresetSelector)}
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Préréglages
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence>
            {showPresetSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="border rounded-lg p-4 bg-gray-50">
                  <ThemePresetSelector
                    currentTheme={theme}
                    onThemeSelect={handlePresetSelect}
                    onPreview={onPreview}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Couleurs
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Typographie
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Mise en page
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contenu
              </TabsTrigger>
              <TabsTrigger value="options" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Options
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="colors" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      label="Couleur principale"
                      value={theme.primaryColor}
                      onChange={(value) => updateTheme('primaryColor', value)}
                    />
                    <ColorPicker
                      label="Couleur secondaire"
                      value={theme.secondaryColor}
                      onChange={(value) => updateTheme('secondaryColor', value)}
                    />
                    <ColorPicker
                      label="Couleur d'accent"
                      value={theme.accentColor}
                      onChange={(value) => updateTheme('accentColor', value)}
                    />
                    <ColorPicker
                      label="Couleur des bordures"
                      value={theme.tableBorderColor}
                      onChange={(value) => updateTheme('tableBorderColor', value)}
                    />
                    <ColorPicker
                      label="Couleur d'arrière-plan tableau"
                      value={theme.tableHeaderBgColor}
                      onChange={(value) => updateTheme('tableHeaderBgColor', value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="typography" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Police principale</Label>
                      <Select
                        value={theme.mainFont}
                        onValueChange={(value) => updateTheme('mainFont', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                        value={theme.headerFont}
                        onValueChange={(value) => updateTheme('headerFont', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label>Taille du titre: {theme.titleFontSize}px</Label>
                      <Slider
                        value={[theme.titleFontSize]}
                        min={16}
                        max={32}
                        step={2}
                        onValueChange={(value) => updateTheme('titleFontSize', value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Taille du sous-titre: {theme.subtitleFontSize}px</Label>
                      <Slider
                        value={[theme.subtitleFontSize]}
                        min={14}
                        max={28}
                        step={2}
                        onValueChange={(value) => updateTheme('subtitleFontSize', value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Taille du contenu: {theme.contentFontSize}px</Label>
                      <Slider
                        value={[theme.contentFontSize]}
                        min={10}
                        max={18}
                        step={1}
                        onValueChange={(value) => updateTheme('contentFontSize', value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Taille du pied de page: {theme.footerFontSize}px</Label>
                      <Slider
                        value={[theme.footerFontSize]}
                        min={8}
                        max={14}
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
                        value={theme.headerLayout}
                        onValueChange={(value) => updateTheme('headerLayout', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="extended">Étendu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Taille des logos</Label>
                      <Select
                        value={theme.logoSize}
                        onValueChange={(value) => updateTheme('logoSize', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Petit</SelectItem>
                          <SelectItem value="medium">Moyen</SelectItem>
                          <SelectItem value="large">Grand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Position des logos</Label>
                      <Select
                        value={theme.logoPosition}
                        onValueChange={(value) => updateTheme('logoPosition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">En haut</SelectItem>
                          <SelectItem value="header">Dans l'en-tête</SelectItem>
                          <SelectItem value="integrated">Intégré</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Style de tableau</Label>
                      <Select
                        value={theme.tableStyle}
                        onValueChange={(value) => updateTheme('tableStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="bordered">Avec bordures</SelectItem>
                          <SelectItem value="striped">Lignes alternées</SelectItem>
                          <SelectItem value="modern">Moderne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Style de bordure</Label>
                      <Select
                        value={theme.borderStyle}
                        onValueChange={(value) => updateTheme('borderStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Continu</SelectItem>
                          <SelectItem value="dashed">Tirets</SelectItem>
                          <SelectItem value="dotted">Pointillés</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="none">Aucune</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Épaisseur de bordure: {theme.borderWidth}px</Label>
                      <Slider
                        value={[theme.borderWidth]}
                        min={0}
                        max={5}
                        step={1}
                        onValueChange={(value) => updateTheme('borderWidth', value[0])}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titre personnalisé (optionnel)</Label>
                      <Input
                        value={theme.customTitle || ""}
                        onChange={(e) => updateTheme('customTitle', e.target.value || undefined)}
                        placeholder="ATTESTATION DE REUSSITE"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sous-titre personnalisé (optionnel)</Label>
                      <Input
                        value={theme.customSubtitle || ""}
                        onChange={(e) => updateTheme('customSubtitle', e.target.value || undefined)}
                        placeholder="ATTESTATION OF COMPLETION OF STUDIES"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Texte de pied de page personnalisé (optionnel)</Label>
                      <Textarea
                        value={theme.customFooterText || ""}
                        onChange={(e) => updateTheme('customFooterText', e.target.value || undefined)}
                        placeholder="Texte personnalisé pour le pied de page..."
                        className="resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Langue principale</Label>
                        <Select
                          value={theme.primaryLanguage}
                          onValueChange={(value) => updateTheme('primaryLanguage', value)}
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

                      <div className="space-y-2">
                        <Label>Disposition du contenu</Label>
                        <Select
                          value={theme.contentLayout}
                          onValueChange={(value) => updateTheme('contentLayout', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="modern">Moderne</SelectItem>
                            <SelectItem value="formal">Formel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="options" className="space-y-4">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Affichage</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-watermark">Afficher le filigrane</Label>
                          <Switch
                            id="show-watermark"
                            checked={theme.showWatermark}
                            onCheckedChange={(checked) => updateTheme('showWatermark', checked)}
                          />
                        </div>

                        {theme.showWatermark && (
                          <div className="space-y-2 ml-4">
                            <Label>Opacité du filigrane: {Math.round(theme.watermarkOpacity * 100)}%</Label>
                            <Slider
                              value={[theme.watermarkOpacity * 100]}
                              min={5}
                              max={50}
                              step={1}
                              onValueChange={(value) => updateTheme('watermarkOpacity', value[0] / 100)}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-qrcode">Afficher le code QR</Label>
                          <Switch
                            id="show-qrcode"
                            checked={theme.showQRCode}
                            onCheckedChange={(checked) => updateTheme('showQRCode', checked)}
                          />
                        </div>

                        {theme.showQRCode && (
                          <div className="space-y-2 ml-4">
                            <div className="space-y-2">
                              <Label>Taille du QR code</Label>
                              <Select
                                value={theme.qrCodeSize}
                                onValueChange={(value) => updateTheme('qrCodeSize', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Petit</SelectItem>
                                  <SelectItem value="medium">Moyen</SelectItem>
                                  <SelectItem value="large">Grand</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Position du QR code</Label>
                              <Select
                                value={theme.qrCodePosition}
                                onValueChange={(value) => updateTheme('qrCodePosition', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bottom-left">Bas gauche</SelectItem>
                                  <SelectItem value="bottom-right">Bas droite</SelectItem>
                                  <SelectItem value="bottom-center">Bas centre</SelectItem>
                                  <SelectItem value="custom">Personnalisé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-bilingual">Texte bilingue</Label>
                          <Switch
                            id="show-bilingual"
                            checked={theme.showBilingualText}
                            onCheckedChange={(checked) => updateTheme('showBilingualText', checked)}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Contenu académique</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-domain-table">Afficher le tableau de domaine</Label>
                          <Switch
                            id="show-domain-table"
                            checked={theme.showDomainTable}
                            onCheckedChange={(checked) => updateTheme('showDomainTable', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-academic-details">Détails académiques</Label>
                          <Switch
                            id="show-academic-details"
                            checked={theme.showAcademicDetails}
                            onCheckedChange={(checked) => updateTheme('showAcademicDetails', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="compact-mode">Mode compact</Label>
                          <Switch
                            id="compact-mode"
                            checked={theme.compactMode}
                            onCheckedChange={(checked) => updateTheme('compactMode', checked)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Style des signatures</Label>
                          <Select
                            value={theme.signatureStyle}
                            onValueChange={(value) => updateTheme('signatureStyle', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="boxed">Encadré</SelectItem>
                              <SelectItem value="underlined">Souligné</SelectItem>
                              <SelectItem value="modern">Moderne</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Disposition des signatures</Label>
                          <Select
                            value={theme.signatureLayout}
                            onValueChange={(value) => updateTheme('signatureLayout', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="side-by-side">Côte à côte</SelectItem>
                              <SelectItem value="stacked">Empilées</SelectItem>
                              <SelectItem value="centered">Centrées</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <div className="mb-2">
                        <Label>Aperçu du thème</Label>
                      </div>
                      <AttestationThemePreview theme={theme} />
                      <div className="mt-4 text-center">
                        <Button variant="outline" size="sm" onClick={handlePreview}>
                          <Eye className="mr-2 h-4 w-4" />
                          Aperçu complet
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <Undo className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Export current theme as JSON file
                const dataStr = JSON.stringify(theme, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "attestation-theme-config.json";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
            >
              Exporter la configuration
            </Button>
            <label
              htmlFor="import-theme-config"
              className="btn btn-outline cursor-pointer"
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              Importer la configuration
            </label>
            <input
              type="file"
              id="import-theme-config"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const json = JSON.parse(event.target?.result as string);
                    onThemeChange(json);
                    setIsModified(true);
                  } catch (error) {
                    alert("Fichier JSON invalide ou erreur de lecture");
                  }
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
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
    </div>
  );
};