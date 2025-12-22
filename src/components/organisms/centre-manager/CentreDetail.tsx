// src/components/organisms/centre-manager/CentreDetail.tsx
// Formulaire détaillé pour éditer un centre de formation

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Trash2,
  Building2,
  Shield,
  Image as ImageIcon,
} from 'lucide-react';
import { Centre, LegalText } from '@/lib/form-schemas/centre-settings';
import { useToast } from '@/hooks/use-toast';

interface CentreDetailProps {
  centre: Centre;
  onUpdate: (centre: Centre) => void;
  onBack: () => void;
}

export const CentreDetail: React.FC<CentreDetailProps> = ({
  centre,
  onUpdate,
  onBack,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Centre>(centre);
  const [isDirty, setIsDirty] = useState(false);

  // Gérer le changement de champ
  const handleFieldChange = (field: keyof Centre, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Gérer l'upload d'image
  const handleImageUpload = useCallback((field: 'logo' | 'administrativeInstanceLogo' | 'watermarkLogo') => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Vérifier la taille (limite: 1MB)
      if (file.size > 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 1MB.",
          variant: "error",
        });
        return;
      }

      // Convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFieldChange(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    };
  }, [toast]);

  // Supprimer une image
  const handleRemoveImage = (field: 'logo' | 'administrativeInstanceLogo' | 'watermarkLogo') => {
    handleFieldChange(field, undefined);
  };

  // Ajouter un texte légal
  const handleAddLegalText = () => {
    const newLegalText: LegalText = { textFr: '', textEn: '' };
    handleFieldChange('legalTexts', [...(formData.legalTexts || []), newLegalText]);
  };

  // Supprimer un texte légal
  const handleRemoveLegalText = (index: number) => {
    const updated = [...(formData.legalTexts || [])];
    updated.splice(index, 1);
    handleFieldChange('legalTexts', updated);
  };

  // Modifier un texte légal
  const handleLegalTextChange = (index: number, field: 'textFr' | 'textEn', value: string) => {
    const updated = [...(formData.legalTexts || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleFieldChange('legalTexts', updated);
  };

  // Sauvegarder
  const handleSave = () => {
    // Validation basique
    if (!formData.nameFrench.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le nom français est requis.",
        variant: "error",
      });
      return;
    }

    if (!formData.nameEnglish.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le nom anglais est requis.",
        variant: "error",
      });
      return;
    }

    onUpdate(formData);
    setIsDirty(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2">
          <Save className="h-4 w-4" />
          Enregistrer
        </Button>
      </div>

      {/* Section 1: Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations Générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du centre (court)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Ex: CEFPRES"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder="Ex: Douala"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameFrench">Nom complet (Français) *</Label>
            <Input
              id="nameFrench"
              value={formData.nameFrench}
              onChange={(e) => handleFieldChange('nameFrench', e.target.value)}
              placeholder="Ex: Centre de Formation Professionnelle de l'Espoir"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEnglish">Nom complet (Anglais) *</Label>
            <Input
              id="nameEnglish"
              value={formData.nameEnglish}
              onChange={(e) => handleFieldChange('nameEnglish', e.target.value)}
              placeholder="Ex: Professional Training Center of Hope"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
            />
            <Label htmlFor="isActive">Centre actif</Label>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo du centre */}
          <div className="space-y-2">
            <Label>Logo du centre</Label>
            {formData.logo ? (
              <div className="relative inline-block">
                <img
                  src={formData.logo}
                  alt="Logo centre"
                  className="w-32 h-32 object-contain border rounded p-2"
                />
                <Button
                  onClick={() => handleRemoveImage('logo')}
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="logo-upload" className="cursor-pointer text-sm text-primary hover:underline">
                  Cliquez pour télécharger
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload('logo')}
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG (max 1MB)</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Logo instance administrative */}
          <div className="space-y-2">
            <Label>Logo de l'instance administrative (ex: MINEFOP)</Label>
            {formData.administrativeInstanceLogo ? (
              <div className="relative inline-block">
                <img
                  src={formData.administrativeInstanceLogo}
                  alt="Logo instance"
                  className="w-32 h-32 object-contain border rounded p-2"
                />
                <Button
                  onClick={() => handleRemoveImage('administrativeInstanceLogo')}
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="admin-logo-upload" className="cursor-pointer text-sm text-primary hover:underline">
                  Cliquez pour télécharger
                </Label>
                <Input
                  id="admin-logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload('administrativeInstanceLogo')}
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG (max 1MB)</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Logo watermark */}
          <div className="space-y-2">
            <Label>Logo de fond (watermark)</Label>
            {formData.watermarkLogo ? (
              <div className="relative inline-block">
                <img
                  src={formData.watermarkLogo}
                  alt="Watermark"
                  className="w-32 h-32 object-contain border rounded p-2"
                />
                <Button
                  onClick={() => handleRemoveImage('watermarkLogo')}
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="watermark-upload" className="cursor-pointer text-sm text-primary hover:underline">
                  Cliquez pour télécharger
                </Label>
                <Input
                  id="watermark-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload('watermarkLogo')}
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG (max 1MB)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Instance administrative */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Instance Administrative
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminNameFr">Nom (Français)</Label>
              <Input
                id="adminNameFr"
                value={formData.administrativeInstanceNameFr || ''}
                onChange={(e) => handleFieldChange('administrativeInstanceNameFr', e.target.value)}
                placeholder="Ex: MINISTERE DE L'EMPLOI ET DE LA FORMATION PROFESSIONNELLE"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminNameEn">Nom (Anglais)</Label>
              <Input
                id="adminNameEn"
                value={formData.administrativeInstanceNameEn || ''}
                onChange={(e) => handleFieldChange('administrativeInstanceNameEn', e.target.value)}
                placeholder="Ex: MINISTRY OF EMPLOYMENT AND VOCATIONAL TRAINING"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminAcronymFr">Acronyme (Français)</Label>
              <Input
                id="adminAcronymFr"
                value={formData.administrativeInstanceAcronymFr || ''}
                onChange={(e) => handleFieldChange('administrativeInstanceAcronymFr', e.target.value)}
                placeholder="Ex: MINEFOP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminAcronymEn">Acronyme (Anglais)</Label>
              <Input
                id="adminAcronymEn"
                value={formData.administrativeInstanceAcronymEn || ''}
                onChange={(e) => handleFieldChange('administrativeInstanceAcronymEn', e.target.value)}
                placeholder="Ex: MINEFOP"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Textes d'autorisation */}
      <Card>
        <CardHeader>
          <CardTitle>Textes d'Autorisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authTextFr">Arrêté d'autorisation (Français)</Label>
            <Input
              id="authTextFr"
              value={formData.authorizationTextFr || ''}
              onChange={(e) => handleFieldChange('authorizationTextFr', e.target.value)}
              placeholder="Ex: Arrêté N° 160 /MINEFOP/SG/DFOP/SDGSF/SACD du 09 avril 2014"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authTextEn">Arrêté d'autorisation (Anglais)</Label>
            <Input
              id="authTextEn"
              value={formData.authorizationTextEn || ''}
              onChange={(e) => handleFieldChange('authorizationTextEn', e.target.value)}
              placeholder="Ex: Order N° 160 /MINEFOP/SG/DFOP/SDGSF/SACD of 09 april 2014"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Textes légaux */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Textes Légaux (Vu les lois...)</CardTitle>
            <Button onClick={handleAddLegalText} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.legalTexts && formData.legalTexts.length > 0 ? (
            formData.legalTexts.map((legal, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-semibold">Texte légal #{index + 1}</h4>
                  <Button
                    onClick={() => handleRemoveLegalText(index)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Texte (Français)</Label>
                    <Textarea
                      value={legal.textFr}
                      onChange={(e) => handleLegalTextChange(index, 'textFr', e.target.value)}
                      placeholder="Ex: Vu la loi N°92/007 du 14 août 1992 portant code du travail ;"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Texte (Anglais)</Label>
                    <Textarea
                      value={legal.textEn}
                      onChange={(e) => handleLegalTextChange(index, 'textEn', e.target.value)}
                      placeholder="Ex: Mindful of law N°92/007 of 14 august 1992 on the labour code"
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun texte légal ajouté</p>
              <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6: Coordonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalBox">Boîte postale</Label>
              <Input
                id="postalBox"
                value={formData.postalBox || ''}
                onChange={(e) => handleFieldChange('postalBox', e.target.value)}
                placeholder="Ex: BP 9293"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="Ex: +237 674936604"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="Ex: centre@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde en bas */}
      <div className="flex justify-end gap-2">
        <Button onClick={onBack} variant="outline">
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2">
          <Save className="h-4 w-4" />
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
};

export default CentreDetail;
