// src/components/organisms/qr-document-processor/components/QRSettings.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Info, Shield } from "lucide-react";

interface QRSettings {
  size: "small" | "medium" | "large" | "custom";
  customSize?: number; // Size in pixels when size is "custom"
  position: { x: number; y: number };
  errorCorrection: "L" | "M" | "Q" | "H";
}

interface QRSettingsProps {
  settings: QRSettings;
  onChange: (settings: Partial<QRSettings>) => void;
}

const ERROR_CORRECTION_LEVELS = {
  L: { label: "Faible (~7%)", description: "Correction d'erreur basique, QR code plus compact" },
  M: { label: "Moyen (~15%)", description: "Équilibre entre taille et robustesse (recommandé)" },
  Q: { label: "Quartile (~25%)", description: "Bonne correction d'erreur, QR code plus grand" },
  H: { label: "Élevé (~30%)", description: "Correction d'erreur maximale, QR code le plus grand" }
};

const SIZE_INFO = {
  small: { pixels: "60x60px", description: "Compact, pour des documents avec peu d'espace" },
  medium: { pixels: "80x80px", description: "Taille standard, bon équilibre lisibilité/espace" },
  large: { pixels: "100x100px", description: "Grande taille, meilleure lisibilité" },
  custom: { pixels: "Personnalisée", description: "Taille définie par l'utilisateur" }
};

// Function to get actual QR code size in pixels
const getActualQRSize = (settings: QRSettings): number => {
  if (settings.size === "custom") {
    return settings.customSize || 80;
  }
  const sizes = { small: 60, medium: 80, large: 100 };
  return sizes[settings.size];
};

export const QRSettings: React.FC<QRSettingsProps> = ({
  settings,
  onChange
}) => {
  const handleCustomSizeChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 500) {
      onChange({ customSize: numValue });
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Paramètres Avancés du QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Correction Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Niveau de Correction d'Erreur</Label>
            <Shield className="h-4 w-4 text-gray-500" />
          </div>
          
          <Select 
            value={settings.errorCorrection} 
            onValueChange={(value: "L" | "M" | "Q" | "H") => onChange({ errorCorrection: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ERROR_CORRECTION_LEVELS).map(([level, info]) => (
                <SelectItem key={level} value={level}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{level} - {info.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Niveau {settings.errorCorrection}:</strong> {ERROR_CORRECTION_LEVELS[settings.errorCorrection].description}
            </p>
          </div>
        </div>

        {/* QR Code Size Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Configuration de la Taille</Label>
            <Info className="h-4 w-4 text-gray-500" />
          </div>
          
          <Select 
            value={settings.size} 
            onValueChange={(value: "small" | "medium" | "large" | "custom") => {
              onChange({ size: value });
              if (value !== "custom") {
                onChange({ customSize: undefined });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Petit - 60x60px</SelectItem>
              <SelectItem value="medium">Moyen - 80x80px (recommandé)</SelectItem>
              <SelectItem value="large">Grand - 100x100px</SelectItem>
              <SelectItem value="custom">Taille personnalisée</SelectItem>
            </SelectContent>
          </Select>
          
          {settings.size === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customSize">Taille personnalisée (pixels)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="customSize"
                  type="number"
                  min="20"
                  max="500"
                  value={settings.customSize || 80}
                  onChange={(e) => handleCustomSizeChange(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">
                  pixels (20-500)
                </span>
              </div>
              <div className="p-2 bg-blue-50 rounded text-sm text-blue-700">
                Taille actuelle: {getActualQRSize(settings)}x{getActualQRSize(settings)}px
              </div>
            </div>
          )}
        </div>

        {/* Current Configuration Summary */}
        <div className="space-y-3">
          <Label>Configuration Actuelle</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              Taille: {settings.size} ({settings.size === "custom" ? `${getActualQRSize(settings)}x${getActualQRSize(settings)}px` : SIZE_INFO[settings.size].pixels})
            </Badge>
            <Badge variant="outline">
              Position: {Math.round(settings.position.x)}%, {Math.round(settings.position.y)}%
            </Badge>
            <Badge variant="outline">
              Correction: {settings.errorCorrection} {ERROR_CORRECTION_LEVELS[settings.errorCorrection].label}
            </Badge>
          </div>
        </div>

        {/* Size Information */}
        <div className="space-y-3">
          <Label>Informations sur les Tailles</Label>
          <div className="grid gap-2">
            {Object.entries(SIZE_INFO).map(([size, info]) => (
              <div 
                key={size}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  settings.size === size 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{size}</span>
                  <span className="text-sm text-gray-600">{info.pixels}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{info.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Recommandations :</strong></p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Taille Medium + Correction M</strong> : Configuration optimale pour la plupart des cas</li>
                <li>• <strong>Correction H</strong> : Si le document peut être endommagé ou imprimé en basse qualité</li>
                <li>• <strong>Taille Large</strong> : Pour des documents consultés à distance ou par des personnes âgées</li>
                <li>• <strong>Correction L</strong> : Seulement si l'espace est très limité</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Technical Information */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Note technique :</strong> Un niveau de correction d'erreur plus élevé permet au QR code de rester lisible même si une partie est endommagée, mais augmente la taille et la complexité du code.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};