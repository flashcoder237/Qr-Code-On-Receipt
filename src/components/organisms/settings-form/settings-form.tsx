// src/components/organisms/settings-form/settings-form.tsx - Version corrigée sans conflit Git
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Save, X, Eye, Building, GraduationCap, Type, Lock, Unlock, Edit3, Download, Upload as UploadIcon, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";
import {
  TranscriptSettingsPayload,
  TranscriptsettingsSchema,
  getCompleteTheme,
} from "@/lib/form-schemas/settings";
import { defaultTheme } from "@/lib/form-schemas/theme-settings";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeEditor } from "../theme-editor";

const SettingForm: React.FC = () => {
  const { toasts, toast, removeToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "advanced">("general");
  const [showPreview, setShowPreview] = useState(false);
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [actionType, setActionType] = useState<'export' | 'import' | 'edit'>('edit');
  const [pendingImportData, setPendingImportData] = useState<TranscriptSettingsPayload | null>(null);

  // État pour stocker les données dans localStorage
  const [storedFormData, setStoredFormData] =
    useLocalStorage<TranscriptSettingsPayload>("settings", {
      establishmentType: "ipes",
      nameFrench: "",
      nameEnglish: "",
      nameAbreviation: "",
      postalBox: "",
      postalBoxEn: "",
      email: "",
      logo: "",
      universityLogo: "",
      facultyLogo: "",
      watermarkLogo: "", // NOUVEAU: Logo de fond
      coatOfArms: "", // NOUVEAU: Armoiries (diplômes)
      ministryLogo: "", // NOUVEAU: Logo MINESUP (diplômes)
      themeColor: "#000000",
      themeFont: "Times New Roman, serif",
      theme: defaultTheme,
    });

  const form = useForm<TranscriptSettingsPayload>({
    resolver: zodResolver(TranscriptsettingsSchema),
    defaultValues: storedFormData,
  });

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    if (!isEditing) return;

    const defaultSettings = {
      establishmentType: "ipes",
      nameFrench: "",
      nameEnglish: "",
      nameAbreviation: "",
      postalBox: "",
      postalBoxEn: "",
      email: "",
      logo: "",
      universityLogo: "",
      facultyLogo: "",
      watermarkLogo: "", // NOUVEAU: Logo de fond
      coatOfArms: "", // NOUVEAU: Armoiries (diplômes)
      ministryLogo: "", // NOUVEAU: Logo MINESUP (diplômes)
      themeColor: "#000000",
      themeFont: "Times New Roman, serif",
      theme: defaultTheme,
    };
    form.reset(defaultSettings);
  };

  const MAX_FILE_SIZE = 1000 * 1024;

  // Observer les changements du type d'établissement
  const watchEstablishmentType = form.watch("establishmentType");

  // Code secret basé sur la date du jour
  const getSecretCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    return `Erica2004.-${dateStr}`;
  };

  // Fonction pour obtenir les libellés conditionnels
  const getEstablishmentLabels = () => {
    const isIpes = watchEstablishmentType === "ipes";
    return {
      establishmentLogo: isIpes ? "Logo de l'IPES" : "Logo de l'établissement",
      establishmentName: isIpes ? "Nom de l'IPES" : "Nom de l'établissement",
      establishmentAbbr: isIpes ? "Abréviation de l'IPES" : "Abréviation de l'établissement",
      establishmentConv: isIpes ? "Convention de l'IPES" : "Convention de l'établissement",
    };
  };

  const labels = getEstablishmentLabels();

  // Gestion du code de déverrouillage
  const handleCodeSubmit = () => {
    const expectedCode = getSecretCode();
    if (codeInput === expectedCode) {
      if (actionType === 'export') {
        performExport();
      } else if (actionType === 'import' && pendingImportData) {
        performImport(pendingImportData);
        setPendingImportData(null);
      } else if (actionType === 'edit') {
        setIsEditing(true);
      }
      setShowCodePrompt(false);
      setCodeInput("");
      setCodeError("");
    } else {
      setCodeError("Code secret invalide. Veuillez réessayer.");
    }
  };

  // Fonction d'exportation (inclut toutes les configurations avancées)
  const performExport = () => {
    // Récupérer toutes les configurations depuis localStorage
    const exportData = {
      // Configuration principale (settings)
      settings: form.getValues(),

      // Thème des attestations
      attestationTheme: localStorage.getItem('attestation-theme')
        ? JSON.parse(localStorage.getItem('attestation-theme')!)
        : null,

      // Configuration avancée des attestations
      attestationAdvancedConfig: localStorage.getItem('attestation-advanced-config')
        ? JSON.parse(localStorage.getItem('attestation-advanced-config')!)
        : null,

      // Configuration académique (semestres, UEs, ECs)
      academicConfigs: localStorage.getItem('academicConfigs')
        ? JSON.parse(localStorage.getItem('academicConfigs')!)
        : null,

      // Configuration des semestres (pour rétrocompatibilité)
      semesterConfig: localStorage.getItem('semester-config')
        ? JSON.parse(localStorage.getItem('semester-config')!)
        : null,

      // Métadonnées d'export
      exportVersion: '2.0',
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `configurations-completes-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Export réussi", "Toutes les configurations ont été exportées avec succès");
  };

  // Fonction d'importation (restaure toutes les configurations avancées)
  const performImport = (data: any) => {
    try {
      // Vérifier si c'est un ancien format (v1.0) ou nouveau format (v2.0)
      const isNewFormat = data.exportVersion === '2.0';

      if (isNewFormat) {
        // Nouveau format : restaurer toutes les configurations

        // Restaurer la configuration principale
        if (data.settings) {
          form.reset(data.settings);
          setStoredFormData(data.settings);
        }

        // Restaurer le thème des attestations
        if (data.attestationTheme) {
          localStorage.setItem('attestation-theme', JSON.stringify(data.attestationTheme));
        }

        // Restaurer la configuration avancée des attestations
        if (data.attestationAdvancedConfig) {
          localStorage.setItem('attestation-advanced-config', JSON.stringify(data.attestationAdvancedConfig));
        }

        // Restaurer la configuration des semestres
        if (data.semesterConfig) {
          localStorage.setItem('semester-config', JSON.stringify(data.semesterConfig));
        }

        // Restaurer la configuration académique (UEs, ECs)
        if (data.academicConfigs) {
          localStorage.setItem('academicConfigs', JSON.stringify(data.academicConfigs));
        }

        toast.success(
          "Import réussi",
          "Toutes les configurations ont été restaurées. Veuillez recharger la page pour appliquer les changements."
        );
      } else {
        // Ancien format : importer uniquement les settings
        form.reset(data);
        setStoredFormData(data);
        toast.warning(
          "Import partiel",
          "Configuration importée au format ancien. Les configurations avancées ne sont pas incluses."
        );
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error("Erreur d'import", "Impossible d'importer la configuration. Vérifiez le format du fichier.");
    }
  };

  // Gestionnaire pour l'export protégé
  const handleExportClick = () => {
    setActionType('export');
    setShowCodePrompt(true);
  };

  // Gestionnaire pour activer le mode édition
  const handleEditClick = () => {
    setActionType('edit');
    setShowCodePrompt(true);
  };

  // Gestionnaire pour l'import protégé
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setPendingImportData(json);
        setActionType('import');
        setShowCodePrompt(true);
      } catch (error) {
        toast.error("Fichier invalide", "Fichier JSON invalide ou erreur de lecture");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Dropzone pour les logos
  const createImageDropzone = (fieldName: keyof TranscriptSettingsPayload) => {
    const onDrop = (acceptedFiles: File[]) => {
      if (!isEditing || !acceptedFiles || acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
  
      if (file.size > MAX_FILE_SIZE) {
        form.setError(fieldName as any, {
          type: "manual",
          message: "L'image dépasse la taille maximale autorisée (1Mb).",
        });
        return;
      }
  
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        form.clearErrors(fieldName as any); 
        form.setValue(fieldName, base64);
      };
      reader.readAsDataURL(file);
    };
    
    return useDropzone({
      onDrop,
      accept: { "image/*": [] },
      disabled: !isEditing,
      multiple: false
    });
  };

  // Créer des dropzones individuels pour chaque logo
  const logoDropzone = createImageDropzone("logo");
  const universityLogoDropzone = createImageDropzone("universityLogo");
  const facultyLogoDropzone = createImageDropzone("facultyLogo");
  const watermarkLogoDropzone = createImageDropzone("watermarkLogo"); // NOUVEAU: Logo de fond
  const coatOfArmsDropzone = createImageDropzone("coatOfArms"); // NOUVEAU: Armoiries
  const ministryLogoDropzone = createImageDropzone("ministryLogo"); // NOUVEAU: Logo MINESUP

  // Fonction pour enregistrer les modifications
  const saveChanges = () => {
    const formData = form.getValues();
    
    // Validation des données avant enregistrement
    if (!formData.nameFrench || !formData.nameEnglish) {
      form.setError("nameFrench" as any, { 
        type: "manual", 
        message: "Le nom de l'établissement est requis en français et en anglais" 
      });
      return;
    }
    
    try {
      setStoredFormData(formData);
      setSaveStatus("success");
      
      // Réinitialiser le message de succès après 3 secondes
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
      
      setIsEditing(false);
    } catch (error) {
      setSaveStatus("error");
    }
  };

  // Annuler les modifications
  const cancelEditing = () => {
    form.reset(storedFormData);
    setIsEditing(false);
    setSaveStatus("idle");
  };

  // Fonction pour prévisualiser le relevé avec le thème actuel
  const previewTranscript = () => {
    setShowPreview(true);
    toast.info("Aperçu", "Fonctionnalité d'aperçu à implémenter");
    setShowPreview(false);
  };

  // Gestionnaire pour mettre à jour le thème
  const handleThemeUpdate = (updatedSettings: TranscriptSettingsPayload) => {
    form.setValue("theme", updatedSettings.theme);
    form.setValue("themeColor", updatedSettings.themeColor);
    form.setValue("themeFont", updatedSettings.themeFont);
    saveChanges();
  };

  // Fonction pour obtenir le message d'action selon le type
  const getActionMessage = () => {
    switch (actionType) {
      case 'export':
        return 'exporter la configuration';
      case 'import':
        return 'importer la configuration';
      case 'edit':
        return 'modifier la configuration';
      default:
        return 'effectuer cette action';
    }
  };

  // Render secret code prompt modal
  const renderCodePrompt = () => {
    if (!showCodePrompt) return null;
    
    return (
      <Dialog open={showCodePrompt} onOpenChange={setShowCodePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Code de sécurité requis
            </DialogTitle>
            <DialogDescription>
              Veuillez entrer le code de déverrouillage pour {getActionMessage()}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code de déverrouillage</Label>
              <Input
                id="code"
                type="password"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Entrez le code..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCodeSubmit();
                  }
                }}
                autoFocus
              />
              {codeError && (
                <p className="text-sm text-red-600">{codeError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCodePrompt(false);
                setCodeInput("");
                setCodeError("");
                setPendingImportData(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCodeSubmit}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      <div className="space-y-8">
        {renderCodePrompt()}
        <Card className="w-full max-w-6xl mx-auto my-10">
          <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <CardTitle>Configuration des Entêtes</CardTitle>
                {!isEditing && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Lock className="h-4 w-4" />
                    <span>Mode lecture seule</span>
                  </div>
                )}
                {isEditing && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Unlock className="h-4 w-4" />
                    <span>Mode édition activé</span>
                  </div>
                )}
              </div>
              <CardDescription>
                Personnalisez l'apparence des relevés de notes et attestations
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <Tabs value={activeTab} onValueChange={(value: "general" | "appearance" | "advanced") => setActiveTab(value)}>
              <TabsList>
                <TabsTrigger value="general">Informations</TabsTrigger>
                <TabsTrigger value="appearance">Apparence</TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-1">
                  <Type className="h-3 w-3" />
                  Tableau
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Boutons d'action */}
            <div className="flex gap-2 items-center flex-wrap">
              {!isEditing && activeTab === "general" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <Edit3 className="h-4 w-4" />
                  Modifier les paramètres
                </Button>
              ) : null}
              
              {isEditing && activeTab === "general" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Verrouiller les modifications
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportClick}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                <Download className="h-4 w-4" />
                Exporter la configuration
              </Button>
              
              <label
                htmlFor="import-settings"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <UploadIcon className="h-4 w-4" />
                Importer la configuration
              </label>
              <input
                type="file"
                id="import-settings"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={handleImportFile}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Messages de statut */}
          {saveStatus === "success" && (
            <Alert className="mb-4 bg-green-50 border-green-300 text-green-800">
              <AlertDescription>
                Les informations ont été enregistrées avec succès
              </AlertDescription>
            </Alert>
          )}
          
          {saveStatus === "error" && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>
                Une erreur est survenue lors de l'enregistrement
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <Tabs value={activeTab}>
                <TabsContent value="general" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                    <div className="space-y-6">
                      {/* Sélection du type d'établissement */}
                      <FormField
                        control={form.control}
                        name="establishmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type d'établissement</FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!isEditing}
                                className="flex flex-row space-x-6"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="ipes" id="ipes" disabled={!isEditing} />
                                  <Label htmlFor="ipes" className={`flex items-center ${!isEditing ? 'cursor-default text-gray-500' : 'cursor-pointer'}`}>
                                    <Building className="h-4 w-4 mr-2" />
                                    Institut Privé (IPES)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="faculty" id="faculty" disabled={!isEditing} />
                                  <Label htmlFor="faculty" className={`flex items-center ${!isEditing ? 'cursor-default text-gray-500' : 'cursor-pointer'}`}>
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    Faculté Universitaire
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Paramètres de thème de base */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="themeColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Couleur du thème</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="color"
                                  disabled={!isEditing}
                                  className={`h-10 w-full ${!isEditing ? "bg-gray-50" : ""}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="themeFont"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Police de caractères</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  disabled={!isEditing}
                                  className={`w-full h-10 px-3 border rounded-md ${!isEditing ? "bg-gray-50 text-gray-600" : ""}`}
                                >
                                  <option value="Times New Roman, serif">Times New Roman</option>
                                  <option value="Arial, sans-serif">Arial</option>
                                  <option value="Helvetica, sans-serif">Helvetica</option>
                                  <option value="Georgia, serif">Georgia</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Champs conditionnels selon le type d'établissement */}
                      {watchEstablishmentType === "ipes" && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="nameFrench"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{labels.establishmentName} (Français)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    disabled={!isEditing} 
                                    className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="nameEnglish"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{labels.establishmentName} (Anglais)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    disabled={!isEditing} 
                                    className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="nameAbreviation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{labels.establishmentAbbr}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    disabled={!isEditing} 
                                    className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="convTextFr"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{labels.establishmentConv} (Français)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    disabled={!isEditing} 
                                    className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="convTextEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{labels.establishmentConv} (Anglais)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    disabled={!isEditing} 
                                    className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="postalBox"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Boîte postale (Français)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    disabled={!isEditing} 
                                    className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="postalBoxEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Boîte postale (Anglais)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    disabled={!isEditing} 
                                    className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adresse e-mail</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="email" 
                                    disabled={!isEditing} 
                                    className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Format du numéro de référence (visible pour tous les types) */}
                      <FormField
                        control={form.control}
                        name="transcriptRefFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Format du N° de référence (Relevé de notes)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ''}
                                disabled={!isEditing}
                                placeholder="{YEAR}/UDo/FMSP/VDPSAA/VDSSE/VDRC/CDAASSR/{TYPE}"
                                className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Placeholders : <code>{'{YEAR}'}</code> = année, <code>{'{CENTRE}'}</code> = initiales du centre, <code>{'{ABBR}'}</code> = abréviation établissement, <code>{'{TYPE}'}</code> = DIR/SSE/abréviation. Laissez vide pour le format par défaut.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Section des logos */}
                    <div className="space-y-6">
                      {watchEstablishmentType === "ipes" && (
                        <FormField
                          control={form.control}
                          name="logo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{labels.establishmentLogo}</FormLabel>
                              <FormControl>
                                <div
                                  {...(isEditing ? logoDropzone.getRootProps() : {})}
                                  className={`border-2 rounded-md p-4 text-center flex flex-col justify-center min-h-[120px] ${
                                    !isEditing 
                                      ? "cursor-default border-gray-200 bg-gray-50" 
                                      : logoDropzone.isDragActive 
                                        ? "border-primary bg-primary/10 cursor-pointer border-dashed" 
                                        : "border-gray-300 cursor-pointer border-dashed"
                                  }`}
                                >
                                  {isEditing && <input {...logoDropzone.getInputProps()} />}
                                  {field.value ? (
                                    <div className="flex flex-col items-center">
                                      <img
                                        src={field.value}
                                        alt="Logo"
                                        className="mx-auto max-h-32 w-full object-contain mb-2"
                                      />
                                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                                        {isEditing ? "Cliquez ou glissez-déposez pour changer" : "Mode lecture seule"}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <UploadIcon className={`h-10 w-10 mb-2 ${!isEditing ? "text-gray-400" : "text-gray-500"}`} />
                                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                                        {isEditing ? "Cliquez ou glissez-déposez pour ajouter" : "Mode lecture seule"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {/* Logo de l'université - toujours affiché */}
                      <FormField
                        control={form.control}
                        name="universityLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo de l'Université</FormLabel>
                            <FormControl>
                              <div
                                {...(isEditing ? universityLogoDropzone.getRootProps() : {})}
                                className={`border-2 ${isEditing ? 'border-dashed cursor-pointer' : 'border-solid'} rounded-md p-4 text-center flex flex-col justify-center ${
                                  isEditing && universityLogoDropzone.isDragActive ? "border-primary bg-primary/10" : isEditing ? "border-gray-300" : "border-gray-200"
                                }`}
                              >
                                {isEditing && <input {...universityLogoDropzone.getInputProps()} />}
                                {field.value ? (
                                  <img
                                    src={field.value}
                                    alt="Logo Université"
                                    className="mx-auto max-h-32 w-full object-contain"
                                  />
                                ) : isEditing && universityLogoDropzone.isDragActive ? (
                                  <p>Déposez le fichier ici ...</p>
                                ) : isEditing ? (
                                  <p>
                                    Faites glisser et déposez un logo ici, ou cliquez pour
                                    sélectionner un fichier
                                  </p>
                                ) : (
                                  <p className="text-gray-500">Aucun logo défini</p>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="facultyLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo de la Faculté</FormLabel>
                            <FormControl>
                              <div
                                {...(isEditing ? facultyLogoDropzone.getRootProps() : {})}
                                className={`border-2 ${isEditing ? 'border-dashed cursor-pointer' : 'border-solid'} rounded-md p-4 text-center flex flex-col justify-center ${
                                  isEditing && facultyLogoDropzone.isDragActive ? "border-primary bg-primary/10" : isEditing ? "border-gray-300" : "border-gray-200"
                                }`}
                              >
                                {isEditing && <input {...facultyLogoDropzone.getInputProps()} />}
                                {field.value ? (
                                  <img
                                    src={field.value}
                                    alt="Logo Faculté"
                                    className="mx-auto max-h-32 w-full object-contain"
                                  />
                                ) : isEditing && facultyLogoDropzone.isDragActive ? (
                                  <p>Déposez le fichier ici ...</p>
                                ) : isEditing ? (
                                  <p>
                                    Faites glisser et déposez un logo ici, ou cliquez pour
                                    sélectionner un fichier
                                  </p>
                                ) : (
                                  <p className="text-gray-500">Aucun logo défini</p>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* NOUVEAU: Logo de fond personnalisé */}
                      <FormField
                        control={form.control}
                        name="watermarkLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo de fond des relevés (Watermark)</FormLabel>
                            <FormControl>
                              <div
                                {...(isEditing ? watermarkLogoDropzone.getRootProps() : {})}
                                className={`border-2 ${isEditing ? 'border-dashed cursor-pointer' : 'border-solid'} rounded-md p-4 text-center flex flex-col justify-center ${
                                  isEditing && watermarkLogoDropzone.isDragActive ? "border-primary bg-primary/10" : isEditing ? "border-gray-300" : "border-gray-200"
                                }`}
                              >
                                {isEditing && <input {...watermarkLogoDropzone.getInputProps()} />}
                                {field.value ? (
                                  <div className="flex flex-col items-center">
                                    <img
                                      src={field.value}
                                      alt="Logo de fond"
                                      className="mx-auto max-h-32 w-full object-contain mb-2"
                                    />
                                    <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                                      {isEditing ? "Cliquez ou glissez-déposez pour changer" : "Mode lecture seule"}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <UploadIcon className={`h-10 w-10 mb-2 ${!isEditing ? "text-gray-400" : "text-gray-500"}`} />
                                    <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                                      {isEditing ? "Cliquez ou glissez-déposez pour ajouter un logo de fond" : "Mode lecture seule"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Si vide, utilise le logo par défaut de l'établissement
                                    </p>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* NOUVEAU: Armoiries du Cameroun (pour diplômes) */}
                      {watchEstablishmentType === "faculty" && (
                        <FormField
                          control={form.control}
                          name="coatOfArms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Armoiries du Cameroun (pour diplômes)</FormLabel>
                              <FormControl>
                                <div
                                  {...(isEditing ? coatOfArmsDropzone.getRootProps() : {})}
                                  className={`border-2 ${isEditing ? 'border-dashed cursor-pointer' : 'border-solid'} rounded-md p-4 text-center flex flex-col justify-center ${
                                    isEditing && coatOfArmsDropzone.isDragActive ? "border-primary bg-primary/10" : isEditing ? "border-gray-300" : "border-gray-200"
                                  }`}
                                >
                                  {isEditing && <input {...coatOfArmsDropzone.getInputProps()} />}
                                  {field.value ? (
                                    <div className="flex flex-col items-center">
                                      <img
                                        src={field.value}
                                        alt="Armoiries du Cameroun"
                                        className="mx-auto max-h-32 w-full object-contain mb-2"
                                      />
                                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                                        {isEditing ? "Cliquez ou glissez-déposez pour changer" : "Mode lecture seule"}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <UploadIcon className={`h-10 w-10 mb-2 ${!isEditing ? "text-gray-400" : "text-gray-500"}`} />
                                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                                        {isEditing ? "Cliquez ou glissez-déposez pour ajouter les armoiries" : "Mode lecture seule"}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Utilisé sur les diplômes uniquement
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* NOUVEAU: Logo MINESUP (pour diplômes) */}
                      {watchEstablishmentType === "faculty" && (
                        <FormField
                          control={form.control}
                          name="ministryLogo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logo MINESUP (pour diplômes)</FormLabel>
                              <FormControl>
                                <div
                                  {...(isEditing ? ministryLogoDropzone.getRootProps() : {})}
                                  className={`border-2 ${isEditing ? 'border-dashed cursor-pointer' : 'border-solid'} rounded-md p-4 text-center flex flex-col justify-center ${
                                    isEditing && ministryLogoDropzone.isDragActive ? "border-primary bg-primary/10" : isEditing ? "border-gray-300" : "border-gray-200"
                                  }`}
                                >
                                  {isEditing && <input {...ministryLogoDropzone.getInputProps()} />}
                                  {field.value ? (
                                    <div className="flex flex-col items-center">
                                      <img
                                        src={field.value}
                                        alt="Logo MINESUP"
                                        className="mx-auto max-h-32 w-full object-contain mb-2"
                                      />
                                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                                        {isEditing ? "Cliquez ou glissez-déposez pour changer" : "Mode lecture seule"}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <UploadIcon className={`h-10 w-10 mb-2 ${!isEditing ? "text-gray-400" : "text-gray-500"}`} />
                                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                                        {isEditing ? "Cliquez ou glissez-déposez pour ajouter le logo MINESUP" : "Mode lecture seule"}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Utilisé sur les diplômes uniquement
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="appearance" className="mt-0">
                  <ThemeEditor
                    settings={form.getValues()}
                    onSave={handleThemeUpdate}
                    onPreview={previewTranscript}
                  />
                </TabsContent>
                {/* Onglet de configuration avancée du tableau */}
                <TabsContent value="advanced" className="mt-0">
                  <ThemeEditor
                    settings={form.getValues()}
                    onSave={handleThemeUpdate}
                    onPreview={previewTranscript}
                    showTableCustomization={true}
                  />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
        {isEditing && activeTab === "general" && (
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelEditing}>
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button onClick={saveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
    </>
  );
};

export default SettingForm;