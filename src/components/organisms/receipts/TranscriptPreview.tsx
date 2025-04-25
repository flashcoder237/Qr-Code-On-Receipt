import React from "react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "components/ui/card";
import { Loader2, Download } from "lucide-react";

interface StudentRecord {
  NOM: string;
  PRENOM: string;
}

interface TranscriptPreviewProps {
  previewStudent: StudentRecord | null;
  previewPdfUrl: string | null;
  isLoading: boolean;
  onBack: () => void;
  onGenerateAll: () => void;
}

export const TranscriptPreview: React.FC<TranscriptPreviewProps> = ({
  previewStudent,
  previewPdfUrl,
  isLoading,
  onBack,
  onGenerateAll,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Prévisualisation du relevé
          {previewStudent && ` - ${previewStudent.NOM} ${previewStudent.PRENOM}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {previewPdfUrl ? (
          <div className="w-full h-screen max-h-[70vh]">
            <iframe
              src={previewPdfUrl}
              className="w-full h-full border rounded"
              title="Prévisualisation du relevé"
            />
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            Aucune prévisualisation disponible
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={onBack} variant="outline">Retour</Button>
        <Button onClick={onGenerateAll} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Générer tous les relevés
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
