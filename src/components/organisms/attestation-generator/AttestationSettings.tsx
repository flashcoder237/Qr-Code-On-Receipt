// src/components/organisms/attestation-generator/AttestationSettings.tsx - Version avec protection complète
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalStorage } from "usehooks-ts";
import { useDropzone } from "react-dropzone";
import { Upload, Save, RotateCcw, Building, GraduationCap, Lock, Download, Upload as UploadIcon, Edit3, Unlock } from "lucide-react";
import { useNotifications } from "@/components/ui/notification-system";

interface AttestationSettingsProps {
  onSettingsUpdated?: () => void;
}

export const AttestationSettings: React.FC<AttestationSettingsProps> = ({ onSettingsUpdated }) => {
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotifications();

  // État des paramètres stockés dans localStorage
  const [settings, setSettings] = useLocalStorage("settings", {
    establishmentType: "ipes", // Valeur par défaut
    nameFrench: "INSTITUT UNIVERSITAIRE DES ...",
    nameEnglish: "UNIVERSITY INSTITUTE OF ...",
    nameAbreviation: "IUB...",
    postalBox: "xxxx, Douala Cameroun",
    postalBoxEn: "xxxx, Douala Cameroon",
    email: "xxxxx@gmail.com",
    logo: "",
    universityLogo: "",
    facultyLogo: "",
    convTextEn: "",
    convTextFr: "",
    qrCodeSize: "medium", // Nouvelle option pour la taille du QR code
  });

  // État local pour la modification
  const [formValues, setFormValues] = useState(settings);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Mode édition verrouillé par défaut
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [actionType, setActionType] = useState<'export' | 'import' | 'edit'>('export');
  const [pendingImportData, setPendingImportData] = useState<any>(null);

  // DEBUG: Ajout de logs pour diagnostiquer le problème
  useEffect(() => {
    console.log("AttestationSettings - Settings chargées:", 
      settings.logo ? "Logo présent" : "Pas de logo",
      settings.universityLogo ? "Logo université présent" : "Pas de logo université",
      settings.facultyLogo ? "Logo faculté présent" : "Pas de logo faculté");
  }, [settings]);
  
  // Synchroniser l'état local quand les paramètres changent
  useEffect(() => {
    setFormValues(settings);
  }, [settings]);

  // Références pour les champs de fichier
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uniLogoInputRef = useRef<HTMLInputElement>(null);
  const facLogoInputRef = useRef<HTMLInputElement>(null);
  
  // Taille maximale de fichier (1 MB)
  const MAX_FILE_SIZE = 1 * 1024 * 1024;

  // Fonction pour obtenir les libellés conditionnels
  const getEstablishmentLabels = () => {
    const isIpes = formValues.establishmentType === "ipes";
    return {
      establishmentLogo: isIpes ? "Logo de l'IPES" : "Logo de l'établissement",
      establishmentName: isIpes ? "Nom de l'IPES" : "Nom de l'établissement",
      establishmentAbbr: isIpes ? "Abréviation de l'IPES" : "Abréviation de l'établissement",
      establishmentConv: isIpes ? "Convention de l'IPES" : "Convention de l'établissement",
    };
  };

  const labels = getEstablishmentLabels();

  // Fonction pour valider le code secret (même logique que SettingsForm)
  const validateSecretCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
    const expectedCode = `Erica2004.-${dateStr}`;
    
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
      setCodeError("Code secret invalide");
    }
  };

  // Fonction d'exportation
  const performExport = () => {
    const dataStr = JSON.stringify(formValues, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attestation-parameters.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fonction d'importation
  const performImport = (data: any) => {
    setFormValues(data);
    setSettings(data);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
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

  // Gestionnaire pour désactiver le mode édition
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormValues(settings); // Restaurer les valeurs d'origine
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
        notifyError("Erreur d'importation", "Fichier JSON invalide ou erreur de lecture");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Dropzones pour les logos (conditionnels selon le mode édition)
  const handleLogoUpload = (field: keyof typeof formValues) => (acceptedFiles: File[]) => {
    if (!isEditing) return; // Bloquer si pas en mode édition
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Vérifier la taille du fichier
      if (file.size > MAX_FILE_SIZE) {
        notifyError("Fichier trop volumineux", `Taille maximale: 1MB. Taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          console.log(`AttestationSettings - Image ${field} chargée:`, 
            typeof e.target.result, 
            typeof e.target.result === 'string' ? e.target.result.substring(0, 30) + '...' : 'Non-string');
          
          setFormValues(prev => ({
            ...prev,
            [field]: e.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const schoolLogoDropzone = useDropzone({
    onDrop: handleLogoUpload('logo'),
    accept: { 'image/*': [] },
    multiple: false,
    disabled: !isEditing
  });

  const uniLogoDropzone = useDropzone({
    onDrop: handleLogoUpload('universityLogo'),
    accept: { 'image/*': [] },
    multiple: false,
    disabled: !isEditing
  });

  const facLogoDropzone = useDropzone({
    onDrop: handleLogoUpload('facultyLogo'),
    accept: { 'image/*': [] },
    multiple: false,
    disabled: !isEditing
  });

  // Gestion des changements de champs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return; // Bloquer si pas en mode édition
    
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestion du changement de type d'établissement
  const handleEstablishmentTypeChange = (value: string) => {
    if (!isEditing) return; // Bloquer si pas en mode édition
    
    setFormValues(prev => ({
      ...prev,
      establishmentType: value
    }));
  };

  // Enregistrement des modifications
  const handleSave = () => {
    console.log("AttestationSettings - Sauvegarde des valeurs:", 
      formValues.logo ? "Logo présent" : "Pas de logo",
      formValues.universityLogo ? "Logo université présent" : "Pas de logo université",
      formValues.facultyLogo ? "Logo faculté présent" : "Pas de logo faculté");
    
    // Sauvegarde dans localStorage avec un nouveau objet pour garantir le déclenchement de useEffect
    setSettings({...formValues});
    setIsSuccess(true);
    setIsEditing(false); // Sortir du mode édition après sauvegarde
    
    // Notification au parent que les paramètres ont été mis à jour
    if (onSettingsUpdated) {
      onSettingsUpdated();
    }
    
    // Effacer le message de succès après un délai
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  // Réinitialisation du formulaire
  const handleReset = () => {
    if (!isEditing) return; // Bloquer si pas en mode édition
    
    // Reset to initial default values instead of current settings to fix reset issue
    const defaultSettings = {
      establishmentType: "",
      nameFrench: "",
      nameEnglish: "",
      nameAbreviation: "",
      postalBox: "",
      postalBoxEn: "",
      email: "",
      logo: "",
      universityLogo: "",
      facultyLogo: "",
      convTextEn: "",
      convTextFr: "",
    };
    setFormValues(defaultSettings);
  };

  // Fonction pour obtenir le message d'action selon le type
  const getActionMessage = () => {
    switch (actionType) {
      case 'export':
        return 'exporter les paramètres';
      case 'import':
        return 'importer les paramètres';
      case 'edit':
        return 'modifier les paramètres';
      default:
        return 'effectuer cette action';
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Paramètres de l'Attestation</span>
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
          </CardTitle>
          <div className="flex gap-2 items-center flex-wrap">
            {!isEditing ? (
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
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
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
              Exporter les paramètres
            </Button>
            <label
              htmlFor="import-parameters"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <UploadIcon className="h-4 w-4" />
              Importer les paramètres
            </label>
            <input
              type="file"
              id="import-parameters"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isSuccess && (
            <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
              Les paramètres ont été enregistrés avec succès.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Côté Gauche - Informations textuelles */}
            <div className="space-y-4">
              {/* Sélection du type d'établissement */}
              <div className="space-y-2">
                <Label>Type d'établissement</Label>
                <RadioGroup
                  value={formValues.establishmentType}
                  onValueChange={handleEstablishmentTypeChange}
                  className="flex flex-row space-x-6"
                  disabled={!isEditing}
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
              </div>
              
              {formValues.establishmentType === "ipes" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameFrench">{labels.establishmentName} (Français)</Label>
                    <Input 
                      id="nameFrench"
                      name="nameFrench"
                      value={formValues.nameFrench}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nameEnglish">{labels.establishmentName} (Anglais)</Label>
                    <Input 
                      id="nameEnglish"
                      name="nameEnglish"
                      value={formValues.nameEnglish}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nameAbreviation">{labels.establishmentAbbr}</Label>
                    <Input 
                      id="nameAbreviation"
                      name="nameAbreviation"
                      value={formValues.nameAbreviation}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="convTextFr">{labels.establishmentConv} (Français)</Label>
                    <Input 
                      id="convTextFr"
                      name="convTextFr"
                      value={formValues.convTextFr}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="convTextEn">{labels.establishmentConv} (Anglais)</Label>
                    <Input 
                      id="convTextEn"
                      name="convTextEn"
                      value={formValues.convTextEn}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalBox">Boîte postale (Français)</Label>
                    <Input 
                      id="postalBox"
                      name="postalBox"
                      value={formValues.postalBox}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalBoxEn">Boîte postale (Anglais)</Label>
                    <Input 
                      id="postalBoxEn"
                      name="postalBoxEn"
                      value={formValues.postalBoxEn}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={formValues.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50 text-gray-600" : ""}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Côté Droit - Logos */}
            <div className="space-y-6">
              {formValues.establishmentType === "ipes" && (
                <div className="space-y-2">
                  <Label>{labels.establishmentLogo}</Label>
                  <div 
                    {...schoolLogoDropzone.getRootProps()} 
                    className={`border-2 border-dashed rounded-md p-4 text-center ${
                      !isEditing 
                        ? "cursor-default border-gray-200 bg-gray-50" 
                        : schoolLogoDropzone.isDragActive 
                          ? "border-primary bg-blue-50 cursor-pointer" 
                          : "border-gray-300 cursor-pointer"
                    }`}
                  >
                    <input {...schoolLogoDropzone.getInputProps()} />
                    
                    {formValues.logo ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={formValues.logo} 
                          alt={labels.establishmentLogo} 
                          className="max-h-32 max-w-full mb-2" 
                        />
                        <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                          {isEditing ? "Cliquez ou glissez-déposez pour changer" : "Mode lecture seule"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className={`h-10 w-10 mb-2 ${!isEditing ? "text-gray-300" : "text-gray-400"}`} />
                        <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                          {isEditing ? "Cliquez ou glissez-déposez pour ajouter" : "Mode lecture seule"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Logo de l'université</Label>
                <div 
                  {...uniLogoDropzone.getRootProps()} 
                  className={`border-2 border-dashed rounded-md p-4 text-center ${
                    !isEditing 
                      ? "cursor-default border-gray-200 bg-gray-50" 
                      : uniLogoDropzone.isDragActive 
                        ? "border-primary bg-blue-50 cursor-pointer" 
                        : "border-gray-300 cursor-pointer"
                  }`}
                >
                  <input {...uniLogoDropzone.getInputProps()} />
                  
                  {formValues.universityLogo ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={formValues.universityLogo} 
                        alt="Logo de l'université" 
                        className="max-h-32 max-w-full mb-2" 
                      />
                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                        {isEditing ? "Cliquez ou glissez-déposez pour changer" : "Mode lecture seule"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className={`h-10 w-10 mb-2 ${!isEditing ? "text-gray-300" : "text-gray-400"}`} />
                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                        {isEditing ? "Cliquez ou glissez-déposez pour ajouter" : "Mode lecture seule"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Logo de la faculté</Label>
                <div 
                  {...facLogoDropzone.getRootProps()} 
                  className={`border-2 border-dashed rounded-md p-4 text-center ${
                    !isEditing 
                      ? "cursor-default border-gray-200 bg-gray-50" 
                      : facLogoDropzone.isDragActive 
                        ? "border-primary bg-blue-50 cursor-pointer" 
                        : "border-gray-300 cursor-pointer"
                  }`}
                >
                  <input {...facLogoDropzone.getInputProps()} />
                  
                  {formValues.facultyLogo ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={formValues.facultyLogo} 
                        alt="Logo de la faculté" 
                        className="max-h-32 max-w-full mb-2" 
                      />
                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                        {isEditing ? "Cliquez ou glissez-déposez pour changer" : "Mode lecture seule"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className={`h-10 w-10 mb-2 ${!isEditing ? "text-gray-300" : "text-gray-400"}`} />
                      <p className={`text-sm ${!isEditing ? "text-gray-400" : "text-gray-500"}`}>
                        {isEditing ? "Cliquez ou glissez-déposez pour ajouter" : "Mode lecture seule"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Paramètres des documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Paramètres des documents</h3>
              
              <div className="space-y-2">
                <Label>Taille du QR code</Label>
                <Select
                  value={formValues.qrCodeSize || "medium"}
                  onValueChange={(value) => 
                    setFormValues(prev => ({ ...prev, qrCodeSize: value as "small" | "medium" | "large" }))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className={!isEditing ? "bg-gray-50 text-gray-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Petit (80x80px)</SelectItem>
                    <SelectItem value="medium">Moyen (100x100px)</SelectItem>
                    <SelectItem value="large">Grand (120x120px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4">
            {isEditing && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
                
                <Button 
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour le code de déverrouillage */}
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
                    validateSecretCode();
                  }
                }}
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
            <Button onClick={validateSecretCode}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};