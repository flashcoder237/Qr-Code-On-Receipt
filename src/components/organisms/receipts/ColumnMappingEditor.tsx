// Fixed ColumnMappingEditor.tsx with improved update handling and session management
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Save, FileDown, Upload, BookmarkPlus, Bookmark, Trash, List, CheckCircle, Clock } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { useNotifications } from "@/components/ui/notification-system";

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
  sessionMapping: { [ecId: string]: string }; // NOUVEAU: Mapping des sessions
  dateCreated: string;
}

interface ColumnMappingEditorProps {
  selectedConfigId: string | null;
  selectedSemesterId: string | null;
  excelColumns: string[];
  columnMapping: { [ecId: string]: string };
  sessionMapping: { [ecId: string]: string }; // NOUVEAU: Prop pour le mapping des sessions
  getAvailableECs: () => EC[];
  onMappingChange: (ecId: string, excelCol: string) => void;
  onSessionMappingChange: (ecId: string, sessionCol: string) => void; // NOUVEAU: Callback pour les sessions
  onLoadMapping?: (mapping: { [ecId: string]: string }, sessionMapping: { [ecId: string]: string }) => void;
  onAutoMapECs?: () => number; // NOUVEAU: Callback pour l'auto-mapping des ECs
}

export const ColumnMappingEditor: React.FC<ColumnMappingEditorProps> = ({
  selectedConfigId,
  selectedSemesterId,
  excelColumns,
  columnMapping,
  sessionMapping,
  getAvailableECs,
  onMappingChange,
  onSessionMappingChange,
  onLoadMapping,
  onAutoMapECs
}) => {
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotifications();

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

  // State to track if initial setup is complete
  const [initialSetupComplete, setInitialSetupComplete] = useState(false);

  // Filtrer les mappings disponibles pour la configuration et le semestre actuel
  const availableMappings = savedMappings.filter(
    m => m.configId === selectedConfigId && m.semesterId === selectedSemesterId
  );

  // NOUVEAU: Fonction pour détecter les colonnes de session
  const getSessionColumns = () => {
    return excelColumns.filter(col => col.startsWith('S/'));
  };

  // NOUVEAU: Fonction pour mapper automatiquement les sessions
  const autoMapSessions = () => {
    const sessionColumns = getSessionColumns();
    const availableECs = getAvailableECs();
    
    availableECs.forEach(ec => {
      const ecColumn = columnMapping[ec.id];
      if (ecColumn) {
        // Chercher la colonne session correspondante
        const sessionColumn = sessionColumns.find(sessionCol => {
          const sessionECName = sessionCol.substring(2); // Enlever "S/"
          return sessionECName === ecColumn;
        });
        
        if (sessionColumn) {
          onSessionMappingChange(ec.id, sessionColumn);
        }
      }
    });
  };

  // Pour faire l'initialisation sans créer une boucle infinie
  useEffect(() => {
    // Ne faire cette initialisation qu'une seule fois par changement de config/semestre
    if (!initialSetupComplete && selectedConfigId && selectedSemesterId) {
      const availableECs = getAvailableECs();
      
      // Si des ECs sont disponibles mais qu'aucun mapping n'existe pour eux,
      // initialiser une fois avec des valeurs vides sans créer de boucle
      let needsUpdate = false;
      
      availableECs.forEach(ec => {
        if (columnMapping[ec.id] === undefined) {
          onMappingChange(ec.id, "null");
          needsUpdate = true;
        }
        // NOUVEAU: Initialiser le mapping des sessions
        if (sessionMapping[ec.id] === undefined) {
          onSessionMappingChange(ec.id, "null");
          needsUpdate = true;
        }
      });
      
     
      
      // Auto-mapper les sessions si possible
      autoMapSessions();
      
      setInitialSetupComplete(true);
    }
  }, [selectedConfigId, selectedSemesterId, getAvailableECs, columnMapping, sessionMapping, onMappingChange, onSessionMappingChange, initialSetupComplete]);

  // Reset initialSetupComplete when config or semester changes
  useEffect(() => {
    setInitialSetupComplete(false);
  }, [selectedConfigId, selectedSemesterId]);

  // NOUVEAU: Auto-mapper les sessions quand le mapping des colonnes change
  useEffect(() => {
    if (initialSetupComplete) {
      autoMapSessions();
    }
  }, [columnMapping, initialSetupComplete]);

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
          sessionMapping: { ...sessionMapping }, // NOUVEAU: Sauvegarder le mapping des sessions
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
          sessionMapping: { ...sessionMapping }, // NOUVEAU: Sauvegarder le mapping des sessions
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
        onLoadMapping(savedMapping.mapping, savedMapping.sessionMapping || {});
      } else {
        // Si onLoadMapping n'est pas fourni, appliquer le mapping manuellement
        // Cette approche est plus lente mais nécessaire sans onLoadMapping
        Object.entries(savedMapping.mapping).forEach(([ecId, col]) => {
          onMappingChange(ecId, col);
        });
        
        // NOUVEAU: Charger le mapping des sessions
        if (savedMapping.sessionMapping) {
          Object.entries(savedMapping.sessionMapping).forEach(([ecId, sessionCol]) => {
            onSessionMappingChange(ecId, sessionCol);
          });
        }
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
      notifyWarning("Aucun mapping", "Aucun mapping à exporter pour cette configuration");
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
          notifyWarning("Aucun mapping valide", "Aucun mapping valide trouvé dans le fichier");
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
            // NOUVEAU: S'assurer que sessionMapping existe
            if (!mapping.sessionMapping) {
              mapping.sessionMapping = {};
            }
            newMappings.push(mapping);
            added++;
          }
        });
        
        setSavedMappings(newMappings);
        notifySuccess("Import réussi", `${added} nouveau(x) mapping(s) importé(s)`);

      } catch (error) {
        notifyError("Erreur d'importation", "Format de fichier invalide");
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

  // NOUVEAU: Statistiques des sessions
  const sessionColumns = getSessionColumns();
  const sessionStats = {
    totalSessionColumns: sessionColumns.length,
    mappedSessions: Object.values(sessionMapping).filter(v => v && v !== "null").length,
    availableSessions: sessionColumns.length
  };

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
        <div>
          <p className="text-sm text-gray-600">Associez chaque élément constitutif (EC) à une colonne Excel</p>
          {/* NOUVEAU: Affichage des statistiques des sessions */}
          {sessionStats.totalSessionColumns > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-blue-600">
                {sessionStats.totalSessionColumns} session(s) détectée(s) | 
                {sessionStats.mappedSessions} mappée(s)
              </span>
              <Badge variant="secondary" className="text-xs">
                Sessions: {sessionStats.mappedSessions}/{sessionStats.totalSessionColumns}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {/* NOUVEAU: Bouton d'auto-mapping des ECs */}
          {onAutoMapECs && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                const mappedCount = onAutoMapECs();
                if (mappedCount > 0) {
                  notifySuccess("Auto-correspondance", `${mappedCount} EC(s) mappé(s) automatiquement`);
                  // Auto-mapper les sessions après avoir mappé les ECs
                  autoMapSessions();
                } else {
                  notifyInfo("Auto-correspondance", "Aucune correspondance automatique trouvée");
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Auto-correspondance ECs
            </Button>
          )}

          {/* NOUVEAU: Bouton d'auto-mapping des sessions */}
          {sessionStats.totalSessionColumns > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={autoMapSessions}
              className="text-blue-600 border-blue-300"
            >
              <Clock className="h-4 w-4 mr-2" />
              Auto-mapper sessions
            </Button>
          )}

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

      {/* NOUVEAU: Alerte d'information sur les sessions */}
      {sessionStats.totalSessionColumns > 0 && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Gestion des sessions détectée :</strong> {sessionStats.totalSessionColumns} colonne(s) session trouvée(s) (format S/[nom_ec]).
            Les sessions permettent de distinguer les épreuves normales des rattrapages.
          </AlertDescription>
        </Alert>
      )}

      {/* Dialog pour enregistrer un mapping */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer la correspondance</DialogTitle>
            <DialogDescription>
              Donnez un nom à cette correspondance pour la réutiliser ultérieurement
            </DialogDescription>
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
            {sessionStats.totalSessionColumns > 0 && (
              <p className="text-xs text-blue-600">
                Cette correspondance inclura aussi le mapping des {sessionStats.totalSessionColumns} session(s)
              </p>
            )}
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
            <DialogDescription>
              Sélectionnez une correspondance précédemment enregistrée pour cette configuration
            </DialogDescription>
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
                      {/* NOUVEAU: Affichage des infos sur les sessions */}
                      {mapping.sessionMapping && Object.keys(mapping.sessionMapping).length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600">
                            {Object.values(mapping.sessionMapping).filter(v => v && v !== "null").length} session(s)
                          </span>
                        </div>
                      )}
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
            <Label className="w-1/3 text-sm">{ec.fullName}</Label>
            
            {/* Colonne pour les notes */}
            <div className="w-1/3">
              <Label className="text-xs text-gray-500 mb-1 block">Note</Label>
              <Select
                value={columnMapping[ec.id] || "null"}
                onValueChange={(value) => onMappingChange(ec.id, value === "null" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une colonne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">-- Aucun --</SelectItem>
                  {excelColumns.filter(col => !col.startsWith('S/')).map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* NOUVEAU: Colonne pour les sessions */}
            <div className="w-1/3">
              <Label className="text-xs text-gray-500 mb-1 block">Session</Label>
              <Select
                value={sessionMapping[ec.id] || "null"}
                onValueChange={(value) => onSessionMappingChange(ec.id, value === "null" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">-- Aucune --</SelectItem>
                  {sessionColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {col}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};