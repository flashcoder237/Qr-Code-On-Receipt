import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Alert, AlertDescription } from "../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import { Switch } from "../../ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../ui/dialog";
import {
  PlusCircle,
  Save,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Settings,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Palette,
  Copy,
  Download,
  Upload,
  X,
  GripVertical,
  Layers,
  Move,
  
} from "lucide-react";
import { ClassConfig, Semester, UE, EC } from "./types";
import { ECConfigEditor } from "./ECConfigEditor";
import { ThemeEditor } from "../theme-editor";
import { getCompleteTheme } from "@/lib/form-schemas/settings";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";

interface ClassDetailProps {
  config: ClassConfig | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (updated: Partial<ClassConfig>) => void;
  onAddSemester: () => void;
  onUpdateSemester: (id: string, updated: Partial<Semester>) => void;
  onDeleteSemester: (id: string) => void;
  onDuplicateSemester: (id: string) => void;
  onConvertToComposite: (semesterId: string, compositeEquivalent: number) => void;
  onCreateCompositeFromSemesters: (semesterIds: string[], name: string, compositeEquivalent?: number) => void;
  onAddUE: (semesterId: string) => void;
  onUpdateUE: (semesterId: string, ueId: string, updated: Partial<UE>) => void;
  onDeleteUE: (semesterId: string, ueId: string) => void;
  onAddEC: (semesterId: string, ueId: string) => void;
  onUpdateEC: (
    semesterId: string,
    ueId: string,
    ecId: string,
    updated: Partial<EC>
  ) => void;
  onDeleteEC: (semesterId: string, ueId: string, ecId: string) => void;
  onAddNewConfig: () => void;
}

// Fonction pour déplacer un élément dans un tableau
const moveItemInArray = <T,>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const newArray = [...array];
  const [movedItem] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, movedItem);
  return newArray;
};

