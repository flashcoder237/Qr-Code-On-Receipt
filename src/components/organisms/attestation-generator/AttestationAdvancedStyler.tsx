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
import { useNotifications } from "@/components/ui/notification-system";
import { 
  Settings, 
  Table2, 
  Eye, 
  RotateCcw, 
  Save,
  ArrowUpDown,
  Square,
  Paintbrush,
  Type,
  Sparkles,
  Monitor,
  Download,
  Upload,
  FileText,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Palette,
  Grid3x3,
  MousePointer2,
  ArrowDown,
  ArrowUp,
  Power,
  Zap,
  Move3D,
  Layers
} from 'lucide-react';
import { AdvancedAttestationConfig, AdvancedSpacingConfig, AdvancedTableConfig, AdvancedFontConfig, AdvancedBorderConfig, BORDER_STYLES, AVAILABLE_FONTS, FONT_WEIGHTS, FONT_STYLES } from '@/lib/form-schemas/advanced-typography';
import { getTableDesignPresets, applyTableDesignPreset } from '@/utils/advanced-css-generator';
import { AttestationThemeSettingsPayload } from '@/lib/form-schemas/attestation-theme-settings';

// Fonction utilitaire pour obtenir la valeur par défaut d'un espacement
const getDefaultSpacingValue = (key: string): number => {
  const defaults = {
    titleSpacing: 8, subtitleSpacing: 6, headerSpacing: 15, 
    studentInfoSpacing: 10, tableSpacing: 8, paragraphSpacing: 6, 
    sectionSpacing: 20, footerSpacing: 15, signatureSpacing: 25
  };
  return defaults[key] || 0;
};

interface AttestationAdvancedStylerProps {
  config: AdvancedAttestationConfig;
  onChange: (config: AdvancedAttestationConfig) => void;
  onPreview: () => void;
  isPreviewMode: boolean;
  standardTheme?: AttestationThemeSettingsPayload; // Pour synchronisation
  onStandardThemeChange?: (theme: AttestationThemeSettingsPayload) => void; // Pour synchro inverse
}

