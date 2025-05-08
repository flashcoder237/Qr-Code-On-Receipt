import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Slider } from "../../ui/slider";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { StudentRecord } from "./types";

interface TranscriptPreviewProps {
  previewStudent: StudentRecord | null;
  previewPdfUrl: string | null;
  isLoading: boolean;
  onBack: () => void;
  onGenerateAll: () => void;
  onPrint?: () => void;
}

export const TranscriptPreview: React.FC<TranscriptPreviewProps> = ({
  previewStudent,
  previewPdfUrl,
  isLoading,
  onBack,
  onGenerateAll,
  onPrint,
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (previewPdfUrl) {
      const printWindow = window.open(previewPdfUrl);
      printWindow?.print();
    }
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
          <div className="flex space-x-4">
            {/* PDF Controls */}
            <div className="w-64 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Zoom</p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 25}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={25}
                    max={200}
                    step={25}
                    className="w-full"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-center">{zoom}%</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Rotation</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="w-full"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotation {rotation}°
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Pages</p>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 relative min-h-[800px] bg-gray-100 rounded-lg overflow-hidden">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
                      <p className="text-sm text-gray-600">
                        Chargement de l'aperçu...
                      </p>
                    </div>
                  </motion.div>
                ) : previewPdfUrl ? (
                  <motion.iframe
                    key="pdf"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={previewPdfUrl}
                    className="w-full h-full"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: "center center",
                    }}
                  />
                ) : (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <p className="text-gray-500">
                      Aucun aperçu disponible
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Utilisez les contrôles à gauche pour ajuster l'aperçu
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
