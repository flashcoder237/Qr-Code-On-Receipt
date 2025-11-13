// src/components/organisms/settings/UserProfile.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Building, MapPin, Save, Upload, X } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

export interface UserProfileData {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  institution: string;
  department: string;
  address: string;
  city: string;
  country: string;
  avatar?: string;
  signature?: string;
  bio?: string;
}

const defaultProfile: UserProfileData = {
  fullName: "",
  email: "",
  phone: "",
  position: "",
  institution: "",
  department: "",
  address: "",
  city: "",
  country: "République Démocratique du Congo",
  avatar: "",
  signature: "",
  bio: "",
};

export const UserProfile: React.FC = () => {
  const [profile, setProfile] = useLocalStorage<UserProfileData>("user-profile", defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState<UserProfileData>(profile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar || null);

  const handleSave = () => {
    setProfile(localProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalProfile(profile);
    setAvatarPreview(profile.avatar || null);
    setIsEditing(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setLocalProfile({ ...localProfile, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setLocalProfile({ ...localProfile, avatar: "" });
  };

  const getInitials = () => {
    if (!localProfile.fullName) return "U";
    const names = localProfile.fullName.split(" ");
    return names.map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil utilisateur
          </CardTitle>
          <CardDescription>
            Gérez vos informations personnelles et professionnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Changer la photo
                  </Button>
                  {avatarPreview && (
                    <Button variant="outline" size="sm" onClick={removeAvatar}>
                      <X className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  )}
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <p className="text-xs text-gray-500">JPG, PNG ou GIF. Max 2MB.</p>
              </div>
            )}
            {!isEditing && (
              <div>
                <h3 className="text-xl font-semibold">{profile.fullName || "Nom complet"}</h3>
                <p className="text-gray-600">{profile.position || "Poste non renseigné"}</p>
                <Badge variant="secondary" className="mt-2">{profile.institution || "Institution"}</Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  value={localProfile.fullName}
                  onChange={(e) => setLocalProfile({ ...localProfile, fullName: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={localProfile.email}
                    onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
                    disabled={!isEditing}
                    placeholder="email@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={localProfile.phone}
                    onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="+243 XXX XXX XXX"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Poste / Fonction</Label>
                <Input
                  id="position"
                  value={localProfile.position}
                  onChange={(e) => setLocalProfile({ ...localProfile, position: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: Secrétaire Académique"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building className="h-4 w-4" />
              Informations professionnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  value={localProfile.institution}
                  onChange={(e) => setLocalProfile({ ...localProfile, institution: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: Université de Kinshasa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Département / Faculté</Label>
                <Input
                  id="department"
                  value={localProfile.department}
                  onChange={(e) => setLocalProfile({ ...localProfile, department: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: Faculté des Sciences"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adresse complète</Label>
                <Input
                  id="address"
                  value={localProfile.address}
                  onChange={(e) => setLocalProfile({ ...localProfile, address: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Numéro, rue, quartier..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={localProfile.city}
                  onChange={(e) => setLocalProfile({ ...localProfile, city: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: Kinshasa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={localProfile.country}
                  onChange={(e) => setLocalProfile({ ...localProfile, country: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: RD Congo"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biographie / Notes</Label>
            <Textarea
              id="bio"
              value={localProfile.bio}
              onChange={(e) => setLocalProfile({ ...localProfile, bio: e.target.value })}
              disabled={!isEditing}
              placeholder="Informations supplémentaires..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Modifier le profil
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
