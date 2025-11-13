import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Weight, Calculator, Eye, Save, RotateCcw, Info, Link, Unlink, Plus, X, Layers, Clock, Palette, Copy, FileText, Download, Upload } from "lucide-react";
import { ClassConfig, EC, UE, MergedSemesterConfig } from "./types";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";
import { ThemeEditor } from "../theme-editor";
import { getCompleteTheme } from "@/lib/form-schemas/settings";
import { defaultTheme } from "@/lib/form-schemas/theme-settings";

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

  // États pour la gestion du thème personnalisé
  const [showThemeDialog, setShowThemeDialog] = useState(false);

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

  // Fonction pour obtenir le thème global actuel depuis les paramètres
  const getGlobalTheme = () => {
    try {
      const storedSettings = localStorage.getItem('settings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        // Utiliser getCompleteTheme pour obtenir le thème complet
        return getCompleteTheme(settings);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du thème global:', error);
    }
    // Fallback vers le thème par défaut
    return { ...defaultTheme };
  };

  // Fonction pour copier le thème global vers la configuration de classe
  const copyGlobalTheme = () => {
    const updatedConfig = { ...config };
    updatedConfig.theme = getGlobalTheme();
    onConfigUpdate(updatedConfig);
    setShowThemeDialog(true);
    setSuccess("Thème global copié vers cette configuration de classe");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour mettre à jour le thème personnalisé
  const handleThemeUpdate = (settings: any) => {
    // Créer une copie complète de la configuration avec le thème mis à jour
    const updatedConfig: ClassConfig = {
      ...config,
      theme: settings.theme
    };
    // Passer la configuration complète pour éviter les pertes de données
    onConfigUpdate(updatedConfig);
    setSuccess("Thème personnalisé mis à jour");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour réinitialiser le thème avec le thème global actuel (dans le Dialog)
  const resetTheme = () => {
    const updatedConfig = { ...config };
    updatedConfig.theme = getGlobalTheme();
    onConfigUpdate(updatedConfig);
    setSuccess("Thème réinitialisé avec le thème global actuel");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fonction pour supprimer complètement le thème personnalisé
  const removeCustomTheme = () => {
    const updatedConfig = { ...config };
    delete updatedConfig.theme;
    onConfigUpdate(updatedConfig);
    setShowThemeDialog(false);
    setSuccess("Thème personnalisé supprimé - utilisation directe du thème global");
    setTimeout(() => setSuccess(null), 3000);
  };

  // NOUVEAU: Fonction pour exporter le thème personnalisé vers un fichier JSON
  const exportTheme = () => {
    if (!config.theme) {
      toast.error("Erreur", "Aucun thème personnalisé à exporter");
      return;
    }

    try {
      const themeData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        className: config.name,
        theme: config.theme
      };

      const dataStr = JSON.stringify(themeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `theme_${config.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess("Thème exporté avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de l'export du thème:", error);
      toast.error("Erreur", "Impossible d'exporter le thème");
    }
  };

  // NOUVEAU: Fonction pour importer un thème depuis un fichier JSON
  const importTheme = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const themeData = JSON.parse(text);

      // Validation basique
      if (!themeData.theme || !themeData.version) {
        toast.error("Format invalide", "Le fichier ne contient pas un thème valide");
        return;
      }

      // Appliquer le thème importé
      const updatedConfig = { ...config };
      updatedConfig.theme = themeData.theme;
      onConfigUpdate(updatedConfig);

      setSuccess(`Thème importé avec succès${themeData.className ? ` (depuis ${themeData.className})` : ''}`);
      setTimeout(() => setSuccess(null), 3000);

      // Réinitialiser l'input file
      event.target.value = '';
    } catch (error) {
      console.error("Erreur lors de l'import du thème:", error);
      toast.error("Erreur", "Impossible d'importer le thème - fichier invalide");
    }
  };

  // NOUVEAU: Fonction pour générer des fake datas basées sur la structure de la classe
  const generateFakeStudentData = () => {
    const fakeFirstNames = ["Jean", "Marie", "Pierre", "Sophie", "Luc", "Emma", "Thomas", "Chloé"];
    const fakeLastNames = ["Dupont", "Martin", "Bernard", "Dubois", "Laurent", "Simon", "Michel", "Lefebvre"];
    const randomFirstName = fakeFirstNames[Math.floor(Math.random() * fakeFirstNames.length)];
    const randomLastName = fakeLastNames[Math.floor(Math.random() * fakeLastNames.length)];

    // Utiliser le premier semestre ou un semestre composite/fusionné
    let selectedSemester = config.semesters[0];
    const activeMergedSemester = config.mergedSemesters?.find(ms => ms.isActive);

    // Préparer les cours basés sur la structure réelle de la classe
    const courses: any[] = [];

    if (activeMergedSemester) {
      // Traiter les semestres fusionnés
      activeMergedSemester.semesterIds.forEach(semesterId => {
        const semester = config.semesters.find(s => s.id === semesterId);
        if (semester) {
          semester.ues.forEach(ue => {
            ue.ecs.forEach(ec => {
              const noteBase = ec.noteBase || 20;
              const displayBase = ec.displayBase || 20;
              const fakeGrade = 10 + Math.random() * 10; // Entre 10 et 20
              const displayGrade = (fakeGrade * displayBase) / noteBase;

              courses.push({
                CODE: ue.code || `UE-${ue.id.slice(0,4)}`,
                INTITULE: ue.name,
                EC_TITRE: ec.name,
                NOTE: displayGrade,
                NOTE_ORIGINAL: fakeGrade,
                NOTE_BASE: noteBase,
                DISPLAY_BASE: displayBase,
                WEIGHT: ec.weight || 1,
                UE_CREDIT: ue.credits || 0,
                UE_ID: ue.id,
                UE_AVERAGE: 0,
                UE_DISPLAY_BASE: ue.displayBase || 20,
                SESSION: config.sessionDisplayFormat === 'full' ? 'Normale 2024' : 'N/2024',
                SHOW_SESSION: config.displaySessions !== false
              });
            });
          });
        }
      });
    } else if (selectedSemester) {
      // Traiter un semestre simple
      selectedSemester.ues.forEach(ue => {
        ue.ecs.forEach(ec => {
          const noteBase = ec.noteBase || 20;
          const displayBase = ec.displayBase || 20;
          const fakeGrade = 10 + Math.random() * 10; // Entre 10 et 20
          const displayGrade = (fakeGrade * displayBase) / noteBase;

          courses.push({
            CODE: ue.code || `UE-${ue.id.slice(0,4)}`,
            INTITULE: ue.name,
            EC_TITRE: ec.name,
            NOTE: displayGrade,
            NOTE_ORIGINAL: fakeGrade,
            NOTE_BASE: noteBase,
            DISPLAY_BASE: displayBase,
            WEIGHT: ec.weight || 1,
            UE_CREDIT: ue.credits || 0,
            UE_ID: ue.id,
            UE_AVERAGE: 0,
            UE_DISPLAY_BASE: ue.displayBase || 20,
            SESSION: config.sessionDisplayFormat === 'full' ? 'Normale 2024' : 'N/2024',
            SHOW_SESSION: config.displaySessions !== false
          });
        });
      });
    }

    // Calculer les moyennes UE avec pondération
    const ueMap = new Map();
    courses.forEach(course => {
      if (!ueMap.has(course.UE_ID)) {
        const ueCourses = courses.filter(c => c.UE_ID === course.UE_ID);
        let totalWeightedPoints = 0;
        let totalWeights = 0;

        ueCourses.forEach(c => {
          const normalizedGrade = (c.NOTE_ORIGINAL * 20) / c.NOTE_BASE;
          totalWeightedPoints += normalizedGrade * c.WEIGHT;
          totalWeights += c.WEIGHT;
        });

        const ueAverage = totalWeights > 0 ? totalWeightedPoints / totalWeights : 0;
        const displayAverage = (ueAverage * course.UE_DISPLAY_BASE) / 20;

        ueMap.set(course.UE_ID, displayAverage);
      }
    });

    // Assigner les moyennes UE
    courses.forEach(course => {
      course.UE_AVERAGE = ueMap.get(course.UE_ID) || 0;
    });

    const totalCredits = activeMergedSemester ? activeMergedSemester.creditsRequired : (selectedSemester?.creditsRequired || 30);
    const semesterName = activeMergedSemester ? activeMergedSemester.name : (selectedSemester?.name || "Semestre 1");

    return {
      NOM: randomLastName.toUpperCase(),
      PRENOM: randomFirstName,
      MATRICULE: `DEMO${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      "DATE DE NAISSANCE": "01/01/2000",
      "LIEU DE NAISSANCE": "Paris",
      CYCLE: config.cycle || "Licence",
      "ANNEE ACADÉMIQUE": config.academicYear || "2024-2025",
      FILIERE: config.filiere || "Informatique",
      NIVEAU: config.niveau || "1",
      SEMESTRE: semesterName,
      OPTION: config.option || "",
      COURSES: courses,
      TOTAL_CREDITS: totalCredits,
      DISPLAY_SESSIONS: config.displaySessions !== false,
      SESSION_FORMAT: config.sessionDisplayFormat || 'short'
    };
  };

  // NOUVEAU: Fonction pour prévisualiser le thème avec fake datas
  const handlePreviewTheme = async () => {
    try {
      if (!config.theme) {
        toast.error("Erreur", "Aucun thème personnalisé à prévisualiser");
        return;
      }

      if (!config.semesters || config.semesters.length === 0) {
        toast.error("Erreur", "Aucun semestre configuré. Ajoutez d'abord des semestres, UEs et ECs.");
        return;
      }

      // Vérifier qu'il y a au moins une UE avec des ECs
      const hasECs = config.semesters.some(s => s.ues.some(ue => ue.ecs.length > 0));
      if (!hasECs) {
        toast.error("Erreur", "Aucun EC configuré. Ajoutez des ECs aux UEs pour générer une prévisualisation.");
        return;
      }

      const fakeStudent = generateFakeStudentData();

      if (!window.transcriptRenderer) {
        throw new Error("Impossible de communiquer avec le processus de rendu HTML");
      }

      // Récupérer les paramètres globaux et fusionner avec le thème personnalisé
      const storedSettings = localStorage.getItem('settings');
      const globalSettings = storedSettings ? JSON.parse(storedSettings) : {};

      const isDemoMode = localStorage.getItem('demo_mode') === 'true';

      const effectiveSettings = {
        ...globalSettings,
        theme: config.theme,
        demoMode: isDemoMode,
        encryptionEnabled: false // Pas de chiffrement pour la prévisualisation
      };

      const renderParams = {
        student: fakeStudent,
        settings: effectiveSettings,
        config: config
      };

      const htmlContent = await window.transcriptRenderer.renderHTML(renderParams);

      if (!htmlContent) {
        throw new Error("Aucun contenu HTML reçu");
      }

      const success = await window.ipcRenderer.invoke('show-preview', htmlContent,
        `Prévisualisation du thème - ${fakeStudent.NOM} ${fakeStudent.PRENOM} (Données fictives)`);

      if (!success) {
        throw new Error("Impossible d'ouvrir la fenêtre de prévisualisation");
      }

      toast.success("Prévisualisation", "Aperçu du thème généré avec des données fictives");
    } catch (error) {
      console.error('Erreur de prévisualisation du thème:', error);
      toast.error("Erreur", `Erreur lors de la prévisualisation: ${error.message || 'Erreur inconnue'}`);
    }
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

      {/* Thème personnalisé */}
      <Card className="bg-indigo-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-indigo-900 text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Thème personnalisé
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {config.theme ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowThemeDialog(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Modifier le thème
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportTheme}
                    title="Exporter le thème personnalisé vers un fichier JSON"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Exporter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeCustomTheme}
                    title="Supprimer le thème personnalisé et utiliser directement le thème global"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Utiliser le thème global
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyGlobalTheme}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copier le thème global
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTheme}
                      className="hidden"
                      id="theme-import-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('theme-import-input')?.click()}
                      title="Importer un thème depuis un fichier JSON"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Importer
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const updatedConfig = { ...config };
                      updatedConfig.theme = getGlobalTheme();
                      onConfigUpdate(updatedConfig);
                      setShowThemeDialog(true);
                    }}
                    title="Créer un thème personnalisé basé sur le thème global actuel"
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    Créer un thème
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-indigo-800 text-sm">
            {config.theme ? (
              <>
                Cette configuration de classe utilise un <strong>thème personnalisé</strong>.
                Les relevés générés pour cette classe utiliseront ce thème au lieu du thème global.
                <br />
                <span className="text-xs text-indigo-600 mt-1 block">
                  Cliquez sur "Utiliser le thème global" pour supprimer le thème personnalisé et utiliser directement le thème global.
                </span>
              </>
            ) : (
              <>
                Cette configuration de classe utilise le <strong>thème global</strong> actuellement défini dans les paramètres.
                <br />
                Vous pouvez créer un thème personnalisé pour cette classe afin de personnaliser l'apparence
                de ses relevés de notes (couleurs, polices, tableaux, etc.).
                <br />
                <span className="text-xs text-indigo-600 mt-1 block">
                  Le thème créé sera basé sur le thème global actuel, que vous pourrez ensuite modifier.
                </span>
              </>
            )}
          </p>

          {config.theme && (
            <div className="bg-white border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">Aperçu du thème</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: config.theme.primaryColor }}
                  />
                  <span className="text-gray-600">Couleur primaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: config.theme.secondaryColor }}
                  />
                  <span className="text-gray-600">Couleur secondaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.theme.fontFamily}</span>
                  <span className="text-gray-600">Police</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.theme.contentFontSize}px</span>
                  <span className="text-gray-600">Taille du contenu</span>
                </div>
              </div>
            </div>
          )}
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
            <DialogDescription>
              Un semestre composite combine plusieurs semestres académiques en une seule période
            </DialogDescription>
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
            <DialogDescription>
              Combinez plusieurs semestres existants pour générer un relevé unique
            </DialogDescription>
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

      {/* Dialog de personnalisation du thème */}
      <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              Personnaliser le thème de la classe
            </DialogTitle>
            <DialogDescription>
              Configurez l'apparence des relevés de notes pour cette classe. Les modifications seront
              automatiquement enregistrées et appliquées uniquement aux relevés de cette classe.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {config.theme && (
              <ThemeEditor
                settings={{ theme: config.theme }}
                onSave={handleThemeUpdate}
                onPreview={handlePreviewTheme}
                showAllTabs={true}
              />
            )}
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetTheme}
                title="Charger le thème global actuel (vous pouvez ensuite le modifier)"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Charger le thème global
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewTheme}
                title="Prévisualiser le thème avec des données fictives basées sur votre classe"
              >
                <FileText className="h-4 w-4 mr-1" />
                Prévisualiser
              </Button>
            </div>
            <Button onClick={() => setShowThemeDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition d'un EC */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer {selectedEC?.name}</DialogTitle>
            <DialogDescription>
              Définissez le poids, la base de notation et la base d'affichage pour cet élément constitutif
            </DialogDescription>
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