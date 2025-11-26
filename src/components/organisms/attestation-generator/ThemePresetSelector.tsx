// src/components/organisms/attestation-generator/ThemePresetSelector.tsx
import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, Palette, Check, Sparkles, FileText, Minimize2, Crown } from "lucide-react";
import { AttestationThemeSettingsPayload } from "@/lib/form-schemas/attestation-theme-settings";
import { AttestationThemePreset, attestationThemePresets, getPresetsByCategory } from "@/lib/form-schemas/attestation-presets";
import { AttestationThemePreview } from "./AttestationThemePreview";
import { motion, AnimatePresence } from "framer-motion";

interface ThemePresetSelectorProps {
  currentTheme: AttestationThemeSettingsPayload;
  onThemeSelect: (theme: AttestationThemeSettingsPayload) => void;
  onPreview?: (theme: AttestationThemeSettingsPayload) => void;
}

export const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({
  currentTheme,
  onThemeSelect,
  onPreview
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewPreset, setPreviewPreset] = useState<AttestationThemePreset | null>(null);

  const categories = [
    { id: "all", label: "Tous", icon: Palette },
    { id: "formal", label: "Formel", icon: FileText },
    { id: "modern", label: "Moderne", icon: Sparkles },
    { id: "classic", label: "Classique", icon: Crown },
    { id: "minimalist", label: "Minimaliste", icon: Minimize2 },
  ];

  // Memoize current presets based on selected category
  const currentPresets = useMemo(() => {
    if (selectedCategory === "all") return attestationThemePresets;
    return getPresetsByCategory(selectedCategory);
  }, [selectedCategory]);

  // Memoize category icon function
  const getCategoryIcon = useCallback((category: string) => {
    switch (category) {
      case 'formal': return <FileText className="h-4 w-4" />;
      case 'modern': return <Sparkles className="h-4 w-4" />;
      case 'classic': return <Crown className="h-4 w-4" />;
      case 'minimalist': return <Minimize2 className="h-4 w-4" />;
      default: return <Palette className="h-4 w-4" />;
    }
  }, []);

  // Memoize category color function
  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'formal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'modern': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'classic': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minimalist': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  }, []);

  // Memoize current theme serialization for comparison
  const currentThemeSerialized = useMemo(() =>
    JSON.stringify(currentTheme), [currentTheme]
  );

  const isCurrentTheme = useCallback((preset: AttestationThemePreset): boolean => {
    return JSON.stringify(preset.theme) === currentThemeSerialized;
  }, [currentThemeSerialized]);

  const handleApplyPreset = useCallback((preset: AttestationThemePreset) => {
    // Fusionner le preset (partiel - styles uniquement) avec le thème actuel
    // pour préserver les paramètres de layout
    const mergedTheme: AttestationThemeSettingsPayload = {
      ...currentTheme,
      ...preset.theme,
    };
    onThemeSelect(mergedTheme);
  }, [currentTheme, onThemeSelect]);

  const handlePreviewPreset = useCallback((preset: AttestationThemePreset) => {
    setPreviewPreset(preset);
    if (onPreview) {
      // Fusionner le preset avec le thème actuel pour la prévisualisation
      const mergedTheme: AttestationThemeSettingsPayload = {
        ...currentTheme,
        ...preset.theme,
      };
      onPreview(mergedTheme);
    }
  }, [currentTheme, onPreview]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Préréglages de thèmes
        </CardTitle>
        <p className="text-sm text-gray-500">
          Choisissez parmi nos thèmes prédéfinis ou utilisez-les comme point de départ
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-5 mb-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center gap-1"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentPresets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <Card className={`cursor-pointer transition-all duration-200 ${
                      isCurrentTheme(preset) 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(preset.category)}
                            <h3 className="font-semibold text-sm">{preset.name}</h3>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(preset.category)}`}
                          >
                            {preset.category}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {preset.description}
                        </p>
                        
                        {/* Mini-aperçu du thème */}
                        <div className="mb-3">
                          <div
                            className="rounded p-2 overflow-hidden"
                            style={{
                              fontFamily: preset.theme.mainFont,
                              color: preset.theme.primaryColor,
                              backgroundColor: 'white',
                              border: `${preset.theme.borderWidth || 1}px ${preset.theme.borderStyle || 'solid'} ${preset.theme.tableBorderColor}`,
                            }}
                          >
                            {/* Titre */}
                            <div
                              className="text-center font-bold mb-1"
                              style={{
                                color: preset.theme.accentColor,
                                fontSize: `${Math.min((preset.theme.titleFontSize || 24) / 3, 9)}px`,
                                fontFamily: preset.theme.headerFont,
                              }}
                            >
                              ATTESTATION DE RÉUSSITE
                            </div>

                            {/* Info étudiant */}
                            <div
                              className="mb-1 px-1"
                              style={{
                                fontSize: `${Math.min((preset.theme.contentFontSize || 12) / 2, 6)}px`,
                                color: preset.theme.secondaryColor,
                              }}
                            >
                              <div>M. DUPONT Jean - N° 2024001</div>
                            </div>

                            {/* Mini tableau */}
                            <div
                              style={{
                                border: `${preset.theme.borderWidth || 1}px ${preset.theme.borderStyle || 'solid'} ${preset.theme.tableBorderColor}`,
                                fontSize: `${Math.min((preset.theme.contentFontSize || 12) / 2.2, 5.5)}px`,
                              }}
                            >
                              {/* En-tête tableau */}
                              <div
                                className="grid grid-cols-3 px-1 py-0.5 font-bold"
                                style={{
                                  backgroundColor: preset.theme.tableHeaderBgColor,
                                  borderBottom: `${preset.theme.borderWidth || 1}px ${preset.theme.borderStyle || 'solid'} ${preset.theme.tableBorderColor}`,
                                }}
                              >
                                <span>UE</span>
                                <span>EC</span>
                                <span className="text-right">Note</span>
                              </div>

                              {/* Lignes tableau */}
                              <div className="grid grid-cols-3 px-1 py-0.5">
                                <span>UE101</span>
                                <span>Mathématiques</span>
                                <span className="text-right font-semibold">15.50</span>
                              </div>
                              <div
                                className="grid grid-cols-3 px-1 py-0.5"
                                style={{
                                  backgroundColor: preset.theme.tableHeaderBgColor ? `${preset.theme.tableHeaderBgColor}20` : '#f9f9f9',
                                }}
                              >
                                <span>UE102</span>
                                <span>Informatique</span>
                                <span className="text-right font-semibold">14.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewPreset(preset)}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Aperçu
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleApplyPreset(preset)}
                            disabled={isCurrentTheme(preset)}
                            className="flex-1"
                          >
                            {isCurrentTheme(preset) ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Actuel
                              </>
                            ) : (
                              'Appliquer'
                            )}
                          </Button>
                        </div>
                        
                        {isCurrentTheme(preset) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1"
                          >
                            <Check className="h-3 w-3" />
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {currentPresets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun thème trouvé dans cette catégorie</p>
            </div>
          )}
        </Tabs>

        {/* Dialog de prévisualisation */}
        <Dialog open={!!previewPreset} onOpenChange={() => setPreviewPreset(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {previewPreset && getCategoryIcon(previewPreset.category)}
                Aperçu: {previewPreset?.name}
              </DialogTitle>
              <DialogDescription>
                Prévisualisation du thème avec ses paramètres et style d'affichage
              </DialogDescription>
            </DialogHeader>
            
            {previewPreset && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={getCategoryColor(previewPreset.category)}>
                      {previewPreset.category}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      {previewPreset.description}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (onPreview) {
                          const mergedTheme: AttestationThemeSettingsPayload = {
                            ...currentTheme,
                            ...previewPreset.theme,
                          };
                          onPreview(mergedTheme);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu complet
                    </Button>
                    
                    <Button
                      onClick={() => {
                        handleApplyPreset(previewPreset);
                        setPreviewPreset(null);
                      }}
                      disabled={isCurrentTheme(previewPreset)}
                    >
                      {isCurrentTheme(previewPreset) ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Thème actuel
                        </>
                      ) : (
                        'Appliquer ce thème'
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <AttestationThemePreview theme={{
                    ...currentTheme,
                    ...previewPreset.theme,
                  }} />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <strong>Police principale:</strong><br />
                    {previewPreset.theme.mainFont?.split(',')[0] || 'N/A'}
                  </div>
                  <div>
                    <strong>Couleur principale:</strong><br />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 border rounded"
                        style={{ backgroundColor: previewPreset.theme.primaryColor }}
                      />
                      {previewPreset.theme.primaryColor}
                    </div>
                  </div>
                  <div>
                    <strong>Style de bordure:</strong><br />
                    {previewPreset.theme.borderStyle || 'N/A'}
                  </div>
                  <div>
                    <strong>Épaisseur bordure:</strong><br />
                    {previewPreset.theme.borderWidth ? `${previewPreset.theme.borderWidth}px` : 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};