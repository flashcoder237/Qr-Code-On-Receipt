// src/components/organisms/settings-form/settings-form.tsx - Version mise à jour
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
import { Edit, Save, X, Eye, Building, GraduationCap, Type } from "lucide-react";
import {
  TranscriptSettingsPayload,
  TranscriptsettingsSchema,
  getCompleteTheme,
  getAdvancedTranscriptConfig, // NOUVEAU
} from "@/lib/form-schemas/settings";
import { defaultTheme } from "@/lib/form-schemas/theme-settings";
import { defaultAdvancedTranscriptConfig } from "@/lib/form-schemas/advanced-typography"; // NOUVEAU
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeEditor } from "../theme-editor";
import { AdvancedTranscriptThemeEditor } from "../theme-editor/AdvancedTranscriptThemeEditor"; // NOUVEAU

const SettingForm: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "advanced">("general"); // NOUVEAU: tab advanced
  const [showPreview, setShowPreview] = useState(false);
  
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
      themeColor: "#000000",
      themeFont: "Times New Roman, serif",
      theme: defaultTheme,
      advancedTranscriptConfig: defaultAdvancedTranscriptConfig, // NOUVEAU
    });

  const form = useForm<TranscriptSettingsPayload>({
    resolver: zodResolver(TranscriptsettingsSchema),
    defaultValues: storedFormData,
  });

  const MAX_FILE_SIZE = 1000 * 1024;

  // Observer les changements du type d'établissement
  const watchEstablishmentType = form.watch("establishmentType");

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
    alert("Fonctionnalité d'aperçu à implémenter. Cette alerte sera remplacée par un aperçu réel.");
    setShowPreview(false);
  };

  // Gestionnaire pour mettre à jour le thème
  const handleThemeUpdate = (updatedSettings: TranscriptSettingsPayload) => {
    form.setValue("theme", updatedSettings.theme);
    form.setValue("themeColor", updatedSettings.themeColor);
    form.setValue("themeFont", updatedSettings.themeFont);
    saveChanges();
  };

  // NOUVEAU: Gestionnaire pour mettre à jour la configuration avancée
  const handleAdvancedConfigUpdate = (advancedConfig: any) => {
    form.setValue("advancedTranscriptConfig", advancedConfig);
    setStoredFormData({
      ...storedFormData,
      advancedTranscriptConfig: advancedConfig
    });
    setSaveStatus("success");
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  // NOUVEAU: Fonction pour sauvegarder la configuration avancée
  const handleAdvancedConfigSave = () => {
    const currentData = form.getValues();
    setStoredFormData(currentData);
    setSaveStatus("success");
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  // Fonction pour obtenir les libellés conditionnels
  const getEstablishmentLabels = () => {
    const isIpes = watchEstablishmentType === "ipes";
    return {
      establishmentLogo: isIpes ? "Logo de l'IPES" : "Logo de l'établissement",
      establishmentName: isIpes ? "Nom de l'IPES" : "Nom de l'établissement",
      establishmentAbbr: isIpes ? "Abréviation de l'IPES" : "Abréviation de l'établissement",
    };
  };

  const labels = getEstablishmentLabels();

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-6xl mx-auto my-10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Configuration des Entêtes</CardTitle>
              <CardDescription>
                Personnalisez l'apparence des relevés de notes et attestations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Tabs value={activeTab} onValueChange={(value: "general" | "appearance" | "advanced") => setActiveTab(value)}>
                <TabsList>
                  <TabsTrigger value="general">Informations</TabsTrigger>
                  <TabsTrigger value="appearance">Apparence</TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center gap-1">
                    <Type className="h-3 w-3" />
                    Typographie
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {!isEditing && activeTab !== "advanced" ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
            <form className="space-y-4">
              <Tabs value={activeTab}>
                <TabsContent value="general" className="mt-0">
                  <div className="grid grid-cols-[2fr_1fr] gap-6">
                    <div className="space-y-4">
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
                                  <RadioGroupItem value="ipes" id="ipes" />
                                  <Label htmlFor="ipes" className="flex items-center cursor-pointer">
                                    <Building className="h-4 w-4 mr-2" />
                                    Institut Privé (IPES)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="faculty" id="faculty" />
                                  <Label htmlFor="faculty" className="flex items-center cursor-pointer">
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

                      <div className="grid grid-cols-2 gap-4">
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
                                  className="h-10 w-full"
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
                                  className="w-full h-10 px-3 border rounded-md"
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
                        <div>
                          <FormField
                            control={form.control}
                            name="nameFrench"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{labels.establishmentName} (Français)</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!isEditing} />
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
                                  <Input {...field} disabled={!isEditing} />
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
                                  <Input {...field} disabled={!isEditing} />
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
                                  <Input {...field} disabled={!isEditing} />
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
                                  <Input {...field} disabled={!isEditing} />
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
                                  <Input {...field} type="email" disabled={!isEditing} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Section des logos */}
                    <div className="space-y-4">
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
                                  className={`border-2 ${isEditing ? 'border-dashed cursor-pointer' : 'border-solid'} rounded-md p-4 text-center flex flex-col justify-center ${
                                    isEditing && logoDropzone.isDragActive ? "border-primary bg-primary/10" : isEditing ? "border-gray-300" : "border-gray-200"
                                  }`}
                                >
                                  {isEditing && <input {...logoDropzone.getInputProps()} />}
                                  {field.value ? (
                                    <img
                                      src={field.value}
                                      alt="Logo"
                                      className="mx-auto max-h-32 w-full object-contain"
                                    />
                                  ) : isEditing && logoDropzone.isDragActive ? (
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

                {/* NOUVEAU: Onglet de configuration typographique avancée */}
                <TabsContent value="advanced" className="mt-0">
                  <AdvancedTranscriptThemeEditor
                    config={getAdvancedTranscriptConfig(form.getValues())}
                    onChange={handleAdvancedConfigUpdate}
                    onSave={handleAdvancedConfigSave}
                    onPreview={previewTranscript}
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
  );
};

export default SettingForm;