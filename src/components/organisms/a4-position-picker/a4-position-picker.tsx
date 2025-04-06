import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import * as pdfjsLib from "pdfjs-dist"; // Bibliothèque pour manipuler les PDF
import "pdfjs-dist/build/pdf.worker.mjs"; // Nécessaire pour charger le worker PDF.js
interface IProps {
  value: {
    x: number;
    y: number;
  };
  onChange: (p: { x: number; y: number }) => void;
}

export const A4PositionPicker = ({
  value: position,
  orientation: orientation,
  onChange: setPosition
}: IProps) => {
  const [pdfImage, setPdfImage] = useState<string | null>(null); // Image convertie du PDF
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour gérer le glissement du QR Code
  const handleDrag = (_: DraggableEvent, data: DraggableData) => {
    setPosition({ x: data.x, y: data.y });
  };

  // Fonction pour gérer la sélection d'un fichier PDF
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Fichier sélectionné :", file);
      if (file.type === "application/pdf") {
        const pdfData = await file.arrayBuffer(); 
        console.log("Données PDF lues", pdfData);
        await renderPdfToImage(pdfData); // Attendez que la promesse se résolve
      } else {
        console.error("Le fichier n'est pas un PDF.");
      }
    } else {
      console.error("Aucun fichier sélectionné.");
    }
  };
  
  const renderPdfToImage = async (pdfData: ArrayBuffer) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise; 
      const page = await pdf.getPage(1); 
      const viewport = page.getViewport({ scale: 1.5 });
  
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
  
      await page.render({
        canvasContext: context!,
        viewport: viewport,
      }).promise;
  
      const imageUrl = canvas.toDataURL("image/png");
      console.log("Image URL générée :", imageUrl);
      setPdfImage(imageUrl); // Mettre à jour l'état avec l'URL de l'image
    } catch (error) {
      console.error("Erreur lors du rendu du PDF :", error);
    }
  };
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          Choisir la position du QR Code ({Math.round(position.x)}, {Math.round(position.y)})
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[70vw] max-h-screen py-4 overflow-y-auto">
        <div
          style={{
            width: (orientation==="portrait" ? "210mm" : "297mm"), // A4 width
            height: (orientation==="portrait" ? "297mm" : "210mm"), // A4 height
            border: "1px solid #ccc",
            position: "relative",
            overflow: "hidden",
            margin: "0 auto",
            backgroundColor: "#f9f9f9",
          }}
        >
          {/* Affichage de l'image du PDF si disponible */}
          {pdfImage ? (
  <div>
    <img
      src={pdfImage}
      alt="Aperçu PDF"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    />
  </div>
) : (
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "14px",
      color: "#666",
      textAlign: "center",
    }}
  >
    Aucun PDF sélectionné
  </div>
)}

          {/* Zone draggable pour le QR Code */}
          <Draggable
            bounds="parent"
            position={{ x: position.x, y: position.y }}
            onDrag={handleDrag}
          >
            <div
              style={{
                width: "100px", // Taille du carré draggable
                height: "100px",
                backgroundColor: "rgba(0, 123, 255, 0.5)",
                border: "1px solid #007bff",
                borderRadius: "4px",
                cursor: "move",
                position: "absolute",
                zIndex: 1, // QR Code par-dessus l'image
              }}
            />
          </Draggable>

          {/* Affichage des coordonnées */}
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              fontSize: "12px",
              color: "#333",
            }}
          >
            <strong>Coordonnées:</strong> X: {position.x.toFixed(1)}, Y:{" "}
            {position.y.toFixed(1)}
          </div>
        </div>

        {/* Bouton pour sélectionner le fichier PDF */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Button onClick={() => fileInputRef.current?.click()}>
            Sélectionner un fichier PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};