export const AttestationAdvancedStyler: React.FC<AttestationAdvancedStylerProps> = ({
  config,
  onChange,
  onPreview,
  isPreviewMode,
  standardTheme,
  onStandardThemeChange
}) => {
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotifications();
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

  // Fonction pour mettre à jour la typographie
  const updateFont = (fontType: keyof AdvancedAttestationConfig, field: keyof AdvancedFontConfig, value: any) => {
    if (config[fontType] && typeof config[fontType] === 'object') {
      const newFont = {
        ...(config[fontType] as AdvancedFontConfig),
        [field]: value
      };
      onChange({
        ...config,
        [fontType]: newFont
      });
    }
  };

  // État pour activer globalement le style avancé - TOUJOURS ACTIVÉ PAR DÉFAUT
  const [isAdvancedStyleEnabled, setIsAdvancedStyleEnabled] = useState(true);


  // Fonction pour synchroniser depuis le thème standard vers avancé
  const syncFromStandardTheme = () => {
    if (!standardTheme) return;

    const updatedConfig = {
      ...config,
      mainTitle: {
        ...config.mainTitle,
        fontFamily: standardTheme.headerFont || standardTheme.mainFont,
        fontSize: standardTheme.titleFontSize,
        color: standardTheme.primaryColor,
      },
      subtitle: {
        ...config.subtitle,
        fontFamily: standardTheme.mainFont,
        fontSize: standardTheme.subtitleFontSize,
        color: standardTheme.secondaryColor || standardTheme.primaryColor,
      },
      headerInfo: {
        ...config.headerInfo,
        fontFamily: standardTheme.mainFont,
        fontSize: standardTheme.contentFontSize - 2, // Légèrement plus petit
        color: standardTheme.primaryColor,
      },
      studentInfo: {
        ...config.studentInfo,
        fontFamily: standardTheme.mainFont,
        fontSize: standardTheme.contentFontSize,
        color: standardTheme.primaryColor,
      },
      tableHeader: {
        ...config.tableHeader,
        fontFamily: standardTheme.mainFont,
        fontSize: standardTheme.contentFontSize,
        color: standardTheme.primaryColor,
      },
      tableContent: {
        ...config.tableContent,
        fontFamily: standardTheme.mainFont,
        fontSize: standardTheme.contentFontSize,
        color: standardTheme.primaryColor,
      },
      footer: {
        ...config.footer,
        fontFamily: standardTheme.mainFont,
        fontSize: standardTheme.footerFontSize,
        color: standardTheme.primaryColor,
      },
      signature: {
        ...config.signature,
        fontFamily: standardTheme.mainFont,
        fontSize: standardTheme.footerFontSize,
        color: standardTheme.primaryColor,
      },
      // Synchroniser aussi les couleurs du design de tableau
      tableDesign: {
        ...config.tableDesign,
        headerBackgroundColor: standardTheme.tableHeaderBgColor || "#f0f0f0",
        headerTextColor: standardTheme.primaryColor,
        rowTextColor: standardTheme.primaryColor,
        // Garder les autres propriétés existantes
      }
    };

    onChange(updatedConfig);
  };

  // Fonction pour synchroniser depuis avancé vers standard
  const syncToStandardTheme = () => {
    if (!standardTheme || !onStandardThemeChange || !config.enableAdvancedTypography) return;

    const updatedTheme = {
      ...standardTheme,
      headerFont: config.mainTitle?.fontFamily || standardTheme.headerFont,
      mainFont: config.tableContent?.fontFamily || config.subtitle?.fontFamily || standardTheme.mainFont,
      titleFontSize: config.mainTitle?.fontSize || standardTheme.titleFontSize,
      subtitleFontSize: config.subtitle?.fontSize || standardTheme.subtitleFontSize,
      contentFontSize: config.tableContent?.fontSize || standardTheme.contentFontSize,
      primaryColor: config.mainTitle?.color || standardTheme.primaryColor,
      secondaryColor: config.subtitle?.color || standardTheme.secondaryColor,
    };

    onStandardThemeChange(updatedTheme);
  };

  // Fonction pour activer/désactiver globalement le style avancé
  const toggleAdvancedStyle = (enabled: boolean) => {
    setIsAdvancedStyleEnabled(enabled);
    
    if (enabled) {
      // Activer avec design de tableau de base et espacement personnalisés
      const enhancedConfig = {
        ...config,
        // Espacement avec valeurs par défaut si pas déjà définies
        spacing: {
          titleSpacing: config.spacing?.titleSpacing || 8,
          subtitleSpacing: config.spacing?.subtitleSpacing || 6,
          headerSpacing: config.spacing?.headerSpacing || 15,
          studentInfoSpacing: config.spacing?.studentInfoSpacing || 10,
          tableSpacing: config.spacing?.tableSpacing || 8,
          paragraphSpacing: config.spacing?.paragraphSpacing || 6,
          sectionSpacing: config.spacing?.sectionSpacing || 20,
          footerSpacing: config.spacing?.footerSpacing || 15,
          signatureSpacing: config.spacing?.signatureSpacing || 25
        },
        // Activer design de tableau avec valeurs de base du thème
        tableDesign: {
          ...config.tableDesign,
          // Si pas de design existant, utiliser les valeurs du thème standard
          headerBackgroundColor: config.tableDesign?.headerBackgroundColor || standardTheme?.tableHeaderBgColor || "#f0f0f0",
          headerTextColor: config.tableDesign?.headerTextColor || standardTheme?.primaryColor || "#000000",
          rowBackgroundColor: config.tableDesign?.rowBackgroundColor || "#ffffff",
          rowTextColor: config.tableDesign?.rowTextColor || standardTheme?.primaryColor || "#000000",
          alternateRowBackgroundColor: config.tableDesign?.alternateRowBackgroundColor || "#f9f9f9",
          headerBackgroundOpacity: config.tableDesign?.headerBackgroundOpacity || 1,
          rowBackgroundOpacity: config.tableDesign?.rowBackgroundOpacity || 1,
          alternateRowOpacity: config.tableDesign?.alternateRowOpacity || 1,
          enableStriped: config.tableDesign?.enableStriped !== undefined ? config.tableDesign.enableStriped : true,
        }
      };
      
      onChange(enhancedConfig);
      
      // Synchroniser depuis le thème standard après
      setTimeout(syncFromStandardTheme, 100);
    } else {
      // Désactiver tout
      onChange({
        ...config,
        enableAdvancedTypography: false,
        spacing: {
          titleSpacing: 8, subtitleSpacing: 6, headerSpacing: 15,
          studentInfoSpacing: 10, tableSpacing: 8, paragraphSpacing: 6,
          sectionSpacing: 20, footerSpacing: 15, signatureSpacing: 25
        },
        tableDesign: {}
      });
    }
  };

  // Fonction pour activer/désactiver seulement la typographie avancée
  const toggleAdvancedTypography = (enabled: boolean) => {
    const updatedConfig = {
      ...config,
      enableAdvancedTypography: enabled
    };
    
    if (enabled) {
      syncFromStandardTheme();
    }
    
    onChange(updatedConfig);
    
    // Synchroniser vers le thème standard si activé
    if (enabled) {
      setTimeout(syncToStandardTheme, 100);
    }
  };

  // Synchroniser depuis le thème standard au chargement
  React.useEffect(() => {
    if (standardTheme && isAdvancedStyleEnabled && !config.enableAdvancedTypography) {
      syncFromStandardTheme();
    }
  }, [standardTheme]);

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

  // Sauvegarder la configuration dans le localStorage
  const saveConfig = () => {
    try {
      localStorage.setItem('attestation-advanced-config', JSON.stringify(config));
      notifySuccess('Configuration sauvegardée', 'Configuration avancée sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      notifyError('Erreur de sauvegarde', 'Erreur lors de la sauvegarde de la configuration');
    }
  };

  // Exporter la configuration vers un fichier JSON
  const exportConfig = () => {
    try {
      const dataStr = JSON.stringify(config, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `attestation-style-avance_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      notifySuccess('Configuration exportée', 'Configuration exportée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      notifyError('Erreur d\'exportation', 'Erreur lors de l\'export de la configuration');
    }
  };

  // Importer la configuration depuis un fichier JSON
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);

        // Valider la structure de base de la configuration
        if (typeof importedConfig === 'object' && importedConfig !== null) {
          onChange({
            ...config,
            ...importedConfig
          });
          notifySuccess('Configuration importée', 'Configuration importée avec succès');
        } else {
          throw new Error('Format de fichier invalide');
        }
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        notifyError('Erreur d\'importation', 'Fichier JSON invalide');
      }
    };

    reader.readAsText(file);
    // Reset input value pour permettre de réimporter le même fichier
    event.target.value = '';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">Style Avancé des Attestations</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              className={`${isPreviewMode ? "bg-blue-100 border-blue-400 text-blue-700" : "text-blue-600 border-blue-200"} hover:bg-blue-50`}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? "Aperçu actif" : "Aperçu"}
            </Button>
            
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveConfig}
                className="h-8 px-2 text-green-600 hover:bg-green-50"
                title="Sauvegarder"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportConfig}
                className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                title="Exporter"
              >
                <Download className="h-4 w-4" />
              </Button>
              <label htmlFor="import-advanced-config">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 px-2 text-orange-600 hover:bg-orange-50 cursor-pointer"
                  title="Importer"
                >
                  <span>
                    <Upload className="h-4 w-4" />
                  </span>
                </Button>
              </label>
              <input
                id="import-advanced-config"
                type="file"
                accept=".json,application/json"
                onChange={importConfig}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefaults}
                className="h-8 px-2 text-gray-600 hover:bg-gray-50"
                title="Réinitialiser"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Section d'activation globale refaite */}
        <div className="mb-8">
          <Card className={`transition-all duration-300 ${isAdvancedStyleEnabled 
            ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-300 shadow-md' 
            : 'bg-gray-50 border-gray-200'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={`p-3 rounded-full transition-all duration-300 ${isAdvancedStyleEnabled 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Zap className="h-6 w-6" />
                    </div>
                    {isAdvancedStyleEnabled && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Power className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="global-advanced-style"
                        checked={isAdvancedStyleEnabled}
                        onCheckedChange={toggleAdvancedStyle}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="global-advanced-style" className="text-lg font-semibold text-gray-800">
                        Activation du Style Avancé
                      </Label>
                      {isAdvancedStyleEnabled && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <Power className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm transition-colors duration-300 ${isAdvancedStyleEnabled 
                      ? 'text-blue-700' 
                      : 'text-gray-600'
                    }`}>
                      {isAdvancedStyleEnabled 
                        ? 'Espacements, tableaux et typographie avancés sont maintenant disponibles'
                        : 'Activez pour accéder aux contrôles avancés d\'espacement, design de tableau et typographie'
                      }
                    </p>
                  </div>
                </div>

                {isAdvancedStyleEnabled && standardTheme && onStandardThemeChange && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={syncFromStandardTheme}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Importer du thème
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={syncToStandardTheme}
                      className="text-orange-700 border-orange-300 hover:bg-orange-50"
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Exporter au thème
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="spacing" disabled={!isAdvancedStyleEnabled} className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              <Move3D className="h-4 w-4" />
              Espacements
            </TabsTrigger>
            <TabsTrigger value="typography" disabled={!isAdvancedStyleEnabled} className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              <Type className="h-4 w-4" />
              Typographie
            </TabsTrigger>
            <TabsTrigger value="table" disabled={!isAdvancedStyleEnabled} className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              <Table2 className="h-4 w-4" />
              Design Tableau
            </TabsTrigger>
            <TabsTrigger value="presets" disabled={!isAdvancedStyleEnabled} className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
              <Sparkles className="h-4 w-4" />
              Modèles
            </TabsTrigger>
          </TabsList>

          {/* Message quand désactivé */}
          {!isAdvancedStyleEnabled && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 rounded-full bg-gray-100 w-20 h-20 mx-auto flex items-center justify-center">
                  <Settings className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">Style Avancé Désactivé</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Activez le style avancé ci-dessus pour accéder aux contrôles d'espacement, typographie et design de tableau.
                  </p>
                  <p className="text-sm text-gray-500">
                    Les configurations s'adapteront automatiquement à votre thème actuel.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => toggleAdvancedStyle(true)}
                  className="mt-4"
                >
                  <Power className="h-4 w-4 mr-2" />
                  Activer le Style Avancé
                </Button>
              </div>
            </div>
          )}

          {/* Onglet Espacements */}
          <TabsContent value="spacing" className="space-y-6">
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  <strong>✅ Toujours actifs :</strong> Les espacements s'appliquent automatiquement, indépendamment de la typographie avancée.
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  Espacements entre blocs
                </h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Sliders className="h-3 w-3 mr-1" />
                  {Object.keys(config.spacing || {}).length} contrôles actifs
                </Badge>
              </div>
              
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

          {/* Onglet Typographie Avancée */}
          <TabsContent value="typography" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Switch
                  id="advanced-typography"
                  checked={config.enableAdvancedTypography || false}
                  onCheckedChange={toggleAdvancedTypography}
                />
                <Label htmlFor="advanced-typography" className="flex-1">
                  <div className="font-medium">🔤 Remplacer les polices du thème</div>
                  <div className="text-sm text-blue-700">
                    <strong>Optional :</strong> Remplace les polices (famille, taille, poids, style) du thème de base. Se synchronise automatiquement.
                  </div>
                </Label>
              </div>

              {config.enableAdvancedTypography && (
                <>
                  <h3 className="text-lg font-semibold">Configuration des polices</h3>
                  
                  {/* Titre principal */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Titre principal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.mainTitle?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('mainTitle', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.mainTitle?.fontSize || 24}px)</Label>
                        <Slider
                          value={[config.mainTitle?.fontSize || 24]}
                          onValueChange={(value) => updateFont('mainTitle', 'fontSize', value[0])}
                          max={48}
                          min={12}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Couleur supprimée - utilise les couleurs du thème de base */}

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.mainTitle?.fontWeight || "bold"}
                          onValueChange={(value) => updateFont('mainTitle', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.mainTitle?.fontStyle || "normal"}
                          onValueChange={(value) => updateFont('mainTitle', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.mainTitle?.lineHeight || 1.2})</Label>
                        <Slider
                          value={[config.mainTitle?.lineHeight || 1.2]}
                          onValueChange={(value) => updateFont('mainTitle', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Tableau - En-têtes */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">En-têtes de tableau</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.tableHeader?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('tableHeader', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.tableHeader?.fontSize || 11}px)</Label>
                        <Slider
                          value={[config.tableHeader?.fontSize || 11]}
                          onValueChange={(value) => updateFont('tableHeader', 'fontSize', value[0])}
                          max={24}
                          min={8}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.tableHeader?.fontWeight || "bold"}
                          onValueChange={(value) => updateFont('tableHeader', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.tableHeader?.fontStyle || "normal"}
                          onValueChange={(value) => updateFont('tableHeader', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.tableHeader?.lineHeight || 1.2})</Label>
                        <Slider
                          value={[config.tableHeader?.lineHeight || 1.2]}
                          onValueChange={(value) => updateFont('tableHeader', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Contenu de tableau */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Contenu de tableau</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.tableContent?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('tableContent', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.tableContent?.fontSize || 11}px)</Label>
                        <Slider
                          value={[config.tableContent?.fontSize || 11]}
                          onValueChange={(value) => updateFont('tableContent', 'fontSize', value[0])}
                          max={20}
                          min={8}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.tableContent?.fontWeight || "bold"}
                          onValueChange={(value) => updateFont('tableContent', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.tableContent?.fontStyle || "normal"}
                          onValueChange={(value) => updateFont('tableContent', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.tableContent?.lineHeight || 1.2})</Label>
                        <Slider
                          value={[config.tableContent?.lineHeight || 1.2]}
                          onValueChange={(value) => updateFont('tableContent', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Sous-titre */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Sous-titre</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.subtitle?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('subtitle', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.subtitle?.fontSize || 22}px)</Label>
                        <Slider
                          value={[config.subtitle?.fontSize || 22]}
                          onValueChange={(value) => updateFont('subtitle', 'fontSize', value[0])}
                          max={36}
                          min={12}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.subtitle?.fontWeight || "bold"}
                          onValueChange={(value) => updateFont('subtitle', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.subtitle?.fontStyle || "italic"}
                          onValueChange={(value) => updateFont('subtitle', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.subtitle?.lineHeight || 1.2})</Label>
                        <Slider
                          value={[config.subtitle?.lineHeight || 1.2]}
                          onValueChange={(value) => updateFont('subtitle', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Informations d'en-tête */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Informations d'en-tête</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.headerInfo?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('headerInfo', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.headerInfo?.fontSize || 10}px)</Label>
                        <Slider
                          value={[config.headerInfo?.fontSize || 10]}
                          onValueChange={(value) => updateFont('headerInfo', 'fontSize', value[0])}
                          max={18}
                          min={8}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.headerInfo?.fontWeight || "normal"}
                          onValueChange={(value) => updateFont('headerInfo', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.headerInfo?.fontStyle || "normal"}
                          onValueChange={(value) => updateFont('headerInfo', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.headerInfo?.lineHeight || 1.2})</Label>
                        <Slider
                          value={[config.headerInfo?.lineHeight || 1.2]}
                          onValueChange={(value) => updateFont('headerInfo', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Contenu principal */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Contenu principal (paragraphes, texte)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.footer?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('footer', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.footer?.fontSize || 12}px)</Label>
                        <Slider
                          value={[config.footer?.fontSize || 12]}
                          onValueChange={(value) => updateFont('footer', 'fontSize', value[0])}
                          max={18}
                          min={8}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.footer?.fontWeight || "normal"}
                          onValueChange={(value) => updateFont('footer', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.footer?.fontStyle || "normal"}
                          onValueChange={(value) => updateFont('footer', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.footer?.lineHeight || 1.4})</Label>
                        <Slider
                          value={[config.footer?.lineHeight || 1.4]}
                          onValueChange={(value) => updateFont('footer', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Informations étudiant */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Informations étudiant</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.studentInfo?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('studentInfo', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.studentInfo?.fontSize || 12}px)</Label>
                        <Slider
                          value={[config.studentInfo?.fontSize || 12]}
                          onValueChange={(value) => updateFont('studentInfo', 'fontSize', value[0])}
                          max={20}
                          min={8}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.studentInfo?.fontWeight || "normal"}
                          onValueChange={(value) => updateFont('studentInfo', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.studentInfo?.fontStyle || "normal"}
                          onValueChange={(value) => updateFont('studentInfo', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.studentInfo?.lineHeight || 1.4})</Label>
                        <Slider
                          value={[config.studentInfo?.lineHeight || 1.4]}
                          onValueChange={(value) => updateFont('studentInfo', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Pied de page */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Pied de page</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.footer?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('footer', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.footer?.fontSize || 12}px)</Label>
                        <Slider
                          value={[config.footer?.fontSize || 12]}
                          onValueChange={(value) => updateFont('footer', 'fontSize', value[0])}
                          max={18}
                          min={8}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.footer?.fontWeight || "normal"}
                          onValueChange={(value) => updateFont('footer', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.footer?.fontStyle || "normal"}
                          onValueChange={(value) => updateFont('footer', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.footer?.lineHeight || 1.4})</Label>
                        <Slider
                          value={[config.footer?.lineHeight || 1.4]}
                          onValueChange={(value) => updateFont('footer', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Signatures */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Signatures</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.signature?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('signature', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.signature?.fontSize || 12}px)</Label>
                        <Slider
                          value={[config.signature?.fontSize || 12]}
                          onValueChange={(value) => updateFont('signature', 'fontSize', value[0])}
                          max={18}
                          min={8}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.signature?.fontWeight || "bold"}
                          onValueChange={(value) => updateFont('signature', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.signature?.fontStyle || "normal"}
                          onValueChange={(value) => updateFont('signature', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.signature?.lineHeight || 1.2})</Label>
                        <Slider
                          value={[config.signature?.lineHeight || 1.2]}
                          onValueChange={(value) => updateFont('signature', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Disclaimer */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Texte de bas de page (disclaimer)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Police</Label>
                        <Select
                          value={config.disclaimer?.fontFamily || "Times New Roman, serif"}
                          onValueChange={(value) => updateFont('disclaimer', 'fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>{font.split(',')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Taille ({config.disclaimer?.fontSize || 8}px)</Label>
                        <Slider
                          value={[config.disclaimer?.fontSize || 8]}
                          onValueChange={(value) => updateFont('disclaimer', 'fontSize', value[0])}
                          max={14}
                          min={6}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Poids</Label>
                        <Select
                          value={config.disclaimer?.fontWeight || "normal"}
                          onValueChange={(value) => updateFont('disclaimer', 'fontWeight', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_WEIGHTS.map(weight => (
                              <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select
                          value={config.disclaimer?.fontStyle || "italic"}
                          onValueChange={(value) => updateFont('disclaimer', 'fontStyle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(style => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hauteur de ligne ({config.disclaimer?.lineHeight || 1.4})</Label>
                        <Slider
                          value={[config.disclaimer?.lineHeight || 1.4]}
                          onValueChange={(value) => updateFont('disclaimer', 'lineHeight', value[0])}
                          max={3}
                          min={0.8}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>
                </>
              )}

              {!config.enableAdvancedTypography && (
                <div className="text-center py-12">
                  <div className="max-w-sm mx-auto space-y-4">
                    <div className="p-3 rounded-full bg-blue-50 w-16 h-16 mx-auto flex items-center justify-center">
                      <Type className="h-10 w-10 text-blue-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-600 font-medium">Typographie avancée désactivée</p>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Activez la typographie avancée ci-dessus pour remplacer les polices du thème avec des contrôles détaillés
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => toggleAdvancedTypography(true)}
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Activer Typographie Avancée
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Onglet Design Tableau */}
          <TabsContent value="table" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-600" />
                  Couleurs et arrière-plans
                </h3>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Grid3x3 className="h-3 w-3 mr-1" />
                  Design de tableau avancé
                </Badge>
              </div>

              <div className="space-y-6">
                {/* En-têtes de tableau */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-medium mb-3 text-blue-900">En-têtes de tableau</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur d'arrière-plan</Label>
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
                      <Label>Opacité ({Math.round((config.tableDesign?.headerBackgroundOpacity || 1) * 100)}%)</Label>
                      <Slider
                        value={[config.tableDesign?.headerBackgroundOpacity || 1]}
                        onValueChange={(value) => updateTableDesign('headerBackgroundOpacity', value[0])}
                        max={1}
                        min={0}
                        step={0.05}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Couleur du texte</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.tableDesign?.headerTextColor || "#000000"}
                          onChange={(e) => updateTableDesign('headerTextColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={config.tableDesign?.headerTextColor || "#000000"}
                          onChange={(e) => updateTableDesign('headerTextColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Lignes du tableau */}
                <Card className="p-4 bg-green-50 border-green-200">
                  <h4 className="font-medium mb-3 text-green-900">Lignes du tableau</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur d'arrière-plan normale</Label>
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
                      <Label>Opacité lignes normales ({Math.round((config.tableDesign?.rowBackgroundOpacity || 1) * 100)}%)</Label>
                      <Slider
                        value={[config.tableDesign?.rowBackgroundOpacity || 1]}
                        onValueChange={(value) => updateTableDesign('rowBackgroundOpacity', value[0])}
                        max={1}
                        min={0}
                        step={0.05}
                        className="w-full"
                      />
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

                    <div className="space-y-2">
                      <Label>Opacité lignes alternées ({Math.round((config.tableDesign?.alternateRowOpacity || 1) * 100)}%)</Label>
                      <Slider
                        value={[config.tableDesign?.alternateRowOpacity || 1]}
                        onValueChange={(value) => updateTableDesign('alternateRowOpacity', value[0])}
                        max={1}
                        min={0}
                        step={0.05}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Couleur du texte</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.tableDesign?.rowTextColor || "#000000"}
                          onChange={(e) => updateTableDesign('rowTextColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={config.tableDesign?.rowTextColor || "#000000"}
                          onChange={(e) => updateTableDesign('rowTextColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Effets de survol */}
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <h4 className="font-medium mb-3 text-purple-900">Effets de survol et focus</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur de survol</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.tableDesign?.hoverBackgroundColor || "#e3f2fd"}
                          onChange={(e) => updateTableDesign('hoverBackgroundColor', e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={config.tableDesign?.hoverBackgroundColor || "#e3f2fd"}
                          onChange={(e) => updateTableDesign('hoverBackgroundColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Opacité de survol ({Math.round((config.tableDesign?.hoverOpacity || 0.8) * 100)}%)</Label>
                      <Slider
                        value={[config.tableDesign?.hoverOpacity || 0.8]}
                        onValueChange={(value) => updateTableDesign('hoverOpacity', value[0])}
                        max={1}
                        min={0}
                        step={0.05}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Square className="h-5 w-5 text-gray-600" />
                  Bordures et structure
                </h3>
                <Badge variant="outline" className="text-xs">
                  {Object.values({
                    outer: config.tableDesign?.enableOuterBorder,
                    inner: config.tableDesign?.enableInnerBorder,
                    header: config.tableDesign?.enableHeaderBorder
                  }).filter(Boolean).length} bordures actives
                </Badge>
              </div>

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

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Effets visuels
                </h3>
                <Badge variant="outline" className="text-xs">
                  <MousePointer2 className="h-3 w-3 mr-1" />
                  {Object.values({
                    shadow: config.tableDesign?.enableShadow,
                    radius: config.tableDesign?.enableRadius,
                    striped: config.tableDesign?.enableStriped,
                    hover: config.tableDesign?.enableHover
                  }).filter(Boolean).length} effets
                </Badge>
              </div>

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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Designs prédéfinis
                </h3>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {tableDesignPresets.length} modèles disponibles
                </Badge>
              </div>
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