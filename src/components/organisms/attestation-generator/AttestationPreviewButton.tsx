// src/components/organisms/attestation-generator/AttestationPreviewButton.tsx - Version corrigée

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { StudentExcelRecord } from "@/lib/helpers/qrcode";
import { generateAttestationHTML } from "@/lib/attestation-generator/html-generator";

interface AttestationPreviewButtonProps {
  student: StudentExcelRecord;
  schoolSettings: any;
  qrCodePosition: { x: number; y: number };
  encryptionEnabled?: boolean; // Nouveau prop pour contrôler le chiffrement
  onError?: (message: string) => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export const AttestationPreviewButton: React.FC<AttestationPreviewButtonProps> = ({
  student,
  schoolSettings,
  qrCodePosition,
  encryptionEnabled = true, // Par défaut, le chiffrement est activé
  onError,
  variant = "outline",
  size = "sm",
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Début de la prévisualisation avec chiffrement:', encryptionEnabled);
      
      // Vérification de sécurité pour la position du QR code
      const safeQrPosition = qrCodePosition && 
        typeof qrCodePosition.x === 'number' && 
        typeof qrCodePosition.y === 'number' 
        ? qrCodePosition 
        : { x: 470, y: 220 };
      
      // S'assurer que l'étudiant a un établissement défini
      const studentWithEstablishment = {
        ...student,
        ETABLISSEMENT: student.ETABLISSEMENT || schoolSettings.nameFrench || "ETABLISSEMENT NON DEFINI"
      };
      
      console.log('📊 Données étudiant pour prévisualisation:', {
        nom: studentWithEstablishment.NOM,
        prenom: studentWithEstablishment.PRENOM,
        matricule: studentWithEstablishment.MATRICULE,
        etablissement: studentWithEstablishment.ETABLISSEMENT,
        encryptionEnabled
      });
      
      let htmlContent = null;
      
      // Approche hybride : essayer d'abord avec le renderer IPC, puis en fallback direct
      if (window.attestationRenderer) {
        try {
          console.log('🔄 Utilisation du renderer IPC...');
          htmlContent = await window.attestationRenderer.renderHTML({
            student: studentWithEstablishment,
            settings: schoolSettings,
            options: {
              qrCodePosition: safeQrPosition,
              encryptionEnabled: encryptionEnabled
            }
          });
          console.log('✅ HTML généré via IPC');
        } catch (ipcError) {
          console.warn("⚠️ Échec du rendu via IPC, utilisation du fallback direct:", ipcError);
          // Continuer avec le fallback
        }
      }
      
      // Si htmlContent n'est pas défini, utiliser directement la fonction de génération HTML
      if (!htmlContent) {
        console.log('🔄 Utilisation du générateur HTML direct...');
        htmlContent = await generateAttestationHTML(studentWithEstablishment, schoolSettings, {
          qrCodePosition: safeQrPosition,
          encryptionEnabled: encryptionEnabled
        });
        console.log('✅ HTML généré directement');
      }
      
      if (!htmlContent) {
        throw new Error("Aucun contenu HTML généré");
      }
      
      // Ouvrir la prévisualisation
      let success = false;
      
      // Essayer d'abord l'API IPC
      if (window.ipcRenderer) {
        try {
          console.log('🔄 Ouverture de la fenêtre de prévisualisation via IPC...');
          success = await window.ipcRenderer.invoke(
            'show-preview', 
            htmlContent, 
            'Prévisualisation de l\'attestation'
          );
          console.log('✅ Fenêtre de prévisualisation ouverte via IPC');
        } catch (showPreviewError) {
          console.warn("⚠️ Échec de l'ouverture via IPC, utilisation du fallback:", showPreviewError);
          // Continuer avec le fallback
        }
      }
      
      // Si l'API IPC n'est pas disponible ou a échoué, essayer d'ouvrir une nouvelle fenêtre
      if (!success) {
        console.log('🔄 Ouverture de la fenêtre de prévisualisation en fallback...');
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(htmlContent);
          previewWindow.document.title = 'Prévisualisation de l\'attestation';
          previewWindow.document.close();
          success = true;
          console.log('✅ Fenêtre de prévisualisation ouverte en fallback');
        } else {
          throw new Error("Impossible d'ouvrir la fenêtre de prévisualisation. Vérifiez que les popups ne sont pas bloqués.");
        }
      }
      
      if (!success && onError) {
        onError("Impossible d'ouvrir la prévisualisation. Vérifiez que les popups ne sont pas bloqués.");
      }
      
      console.log('✅ Prévisualisation terminée avec succès');
      
    } catch (error) {
      console.error("❌ Erreur lors de la prévisualisation:", error);
      if (onError) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        onError(`Une erreur est survenue lors de la prévisualisation: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePreview}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Eye className="h-4 w-4 mr-1" />
          Aperçu
        </>
      )}
    </Button>
  );
};