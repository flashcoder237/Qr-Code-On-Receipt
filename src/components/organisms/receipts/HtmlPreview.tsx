import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/LoadingSpinner';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Download, 
  Printer, 
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface HtmlPreviewProps {
  html?: string;
  isLoading?: boolean;
  onBack?: () => void;
  onGenerate?: () => void;
  onPrint?: () => void;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({ 
  html, 
  isLoading = false,
  onBack,
  onGenerate,
  onPrint
}) => {
  const [zoom, setZoom] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Use an internal document write method to safely inject HTML
  useEffect(() => {
    if (html && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        // Clear any existing content
        iframeDoc.open();
        
        // Write the HTML content
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { 
                margin: 0; 
                zoom: ${zoom / 100};
                -moz-transform: scale(${zoom / 100});
                -moz-transform-origin: 0 0;
                overflow-x: auto;
              }
              * { max-width: 100%; }
            </style>
          </head>
          <body>${html}</body>
          </html>
        `);
        
        iframeDoc.close();
      }
    }
  }, [html, zoom]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  const handleDownload = () => {
    if (onGenerate) {
      onGenerate();
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={`flex flex-col ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className={`w-full ${isFullScreen ? 'h-full flex flex-col border-0' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between py-2">
          <CardTitle>Prévisualisation du relevé</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm mx-1">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullScreen} title="Plein écran">
              {isFullScreen ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack} title="Retour">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className={`p-1 bg-gray-100 ${isFullScreen ? 'flex-1 overflow-auto' : 'h-[70vh]'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner.Large label="Génération du relevé en cours..." />
            </div>
          ) : html ? (
            <iframe 
              ref={iframeRef}
              className="w-full h-full bg-white shadow-md"
              title="Aperçu du relevé de notes"
              sandbox="allow-scripts allow-same-origin" // Modified to allow same-origin scripts
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Aucun aperçu disponible
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between py-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setZoom(100)}
            title="Réinitialiser le zoom"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              title="Imprimer"
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimer
            </Button>
            {onGenerate && (
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                title="Télécharger"
              >
                <Download className="h-4 w-4 mr-1" />
                Télécharger
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default HtmlPreview;