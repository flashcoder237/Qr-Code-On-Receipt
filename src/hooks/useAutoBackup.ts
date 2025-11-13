// src/hooks/useAutoBackup.ts
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

interface BackupSettings {
  autoBackupEnabled: boolean;
  backupInterval: number; // en heures
  lastBackupDate?: string;
}

const defaultBackupSettings: BackupSettings = {
  autoBackupEnabled: false,
  backupInterval: 24,
};

export const useAutoBackup = () => {
  const [backupSettings, setBackupSettings] = useLocalStorage<BackupSettings>(
    "backup-settings",
    defaultBackupSettings
  );

  const performBackup = () => {
    try {
      // Récupérer toutes les données du localStorage
      const data: Record<string, any> = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              data[key] = JSON.parse(value);
            }
          } catch (e) {
            data[key] = localStorage.getItem(key);
          }
        }
      }

      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        appName: "FMSP Diplomation",
        autoBackup: true,
        data: data,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `auto_backup_fmsp_${new Date().toISOString().split("T")[0]}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Mettre à jour la date de dernière sauvegarde
      setBackupSettings({
        ...backupSettings,
        lastBackupDate: new Date().toISOString(),
      });

      console.log("✅ Sauvegarde automatique effectuée avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde automatique:", error);
    }
  };

  useEffect(() => {
    if (!backupSettings.autoBackupEnabled) return;

    // Vérifier si une sauvegarde est nécessaire
    const checkAndBackup = () => {
      const now = new Date().getTime();
      const lastBackup = backupSettings.lastBackupDate
        ? new Date(backupSettings.lastBackupDate).getTime()
        : 0;

      const intervalMs = backupSettings.backupInterval * 60 * 60 * 1000;
      const timeSinceLastBackup = now - lastBackup;

      if (timeSinceLastBackup >= intervalMs) {
        console.log("⏰ Déclenchement de la sauvegarde automatique...");
        performBackup();
      }
    };

    // Vérifier immédiatement
    checkAndBackup();

    // Puis vérifier toutes les heures
    const interval = setInterval(checkAndBackup, 60 * 60 * 1000); // Vérifier toutes les heures

    return () => clearInterval(interval);
  }, [backupSettings]);

  return { backupSettings, performBackup };
};