export const ClassDetail: React.FC<ClassDetailProps> = ({
  config,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onAddSemester,
  onUpdateSemester,
  onDeleteSemester,
  onDuplicateSemester,
  onConvertToComposite,
  onCreateCompositeFromSemesters,
  onAddUE,
  onUpdateUE,
  onDeleteUE,
  onAddEC,
  onUpdateEC,
  onDeleteEC,
  onAddNewConfig,
}) => {
  const { toasts, toast, removeToast } = useToast();
  const [expandedUEs, setExpandedUEs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("0");
  const [mainTab, setMainTab] = useState<string>("semesters");
  const [localState, setLocalState] = useState({
    name: "",
    academicYear: "",
    filiere: "",
    niveau: "",
    cycle: "",
    option: "",
  });

  // États pour la gestion du thème personnalisé par semestre
  const [showSemesterThemeDialog, setShowSemesterThemeDialog] = useState(false);
  const [selectedSemesterForTheme, setSelectedSemesterForTheme] = useState<string | null>(null);
  const [semesterThemeSettings, setSemesterThemeSettings] = useState<any>(null);
  const [expandedSemesterThemes, setExpandedSemesterThemes] = useState<Set<string>>(new Set());

  // NOUVEAU: États pour la conversion en semestre composite
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [semesterToConvert, setSemesterToConvert] = useState<string | null>(null);
  const [compositeEquivalent, setCompositeEquivalent] = useState<string>("2");

  // NOUVEAU: États pour la création de composite à partir de semestres
  const [showCreateCompositeDialog, setShowCreateCompositeDialog] = useState(false);
  const [selectedSemestersForComposite, setSelectedSemestersForComposite] = useState<string[]>([]);
  const [compositeName, setCompositeName] = useState<string>("");
  const [compositeEquivalentMulti, setCompositeEquivalentMulti] = useState<string>("");

  // NOUVEAU: État pour activer/désactiver la réorganisation des UEs
  const [ueReorderEnabled, setUeReorderEnabled] = useState<boolean>(false);

  // Fonction pour déplacer une UE vers le haut
  const moveUEUp = useCallback((semesterId: string, ueId: string) => {
    if (!config) return;

    const semester = config.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const ueIndex = semester.ues.findIndex(u => u.id === ueId);
    if (ueIndex <= 0) return; // Déjà en première position

    const reorderedUEs = moveItemInArray(semester.ues, ueIndex, ueIndex - 1);

    // Mettre à jour les ordres
    const updatedUEs = reorderedUEs.map((ue, index) => ({
      ...ue,
      order: index
    }));

    onUpdateSemester(semesterId, { ues: updatedUEs });
  }, [config, onUpdateSemester]);

  // Fonction pour déplacer une UE vers le bas
  const moveUEDown = useCallback((semesterId: string, ueId: string) => {
    if (!config) return;

    const semester = config.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const ueIndex = semester.ues.findIndex(u => u.id === ueId);
    if (ueIndex === -1 || ueIndex >= semester.ues.length - 1) return; // Déjà en dernière position

    const reorderedUEs = moveItemInArray(semester.ues, ueIndex, ueIndex + 1);

    // Mettre à jour les ordres
    const updatedUEs = reorderedUEs.map((ue, index) => ({
      ...ue,
      order: index
    }));

    onUpdateSemester(semesterId, { ues: updatedUEs });
  }, [config, onUpdateSemester]);

  // Fonction pour déplacer une UE en première position
  const moveUEToTop = useCallback((semesterId: string, ueId: string) => {
    if (!config) return;

    const semester = config.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const ueIndex = semester.ues.findIndex(u => u.id === ueId);
    if (ueIndex <= 0) return; // Déjà en première position

    const reorderedUEs = moveItemInArray(semester.ues, ueIndex, 0);

    // Mettre à jour les ordres
    const updatedUEs = reorderedUEs.map((ue, index) => ({
      ...ue,
      order: index
    }));

    onUpdateSemester(semesterId, { ues: updatedUEs });
  }, [config, onUpdateSemester]);

  // Fonction pour déplacer une UE en dernière position
  const moveUEToBottom = useCallback((semesterId: string, ueId: string) => {
    if (!config) return;

    const semester = config.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const ueIndex = semester.ues.findIndex(u => u.id === ueId);
    if (ueIndex === -1 || ueIndex >= semester.ues.length - 1) return; // Déjà en dernière position

    const reorderedUEs = moveItemInArray(semester.ues, ueIndex, semester.ues.length - 1);

    // Mettre à jour les ordres
    const updatedUEs = reorderedUEs.map((ue, index) => ({
      ...ue,
      order: index
    }));

    onUpdateSemester(semesterId, { ues: updatedUEs });
  }, [config, onUpdateSemester]);

  // États pour le drag and drop des UEs
  const [draggedUEIndex, setDraggedUEIndex] = useState<{ semesterId: string; index: number } | null>(null);
  const [dragOverUEIndex, setDragOverUEIndex] = useState<{ semesterId: string; index: number } | null>(null);
  const [ueDropPosition, setUEDropPosition] = useState<'before' | 'after'>('after');

  // Gestionnaires pour le drag and drop natif des UEs
  const handleUEDragStart = useCallback((semesterId: string, index: number) => {
    setDraggedUEIndex({ semesterId, index });
  }, []);

  const handleUEDragOver = useCallback((e: React.DragEvent, semesterId: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Calculer si on est dans la moitié supérieure ou inférieure
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';

    setDragOverUEIndex({ semesterId, index });
    setUEDropPosition(position);
  }, []);

  const handleUEDragLeave = useCallback(() => {
    setDragOverUEIndex(null);
  }, []);

  const handleUEDrop = useCallback((semesterId: string, dropIndex: number) => {
    if (!draggedUEIndex || draggedUEIndex.semesterId !== semesterId || !config) return;

    const semester = config.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const sourceIndex = draggedUEIndex.index;

    // Calculer l'index final basé sur la position de drop
    let finalIndex = dropIndex;
    if (ueDropPosition === 'after' && dropIndex >= sourceIndex) {
      finalIndex = dropIndex;
    } else if (ueDropPosition === 'before' && dropIndex <= sourceIndex) {
      finalIndex = dropIndex;
    } else if (ueDropPosition === 'after') {
      finalIndex = dropIndex + 1;
    }

    if (sourceIndex !== finalIndex && sourceIndex !== finalIndex - 1) {
      const reorderedUEs = moveItemInArray(semester.ues, sourceIndex, finalIndex > sourceIndex ? finalIndex - 1 : finalIndex);

      // Mettre à jour les ordres
      const updatedUEs = reorderedUEs.map((ue, index) => ({
        ...ue,
        order: index
      }));

      onUpdateSemester(semesterId, { ues: updatedUEs });
    }

    setDraggedUEIndex(null);
    setDragOverUEIndex(null);
  }, [draggedUEIndex, ueDropPosition, config, onUpdateSemester]);

  const handleUEDragEnd = useCallback(() => {
    setDraggedUEIndex(null);
    setDragOverUEIndex(null);
  }, []);

  // Initialize local state when config changes
  useEffect(() => {
    if (config) {
      setLocalState({
        name: config.name,
        academicYear: config.academicYear,
        filiere: config.filiere || "",
        niveau: config.niveau || "",
        cycle: config.cycle || "",
        option: config.option || "",
      });
    }
  }, [config]);

  // Update handler with improved semester management
  const handleUpdate = useCallback((field: string, value: string) => {
    setLocalState(prev => ({ ...prev, [field]: value }));
    
    // Si on modifie le niveau ET qu'il n'y a pas encore de semestres, créer automatiquement
    if (field === 'niveau' && config && config.semesters.length === 0) {
      const niveauNumber = parseInt(value) || 0;
      if (niveauNumber > 0) {
        const semester1Id = `semester-${(niveauNumber * 2) - 1}`;
        const semester2Id = `semester-${niveauNumber * 2}`;
        
        const updatedSemesters: Semester[] = [
          {
            id: semester1Id,
            name: `Semestre ${(niveauNumber * 2) - 1}`,
            ues: [],
          },
          {
            id: semester2Id,
            name: `Semestre ${niveauNumber * 2}`,
            ues: [],
          },
        ];
        
        onUpdate({ 
          [field]: value,
          semesters: updatedSemesters
        });
      } else {
        onUpdate({ [field]: value });
      }
    } else {
      // Pour tous les autres cas, ne pas toucher aux semestres existants
      onUpdate({ [field]: value });
    }
  }, [onUpdate, config]);

  const toggleUE = useCallback((ueId: string) => {
    setExpandedUEs((prev) => {
      const next = new Set(prev);
      if (next.has(ueId)) {
        next.delete(ueId);
      } else {
        next.add(ueId);
      }
      return next;
    });
  }, []);

  // Fonction pour basculer l'expansion de la section thème du semestre
  const toggleSemesterThemeExpansion = (semesterId: string) => {
    setExpandedSemesterThemes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(semesterId)) {
        newSet.delete(semesterId);
      } else {
        newSet.add(semesterId);
      }
      return newSet;
    });
  };

  // NOUVEAU: Fonction pour ouvrir le dialogue de conversion en composite
  const openConvertDialog = (semesterId: string) => {
    const semester = config?.semesters.find(s => s.id === semesterId);
    if (semester?.isComposite) {
      toast.error("Erreur", "Ce semestre est déjà un semestre composite");
      return;
    }
    setSemesterToConvert(semesterId);
    setCompositeEquivalent("2");
    setShowConvertDialog(true);
  };

  // NOUVEAU: Fonction pour convertir un semestre en composite
  const handleConvertToComposite = () => {
    if (!semesterToConvert) return;
    const equivalent = parseInt(compositeEquivalent) || 2;
    onConvertToComposite(semesterToConvert, equivalent);
    setShowConvertDialog(false);
    setSemesterToConvert(null);
  };

  // NOUVEAU: Fonction pour ouvrir le dialogue de création de composite
  const openCreateCompositeDialog = () => {
    if (!config || config.semesters.length < 2) {
      toast.error("Erreur", "Vous devez avoir au moins 2 semestres pour créer un composite");
      return;
    }
    setSelectedSemestersForComposite([]);
    setCompositeName("");
    setCompositeEquivalentMulti("");
    setShowCreateCompositeDialog(true);
  };

  // NOUVEAU: Fonction pour basculer la sélection d'un semestre
  const toggleSemesterSelection = (semesterId: string) => {
    setSelectedSemestersForComposite(prev =>
      prev.includes(semesterId)
        ? prev.filter(id => id !== semesterId)
        : [...prev, semesterId]
    );
  };

  // NOUVEAU: Fonction pour créer un composite à partir de semestres
  const handleCreateComposite = () => {
    if (selectedSemestersForComposite.length < 2) {
      toast.error("Erreur", "Veuillez sélectionner au moins 2 semestres");
      return;
    }
    if (!compositeName.trim()) {
      toast.error("Erreur", "Veuillez entrer un nom pour le semestre composite");
      return;
    }
    const equivalent = compositeEquivalentMulti ? parseInt(compositeEquivalentMulti) : undefined;
    onCreateCompositeFromSemesters(selectedSemestersForComposite, compositeName, equivalent);
    setShowCreateCompositeDialog(false);
  };

  // Fonctions de gestion du thème par semestre
  const getGlobalTheme = () => {
    return getCompleteTheme();
  };

  const openSemesterThemeDialog = (semesterId: string) => {
    const semester = config?.semesters.find(s => s.id === semesterId);
    const globalSettings = typeof window !== 'undefined' ? localStorage.getItem('settings') : null;
    const parsedGlobalSettings = globalSettings ? JSON.parse(globalSettings) : {};

    // Créer les settings complets en fusionnant les settings globaux avec le thème du semestre
    const completeSettings = {
      ...parsedGlobalSettings,
      theme: {
        ...getCompleteTheme(parsedGlobalSettings),
        ...(semester?.theme || {})
      }
    };

    setSemesterThemeSettings(completeSettings);
    setSelectedSemesterForTheme(semesterId);
    setShowSemesterThemeDialog(true);
  };

  const saveSemesterTheme = (semesterId: string, theme: any) => {
    onUpdateSemester(semesterId, { theme });

    // Mettre à jour les settings locaux pour éviter la réinitialisation
    setSemesterThemeSettings((prev: any) => ({
      ...prev,
      theme: theme
    }));

    toast.success("Thème enregistré", "Le thème personnalisé du semestre a été enregistré avec succès");
  };

  const previewSemesterTheme = async () => {
    if (!selectedSemesterForTheme || !config) {
      toast.error("Erreur", "Impossible de générer l'aperçu");
      return;
    }

    const semester = config.semesters.find(s => s.id === selectedSemesterForTheme);
    if (!semester) return;

    try {
      // Créer un étudiant d'exemple avec TOUTES les configurations de la classe
      const sampleStudent = {
        NOM: "DUPONT",
        PRENOM: "Jean",
        MATRICULE: "2024001",
        "DATE DE NAISSANCE": "01/01/2000",
        "LIEU DE NAISSANCE": "Yaoundé",
        CYCLE: config.cycle || "Licence",
        "ANNEE ACADÉMIQUE": config.academicYear || "2024-2025",
        FILIERE: config.filiere || "Informatique",
        NIVEAU: config.niveau || "L1",
        SEMESTRE: semester.name,
        OPTION: config.option || "",
        COURSES: [],
        TOTAL_CREDITS: semester.creditsRequired || 30,
        // IMPORTANT: Utiliser les configurations de la classe
        DISPLAY_SESSIONS: config.displaySessions !== false, // Par défaut true
        SESSION_FORMAT: config.sessionDisplayFormat || 'short'
      };

      // Ajouter des cours d'exemple
      semester.ues.forEach((ue: any) => {
        let ueGradeSum = 0;
        let ueWeightSum = 0;
        const ueCourses: any[] = [];

        ue.ecs.forEach((ec: any) => {
          const sampleGrade = 12 + Math.random() * 6; // Note entre 12 et 18
          const weight = ec.weight || 1;
          ueGradeSum += sampleGrade * weight;
          ueWeightSum += weight;

          // Formater la session selon la configuration de la classe
          let sessionDisplay = '';
          if (config.displaySessions !== false) {
            const sessionFormat = config.sessionDisplayFormat || 'short';
            if (sessionFormat === 'full') {
              sessionDisplay = 'Normale 2024';
            } else {
              sessionDisplay = 'N/2024';
            }
          }

          ueCourses.push({
            CODE: ue.code || `UE${ue.name}`,
            INTITULE: ue.name,
            EC_TITRE: ec.name,
            NOTE: parseFloat(sampleGrade.toFixed(2)),
            NOTE_ORIGINAL: parseFloat(sampleGrade.toFixed(2)),
            NOTE_BASE: ec.noteBase || 20,
            DISPLAY_BASE: ec.displayBase || 20,
            WEIGHT: weight,
            UE_CREDIT: ue.credits || 0,
            UE_ID: ue.id,
            UE_AVERAGE: 0,
            UE_DISPLAY_BASE: ue.displayBase || 20,
            SESSION: sessionDisplay,
            SHOW_SESSION: config.displaySessions !== false
          });
        });

        const ueAverage = ueWeightSum > 0 ? ueGradeSum / ueWeightSum : 0;
        ueCourses.forEach(course => {
          course.UE_AVERAGE = parseFloat(ueAverage.toFixed(2));
        });

        sampleStudent.COURSES.push(...ueCourses);
      });

      // Charger les settings globaux
      const globalSettings = typeof window !== 'undefined' ? localStorage.getItem('settings') : null;
      const parsedGlobalSettings = globalSettings ? JSON.parse(globalSettings) : {};

      // Fusionner avec le thème du semestre
      const effectiveSettings = {
        ...parsedGlobalSettings,
        theme: semesterThemeSettings?.theme || semester.theme,
        demoMode: false,
        encryptionEnabled: false
      };

      const renderParams = {
        student: sampleStudent,
        settings: effectiveSettings,
        config: config
      };

      const htmlContent = await (window as any).transcriptRenderer.renderHTML(renderParams);

      if (htmlContent) {
        await (window as any).ipcRenderer.invoke('show-preview', htmlContent,
          `Aperçu du thème - ${semester.name}`);
        toast.success("Aperçu", "Aperçu du relevé généré avec le thème du semestre");
      }
    } catch (error) {
      console.error('Erreur génération aperçu:', error);
      toast.error("Erreur", "Impossible de générer l'aperçu du relevé");
    }
  };

  const copySemesterThemeFromClass = (semesterId: string) => {
    if (!config?.theme) {
      toast.error("Aucun thème de classe", "La classe n'a pas de thème personnalisé à copier");
      return;
    }
    onUpdateSemester(semesterId, { theme: config.theme });
    toast.success("Thème copié", "Le thème de la classe a été copié vers ce semestre");
  };

  const copySemesterThemeFromGlobal = (semesterId: string) => {
    const globalTheme = getGlobalTheme();
    onUpdateSemester(semesterId, { theme: globalTheme });
    toast.success("Thème copié", "Le thème global a été copié vers ce semestre");
  };

  const removeSemesterTheme = (semesterId: string) => {
    const semester = config?.semesters.find(s => s.id === semesterId);
    if (!semester) return;

    const updatedSemester = { ...semester };
    delete updatedSemester.theme;
    onUpdateSemester(semesterId, updatedSemester);
    setShowSemesterThemeDialog(false);
    toast.success("Thème supprimé", "Le semestre utilisera le thème de la classe ou le thème global");
  };

  const exportSemesterTheme = (semesterId: string) => {
    const semester = config?.semesters.find(s => s.id === semesterId);
    if (!semester?.theme) {
      toast.error("Erreur", "Aucun thème personnalisé à exporter");
      return;
    }

    try {
      const themeData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        className: config?.name,
        semesterName: semester.name,
        theme: semester.theme
      };

      const dataStr = JSON.stringify(themeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `theme_${semester.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Thème exporté", "Le thème du semestre a été exporté avec succès");
    } catch (error) {
      console.error("Erreur lors de l'export du thème:", error);
      toast.error("Erreur", "Impossible d'exporter le thème");
    }
  };

  const importSemesterTheme = async (semesterId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const themeData = JSON.parse(text);

      if (!themeData.theme || !themeData.version) {
        toast.error("Format invalide", "Le fichier ne contient pas un thème valide");
        return;
      }

      onUpdateSemester(semesterId, { theme: themeData.theme });
      toast.success("Thème importé", `Thème importé avec succès${themeData.semesterName ? ` (depuis ${themeData.semesterName})` : ''}`);

      event.target.value = '';
    } catch (error) {
      console.error("Erreur lors de l'import du thème:", error);
      toast.error("Erreur", "Impossible d'importer le thème - fichier invalide");
    }
  };

  if (!config) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] p-8 text-center"
      >
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Aucune configuration sélectionnée
        </h3>
        <p className="text-gray-500 mb-6">
          Sélectionnez une configuration existante ou créez-en une nouvelle
        </p>
        <Button onClick={onAddNewConfig}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle Configuration
        </Button>
      </motion.div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-4 flex-1">
          <CardTitle className="flex items-center space-x-4">
            {isEditing ? (
              <Input
                value={localState.name}
                onChange={(e) => handleUpdate('name', e.target.value)}
                className="text-xl font-bold"
                placeholder="Nom de la classe"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span>{config.name}</span>
            )}
          </CardTitle>
          
          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Année Académique */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Année Académique</label>
              {isEditing ? (
                <Input
                  value={localState.academicYear}
                  onChange={(e) => handleUpdate('academicYear', e.target.value)}
                  placeholder="Ex: 2023-2024"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.academicYear}</p>
              )}
            </div>

            {/* Filière */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filière</label>
              {isEditing ? (
                <Input
                  value={localState.filiere}
                  onChange={(e) => handleUpdate('filiere', e.target.value)}
                  placeholder="Ex: Informatique"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.filiere}</p>
              )}
            </div>

            {/* Niveau */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Niveau
                {/* {config.semesters.length > 0 && (
                  <span className="text-xs text-orange-600 ml-1">
                    (modifiable uniquement si aucun semestre)
                  </span>
                )} */}
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  min="1"
                  max="7"
                  value={localState.niveau}
                  onChange={(e) => handleUpdate('niveau', e.target.value)}
                  placeholder="Ex: 1"
                  onClick={(e) => e.stopPropagation()}
                  // disabled={config.semesters.length > 0}
                  className={config.semesters.length > 0 ? "bg-gray-100" : ""}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.niveau}</p>
              )}
            </div>

            {/* Cycle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cycle</label>
              {isEditing ? (
                <Input
                  value={localState.cycle}
                  onChange={(e) => handleUpdate('cycle', e.target.value)}
                  placeholder="Ex: Licence"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.cycle}</p>
              )}
            </div>

            {/* Option */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Option</label>
              {isEditing ? (
                <Input
                  value={localState.option}
                  onChange={(e) => handleUpdate('option', e.target.value)}
                  placeholder="Ex: Développement"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.option}</p>
              )}
            </div>

            {/* Centre associé (conditionnel) */}
            {(() => {
              const centres = typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('training-centres') || '[]')
                : [];
              if (centres.length === 0) return null;

              return (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Centre de formation</label>
                  {isEditing ? (
                    <select
                      value={config.centreId || ''}
                      onChange={(e) => onUpdate({ centreId: e.target.value || undefined })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Aucun centre</option>
                      {centres.map((centre: any) => (
                        <option key={centre.id} value={centre.id}>
                          {centre.nameFrench}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {config.centreId
                        ? centres.find((c: any) => c.id === config.centreId)?.nameFrench || 'Centre non trouvé'
                        : 'Aucun centre'
                      }
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={isEditing ? onSave : onEdit}
          className="ml-4"
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          ) : (
            <>
              <Edit2 className="mr-2 h-4 w-4" />
              Modifier
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent>
        {/* Onglets principaux */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="semesters" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Semestres & Structure
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration Avancée
            </TabsTrigger>
          </TabsList>

          <TabsContent value="semesters" className="space-y-6 mt-6">
            {/* Section de gestion des semestres */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Semestres ({config.semesters.length})
                </h3>
                {isEditing && (
                  <Button
                    onClick={onAddSemester}
                    variant="outline"
                    size="sm"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un semestre
                  </Button>
                )}
                {isEditing && config.semesters.length >= 2 && (
                  <Button
                    onClick={openCreateCompositeDialog}
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Créer composite depuis semestres
                  </Button>
                )}
              </div>

              {/* NOUVEAU: Toggle pour activer/désactiver la réorganisation des UEs */}
              {isEditing && config.semesters.length > 0 && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Move className={`h-4 w-4 ${ueReorderEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                  <Label htmlFor="ue-reorder-toggle" className="text-sm cursor-pointer flex-1">
                    Réorganisation des UEs
                  </Label>
                  <Switch
                    id="ue-reorder-toggle"
                    checked={ueReorderEnabled}
                    onCheckedChange={setUeReorderEnabled}
                  />
                </div>
              )}

              {config.semesters.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Aucun semestre configuré</p>
                  {isEditing && (
                    <Button onClick={onAddSemester} variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Créer le premier semestre
                    </Button>
                  )}
                </div>
              )}
            </div>

        {config.semesters.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="flex-wrap">
                {config.semesters.map((semester, index) => (
                  <TabsTrigger key={semester.id} value={index.toString()}>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Input
                          value={semester.name}
                          onChange={(e) => onUpdateSemester(semester.id, { name: e.target.value })}
                          className="h-6 text-xs min-w-0 w-24"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span>{semester.name}</span>
                      )}
                      {isEditing && (
                        <>
                          {!semester.isComposite && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConvertDialog(semester.id);
                              }}
                              className="h-6 w-6 p-0 text-amber-500 hover:text-amber-600"
                              title="Convertir en semestre composite"
                            >
                              <Layers className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateSemester(semester.id);
                            }}
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600"
                            title="Dupliquer ce semestre"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSemester(semester.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <ScrollArea className="h-[calc(100vh-20rem)]">
              {config.semesters.map((semester, semesterIndex) => (
                <TabsContent
                  key={semester.id}
                  value={semesterIndex.toString()}
                  className="space-y-4 mt-0"
                >
                  {/* Section thème du semestre */}
                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <CardHeader
                      className="cursor-pointer hover:bg-indigo-100/50 transition-colors"
                      onClick={() => toggleSemesterThemeExpansion(semester.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedSemesterThemes.has(semester.id) ? (
                            <ChevronDown className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-indigo-600" />
                          )}
                          <Palette className="h-5 w-5 text-indigo-600" />
                          <CardTitle className="text-indigo-900 text-base">
                            Thème du semestre
                          </CardTitle>
                          {semester.theme && (
                            <Badge variant="default" className="bg-indigo-100 text-indigo-800 border-indigo-300">
                              Personnalisé
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {semester.theme ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSemesterThemeDialog(semester.id)}
                                title="Modifier le thème du semestre"
                              >
                                <Palette className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportSemesterTheme(semester.id)}
                                title="Exporter le thème vers un fichier JSON"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Exporter
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeSemesterTheme(semester.id)}
                                title="Supprimer le thème personnalisé"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept=".json"
                                id={`semester-theme-import-${semester.id}`}
                                className="hidden"
                                onChange={(e) => importSemesterTheme(semester.id, e)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copySemesterThemeFromGlobal(semester.id)}
                                title="Copier le thème global"
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copier global
                              </Button>
                              {config.theme && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copySemesterThemeFromClass(semester.id)}
                                  title="Copier le thème de la classe"
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copier classe
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`semester-theme-import-${semester.id}`)?.click()}
                                title="Importer un thème depuis un fichier JSON"
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Importer
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {expandedSemesterThemes.has(semester.id) && (
                      <CardContent>
                        <p className="text-indigo-800 text-sm">
                        {semester.theme ? (
                          <>
                            Ce semestre utilise un <strong>thème personnalisé</strong>.
                            Les relevés générés pour ce semestre utiliseront ce thème spécifique.
                          </>
                        ) : (
                          <>
                            Ce semestre utilise le {config.theme ? <strong>thème de la classe</strong> : <strong>thème global</strong>}.
                            Créez un thème personnalisé pour ce semestre afin de le distinguer visuellement.
                          </>
                        )}
                      </p>
                      {semester.theme && (
                        <div className="mt-3 bg-white border rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: semester.theme.primaryColor }}
                              />
                              <span className="text-gray-600">Couleur primaire</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: semester.theme.secondaryColor }}
                              />
                              <span className="text-gray-600">Couleur secondaire</span>
                            </div>
                          </div>
                        </div>
                      )}
                      </CardContent>
                    )}
                  </Card>

                  <AnimatePresence initial={false}>
                    {semester.ues.map((ue, ueIndex) => {
                      const isDraggingThis = draggedUEIndex?.semesterId === semester.id && draggedUEIndex?.index === ueIndex;
                      const isDragOverThis = dragOverUEIndex?.semesterId === semester.id && dragOverUEIndex?.index === ueIndex;

                      return (
                        <motion.div
                          key={ue.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          draggable={isEditing && ueReorderEnabled}
                          onDragStart={() => handleUEDragStart(semester.id, ueIndex)}
                          onDragOver={(e) => handleUEDragOver(e, semester.id, ueIndex)}
                          onDragLeave={handleUEDragLeave}
                          onDrop={() => handleUEDrop(semester.id, ueIndex)}
                          onDragEnd={handleUEDragEnd}
                          className="relative mb-3"
                          style={{
                            marginTop: isDragOverThis && ueDropPosition === 'before' && !isDraggingThis ? '40px' : '0',
                            marginBottom: isDragOverThis && ueDropPosition === 'after' && !isDraggingThis ? '40px' : ueIndex < semester.ues.length - 1 ? '12px' : '0',
                            transition: 'margin 0.2s ease',
                          }}
                        >
                          {/* Indicateur de drop - ligne avant */}
                          {isDragOverThis && ueDropPosition === 'before' && !isDraggingThis && (
                            <div className="absolute -top-5 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-10">
                              <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-blue-500 rounded-full" />
                            </div>
                          )}

                          <Card className={`transition-all ${isDraggingThis ? 'opacity-50 scale-95' : ''}`}>
                            <CardHeader
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => toggleUE(ue.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {isEditing && ueReorderEnabled && (
                                    <div
                                      className="cursor-grab active:cursor-grabbing"
                                      title="Glisser pour réorganiser"
                                      onClick={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                  {expandedUEs.has(ue.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  {isEditing ? (
                                  <div className="flex flex-col space-y-2 w-64">
                                    <Input
                                      value={ue.name}
                                      onChange={(e) =>
                                        onUpdateUE(semester.id, ue.id, {
                                          name: e.target.value,
                                        })
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className="mb-1"
                                      placeholder="Nom de l'UE"
                                    />
                                    <Input
                                      value={ue.code || `UE${ue.id.slice(0,4)}`}
                                      onChange={(e) =>
                                        onUpdateUE(semester.id, ue.id, {
                                          code: e.target.value,
                                        })
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="Code UE"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium">{ue.name}</div>
                                    <div className="text-xs text-gray-500">Code: {ue.code || `UE${ue.id.slice(0,4)}`}</div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {/* Actions de réorganisation */}
                                {isEditing && ueReorderEnabled && semester.ues.length > 1 && (
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveUEToTop(semester.id, ue.id);
                                      }}
                                      disabled={semesterIndex === 0 && semester.ues.findIndex(u => u.id === ue.id) === 0}
                                      className="h-8 w-8 p-0"
                                      title="Déplacer en première position"
                                    >
                                      <ChevronsUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveUEUp(semester.id, ue.id);
                                      }}
                                      disabled={semester.ues.findIndex(u => u.id === ue.id) === 0}
                                      className="h-8 w-8 p-0"
                                      title="Déplacer vers le haut"
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveUEDown(semester.id, ue.id);
                                      }}
                                      disabled={semester.ues.findIndex(u => u.id === ue.id) === semester.ues.length - 1}
                                      className="h-8 w-8 p-0"
                                      title="Déplacer vers le bas"
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        moveUEToBottom(semester.id, ue.id);
                                      }}
                                      disabled={semester.ues.findIndex(u => u.id === ue.id) === semester.ues.length - 1}
                                      className="h-8 w-8 p-0"
                                      title="Déplacer en dernière position"
                                    >
                                      <ChevronsDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                                {isEditing && (
                                  <Input
                                    type="number"
                                    value={ue.credits}
                                    onChange={(e) =>
                                      onUpdateUE(semester.id, ue.id, {
                                        credits: Number(e.target.value),
                                      })
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-20"
                                  />
                                )}
                                <span className="text-sm text-gray-500">
                                  {ue.credits} crédits
                                </span>
                                {isEditing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteUE(semester.id, ue.id);
                                    }}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <AnimatePresence>
                            {expandedUEs.has(ue.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <CardContent className="pt-4">
                                  <div className="space-y-2">
                                    {ue.ecs.map((ec) => (
                                      <motion.div
                                        key={ec.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                      >
                                        {isEditing ? (
                                          <Input
                                            value={ec.name}
                                            onChange={(e) =>
                                              onUpdateEC(semester.id, ue.id, ec.id, {
                                                name: e.target.value,
                                              })
                                            }
                                            className="w-full"
                                          />
                                        ) : (
                                          <span>{ec.name}</span>
                                        )}
                                        <div className="flex items-center space-x-2">
                                          {isEditing && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                onDeleteEC(semester.id, ue.id, ec.id)
                                              }
                                              className="text-red-500 hover:text-red-600"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </div>
                                      </motion.div>
                                    ))}
                                    {isEditing && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onAddEC(semester.id, ue.id)}
                                        className="w-full mt-2"
                                      >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Ajouter un EC
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>

                        {/* Indicateur de drop - ligne après */}
                        {isDragOverThis && ueDropPosition === 'after' && !isDraggingThis && (
                          <div className="absolute -bottom-5 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-10">
                            <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-blue-500 rounded-full" />
                          </div>
                        )}
                      </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => onAddUE(semester.id)}
                      className="w-full mt-4"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Ajouter une UE
                    </Button>
                  )}
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-6">
            <ECConfigEditor
              config={config}
              onConfigUpdate={(updatedConfig) => {
                // Passer directement la configuration complète au parent
                // pour éviter les appels multiples qui peuvent causer des pertes de données
                onUpdate(updatedConfig);
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog pour éditer le thème du semestre */}
      {selectedSemesterForTheme && config && (
        <Dialog open={showSemesterThemeDialog} onOpenChange={setShowSemesterThemeDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Personnaliser le thème du semestre: {config.semesters.find(s => s.id === selectedSemesterForTheme)?.name}
              </DialogTitle>
              <DialogDescription>
                Modifiez les paramètres visuels pour ce semestre spécifique. Ces paramètres seront utilisés uniquement pour les relevés de ce semestre.
              </DialogDescription>
            </DialogHeader>
            <ThemeEditor
              settings={semesterThemeSettings || {}}
              onSave={(updatedSettings) => {
                if (selectedSemesterForTheme) {
                  // Mettre à jour d'abord les settings locaux avec le nouveau thème
                  setSemesterThemeSettings(updatedSettings);
                  saveSemesterTheme(selectedSemesterForTheme, updatedSettings.theme);
                }
              }}
              onPreview={previewSemesterTheme}
              showAllTabs={true}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSemesterThemeDialog(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* NOUVEAU: Dialog de conversion en semestre composite */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              Convertir en semestre composite
            </DialogTitle>
            <DialogDescription>
              Convertir ce semestre en semestre composite qui représente plusieurs semestres académiques
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="bg-amber-50 border-amber-200">
              <Layers className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                La conversion préservera toutes les UEs et ECs existantes. Le semestre sera marqué comme composite et pourra afficher des séparations entre les semestres.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label htmlFor="equivalent" className="text-sm font-medium">
                Équivaut à combien de semestres ?
              </label>
              <Input
                id="equivalent"
                type="number"
                value={compositeEquivalent}
                onChange={(e) => setCompositeEquivalent(e.target.value)}
                min="1"
                max="4"
                placeholder="2"
              />
              <p className="text-xs text-gray-500">
                Nombre de semestres académiques équivalents (généralement 2 pour une année complète)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConvertToComposite}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Layers className="h-4 w-4 mr-2" />
              Convertir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOUVEAU: Dialog de création de composite depuis semestres */}
      <Dialog open={showCreateCompositeDialog} onOpenChange={setShowCreateCompositeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              Créer un semestre composite depuis semestres existants
            </DialogTitle>
            <DialogDescription>
              Combinez plusieurs semestres pour créer un nouveau semestre composite avec toutes leurs UEs et ECs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="composite-name" className="text-sm font-medium">
                Nom du semestre composite
              </label>
              <Input
                id="composite-name"
                value={compositeName}
                onChange={(e) => setCompositeName(e.target.value)}
                placeholder="Ex: Année L1, Semestre 1-2, etc."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Sélectionner les semestres à combiner (min. 2)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {config?.semesters.map((semester) => (
                  <div key={semester.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`select-${semester.id}`}
                      checked={selectedSemestersForComposite.includes(semester.id)}
                      onChange={() => toggleSemesterSelection(semester.id)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`select-${semester.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {semester.name}
                      {semester.isComposite && (
                        <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 text-xs">
                          Composite
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 ml-2">
                        ({semester.ues.length} UE{semester.ues.length > 1 ? 's' : ''})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              {selectedSemestersForComposite.length > 0 && (
                <p className="text-xs text-gray-500">
                  {selectedSemestersForComposite.length} semestre(s) sélectionné(s)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="composite-equivalent-multi" className="text-sm font-medium">
                Équivalence en semestres (optionnel)
              </label>
              <Input
                id="composite-equivalent-multi"
                type="number"
                value={compositeEquivalentMulti}
                onChange={(e) => setCompositeEquivalentMulti(e.target.value)}
                min="1"
                max="4"
                placeholder={`${selectedSemestersForComposite.length || 2}`}
              />
              <p className="text-xs text-gray-500">
                Laissez vide pour utiliser le nombre de semestres sélectionnés
              </p>
            </div>

            {selectedSemestersForComposite.length >= 2 && (
              <Alert className="bg-blue-50 border-blue-200">
                <Layers className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Un nouveau semestre composite sera créé avec toutes les UEs et ECs des {selectedSemestersForComposite.length} semestres sélectionnés. Les semestres originaux seront préservés.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCompositeDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateComposite}
              disabled={selectedSemestersForComposite.length < 2 || !compositeName.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Layers className="h-4 w-4 mr-2" />
              Créer composite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Card>
  );
};