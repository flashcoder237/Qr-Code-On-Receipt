// src/components/organisms/attestation-generator/AttestationPreviewButton.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { StudentExcelRecord } from "@/lib/helpers/qrcode";
import { openAttestationPreview } from "@/lib/attestation-generator/preview";

interface AttestationPreviewButtonProps {
  student: StudentExcelRecord;
  schoolSettings: any;
  qrCodePosition: { x: number; y: number };
  onError?: (message: string) => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const AttestationPreviewButton: React.FC<AttestationPreviewButtonProps> = ({
  student,
  schoolSettings,
  qrCodePosition,
  onError,
  variant = "outline",
  size = "sm"
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    try {
      setIsLoading(true);
      
      const success = await openAttestationPreview(
        student,
        schoolSettings,
        { qrCodePosition }
      );
      
      if (!success && onError) {
        onError("Impossible d'ouvrir la prévisualisation. Vérifiez que les popups ne sont pas bloqués.");
      }
    } catch (error) {
      console.error("Erreur lors de la prévisualisation:", error);
      if (onError) {
        onError("Une erreur est survenue lors de la prévisualisation.");
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
      disabled={isLoading}
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