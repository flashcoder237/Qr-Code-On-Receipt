// src/components/organisms/attestation-generator/AttestationPreviewButton.tsx - Version robuste
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { StudentExcelRecord } from "@/lib/helpers/qrcode";
import QRCode from "qrcode";
import { generateAttestationHTML } from "@/lib/attestation-generator/html-generator";

interface AttestationPreviewButtonProps {
  student: StudentExcelRecord;
  schoolSettings: any;
  qrCodePosition: { x: number; y: number };
  onError?: (message: string) => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export const AttestationPreviewButton: React.FC<AttestationPreviewButtonProps> = ({
  student,
  schoolSettings,
  qrCodePosition,
  onError,
  variant = "outline",
  size = "sm",
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    try {
      setIsLoading(true);
      
      // Générer un QR code pour l'attestation
      let qrCodeBase64 = '';
      try {
        // Créer les données QR pour l'attestation
        const qrData = `Établissement: ${schoolSettings.nameFrench}
Nom: ${student.NOM}
Prénom: ${student.PRENOM}
Matricule: ${student.MATRICULE}
Date de naissance: ${student["DATE DE NAISSANCE"]}
Lieu de naissance: ${student["LIEU DE NAISSANCE"]}
Parcours: ${student.PARCOURS || ""}
Spécialité: ${student.SPECIALITE || ""}
Option: ${student.OPTION || ""}
Moyenne: ${student.MOYENNE}
Grade: ${student.GRADE}
Mention: ${student.MENTION}
Année académique: ${student["ANNEE ACADEMIQUE"]}`;

        qrCodeBase64 = await QRCode.toDataURL(qrData);
      } catch (qrError) {
        console.error("Erreur lors de la génération du QR code:", qrError);
        // Continuer sans QR code
      }
      
      let htmlContent = null;
      
      // Approche hybride : essayer d'abord avec le renderer IPC, puis en fallback direct
      if (window.attestationRenderer) {
        try {
          // Essayer avec l'API IPC
          htmlContent = await window.attestationRenderer.renderHTML({
            student,
            settings: schoolSettings,
            options: {
              qrCodePosition,
              qrCodeImage: qrCodeBase64
            }
          });
        } catch (ipcError) {
          console.warn("Échec du rendu via IPC, utilisation du fallback direct:", ipcError);
          // Continuer avec le fallback
        }
      }
      
      // Si htmlContent n'est pas défini, utiliser directement la fonction de génération HTML
      if (!htmlContent) {
        htmlContent = await generateAttestationHTML(student, schoolSettings, {
          qrCodeImage: qrCodeBase64,
          qrCodePosition
        });
      }
      
      if (!htmlContent) {
        throw new Error("Aucun contenu HTML généré");
      }
      
      // Ouvrir la prévisualisation
      let success = false;
      
      // Essayer d'abord l'API IPC
      if (window.ipcRenderer) {
        try {
          success = await window.ipcRenderer.invoke(
            'show-preview', 
            htmlContent, 
            'Prévisualisation de l\'attestation'
          );
        } catch (showPreviewError) {
          console.warn("Échec de l'ouverture via IPC, utilisation du fallback:", showPreviewError);
          // Continuer avec le fallback
        }
      }
      
      // Si l'API IPC n'est pas disponible ou a échoué, essayer d'ouvrir une nouvelle fenêtre
      if (!success) {
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(htmlContent);
          previewWindow.document.title = 'Prévisualisation de l\'attestation';
          previewWindow.document.close();
          success = true;
        } else {
          throw new Error("Impossible d'ouvrir la fenêtre de prévisualisation. Vérifiez que les popups ne sont pas bloqués.");
        }
      }
      
      if (!success && onError) {
        onError("Impossible d'ouvrir la prévisualisation. Vérifiez que les popups ne sont pas bloqués.");
      }
    } catch (error) {
      console.error("Erreur lors de la prévisualisation:", error);
      if (onError) {
        onError(`Une erreur est survenue lors de la prévisualisation: ${error.message || "Erreur inconnue"}`);
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