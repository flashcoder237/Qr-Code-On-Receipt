// src/components/organisms/qr-document-processor/components/EnhancedPreviewCanvas.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCw, Grid3X3 } from "lucide-react";

interface EnhancedPreviewCanvasProps {
  children: React.ReactNode;
  showGrid: boolean;
  onToggleGrid: () => void;
  documentName?: string;
}

export const EnhancedPreviewCanvas: React.FC<EnhancedPreviewCanvasProps> = ({
  children,
  showGrid,
  onToggleGrid,
  documentName
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}>
      {/* Controls Bar */}
      <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Zoom: {zoom}%
          </Badge>
          {documentName && (
            <Badge variant="secondary" className="max-w-xs truncate">
              {documentName}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
          >
            100%
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleGrid}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            {showGrid ? 'Masquer' : 'Grille'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-1" />
                Quitter
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-1" />
                Plein écran
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div
        className={`overflow-auto ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'max-h-[800px]'} bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-4`}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          {children}
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-md">
          <p className="font-medium mb-1">Raccourcis clavier :</p>
          <p>• ESC : Quitter le plein écran</p>
          <p>• +/- : Zoom in/out</p>
          <p>• G : Afficher/Masquer grille</p>
        </div>
      )}
    </div>
  );
};
