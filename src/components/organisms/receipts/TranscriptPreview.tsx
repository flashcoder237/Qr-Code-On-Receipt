import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../ui/card";
import { Button } from "../../ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { StudentRecord } from "../types"; // Assurez-vous que ce chemin est correct
import HtmlPreview from "./HtmlPreview"; // Importez le nouveau composant de prévisualisation

interface TranscriptPreviewProps {
  previewStudent: StudentRecord | null;
  previewPdfUrl: string | null;
  previewHtml: string | null;
  isLoading: boolean;
  onBack: () => void;
  onGenerateAll: () => void;
  onRefreshPreview?: () => void;
  onPrint?: () => void;
}

export const TranscriptPreview: React.FC<TranscriptPreviewProps> = ({
  previewStudent,
  previewPdfUrl,
  previewHtml,
  isLoading,
  onBack,
  onGenerateAll,
  onRefreshPreview,
  onPrint,
}) => {
  const [useHtmlPreview, setUseHtmlPreview] = useState(true);

  // Fonction pour basculer entre les modes de prévisualisation
  const togglePreviewMode = () => {
    setUseHtmlPreview(!useHtmlPreview);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Prévisualisation du relevé</CardTitle>
            {previewStudent && (
              <p className="text-sm text-gray-500">
                {previewStudent.NOM} {previewStudent.PRENOM} - {previewStudent.MATRICULE}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={togglePreviewMode}>
              {useHtmlPreview ? "Mode PDF" : "Mode HTML"}
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button variant="default" size="sm" onClick={onGenerateAll}>
              <Download className="h-4 w-4 mr-2" />
              Générer tout
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {useHtmlPreview ? (
              <motion.div
                key="html-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <HtmlPreview 
                  html={previewHtml || undefined}
                  isLoading={isLoading} 
                  onGenerate={onGenerateAll}
                  onPrint={onPrint}
                  onBack={onRefreshPreview}
                />
              </motion.div>
            ) : (
              <motion.div
                key="pdf-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-[70vh] bg-gray-100 rounded-lg flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
                    <p className="text-sm text-gray-600">
                      Chargement de l'aperçu...
                    </p>
                  </div>
                ) : previewPdfUrl ? (
                  <object
                    data={previewPdfUrl}
                    type="application/pdf"
                    className="w-full h-full rounded-lg"
                  >
                    <embed
                      src={previewPdfUrl}
                      type="application/pdf"
                      className="w-full h-full rounded-lg"
                    />
                  </object>
                ) : (
                  <p className="text-gray-500">
                    Aucun aperçu PDF disponible
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            {useHtmlPreview 
              ? "Le mode HTML offre une meilleure prévisualisation et optimise les performances."
              : "Le mode PDF montre exactement ce qui sera généré, mais peut être plus lent à charger."}
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};