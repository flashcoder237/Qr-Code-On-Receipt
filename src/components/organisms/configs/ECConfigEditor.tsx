import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Weight, Calculator, Eye, Save, RotateCcw, Info, Link, Unlink, Plus, X, Layers, Clock } from "lucide-react";
import { ClassConfig, EC, UE, MergedSemesterConfig } from "./types";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";

interface ECConfigEditorProps {
  config: ClassConfig;
  onConfigUpdate: (updatedConfig: ClassConfig) => void;
}

export const ECConfigEditor: React.FC<ECConfigEditorProps> = ({
  config,
  onConfigUpdate,
}) => {
  const { toasts, toast, removeToast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedUEId, setSelectedUEId] = useState<string>("");
  const [selectedEC, setSelectedEC] = useState<EC | null>(null);
  const [tempWeight, setTempWeight] = useState<string>("1");
  const [tempNoteBase, setTempNoteBase] = useState<string>("20");
  const [tempDisplayBase, setTempDisplayBase] = useState<string>("20");
  const [success, setSuccess] = useState<string | null>(null);

  // États pour la gestion des semestres fusionnés
  const [showMergedDialog, setShowMergedDialog] = useState(false);
  const [tempMergedName, setTempMergedName] = useState<string>("");
  const [tempSelectedSemesters, setTempSelectedSemesters] = useState<string[]>([]);
  const [tempMergedCredits, setTempMergedCredits] = useState<string>("60");

  // États pour la création de semestres composites
  const [showCompositeDialog, setShowCompositeDialog] = useState(false);
  const [tempCompositeName, setTempCompositeName] = useState<string>("");
  const [tempCompositeCredits, setTempCompositeCredits] = useState<string>("60");
  const [tempCompositeEquivalent, setTempCompositeEquivalent] = useState<string>("2");

  // Fonction pour ouvrir l'éditeur d'un EC spécifique
  const editEC = (semesterId: string, ueId: string, ec: EC) => {
    setSelectedSemesterId(semesterId);
    setSelectedUEId(ueId);
    setSelectedEC(ec);
    setTempWeight((ec.weight || 1).toString());
    setTempNoteBase((ec.noteBase || 20).toString());
    setTempDisplayBase((ec.displayBase || 20).toString());
    setShowDialog(true);
  };

  // Fonction pour sauvegarder les modifications d'un EC
  const saveECConfig = () => {
    if (!selectedEC || !selectedSemesterId || !selectedUEId) return;

    const weight = parseFloat(tempWeight) || 1;
    const noteBase = parseFloat(tempNoteBase) || 20;
    const displayBase = parseFloat(tempDisplayBase) || 20;

    if (weight <= 0) {
      toast.error("Poids invalide", "Le poids doit être supérieur à 0");
      return;
    }

    if (noteBase <= 0 || displayBase <= 0) {
      toast.error("Bases de notation invalides", "Les bases de notation doivent être supérieures à 0");
      return;
    }

    const updatedConfig = { ...config };
    const semester = updatedConfig.semesters.find(s => s.id === selectedSemesterId);
    if (!semester) return;

    const ue = semester.ues.find(u => u.id === selectedUEId);
    if (!ue) return;

    const ec = ue.ecs.find(e => e.id === selectedEC.id);
    if (!ec) return;

    ec.weight = weight;
    ec.noteBase = noteBase;
    ec.displayBase = displayBase;

    onConfigUpdate(updatedConfig);
    setShowDialog(false);
    setSuccess(`Configuration mise à jour pour ${ec.name}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour appliquer des valeurs par défaut à tous les ECs d'une UE
  const applyDefaultsToUE = (semesterId: string, ueId: string) => {
    const updatedConfig = { ...config };
    const semester = updatedConfig.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const ue = semester.ues.find(u => u.id === ueId);
    if (!ue) return;

    ue.ecs.forEach(ec => {
      ec.weight = ec.weight || 1;
      ec.noteBase = ec.noteBase || 20;
      ec.displayBase = ec.displayBase || 20;
    });

    onConfigUpdate(updatedConfig);
    setSuccess(`Valeurs par défaut appliquées à l'UE ${ue.name}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour appliquer des valeurs par défaut à tous les ECs d'un semestre
  const applyDefaultsToSemester = (semesterId: string) => {
    const updatedConfig = { ...config };
    const semester = updatedConfig.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    semester.ues.forEach(ue => {
      ue.ecs.forEach(ec => {
        ec.weight = ec.weight || 1;
        ec.noteBase = ec.noteBase || 20;
        ec.displayBase = ec.displayBase || 20;
      });
    });

    onConfigUpdate(updatedConfig);
    setSuccess(`Valeurs par défaut appliquées au semestre ${semester.name}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour définir la base d'affichage d'une UE
  const setUEDisplayBase = (semesterId: string, ueId: string, displayBase: number) => {
    const updatedConfig = { ...config };
    const semester = updatedConfig.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const ue = semester.ues.find(u => u.id === ueId);
    if (!ue) return;

    ue.displayBase = displayBase;
    onConfigUpdate(updatedConfig);
    setSuccess(`Base d'affichage définie pour l'UE ${ue.name}: /${displayBase}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour définir les crédits requis d'un semestre
  const setSemesterCreditsRequired = (semesterId: string, creditsRequired: number) => {
    const updatedConfig = { ...config };
    const semester = updatedConfig.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    semester.creditsRequired = creditsRequired;
    onConfigUpdate(updatedConfig);
    setSuccess(`Crédits requis définis pour le semestre ${semester.name}: ${creditsRequired}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour ouvrir le dialog de création de semestre fusionné
  const openMergedSemesterDialog = () => {
    setTempMergedName("");
    setTempSelectedSemesters([]);
    setTempMergedCredits("60");
    setShowMergedDialog(true);
  };

  // Fonction pour créer un semestre fusionné
  const createMergedSemester = () => {
    if (!tempMergedName.trim() || tempSelectedSemesters.length < 2) {
      toast.error("Informations manquantes", "Veuillez saisir un nom et sélectionner au moins 2 semestres");
      return;
    }

    const creditsRequired = parseInt(tempMergedCredits) || 60;
    if (creditsRequired <= 0) {
      toast.error("Crédits invalides", "Le nombre de crédits requis doit être supérieur à 0");
      return;
    }

    const newMergedSemester: MergedSemesterConfig = {
      id: `merged-${Date.now()}`,
      name: tempMergedName.trim(),
      semesterIds: [...tempSelectedSemesters],
      creditsRequired,
      isActive: false
    };

    const updatedConfig = { ...config };
    if (!updatedConfig.mergedSemesters) {
      updatedConfig.mergedSemesters = [];
    }
    updatedConfig.mergedSemesters.push(newMergedSemester);

    onConfigUpdate(updatedConfig);
    setShowMergedDialog(false);
    setSuccess(`Semestre fusionné "${tempMergedName}" créé avec succès`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour supprimer un semestre fusionné
  const deleteMergedSemester = (mergedId: string) => {
    const updatedConfig = { ...config };
    if (!updatedConfig.mergedSemesters) return;

    updatedConfig.mergedSemesters = updatedConfig.mergedSemesters.filter(
      ms => ms.id !== mergedId
    );

    onConfigUpdate(updatedConfig);
    setSuccess("Semestre fusionné supprimé");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour activer/désactiver un semestre fusionné
  const toggleMergedSemester = (mergedId: string) => {
    const updatedConfig = { ...config };
    if (!updatedConfig.mergedSemesters) return;

    const mergedSemester = updatedConfig.mergedSemesters.find(ms => ms.id === mergedId);
    if (!mergedSemester) return;

    // Désactiver tous les autres semestres fusionnés
    updatedConfig.mergedSemesters.forEach(ms => {
      ms.isActive = ms.id === mergedId ? !ms.isActive : false;
    });

    onConfigUpdate(updatedConfig);
    const status = mergedSemester.isActive ? "désactivé" : "activé";
    setSuccess(`Semestre fusionné ${status}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour gérer la sélection des semestres à fusionner
  const toggleSemesterSelection = (semesterId: string) => {
    setTempSelectedSemesters(prev => 
      prev.includes(semesterId) 
        ? prev.filter(id => id !== semesterId)
        : [...prev, semesterId]
    );
  };

  // Fonction pour ouvrir le dialog de création de semestre composite
  const openCompositeDialog = () => {
    setTempCompositeName("");
    setTempCompositeCredits("60");
    setTempCompositeEquivalent("2");
    setShowCompositeDialog(true);
  };

  // Fonction pour créer un semestre composite
  const createCompositeSemester = () => {
    if (!tempCompositeName.trim()) {
      toast.error("Nom manquant", "Veuillez saisir un nom pour le semestre composite");
      return;
    }

    const creditsRequired = parseInt(tempCompositeCredits) || 60;
    const equivalent = parseInt(tempCompositeEquivalent) || 2;

    if (creditsRequired <= 0) {
      toast.error("Crédits invalides", "Le nombre de crédits requis doit être supérieur à 0");
      return;
    }

    if (equivalent < 1) {
      toast.error("Équivalent invalide", "L'équivalent en semestres doit être au moins 1");
      return;
    }

    const newCompositeSemester = {
      id: `composite-${Date.now()}`,
      name: tempCompositeName.trim(),
      ues: [],
      creditsRequired,
      isComposite: true,
      compositeEquivalent: equivalent
    };

    const updatedConfig = { ...config };
    updatedConfig.semesters.push(newCompositeSemester);

    onConfigUpdate(updatedConfig);
    setShowCompositeDialog(false);
    setSuccess(`Semestre composite "${tempCompositeName}" créé avec succès ! Allez dans l'onglet "Semestres & Structure" pour y ajouter des UEs et ECs.`);
    setTimeout(() => setSuccess(null), 6000);
  };

  // Fonction pour supprimer un semestre composite
  const deleteCompositeSemester = (semesterId: string) => {
    const updatedConfig = { ...config };
    updatedConfig.semesters = updatedConfig.semesters.filter(s => s.id !== semesterId);

    onConfigUpdate(updatedConfig);
    setSuccess("Semestre composite supprimé");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour gérer l'affichage des sessions
  const toggleSessionDisplay = (enabled: boolean) => {
    const updatedConfig = { ...config };
    updatedConfig.displaySessions = enabled;
    onConfigUpdate(updatedConfig);
    setSuccess(`Affichage des sessions ${enabled ? 'activé' : 'désactivé'}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // NOUVEAU: Fonction pour gérer le masquage de la colonne semestre
  const toggleSemesterColumnDisplay = (hide: boolean) => {
    const updatedConfig = { ...config };
    updatedConfig.hideSemesterColumn = hide;
    onConfigUpdate(updatedConfig);
    setSuccess(`Colonne semestre ${hide ? 'masquée' : 'affichée'}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // NOUVEAU: Fonction pour gérer la séparation des semestres composites
  const toggleSemesterSeparation = (semesterId: string, enabled: boolean) => {
    const updatedConfig = { ...config };
    const semester = updatedConfig.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    semester.showSemesterSeparation = enabled;
    onConfigUpdate(updatedConfig);
    setSuccess(`Séparation des semestres ${enabled ? 'activée' : 'désactivée'} pour ${semester.name}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // NOUVEAU: Fonction pour définir le numéro de semestre d'une UE
  const setUESemesterNumber = (semesterId: string, ueId: string, semesterNumber: number | undefined) => {
    const updatedConfig = { ...config };
    const semester = updatedConfig.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const ue = semester.ues.find(u => u.id === ueId);
    if (!ue) return;

    ue.semesterNumber = semesterNumber;
    onConfigUpdate(updatedConfig);
    setSuccess(`Semestre ${semesterNumber || 'non défini'} assigné à l'UE ${ue.name}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour changer le format d'affichage des sessions
  const setSessionDisplayFormat = (format: 'short' | 'full') => {
    const updatedConfig = { ...config };
    updatedConfig.sessionDisplayFormat = format;
    onConfigUpdate(updatedConfig);
    setSuccess(`Format d'affichage des sessions changé en ${format === 'short' ? 'court' : 'complet'}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  if (!config.semesters.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Info className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            Aucun semestre configuré. Ajoutez d'abord des semestres, UEs et ECs pour configurer les poids et bases de notation.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Vérifier s'il y a des semestres composites vides
  const emptyCompositeSemesters = config.semesters.filter(s => s.isComposite && s.ues.length === 0);

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      <div className="space-y-6">
        {/* Messages de succès */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <Save className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

      {/* Alerte pour les semestres composites vides */}
      {emptyCompositeSemesters.length > 0 && (
        <Alert className="bg-orange-50 border-orange-200">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Attention:</strong> Vous avez {emptyCompositeSemesters.length} semestre{emptyCompositeSemesters.length > 1 ? 's' : ''} composite{emptyCompositeSemesters.length > 1 ? 's' : ''} vide{emptyCompositeSemesters.length > 1 ? 's' : ''} ({emptyCompositeSemesters.map(s => s.name).join(', ')}). 
            <br />
            Allez dans l'onglet <strong>"Semestres & Structure"</strong> pour y ajouter des UEs et ECs, sinon vous ne pourrez pas faire de correspondances.
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration avancée des ECs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <Weight className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <strong>Poids des ECs:</strong> Permet de pondérer les notes lors du calcul de la moyenne de l'UE (défaut: 1)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calculator className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <strong>Base de notation:</strong> Sur combien la note est saisie dans Excel (défaut: 20)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <strong>Base d'affichage:</strong> Sur combien la note doit apparaître dans les relevés (défaut: 20)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration de l'affichage des sessions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Affichage des Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-blue-800 text-sm">
            Configurez comment les sessions (Normale/Rattrapage) sont affichées sur les relevés de notes.
          </p>
          
          <div className="space-y-4">
            {/* Switch pour activer/désactiver l'affichage des sessions */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="space-y-1">
                <Label htmlFor="session-display-switch" className="text-sm font-medium">
                  Afficher les sessions sur les relevés
                </Label>
                <p className="text-xs text-gray-500">
                  Quand activé, les sessions (N/2024, Ratt/2024) apparaîtront sur les relevés
                </p>
              </div>
              <Switch
                id="session-display-switch"
                checked={config.displaySessions !== false} // Par défaut true
                onCheckedChange={toggleSessionDisplay}
              />
            </div>
            
            {/* NOUVEAU: Switch pour masquer la colonne semestre */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="space-y-1">
                <Label htmlFor="semester-column-switch" className="text-sm font-medium">
                  Masquer la colonne semestre dans les décisions
                </Label>
                <p className="text-xs text-gray-500">
                  Cache la colonne "SEMESTRE" dans le tableau des décisions du relevé.
                  Les libellés s'adaptent automatiquement pour les semestres composites.
                </p>
              </div>
              <Switch
                id="semester-column-switch"
                checked={config.hideSemesterColumn === true} // Par défaut false
                onCheckedChange={toggleSemesterColumnDisplay}
              />
            </div>

            {/* Format d'affichage des sessions */}
            {config.displaySessions !== false && (
              <div className="p-4 bg-white rounded-lg border">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Format d'affichage</Label>
                  <Select
                    value={config.sessionDisplayFormat || 'short'}
                    onValueChange={(value: 'short' | 'full') => setSessionDisplayFormat(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir le format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">
                        <div className="flex items-center gap-2">
                          <span>Court</span>
                          <Badge variant="secondary" className="text-xs">N/2024, Ratt/2024</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="full">
                        <div className="flex items-center gap-2">
                          <span>Complet</span>
                          <Badge variant="secondary" className="text-xs">Normale 2024, Rattrapage 2024</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {config.sessionDisplayFormat === 'full' 
                      ? 'Format complet : "Normale 2024", "Rattrapage 2024"'
                      : 'Format court : "N/2024", "Ratt/2024"'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Aperçu des sessions */}
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Aperçu d'affichage</span>
              </div>
              <div className="space-y-1 text-xs">
                {config.displaySessions !== false ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Session normale :</span>
                      <Badge variant="outline" className="text-xs">
                        {config.sessionDisplayFormat === 'full' ? 'Normale 2024' : 'N/2024'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Session rattrapage :</span>
                      <Badge variant="outline" className="text-xs">
                        {config.sessionDisplayFormat === 'full' ? 'Rattrapage 2024' : 'Ratt/2024'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 italic">Sessions masquées sur les relevés</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestion des semestres composites */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-amber-900 text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Semestres composites
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openCompositeDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Créer un semestre composite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-amber-800 text-sm">
            Créez directement un semestre qui équivaut à plusieurs semestres académiques (ex: "Année L1" = 2 semestres avec 60 crédits).
          </p>
          
          {config.semesters.filter(s => s.isComposite).length ? (
            <div className="space-y-2">
              {config.semesters.filter(s => s.isComposite).map((composite) => (
                <div key={composite.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-amber-600" />
                      <span className="font-medium">{composite.name}</span>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        {composite.compositeEquivalent || 2} semestre{(composite.compositeEquivalent || 2) > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {composite.creditsRequired || 60} crédits requis • {composite.ues.length} UE{composite.ues.length > 1 ? 's' : ''}
                      {composite.ues.length === 0 && (
                        <span className="text-orange-600 font-medium"> • ⚠️ Vide - Ajoutez des UEs dans "Semestres & Structure"</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCompositeSemester(composite.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Aucun semestre composite configuré</p>
          )}
        </CardContent>
      </Card>

      {/* Gestion des semestres fusionnés */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-purple-900 text-lg flex items-center gap-2">
              <Link className="h-5 w-5" />
              Semestres fusionnés
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openMergedSemesterDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Créer un semestre fusionné
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-purple-800 text-sm">
            Combinez plusieurs semestres existants pour générer un relevé unique (ex: Semestre 1 + Semestre 2).
          </p>
          
          {config.mergedSemesters?.length ? (
            <div className="space-y-2">
              {config.mergedSemesters.map((merged) => (
                <div key={merged.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{merged.name}</span>
                      {merged.isActive && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                          Actif
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {merged.semesterIds.map(id => {
                        const semester = config.semesters.find(s => s.id === id);
                        return semester?.name;
                      }).filter(Boolean).join(" + ")} • {merged.creditsRequired} crédits requis
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={merged.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleMergedSemester(merged.id)}
                    >
                      {merged.isActive ? (
                        <>
                          <Unlink className="h-4 w-4 mr-1" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Link className="h-4 w-4 mr-1" />
                          Activer
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMergedSemester(merged.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Aucun semestre fusionné configuré</p>
          )}
        </CardContent>
      </Card>

      {/* Configuration par semestre */}
      {config.semesters.map((semester) => (
        <Card key={semester.id} className={semester.isComposite ? "border-amber-200" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {semester.isComposite && <Layers className="h-5 w-5 text-amber-600" />}
                {semester.name}
                {semester.isComposite && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                    Composite ({semester.compositeEquivalent || 2} sem.)
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Crédits requis:</Label>
                  <Input
                    type="number"
                    value={semester.creditsRequired || 30}
                    onChange={(e) => setSemesterCreditsRequired(semester.id, parseInt(e.target.value) || 30)}
                    className="w-20 h-8"
                    min="1"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyDefaultsToSemester(semester.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Valeurs par défaut
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configuration spécifique aux semestres composites */}
            {semester.isComposite && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-900">Options pour semestre composite</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-amber-900">
                      Afficher la séparation des semestres
                    </Label>
                    <p className="text-xs text-amber-700">
                      Ajoute des lignes "Semestre X" dans le tableau pour délimiter les UEs de chaque semestre
                    </p>
                  </div>
                  <Switch
                    checked={semester.showSemesterSeparation === true}
                    onCheckedChange={(enabled) => toggleSemesterSeparation(semester.id, enabled)}
                  />
                </div>

                {semester.showSemesterSeparation && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      <strong>Astuce :</strong> Assignez un numéro de semestre (1, 2, etc.) à chaque UE ci-dessous pour
                      définir leur ordre d'affichage dans le tableau.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            {semester.ues.map((ue) => (
              <div key={ue.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{ue.name}</h4>
                    <p className="text-sm text-gray-600">{ue.code} - {ue.credits} crédits</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {semester.isComposite && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Semestre:</Label>
                        <Select
                          value={ue.semesterNumber?.toString() || "undefined"}
                          onValueChange={(value) => setUESemesterNumber(
                            semester.id,
                            ue.id,
                            value === "undefined" ? undefined : parseInt(value)
                          )}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue placeholder="N°" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="undefined">-</SelectItem>
                            {(() => {
                              // Extraire les numéros de semestre depuis le nom du semestre composite
                              const extractSemesterNumbers = (name: string): number[] => {
                                if (!name) return [];
                                const rangeMatch = name.match(/(\d+)-(\d+)/);
                                if (rangeMatch) {
                                  const start = parseInt(rangeMatch[1]);
                                  const end = parseInt(rangeMatch[2]);
                                  const numbers = [];
                                  for (let i = start; i <= end; i++) {
                                    numbers.push(i);
                                  }
                                  return numbers;
                                }
                                const individualMatch = name.match(/\d+/g);
                                if (individualMatch) {
                                  return individualMatch.map(n => parseInt(n)).sort((a, b) => a - b);
                                }
                                return Array.from({ length: semester.compositeEquivalent || 2 }, (_, i) => i + 1);
                              };

                              const semesterNumbers = extractSemesterNumbers(semester.name);
                              return semesterNumbers.map(num => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Moyenne sur:</Label>
                      <Input
                        type="number"
                        value={ue.displayBase || 20}
                        onChange={(e) => setUEDisplayBase(semester.id, ue.id, parseInt(e.target.value) || 20)}
                        className="w-16 h-8"
                        min="1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyDefaultsToUE(semester.id, ue.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Défaut
                    </Button>
                  </div>
                </div>

                {/* Liste des ECs */}
                <div className="grid gap-2">
                  {ue.ecs.map((ec) => (
                    <div key={ec.id} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex-1">
                        <span className="font-medium">{ec.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Weight className="h-3 w-3 text-gray-500" />
                          <Badge variant="secondary" className="text-xs">
                            Poids: {ec.weight || 1}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calculator className="h-3 w-3 text-gray-500" />
                          <Badge variant="outline" className="text-xs">
                            /{ec.noteBase || 20}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-gray-500" />
                          <Badge variant="outline" className="text-xs">
                            Affichage: /{ec.displayBase || 20}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editEC(semester.id, ue.id, ec)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Dialog de création de semestre composite */}
      <Dialog open={showCompositeDialog} onOpenChange={setShowCompositeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              Créer un semestre composite
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="compositeName">Nom du semestre composite</Label>
              <Input
                id="compositeName"
                value={tempCompositeName}
                onChange={(e) => setTempCompositeName(e.target.value)}
                placeholder="Ex: Année L1, Semestre 1-2, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compositeEquivalent">Équivaut à combien de semestres</Label>
              <Input
                id="compositeEquivalent"
                type="number"
                value={tempCompositeEquivalent}
                onChange={(e) => setTempCompositeEquivalent(e.target.value)}
                min="1"
                max="4"
                placeholder="2"
              />
              <p className="text-xs text-gray-500">
                Nombre de semestres académiques équivalents (généralement 2 pour une année)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compositeCredits">Total des crédits requis</Label>
              <Input
                id="compositeCredits"
                type="number"
                value={tempCompositeCredits}
                onChange={(e) => setTempCompositeCredits(e.target.value)}
                min="1"
                placeholder="60"
              />
              <p className="text-xs text-gray-500">
                Total des crédits nécessaires pour valider ce semestre composite
              </p>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <Layers className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                <strong>Étapes suivantes:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Créer le semestre composite (équivaut à {tempCompositeEquivalent} semestre{parseInt(tempCompositeEquivalent) > 1 ? 's' : ''})</li>
                  <li>Aller dans l'onglet "Semestres & Structure"</li>
                  <li>Ajouter des UEs et ECs au semestre</li>
                  <li>Revenir ici pour configurer poids et bases</li>
                  <li>Faire les correspondances dans "Génération des relevés"</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompositeDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={createCompositeSemester}
              disabled={!tempCompositeName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de semestre fusionné */}
      <Dialog open={showMergedDialog} onOpenChange={setShowMergedDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un semestre fusionné</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mergedName">Nom du semestre fusionné</Label>
              <Input
                id="mergedName"
                value={tempMergedName}
                onChange={(e) => setTempMergedName(e.target.value)}
                placeholder="Ex: Semestre 1 et 2"
              />
            </div>

            <div className="space-y-2">
              <Label>Sélectionner les semestres à fusionner</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {config.semesters.map((semester) => (
                  <div key={semester.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`semester-${semester.id}`}
                      checked={tempSelectedSemesters.includes(semester.id)}
                      onChange={() => toggleSemesterSelection(semester.id)}
                      className="h-4 w-4"
                    />
                    <Label 
                      htmlFor={`semester-${semester.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {semester.name} ({semester.ues.reduce((acc, ue) => acc + ue.credits, 0)} crédits)
                    </Label>
                  </div>
                ))}
              </div>
              {tempSelectedSemesters.length > 0 && (
                <p className="text-xs text-gray-500">
                  {tempSelectedSemesters.length} semestre(s) sélectionné(s)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mergedCredits">Total des crédits requis</Label>
              <Input
                id="mergedCredits"
                type="number"
                value={tempMergedCredits}
                onChange={(e) => setTempMergedCredits(e.target.value)}
                min="1"
                placeholder="60"
              />
              <p className="text-xs text-gray-500">
                Total des crédits nécessaires pour valider les semestres fusionnés
              </p>
            </div>

            {tempSelectedSemesters.length >= 2 && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Aperçu:</strong> Un relevé sera généré incluant tous les ECs des semestres sélectionnés, 
                  avec un total de {tempMergedCredits} crédits requis.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMergedDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={createMergedSemester}
              disabled={!tempMergedName.trim() || tempSelectedSemesters.length < 2}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition d'un EC */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer {selectedEC?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Poids de l'EC</Label>
              <Input
                id="weight"
                type="number"
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                step="0.1"
                min="0.1"
                placeholder="1"
              />
              <p className="text-xs text-gray-500">
                Plus le poids est élevé, plus l'EC influence la moyenne de l'UE
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="noteBase">Base de notation (Excel)</Label>
              <Input
                id="noteBase"
                type="number"
                value={tempNoteBase}
                onChange={(e) => setTempNoteBase(e.target.value)}
                min="1"
                placeholder="20"
              />
              <p className="text-xs text-gray-500">
                Sur combien la note est saisie dans le fichier Excel
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayBase">Base d'affichage (Relevé)</Label>
              <Input
                id="displayBase"
                type="number"
                value={tempDisplayBase}
                onChange={(e) => setTempDisplayBase(e.target.value)}
                min="1"
                placeholder="20"
              />
              <p className="text-xs text-gray-500">
                Sur combien la note apparaîtra dans les relevés de notes
              </p>
            </div>

            {/* Exemple de calcul */}
            {tempNoteBase !== tempDisplayBase && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <Calculator className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  <strong>Conversion automatique:</strong> Une note de {tempNoteBase}/{tempNoteBase} sera affichée comme {tempDisplayBase}/{tempDisplayBase}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveECConfig}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};