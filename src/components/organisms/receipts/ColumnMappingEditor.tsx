import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Save, FileDown, Upload, BookmarkPlus, Bookmark, Trash, List, CheckCircle } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

interface EC {
  id: string;
  fullName: string;
}

// Structure pour stocker les mappings enregistrés
interface SavedMapping {
  id: string;
  name: string;
  configId: string;
  semesterId: string; 
  mapping: { [ecId: string]: string };
  dateCreated: string;
}

interface ColumnMappingEditorProps {
  selectedConfigId: string | null;
  selectedSemesterId: string | null;
  excelColumns: string[];
  columnMapping: { [ecId: string]: string };
  getAvailableECs: () => EC[];
  onMappingChange: (ecId: string, excelCol: string) => void;
  onLoadMapping?: (mapping: { [ecId: string]: string }) => void;
}

export const ColumnMappingEditor: React.FC<ColumnMappingEditorProps> = ({
  selectedConfigId,
  selectedSemesterId,
  excelColumns,
  columnMapping,
  getAvailableECs,
  onMappingChange,
  onLoadMapping
}) => {
  // État pour gérer les mappings sauvegardés
  const [savedMappings, setSavedMappings] = useLocalStorage<SavedMapping[]>(
    "saved-column-mappings", 
    []
  );
  const [newMappingName, setNewMappingName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrer les mappings disponibles pour la configuration et le semestre actuel
  const availableMappings = savedMappings.filter(
    m => m.configId === selectedConfigId && m.semesterId === selectedSemesterId
  );

  // Pour forcer une mise à jour après le mapping initial
  useEffect(() => {
    const availableECs = getAvailableECs();
    
    // Si des ECs sont disponibles mais qu'aucun mapping n'existe pour eux,
    // initialiser le mapping avec des valeurs vides
    if (availableECs.length > 0) {
      let needsUpdate = false;
      availableECs.forEach(ec => {
        if (columnMapping[ec.id] === undefined) {
          onMappingChange(ec.id, "null");
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        // Forcer une mise à jour de l'interface
        console.log("Initializing column mapping for all ECs");
      }
    }
  }, [selectedConfigId, selectedSemesterId, getAvailableECs, columnMapping, onMappingChange]);

  // Fonction pour sauvegarder le mapping actuel
  const saveCurrentMapping = () => {
    if (!newMappingName.trim()) {
      setError("Veuillez entrer un nom pour ce mapping");
      return;
    }

    if (!selectedConfigId || !selectedSemesterId) {
      setError("Impossible de sauvegarder sans configuration et semestre");
      return;
    }

    // Vérifier si un mapping avec ce nom existe déjà
    const mappingExists = savedMappings.some(
      m => m.name === newMappingName && 
           m.configId === selectedConfigId && 
           m.semesterId === selectedSemesterId
    );

    if (mappingExists) {
      if (!confirm(`Un mapping avec le nom "${newMappingName}" existe déjà. Voulez-vous le remplacer?`)) {
        return;
      }
      
      // Supprimer l'ancien mapping
      const filteredMappings = savedMappings.filter(
        m => !(m.name === newMappingName && 
              m.configId === selectedConfigId && 
              m.semesterId === selectedSemesterId)
      );
      
      setSavedMappings([
        ...filteredMappings,
        {
          id: Date.now().toString(),
          name: newMappingName,
          configId: selectedConfigId,
          semesterId: selectedSemesterId,
          mapping: { ...columnMapping },
          dateCreated: new Date().toISOString()
        }
      ]);
    } else {
      // Ajouter le nouveau mapping
      setSavedMappings([
        ...savedMappings,
        {
          id: Date.now().toString(),
          name: newMappingName,
          configId: selectedConfigId,
          semesterId: selectedSemesterId,
          mapping: { ...columnMapping },
          dateCreated: new Date().toISOString()
        }
      ]);
    }

    // Réinitialiser l'état et afficher un message de succès
    setNewMappingName("");
    setShowSaveDialog(false);
    setSaveSuccess(true);
    setError(null);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Fonction pour charger un mapping sauvegardé
  const loadMapping = (savedMapping: SavedMapping) => {
    try {
      if (onLoadMapping) {
        onLoadMapping(savedMapping.mapping);
      } else {
        // Si onLoadMapping n'est pas fourni, appliquer le mapping manuellement
        Object.entries(savedMapping.mapping).forEach(([ecId, col]) => {
          onMappingChange(ecId, col);
        });
      }
      
      // Fermer le dialogue et afficher un message de succès
      setShowLoadDialog(false);
      setLoadSuccess(true);
      setTimeout(() => setLoadSuccess(false), 3000);
    } catch (error) {
      console.error("Erreur lors du chargement du mapping:", error);
      setError(`Erreur lors du chargement du mapping: ${error.message}`);
      setShowLoadDialog(false);
    }
  };

  // Fonction pour supprimer un mapping sauvegardé
  const deleteMapping = (mappingId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce mapping?")) {
      setSavedMappings(savedMappings.filter(m => m.id !== mappingId));
    }
  };

  // Fonction pour exporter les mappings
  const exportMappings = () => {
    // Filtrer les mappings pour la configuration actuelle
    const mappingsToExport = savedMappings.filter(
      m => m.configId === selectedConfigId
    );
    
    if (mappingsToExport.length === 0) {
      alert("Aucun mapping à exporter pour cette configuration");
      return;
    }
    
    const blob = new Blob(
      [JSON.stringify(mappingsToExport, null, 2)], 
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `column-mappings-${selectedConfigId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fonction pour importer des mappings
  const importMappings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedMappings = JSON.parse(e.target?.result as string) as SavedMapping[];
        
        // Vérifier si les mappings importés ont les champs nécessaires
        const validMappings = importedMappings.filter(m => 
          m.id && m.name && m.configId && m.semesterId && m.mapping
        );
        
        if (validMappings.length === 0) {
          alert("Aucun mapping valide trouvé dans le fichier");
          return;
        }
        
        // Ajouter les nouveaux mappings, en évitant les doublons
        const newMappings = [...savedMappings];
        let added = 0;
        
        validMappings.forEach(mapping => {
          const exists = newMappings.some(
            m => m.name === mapping.name && 
                 m.configId === mapping.configId && 
                 m.semesterId === mapping.semesterId
          );
          
          if (!exists) {
            newMappings.push(mapping);
            added++;
          }
        });
        
        setSavedMappings(newMappings);
        alert(`${added} nouveau(x) mapping(s) importé(s)`);
        
      } catch (error) {
        alert("Erreur lors de l'importation : format de fichier invalide");
        console.error("Import error:", error);
      }
    };
    
    reader.readAsText(file);
    
    // Réinitialiser l'input file
    event.target.value = "";
  };

  // Vérification des données disponibles
  const availableECs = getAvailableECs();
  const hasConfig = !!selectedConfigId;
  const hasColumns = excelColumns && excelColumns.length > 0;
  const hasECs = availableECs && availableECs.length > 0;

  if (!hasConfig || !hasColumns) {
    return (
      <div className="text-center py-10 text-gray-500">
        Veuillez d&apos;abord sélectionner une configuration et charger un fichier Excel
      </div>
    );
  }

  if (!hasECs) {
    return (
      <div className="text-center py-10 text-gray-500">
        Aucun élément constitutif (EC) trouvé dans cette configuration
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">Associez chaque élément constitutif (EC) à une colonne Excel</p>
        
        <div className="flex space-x-2">
          {/* Bouton de sauvegarde du mapping */}
          <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer mapping
          </Button>

          {/* Bouton de chargement des mappings */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLoadDialog(true)}
            disabled={availableMappings.length === 0}
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Charger mapping
          </Button>

          {/* Bouton d'exportation */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportMappings}
            disabled={savedMappings.filter(m => m.configId === selectedConfigId).length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exporter
          </Button>

          {/* Bouton d'importation */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => document.getElementById('import-mappings')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <input
              id="import-mappings"
              type="file"
              accept=".json"
              onChange={importMappings}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Messages de succès */}
      {saveSuccess && (
        <Alert className="mb-4 bg-green-100 text-green-800 rounded-md flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>Mapping sauvegardé avec succès</AlertDescription>
        </Alert>
      )}
      
      {loadSuccess && (
        <Alert className="mb-4 bg-green-100 text-green-800 rounded-md flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>Mapping chargé avec succès</AlertDescription>
        </Alert>
      )}

      {/* Message d'erreur */}
      {error && (
        <Alert className="mb-4 bg-red-100 text-red-800 rounded-md flex items-center" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Dialog pour enregistrer un mapping */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer la correspondance</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="mapping-name" className="mb-2 block">Nom de la correspondance</Label>
            <Input
              id="mapping-name"
              value={newMappingName}
              onChange={(e) => setNewMappingName(e.target.value)}
              placeholder="Exemple: Mapping Semestre 1 - 2023"
              className="mb-4"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Annuler</Button>
            <Button onClick={saveCurrentMapping}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour charger un mapping */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Charger une correspondance sauvegardée</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto">
            {availableMappings.length === 0 ? (
              <p className="text-center text-gray-500">
                Aucune correspondance disponible pour cette configuration et ce semestre
              </p>
            ) : (
              <div className="space-y-2">
                {availableMappings.map((mapping) => (
                  <Card key={mapping.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{mapping.name}</p>
                      <p className="text-xs text-gray-500">
                        Créé le {new Date(mapping.dateCreated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadMapping(mapping)}
                      >
                        <BookmarkPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMapping(mapping.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Éditeur de correspondance */}
      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-2">
        {availableECs.map((ec) => (
          <div key={ec.id} className="flex items-center gap-2 my-2 p-2 bg-gray-50 rounded">
            <Label className="w-1/2 text-sm">{ec.fullName}</Label>
            <Select
                value={columnMapping[ec.id] || "null"}
                onValueChange={(value) => onMappingChange(ec.id, value === "null" ? "" : value)}
              >
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Sélectionner une colonne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">-- Aucun --</SelectItem>
                {excelColumns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
};