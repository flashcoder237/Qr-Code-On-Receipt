// src/components/organisms/settings/DataBackup.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Download,
  Upload,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  Calendar
} from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

interface BackupSettings {
  autoBackupEnabled: boolean;
  backupInterval: number; // en heures
  lastBackupDate?: string;
}

const defaultBackupSettings: BackupSettings = {
  autoBackupEnabled: false,
  backupInterval: 24, // 24 heures par défaut
};

export const DataBackup: React.FC = () => {
  const [backupSettings, setBackupSettings] = useLocalStorage<BackupSettings>(
    "backup-settings",
    defaultBackupSettings
  );
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const getAllAppData = () => {
    const data: Record<string, any> = {};

    // Récupérer toutes les clés du localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            data[key] = JSON.parse(value);
          }
        } catch (e) {
          // Si le parsing JSON échoue, stocker la valeur brute
          data[key] = localStorage.getItem(key);
        }
      }
    }

    return data;
  };

  const getDataSize = () => {
    const data = getAllAppData();
    const dataStr = JSON.stringify(data);
    const bytes = new Blob([dataStr]).size;

    if (bytes < 1024) return `${bytes} octets`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const exportAllData = () => {
    try {
      const allData = getAllAppData();

      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        appName: "FMSP Diplomation",
        data: allData,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_fmsp_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus("success");
      setStatusMessage("Toutes les données ont été exportées avec succès!");

      // Mettre à jour la date de dernière sauvegarde
      setBackupSettings({
        ...backupSettings,
        lastBackupDate: new Date().toISOString(),
      });

      setTimeout(() => {
        setExportStatus("idle");
        setStatusMessage("");
      }, 5000);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      setExportStatus("error");
      setStatusMessage("Erreur lors de l'export des données");
      setTimeout(() => {
        setExportStatus("idle");
        setStatusMessage("");
      }, 5000);
    }
  };

  const importAllData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Vérifier la structure du fichier
      if (!importedData.data || !importedData.version) {
        throw new Error("Format de fichier invalide");
      }

      // Demander confirmation avant d'écraser les données
      const confirmImport = window.confirm(
        "⚠️ ATTENTION: Cette action remplacera toutes les données actuelles de l'application.\n\n" +
        "Êtes-vous sûr de vouloir continuer?\n\n" +
        "Conseil: Exportez d'abord vos données actuelles comme sauvegarde de sécurité."
      );

      if (!confirmImport) {
        setImportStatus("idle");
        event.target.value = "";
        return;
      }

      // Importer toutes les données
      Object.entries(importedData.data).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        } catch (e) {
          console.error(`Erreur lors de l'import de la clé ${key}:`, e);
        }
      });

      setImportStatus("success");
      setStatusMessage(
        `Import réussi! ${Object.keys(importedData.data).length} éléments ont été importés. La page va se recharger...`
      );

      // Recharger la page après 2 secondes pour appliquer les changements
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      event.target.value = "";
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      setImportStatus("error");
      setStatusMessage("Erreur lors de l'import - Fichier invalide ou corrompu");
      setTimeout(() => {
        setImportStatus("idle");
        setStatusMessage("");
      }, 5000);
      event.target.value = "";
    }
  };

  const toggleAutoBackup = (enabled: boolean) => {
    setBackupSettings({
      ...backupSettings,
      autoBackupEnabled: enabled,
    });
  };

  const updateBackupInterval = (hours: number) => {
    setBackupSettings({
      ...backupSettings,
      backupInterval: hours,
    });
  };

  const formatLastBackupDate = () => {
    if (!backupSettings.lastBackupDate) return "Jamais";

    const date = new Date(backupSettings.lastBackupDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Il y a moins d'une heure";
    if (diffHours < 24) return `Il y a ${diffHours} heure(s)`;
    if (diffDays < 7) return `Il y a ${diffDays} jour(s)`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Export/Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sauvegarde et restauration des données
          </CardTitle>
          <CardDescription>
            Exportez toutes vos données pour créer une sauvegarde ou importez des données existantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Messages */}
          {exportStatus === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
            </Alert>
          )}
          {importStatus === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
            </Alert>
          )}
          {(exportStatus === "error" || importStatus === "error") && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{statusMessage}</AlertDescription>
            </Alert>
          )}

          {/* Data Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <HardDrive className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Taille des données</p>
                <p className="text-lg font-bold text-blue-900">{getDataSize()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Dernière sauvegarde</p>
                <p className="text-sm font-semibold text-purple-900">{formatLastBackupDate()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Sauvegarde auto</p>
                <p className="text-sm font-semibold text-green-900">
                  {backupSettings.autoBackupEnabled ? `Tous les ${backupSettings.backupInterval}h` : "Désactivée"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Exporter toutes les données</h3>
            <p className="text-sm text-gray-600">
              Créez une sauvegarde complète de toutes vos données (configurations, paramètres, profil, etc.)
              dans un fichier JSON que vous pourrez conserver en lieu sûr.
            </p>
            <Button onClick={exportAllData} className="w-full md:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Exporter toutes les données
            </Button>
          </div>

          <Separator />

          {/* Import Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Importer des données</h3>
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Attention:</strong> L'importation remplacera toutes vos données actuelles.
                Assurez-vous d'avoir une sauvegarde avant de continuer.
              </AlertDescription>
            </Alert>
            <div>
              <input
                type="file"
                accept=".json"
                id="import-data"
                className="hidden"
                onChange={importAllData}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("import-data")?.click()}
                className="w-full md:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer depuis un fichier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sauvegarde automatique
          </CardTitle>
          <CardDescription>
            Configurez les sauvegardes automatiques périodiques de vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-backup">Activer la sauvegarde automatique</Label>
              <p className="text-sm text-gray-600">
                Les données seront sauvegardées automatiquement à intervalles réguliers
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={backupSettings.autoBackupEnabled}
              onCheckedChange={toggleAutoBackup}
            />
          </div>

          {backupSettings.autoBackupEnabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label htmlFor="backup-interval">Intervalle de sauvegarde (heures)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="backup-interval"
                    type="number"
                    min="1"
                    max="168"
                    value={backupSettings.backupInterval}
                    onChange={(e) => updateBackupInterval(Number(e.target.value))}
                    className="w-32"
                  />
                  <div className="flex gap-2">
                    <Badge
                      variant={backupSettings.backupInterval === 6 ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateBackupInterval(6)}
                    >
                      6h
                    </Badge>
                    <Badge
                      variant={backupSettings.backupInterval === 12 ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateBackupInterval(12)}
                    >
                      12h
                    </Badge>
                    <Badge
                      variant={backupSettings.backupInterval === 24 ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateBackupInterval(24)}
                    >
                      24h
                    </Badge>
                    <Badge
                      variant={backupSettings.backupInterval === 168 ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => updateBackupInterval(168)}
                    >
                      7j
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Prochaine sauvegarde automatique dans environ {backupSettings.backupInterval} heure(s)
                </p>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Les sauvegardes automatiques seront téléchargées automatiquement dans votre dossier de téléchargements.
                  Pensez à les conserver en lieu sûr.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
