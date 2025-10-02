// src/components/organisms/qr-document-processor/components/QRPositioning.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  MousePointer, 
  Move, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Target,
  Info,
  Eye,
  Grid3X3,
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";
import { generateDocumentPreview, DocumentPreview } from "@/lib/qr-document-processor/document-preview";

interface QRSettings {
  size: "small" | "medium" | "large" | "custom";
  customSize?: number; // Size in pixels when size is "custom"
  position: { x: number; y: number };
  errorCorrection: "L" | "M" | "Q" | "H";
}

interface QRPositioningProps {
  document: File | null;
  documentPreview: string | null;
  settings: QRSettings;
  onSettingsChange: (settings: Partial<QRSettings>) => void;
}

const QR_SIZES = {
  small: 60,
  medium: 80,
  large: 100
};

// Function to get actual QR code size in pixels
const getActualQRSize = (settings: QRSettings): number => {
  if (settings.size === "custom") {
    return settings.customSize || 80;
  }
  return QR_SIZES[settings.size];
};

export const QRPositioning: React.FC<QRPositioningProps> = ({
  document,
  documentPreview,
  settings,
  onSettingsChange
}) => {
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [docPreview, setDocPreview] = useState<DocumentPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert percentage to pixels
  const getPixelPosition = useCallback(() => {
    return {
      x: (settings.position.x / 100) * canvasSize.width,
      y: (settings.position.y / 100) * canvasSize.height
    };
  }, [settings.position, canvasSize]);

  // Convert pixels to percentage
  const getPercentagePosition = useCallback((pixelX: number, pixelY: number) => {
    return {
      x: Math.max(0, Math.min(100, (pixelX / canvasSize.width) * 100)),
      y: Math.max(0, Math.min(100, (pixelY / canvasSize.height) * 100))
    };
  }, [canvasSize]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;
    
    const newPosition = getPercentagePosition(pixelX, pixelY);
    onSettingsChange({ position: newPosition });
  }, [isDragging, getPercentagePosition, onSettingsChange]);

  // Handle QR drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pixelPos = getPixelPosition();
    setDragOffset({
      x: e.clientX - rect.left - pixelPos.x,
      y: e.clientY - rect.top - pixelPos.y
    });
  }, [getPixelPosition]);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left - dragOffset.x;
    const pixelY = e.clientY - rect.top - dragOffset.y;
    
    const newPosition = getPercentagePosition(pixelX, pixelY);
    onSettingsChange({ position: newPosition });
  }, [isDragging, dragOffset, getPercentagePosition, onSettingsChange]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Generate document preview when document changes
  useEffect(() => {
    if (document && !docPreview) {
      setIsLoadingPreview(true);
      setPreviewError(null);
      
      generateDocumentPreview(document)
        .then((preview) => {
          setDocPreview(preview);
          setPreviewError(null); // Clear any previous error
        })
        .catch((error) => {
          console.error('Error generating document preview:', error);
          let errorMessage = 'Erreur lors de la génération de l\'aperçu';
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          setPreviewError(errorMessage);
          setDocPreview(null); // Clear preview on error
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [document, docPreview]);

  // Update canvas size when preview is loaded
  useEffect(() => {
    if (canvasRef.current && docPreview) {
      const container = canvasRef.current.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const maxWidth = Math.min(containerRect.width - 40, 1200); // Increased max width
        const maxHeight = 800; // Increased max height for larger preview

        let canvasWidth = docPreview.width;
        let canvasHeight = docPreview.height;

        // Scale to fit container while maintaining aspect ratio
        const scaleX = maxWidth / canvasWidth;
        const scaleY = maxHeight / canvasHeight;
        const scale = Math.min(scaleX, scaleY, 1.2); // Allow slight scale up for better visibility

        canvasWidth *= scale;
        canvasHeight *= scale;

        setCanvasSize({ width: canvasWidth, height: canvasHeight });
      }
    }
  }, [docPreview]);

  // Reset preview when document changes
  useEffect(() => {
    setDocPreview(null);
  }, [document]);

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.document.addEventListener('mousemove', handleDragMove);
      window.document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        window.document.removeEventListener('mousemove', handleDragMove);
        window.document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Preset positions
  const presetPositions = [
    { label: "Haut gauche", position: { x: 10, y: 10 } },
    { label: "Haut droite", position: { x: 85, y: 10 } },
    { label: "Centre", position: { x: 45, y: 45 } },
    { label: "Bas gauche", position: { x: 10, y: 80 } },
    { label: "Bas droite", position: { x: 85, y: 80 } },
  ];

  const pixelPosition = getPixelPosition();
  const qrSize = getActualQRSize(settings);

  return (
    <div className="space-y-6">
      {!document ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Chargez d'abord un document pour configurer le positionnement du QR code.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Preview Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Positionnement Visuel
                  {isLoadingPreview && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                    disabled={isLoadingPreview || !document}
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    {showGrid ? 'Masquer' : 'Afficher'} Grille
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {isLoadingPreview 
                    ? "Génération de l'aperçu en cours..."
                    : "Cliquez ou glissez le QR code pour le positionner sur le document"
                  }
                </p>
                
                {previewError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div>
                        <strong>Erreur de prévisualisation:</strong> {previewError}
                        <br />
                        <span className="text-xs">Le positionnement du QR code restera disponible avec une vue simplifiée.</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-center w-full">
                  <div
                    ref={canvasRef}
                    className={`relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair shadow-lg ${showGrid ? 'bg-grid' : ''} ${isLoadingPreview ? 'animate-pulse' : ''}`}
                    onClick={handleCanvasClick}
                    style={{
                      width: canvasSize.width || 600,
                      height: canvasSize.height || 800,
                      maxWidth: '100%',
                      backgroundImage: docPreview ? `url(${docPreview.dataUrl})` : undefined,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundColor: docPreview ? 'white' : '#f8f9fa',
                      minHeight: '500px'
                    }}
                  >
                  {/* Fallback placeholder when preview fails */}
                  {!docPreview && !isLoadingPreview && previewError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                      <FileText className="h-16 w-16 mb-4" />
                      <div className="text-center">
                        <p className="font-medium">Aperçu du document non disponible</p>
                        <p className="text-sm mt-1">Positionnement QR disponible</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Document type indicator when no preview */}
                  {!docPreview && !isLoadingPreview && document && (
                    <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {document.type === 'application/pdf' ? 'PDF' : 'IMAGE'} - {document.name}
                    </div>
                  )}
                  {/* Grid overlay */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Vertical lines */}
                      {Array.from({ length: 11 }, (_, i) => (
                        <div
                          key={`v-${i}`}
                          className="absolute top-0 bottom-0 w-px bg-gray-300 opacity-30"
                          style={{ left: `${i * 10}%` }}
                        />
                      ))}
                      {/* Horizontal lines */}
                      {Array.from({ length: 11 }, (_, i) => (
                        <div
                          key={`h-${i}`}
                          className="absolute left-0 right-0 h-px bg-gray-300 opacity-30"
                          style={{ top: `${i * 10}%` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* QR Code Placeholder - Show always when document is loaded (with or without preview) */}
                  {!isLoadingPreview && document && (
                    <div
                      className={`absolute border-2 border-blue-500 bg-blue-100 bg-opacity-90 rounded-md flex items-center justify-center cursor-move select-none transition-all duration-200 ${isDragging ? 'shadow-xl scale-110 border-blue-600 z-50' : 'hover:shadow-lg hover:scale-105 hover:bg-blue-200'} ${!docPreview && previewError ? 'border-orange-500 bg-orange-100' : ''}`}
                      style={{
                        left: `${pixelPosition.x}px`,
                        top: `${pixelPosition.y}px`,
                        width: `${qrSize}px`,
                        height: `${qrSize}px`,
                        transform: `translate(-50%, -50%)`,
                        boxShadow: isDragging ? '0 10px 25px rgba(59, 130, 246, 0.5)' : '0 2px 10px rgba(59, 130, 246, 0.3)'
                      }}
                      onMouseDown={handleDragStart}
                    >
                      <div className={`text-xs font-mono text-center font-semibold ${!docPreview && previewError ? 'text-orange-700' : 'text-blue-700'}`}>
                        QR<br/>{settings.size.toUpperCase()}
                      </div>
                      
                      {/* Corner indicators for better visual feedback */}
                      <div className={`absolute -top-1 -left-1 w-2 h-2 rounded-full ${!docPreview && previewError ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${!docPreview && previewError ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                      <div className={`absolute -bottom-1 -left-1 w-2 h-2 rounded-full ${!docPreview && previewError ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                      <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${!docPreview && previewError ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                    </div>
                  )}

                  {/* Position indicator */}
                  {document && !isLoadingPreview && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-md">
                      X: {Math.round(settings.position.x)}% Y: {Math.round(settings.position.y)}%
                      {!docPreview && previewError && (
                        <span className="ml-2 text-orange-300">⚠</span>
                      )}
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {isLoadingPreview && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white bg-opacity-90 rounded-lg p-4 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Génération de l'aperçu...
                        </span>
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                {/* Position coordinates */}
                {document && !isLoadingPreview && (
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <Badge variant="secondary">
                      Taille: {settings.size} ({qrSize}px)
                    </Badge>
                    <Badge variant="secondary">
                      Position: {Math.round(settings.position.x)}%, {Math.round(settings.position.y)}%
                    </Badge>
                    {docPreview && (
                      <Badge variant="outline">
                        Document: {Math.round(docPreview.width)}×{Math.round(docPreview.height)}px
                      </Badge>
                    )}
                    {!docPreview && previewError && (
                      <Badge variant="outline" className="text-orange-600">
                        Aperçu non disponible
                      </Badge>
                    )}
                    {isDragging && (
                      <Badge variant="default">
                        <Move className="h-3 w-3 mr-1" />
                        Déplacement en cours
                      </Badge>
                    )}
                  </div>
                )}
                
                {isLoadingPreview && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement de l'aperçu du document...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Controls */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Size Control */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taille du QR Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(QR_SIZES).map((size) => (
                    <Button
                      key={size}
                      variant={settings.size === size ? "default" : "outline"}
                      size="sm"
                      disabled={isLoadingPreview || !document}
                      onClick={() => onSettingsChange({ size: size as any, customSize: undefined })}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                      <span className="ml-1 text-xs">({QR_SIZES[size as keyof typeof QR_SIZES]}px)</span>
                    </Button>
                  ))}
                  <Button
                    variant={settings.size === "custom" ? "default" : "outline"}
                    size="sm"
                    disabled={isLoadingPreview || !document}
                    onClick={() => onSettingsChange({ size: "custom", customSize: settings.customSize || 80 })}
                    className="col-span-2"
                  >
                    Personnalisée
                    <span className="ml-1 text-xs">
                      ({settings.size === "custom" ? `${settings.customSize || 80}px` : "..."})
                    </span>
                  </Button>
                </div>
                
                {settings.size === "custom" && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <Label htmlFor="customSizeInput" className="text-sm font-medium">
                      Taille en pixels (20-500)
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        id="customSizeInput"
                        type="number"
                        min="20"
                        max="500"
                        value={settings.customSize || 80}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 20 && value <= 500) {
                            onSettingsChange({ customSize: value });
                          }
                        }}
                        className="flex h-8 w-20 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoadingPreview || !document}
                      />
                      <span className="text-sm text-blue-700">
                        pixels (actuel: {getActualQRSize(settings)}px)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Position Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Positions Prédéfinies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {presetPositions.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      disabled={isLoadingPreview || !document}
                      onClick={() => onSettingsChange({ position: preset.position })}
                      className="text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fine-tuning Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ajustement Précis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Position Horizontale (X): {Math.round(settings.position.x)}%</Label>
                <Slider
                  value={[settings.position.x]}
                  onValueChange={([value]) => onSettingsChange({ 
                    position: { ...settings.position, x: value }
                  })}
                  min={0}
                  max={100}
                  step={1}
                  disabled={isLoadingPreview || !document}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Position Verticale (Y): {Math.round(settings.position.y)}%</Label>
                <Slider
                  value={[settings.position.y]}
                  onValueChange={([value]) => onSettingsChange({ 
                    position: { ...settings.position, y: value }
                  })}
                  min={0}
                  max={100}
                  step={1}
                  disabled={isLoadingPreview || !document}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  disabled={isLoadingPreview || !document}
                  onClick={() => onSettingsChange({ position: { x: 50, y: 50 } })}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Centrer
                </Button>
                
                <div className="text-sm text-gray-500">
                  Position: ({Math.round(settings.position.x)}%, {Math.round(settings.position.y)}%)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Alert>
            <MousePointer className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructions:</strong> {isLoadingPreview 
                ? "Génération de l'aperçu en cours, veuillez patienter..." 
                : docPreview 
                  ? "Cliquez sur l'aperçu pour positionner le QR code, ou glissez-le directement. Utilisez les contrôles pour un ajustement précis."
                  : "Chargez d'abord un document pour voir son aperçu et positionner le QR code."
              }
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
};