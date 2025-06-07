// src/components/organisms/attestation-generator/AttestationSettings.tsx - Version adaptée
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocalStorage } from "usehooks-ts";
import { useDropzone } from "react-dropzone";
import { Upload, Save, RotateCcw, Building, GraduationCap } from "lucide-react";

interface AttestationSettingsProps {
  onSettingsUpdated?: () => void;
}

export const AttestationSettings: React.FC<AttestationSettingsProps> = ({ onSettingsUpdated }) => {
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
  });

  // État local pour la modification
  const [formValues, setFormValues] = useState(settings);
  const [isSuccess, setIsSuccess] = useState(false);
  
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

  // Dropzones pour les logos
  const handleLogoUpload = (field: keyof typeof formValues) => (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Vérifier la taille du fichier
      if (file.size > MAX_FILE_SIZE) {
        alert(`Le fichier est trop volumineux. Taille maximale: 1MB. Taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
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
    multiple: false
  });

  const uniLogoDropzone = useDropzone({
    onDrop: handleLogoUpload('universityLogo'),
    accept: { 'image/*': [] },
    multiple: false
  });

  const facLogoDropzone = useDropzone({
    onDrop: handleLogoUpload('facultyLogo'),
    accept: { 'image/*': [] },
    multiple: false
  });

  // Gestion des changements de champs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestion du changement de type d'établissement
  const handleEstablishmentTypeChange = (value: string) => {
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
    setFormValues(settings);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Paramètres de l'Attestation</CardTitle>
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
            </div>
            { formValues.establishmentType === "ipes" && 
            <div>
              <div className="space-y-2">
              <Label htmlFor="nameFrench">{labels.establishmentName} (Français)</Label>
              <Input 
                id="nameFrench"
                name="nameFrench"
                value={formValues.nameFrench}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nameEnglish">{labels.establishmentName} (Anglais)</Label>
              <Input 
                id="nameEnglish"
                name="nameEnglish"
                value={formValues.nameEnglish}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nameAbreviation">{labels.establishmentAbbr}</Label>
              <Input 
                id="nameAbreviation"
                name="nameAbreviation"
                value={formValues.nameAbreviation}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="convTextFr">{labels.establishmentConv} (Français)</Label>
              <Input 
                id="convTextFr"
                name="convTextFr"
                value={formValues.convTextFr}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convTextEn">{labels.establishmentConv} (Anglais)</Label>
              <Input 
                id="convTextEn"
                name="convTextEn"
                value={formValues.convTextEn}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalBox">Boîte postale (Français)</Label>
              <Input 
                id="postalBox"
                name="postalBox"
                value={formValues.postalBox}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postalBoxEn">Boîte postale (Anglais)</Label>
              <Input 
                id="postalBoxEn"
                name="postalBoxEn"
                value={formValues.postalBoxEn}
                onChange={handleInputChange}
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
              />
            </div>
            </div>
}
          </div>
          
          {/* Côté Droit - Logos */}
          <div className="space-y-6">
            { formValues.establishmentType === "ipes" && 
            <div className="space-y-2">
              <Label>{labels.establishmentLogo}</Label>
              <div 
                {...schoolLogoDropzone.getRootProps()} 
                className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
                  schoolLogoDropzone.isDragActive ? "border-primary bg-blue-50" : "border-gray-300"
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
                    <p className="text-sm text-gray-500">
                      Cliquez ou glissez-déposez pour changer
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Cliquez ou glissez-déposez pour ajouter
                    </p>
                  </div>
                )}
              </div>
            </div>
}
            <div className="space-y-2">
              <Label>Logo de l'université</Label>
              <div 
                {...uniLogoDropzone.getRootProps()} 
                className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
                  uniLogoDropzone.isDragActive ? "border-primary bg-blue-50" : "border-gray-300"
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
                    <p className="text-sm text-gray-500">
                      Cliquez ou glissez-déposez pour changer
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Cliquez ou glissez-déposez pour ajouter
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Logo de la faculté</Label>
              <div 
                {...facLogoDropzone.getRootProps()} 
                className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
                  facLogoDropzone.isDragActive ? "border-primary bg-blue-50" : "border-gray-300"
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
                    <p className="text-sm text-gray-500">
                      Cliquez ou glissez-déposez pour changer
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Cliquez ou glissez-déposez pour ajouter
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4">
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
        </div>
      </CardContent>
    </Card>
  );
};