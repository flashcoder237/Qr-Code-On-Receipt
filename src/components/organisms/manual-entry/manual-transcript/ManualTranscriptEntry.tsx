import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNotifications } from "@/components/ui/notification-system";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Download,
  Loader2,
  Settings2,
  PenLine,
  BarChart3,
  RotateCcw,
  Save,
  FolderPlus,
} from "lucide-react";
import { ClassConfig, Semester } from "@/components/organisms/configs/types";
import { SavedDocumentsList } from "../shared/SavedDocumentsList";
import {
  saveDocument,
  SavedManualDocument,
} from "../shared/manual-document-storage";
import { ConfigurationSelector } from "@/components/organisms/receipts/ConfigurationSelector";
import { SemesterSelector } from "@/components/organisms/receipts/SemesterSelector";
import { StudentInfoForm } from "./StudentInfoForm";
import { GradeEntryTable } from "./GradeEntryTable";
import { TranscriptSummary } from "./TranscriptSummary";
import {
  manualTranscriptSchema,
  ManualTranscriptFormValues,
  UEGradeValues,
} from "../shared/manual-entry-schemas";
import { StudentRecord, CourseRecord } from "@/types/student";
import {
  calculateUEAverage,
  calculateSemesterStatistics,
} from "@/lib/helpers/grades";

const LOCAL_STORAGE_KEY = "academicConfigs";

interface FreeConfig {
  filiere: string;
  niveau: string;
  cycle: string;
  academicYear: string;
  semesterName: string;
  creditsRequired: number;
  option: string;
  displaySessions: boolean;
}

const DEFAULT_FREE_CONFIG: FreeConfig = {
  filiere: "",
  niveau: "",
  cycle: "",
  academicYear: "",
  semesterName: "Semestre 1",
  creditsRequired: 30,
  option: "",
  displaySessions: false,
};

interface TranscriptSettings {
  establishmentType: string;
  nameFrench: string;
  nameEnglish: string;
  postalBox: string;
  postalBoxEn: string;
  email: string;
  logo: string;
  universityLogo: string;
  facultyLogo: string;
  themeColor: string;
  themeFont: string;
  qrCodeSize?: "small" | "medium" | "large";
}

export const ManualTranscriptEntry: React.FC = () => {
  const { notifyError, notifyWarning, notifySuccess } = useNotifications();
  const [activeTab, setActiveTab] = useState("config");
  const [configs, setConfigs] = useState<ClassConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [savedListKey, setSavedListKey] = useState(0);
  const [freeMode, setFreeMode] = useState(false);
  const [freeConfig, setFreeConfig] = useState<FreeConfig>(DEFAULT_FREE_CONFIG);
  const [saveConfigDialog, setSaveConfigDialog] = useState<{
    open: boolean;
    name: string;
    pendingData: ManualTranscriptFormValues | null;
  }>({ open: false, name: "", pendingData: null });

  const [settings] = useLocalStorage<TranscriptSettings>("settings", {
    establishmentType: "ipes",
    nameFrench: "",
    nameEnglish: "",
    postalBox: "",
    postalBoxEn: "",
    email: "",
    logo: "",
    universityLogo: "",
    facultyLogo: "",
    themeColor: "#003366",
    themeFont: "serif",
  });

  const [encryptionEnabled] = useLocalStorage("releve-encryption-enabled", true);

  // Load configs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const visible = parsed.filter((c: ClassConfig) => !c.isHidden);
        setConfigs(visible);
      }
    } catch (e) {
      console.error("Erreur chargement configs:", e);
    }
  }, []);

  const currentConfig = useMemo(
    () => configs.find((c) => c.id === selectedConfigId) || null,
    [configs, selectedConfigId]
  );

  const currentSemester = useMemo(() => {
    if (!currentConfig || !selectedSemesterId) return null;
    return (
      currentConfig.semesters.find((s) => s.id === selectedSemesterId) || null
    );
  }, [currentConfig, selectedSemesterId]);

  // Virtual semester for GradeEntryTable in free mode
  const effectiveSemester = useMemo<Semester | null>(() => {
    if (freeMode) {
      return {
        id: "free-mode",
        name: freeConfig.semesterName || "Semestre",
        ues: [],
        creditsRequired: freeConfig.creditsRequired,
      };
    }
    return currentSemester;
  }, [freeMode, freeConfig.semesterName, freeConfig.creditsRequired, currentSemester]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<ManualTranscriptFormValues>({
    resolver: zodResolver(manualTranscriptSchema),
    defaultValues: {
      studentInfo: {
        nom: "",
        prenom: "",
        matricule: "",
        dateNaissance: "",
        lieuNaissance: "",
      },
      ues: [],
    },
  });

  // Flag to skip UE reset when loading a saved document
  const [skipNextUeReset, setSkipNextUeReset] = useState(false);

  // Reset UE form when semester changes (skip in free mode)
  useEffect(() => {
    if (freeMode) return;

    if (skipNextUeReset) {
      setSkipNextUeReset(false);
      return;
    }

    if (!currentSemester) {
      setValue("ues", []);
      return;
    }

    const ueDefaults: UEGradeValues[] = currentSemester.ues.map((ue) => ({
      ueId: ue.id,
      ueName: ue.name,
      ueCode: ue.code,
      ueCredits: ue.credits,
      useExcelAverage: ue.useExcelAverage || false,
      ueAverageManual: undefined,
      displayBase: ue.displayBase || 20,
      forceValidateCredits: false,
      ecs: ue.ecs.map((ec) => ({
        ecId: ec.id,
        ecName: ec.name,
        note: undefined,
        weight: ec.weight || 1,
        noteBase: ec.noteBase || 20,
        displayBase: ec.displayBase || 20,
      })),
      session: { type: "N" as const, year: "" },
    }));

    setValue("ues", ueDefaults);
  }, [currentSemester, setValue, skipNextUeReset, freeMode]);

  const watchedUes = watch("ues");

  // Calculate semester statistics in real-time
  const semesterStats = useMemo(() => {
    if (!watchedUes || watchedUes.length === 0) return null;

    // Résultats par UE : average /20 + flag forcé
    const ueResults: Array<{
      credits: number;
      average: number;
      forced: boolean;
    }> = [];

    for (const ueData of watchedUes) {
      let ueAverage: number | null = null;

      if (ueData.useExcelAverage && ueData.ueAverageManual) {
        const manualAvg =
          typeof ueData.ueAverageManual === "string"
            ? parseFloat(ueData.ueAverageManual)
            : ueData.ueAverageManual;
        if (!isNaN(manualAvg)) {
          const displayBase = ueData.displayBase || 20;
          ueAverage = (manualAvg * 20) / displayBase;
        }
      } else {
        const ecsWithNotes = ueData.ecs
          ?.map((ec) => {
            const note =
              typeof ec.note === "string" ? parseFloat(ec.note) : ec.note;
            if (note === undefined || note === null || isNaN(note)) return null;
            return {
              note,
              weight: ec.weight || 1,
              noteBase: ec.noteBase || 20,
              displayBase: ec.displayBase || 20,
            };
          })
          .filter(Boolean);

        if (ecsWithNotes && ecsWithNotes.length > 0) {
          const result = calculateUEAverage(ecsWithNotes as any);
          ueAverage = result.average;
        }
      }

      if (ueAverage !== null) {
        ueResults.push({
          credits: ueData.ueCredits,
          average: ueAverage,
          forced: ueData.forceValidateCredits === true,
        });
      } else if (ueData.forceValidateCredits) {
        // Crédits forcés même sans note saisie
        ueResults.push({ credits: ueData.ueCredits, average: 0, forced: true });
      }
    }

    if (ueResults.length === 0) return null;

    const creditsRequired = freeMode
      ? freeConfig.creditsRequired
      : (currentSemester?.creditsRequired || 30);
    const ignoreCredits = freeMode ? false : (currentConfig?.ignoreCreditsInAverage || false);

    // Calcul de la moyenne sur toutes les UEs ayant une note
    const ueWithAvg = ueResults.filter((r) => r.average > 0);
    const stats = ueWithAvg.length > 0
      ? calculateSemesterStatistics(
          ueWithAvg.map((r) => ({ credits: r.credits, average: r.average, displayBase: 20 })),
          creditsRequired,
          ignoreCredits
        )
      : null;

    // Crédits obtenus : par UE (forcé OU moyenne >= 10)
    const creditsObtained = ueResults.reduce((sum, r) => {
      return sum + (r.forced || r.average >= 10 ? r.credits : 0);
    }, 0);

    const average = stats?.average ?? 0;
    const isValidated = creditsObtained >= creditsRequired && average >= 10;

    return {
      totalCredits: ueResults.reduce((s, r) => s + r.credits, 0),
      creditsRequired,
      creditsObtained,
      average,
      grade: stats?.grade ?? "F",
      mgp: stats?.mgp ?? 0,
      isValidated,
    };
  }, [watchedUes, currentSemester, currentConfig, freeMode, freeConfig.creditsRequired]);

  // Build StudentRecord from form data
  const buildStudentRecord = useCallback(
    (data: ManualTranscriptFormValues): StudentRecord | null => {
      if (!freeMode && (!currentConfig || !currentSemester)) return null;

      const effectiveFiliere = freeMode ? freeConfig.filiere : (currentConfig?.filiere || "");
      const effectiveNiveau = freeMode ? freeConfig.niveau : (currentConfig?.niveau || "");
      const effectiveCycle = freeMode ? freeConfig.cycle : (currentConfig?.cycle || "");
      const effectiveYear = freeMode ? freeConfig.academicYear : (currentConfig?.academicYear || "");
      const effectiveSemName = freeMode ? freeConfig.semesterName : (currentSemester?.name || "");
      const effectiveOption = freeMode ? freeConfig.option : (currentConfig?.option || "");
      const effectiveCredits = freeMode ? freeConfig.creditsRequired : (currentSemester?.creditsRequired || 30);
      const effectiveDisplaySessions = freeMode ? freeConfig.displaySessions : (currentConfig?.displaySessions === true);
      const effectiveSessionFormat = freeMode ? "short" : (currentConfig?.sessionDisplayFormat || "short");

      const courses: CourseRecord[] = [];
      const ueAverages = new Map<string, number>();         // /20 pour validation
      const ueDisplayAverages = new Map<string, number>(); // sur base d'affichage UE
      const ueDisplayBases = new Map<string, number>();
      const ueForceValidates = new Map<string, boolean>();

      data.ues.forEach((ueData) => {
        const ueCode = ueData.ueCode || "";
        const ueName = ueData.ueName || "";
        const ueCredits = ueData.ueCredits || 0;
        const ueId = ueData.ueId;
        const ueDisplayBaseVal = ueData.displayBase || 20;
        let ueAverage: number;       // sur /20
        let ueDisplayAverage: number; // sur base d'affichage UE

        if (ueData.useExcelAverage && ueData.ueAverageManual) {
          const manualAvg =
            typeof ueData.ueAverageManual === "string"
              ? parseFloat(ueData.ueAverageManual)
              : ueData.ueAverageManual;
          const raw = !isNaN(manualAvg) ? manualAvg : 0;
          // L'utilisateur saisit la valeur sur la base d'affichage
          ueAverage = (raw * 20) / ueDisplayBaseVal;
          ueDisplayAverage = raw;
        } else {
          const ecsWithNotes = ueData.ecs
            .map((ec) => {
              const note =
                typeof ec.note === "string" ? parseFloat(ec.note) : ec.note;
              if (note === undefined || note === null || isNaN(note))
                return null;
              return {
                note,
                weight: ec.weight || 1,
                noteBase: ec.noteBase || 20,
                displayBase: ec.displayBase || 20,
              };
            })
            .filter((x): x is NonNullable<typeof x> => x !== null);

          if (ecsWithNotes.length === 0) return;

          const result = calculateUEAverage(ecsWithNotes);
          ueAverage = result.average; // /20
          ueDisplayAverage = (result.average * ueDisplayBaseVal) / 20;
        }

        ueAverages.set(ueId, ueAverage);
        ueDisplayAverages.set(ueId, ueDisplayAverage);
        ueDisplayBases.set(ueId, ueDisplayBaseVal);
        ueForceValidates.set(ueId, ueData.forceValidateCredits === true);

        if (ueData.useExcelAverage) {
          const sessionDisplay = buildSessionDisplay(
            ueData.session,
            effectiveDisplaySessions,
            effectiveSessionFormat
          );
          courses.push({
            CODE: ueCode,
            INTITULE: ueName,
            EC_TITRE: ueName,
            NOTE: ueDisplayAverage,
            UE_CREDIT: ueCredits,
            UE_ID: ueId,
            UE_AVERAGE: ueAverage,
            UE_DISPLAY_AVERAGE: ueDisplayAverage,
            UE_DISPLAY_BASE: ueDisplayBaseVal,
            UE_FORCE_VALIDATE: ueData.forceValidateCredits === true,
            SESSION: sessionDisplay,
          });
        } else {
          ueData.ecs.forEach((ecData) => {
            const note =
              typeof ecData.note === "string"
                ? parseFloat(ecData.note)
                : ecData.note;
            if (note === undefined || note === null || isNaN(note)) return;

            const noteBase = ecData.noteBase || 20;
            const ecDisplayBase = ecData.displayBase || 20;
            const displayGrade = (note * ecDisplayBase) / noteBase;

            const sessionDisplay = buildSessionDisplay(
              ueData.session,
              effectiveDisplaySessions,
              effectiveSessionFormat
            );

            courses.push({
              CODE: ueCode,
              INTITULE: ueName,
              EC_TITRE: ecData.ecName || "",
              NOTE: displayGrade,
              UE_CREDIT: ueCredits,
              UE_ID: ueId,
              UE_AVERAGE: 0,
              UE_DISPLAY_AVERAGE: 0,
              UE_DISPLAY_BASE: ueDisplayBaseVal,
              UE_FORCE_VALIDATE: ueData.forceValidateCredits === true,
              SESSION: sessionDisplay,
            });
          });
        }
      });

      courses.forEach((course) => {
        const ueId = course.UE_ID!;
        const avg = ueAverages.get(ueId);
        if (avg !== undefined) course.UE_AVERAGE = avg;
        const dispAvg = ueDisplayAverages.get(ueId);
        if (dispAvg !== undefined) course.UE_DISPLAY_AVERAGE = dispAvg;
      });

      if (courses.length === 0) return null;

      return {
        NOM: data.studentInfo.nom,
        PRENOM: data.studentInfo.prenom,
        MATRICULE: data.studentInfo.matricule,
        "DATE DE NAISSANCE": data.studentInfo.dateNaissance || "",
        "LIEU DE NAISSANCE": data.studentInfo.lieuNaissance || "",
        CYCLE: effectiveCycle,
        "ANNEE ACADÉMIQUE": effectiveYear,
        FILIERE: effectiveFiliere,
        NIVEAU: effectiveNiveau,
        SEMESTRE: effectiveSemName,
        OPTION: effectiveOption,
        COURSES: courses,
        TOTAL_CREDITS: effectiveCredits,
        DISPLAY_SESSIONS: effectiveDisplaySessions,
        SESSION_FORMAT: effectiveSessionFormat as "short" | "full",
      };
    },
    [currentConfig, currentSemester, freeMode, freeConfig]
  );

  const getEffectiveSettings = useCallback(() => {
    const semesterTheme = currentSemester?.theme || currentConfig?.theme;

    let centreInfo: any = null;
    if (currentConfig?.centreId) {
      try {
        const centresStored = localStorage.getItem("training-centres");
        if (centresStored) {
          const centres = JSON.parse(centresStored);
          centreInfo = centres.find(
            (c: any) => c.id === currentConfig.centreId
          );
        }
      } catch (e) {
        console.error("Erreur chargement centre:", e);
      }
    }

    return {
      ...settings,
      demoMode: localStorage.getItem("demo_mode") === "true",
      encryptionEnabled,
      ...(semesterTheme && { theme: semesterTheme }),
      ...(centreInfo && {
        centre: {
          ...centreInfo,
          authorizationTextFr: centreInfo.authorizationTextFr,
          authorizationTextEn: centreInfo.authorizationTextEn,
          location: centreInfo.location,
        },
        centreLogo: centreInfo.logo,
        centreAdministrativeInstanceLogo:
          centreInfo.administrativeInstanceLogo,
        centreAdministrativeInstanceNameFr:
          centreInfo.administrativeInstanceNameFr,
        centreAdministrativeInstanceNameEn:
          centreInfo.administrativeInstanceNameEn,
      }),
    };
  }, [settings, currentConfig, currentSemester, encryptionEnabled]);

  const handlePreview = handleSubmit(async (data) => {
    setIsPreviewing(true);
    try {
      const studentRecord = buildStudentRecord(data);
      if (!studentRecord) {
        notifyError("Apercu impossible", "Verifiez que des notes ont ete saisies.");
        return;
      }

      if (!window.transcriptRenderer) {
        notifyError("Moteur de rendu indisponible", "Relancez l'application.");
        return;
      }

      const effectiveSettings = getEffectiveSettings();
      const renderParams = {
        student: studentRecord,
        settings: effectiveSettings,
        config: currentConfig,
      };

      const htmlContent =
        await window.transcriptRenderer.renderHTML(renderParams);

      if (htmlContent) {
        await window.ipcRenderer.invoke(
          "show-preview",
          htmlContent,
          `Releve - ${studentRecord.NOM} ${studentRecord.PRENOM}`
        );
      }
    } catch (error) {
      console.error("Erreur preview:", error);
    } finally {
      setIsPreviewing(false);
    }
  });

  const handleExport = handleSubmit(async (data) => {
    setIsGenerating(true);
    try {
      const studentRecord = buildStudentRecord(data);
      if (!studentRecord) {
        notifyError("Generation impossible", "Verifiez que des notes ont ete saisies.");
        return;
      }

      const effectiveSettings = getEffectiveSettings();
      const pdfData = {
        student: studentRecord,
        settings: effectiveSettings,
        config: currentConfig,
      };

      const pdfBytes = await window.ipcRenderer.invoke(
        "generate-transcript-pdf",
        pdfData
      );

      if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Releve_${data.studentInfo.nom}_${data.studentInfo.prenom}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erreur generation PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  });

  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
    setSelectedSemesterId(null);
  };

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
  };

  const handleToggleFreeMode = (enabled: boolean) => {
    setFreeMode(enabled);
    if (enabled) {
      setSelectedConfigId(null);
      setSelectedSemesterId(null);
      setValue("ues", []);
    }
  };

  const handleSaveDoc = handleSubmit((data) => {
    const formDataToSave = freeMode
      ? { ...data, _freeMode: true, _freeConfig: freeConfig }
      : data;

    const label = freeMode
      ? `${freeConfig.filiere || "Libre"} - ${freeConfig.semesterName}`
      : currentConfig
      ? `${currentConfig.name} - ${currentSemester?.name || ""}`
      : "";

    const doc = saveDocument(
      {
        type: "transcript",
        label,
        studentName: `${data.studentInfo.nom} ${data.studentInfo.prenom}`,
        studentMatricule: data.studentInfo.matricule,
        formData: formDataToSave,
        configId: freeMode ? undefined : (selectedConfigId || undefined),
        semesterId: freeMode ? undefined : (selectedSemesterId || undefined),
      },
      editingDocId || undefined
    );
    setEditingDocId(doc.id);
    setSavedListKey((k) => k + 1);
  });

  const handleLoadDoc = (doc: SavedManualDocument) => {
    const formData = doc.formData as ManualTranscriptFormValues & {
      _freeMode?: boolean;
      _freeConfig?: FreeConfig;
    };

    // Restore free mode document
    if (formData._freeMode && formData._freeConfig) {
      setFreeMode(true);
      setFreeConfig(formData._freeConfig);
      setEditingDocId(doc.id);
      const { _freeMode: _fm, _freeConfig: _fc, ...cleanData } = formData;
      reset(cleanData as ManualTranscriptFormValues);
      setActiveTab("grades");
      return;
    }

    // Config-based document
    if (doc.configId) {
      const configExists = configs.some((c) => c.id === doc.configId);
      if (!configExists) {
        notifyWarning(
          "Configuration introuvable",
          "La configuration associee a ce document n'existe plus. Veuillez en selectionner une nouvelle."
        );
        setEditingDocId(doc.id);
        setValue("studentInfo", (formData as ManualTranscriptFormValues).studentInfo);
        setActiveTab("config");
        return;
      }
    }

    setSkipNextUeReset(true);
    setEditingDocId(doc.id);
    setFreeMode(false);
    if (doc.configId) setSelectedConfigId(doc.configId);
    if (doc.semesterId) setSelectedSemesterId(doc.semesterId);
    reset(formData as ManualTranscriptFormValues);
    setActiveTab("grades");
  };

  const handleNew = () => {
    setEditingDocId(null);
    setFreeMode(false);
    setFreeConfig(DEFAULT_FREE_CONFIG);
    reset();
    setActiveTab("config");
  };

  // Open confirmation dialog before saving config
  const handleSaveConfig = handleSubmit((data) => {
    const suggestedName = freeMode
      ? [freeConfig.filiere, freeConfig.niveau, freeConfig.academicYear]
          .filter(Boolean)
          .join(" - ") || "Nouvelle configuration"
      : `${currentConfig?.name || "Config"} (copie)`;

    setSaveConfigDialog({ open: true, name: suggestedName, pendingData: data });
  });

  // Actually persist the config after user confirms the name
  const confirmSaveConfig = () => {
    const { name, pendingData } = saveConfigDialog;
    if (!pendingData) return;

    const newConfig: ClassConfig = {
      id: crypto.randomUUID(),
      name: name.trim() || "Nouvelle configuration",
      academicYear: freeMode ? freeConfig.academicYear : (currentConfig?.academicYear || ""),
      filiere: freeMode ? freeConfig.filiere : (currentConfig?.filiere || ""),
      niveau: freeMode ? freeConfig.niveau : (currentConfig?.niveau || ""),
      cycle: freeMode ? freeConfig.cycle : (currentConfig?.cycle || ""),
      option: freeMode ? freeConfig.option : (currentConfig?.option || ""),
      displaySessions: freeMode ? freeConfig.displaySessions : (currentConfig?.displaySessions === true),
      semesters: [
        {
          id: crypto.randomUUID(),
          name: freeMode ? freeConfig.semesterName : (currentSemester?.name || "Semestre 1"),
          creditsRequired: freeMode ? freeConfig.creditsRequired : (currentSemester?.creditsRequired || 30),
          ues: pendingData.ues.map((ue) => ({
            id: ue.ueId,
            name: ue.ueName,
            code: ue.ueCode,
            credits: ue.ueCredits,
            displayBase: ue.displayBase || 20,
            useExcelAverage: ue.useExcelAverage,
            ecs: ue.ecs.map((ec) => ({
              id: ec.ecId,
              name: ec.ecName,
              weight: ec.weight || 1,
              noteBase: ec.noteBase || 20,
              displayBase: ec.displayBase || 20,
            })),
          })),
        },
      ],
    };

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existing: ClassConfig[] = stored ? JSON.parse(stored) : [];
      existing.push(newConfig);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
      setConfigs((prev) => [...prev, newConfig]);
      notifySuccess(
        "Configuration sauvegardee",
        `"${newConfig.name}" ajoutee aux configurations academiques.`
      );
      setSaveConfigDialog({ open: false, name: "", pendingData: null });
    } catch (e) {
      notifyError("Erreur", "Impossible de sauvegarder la configuration.");
    }
  };

  const canProceedToGrades = freeMode || (!!currentConfig && !!currentSemester);

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <PenLine className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Saisie Manuelle - Releve</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez les donnees d'un etudiant pour generer un releve de notes
          </p>
        </div>
        {editingDocId && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Modification en cours
          </Badge>
        )}
      </div>

      <SavedDocumentsList
        key={savedListKey}
        type="transcript"
        onLoad={handleLoadDoc}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Configuration
          </TabsTrigger>
          <TabsTrigger
            value="grades"
            disabled={!canProceedToGrades}
            className="gap-1.5"
          >
            <PenLine className="h-3.5 w-3.5" />
            Saisie
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            disabled={!canProceedToGrades}
            className="gap-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Apercu
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Configuration */}
        <TabsContent value="config" className="space-y-4 mt-4">
          {/* Mode toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div>
              <p className="text-sm font-medium">Mode saisie libre</p>
              <p className="text-xs text-muted-foreground">
                Saisir sans configuration existante, en definissant les
                parametres manuellement
              </p>
            </div>
            <Switch
              checked={freeMode}
              onCheckedChange={handleToggleFreeMode}
            />
          </div>

          {freeMode ? (
            /* Free mode: manual config fields */
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Parametres du releve
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Filiere</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="ex: Informatique"
                    value={freeConfig.filiere}
                    onChange={(e) =>
                      setFreeConfig((c) => ({ ...c, filiere: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Niveau</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="ex: Licence 2"
                    value={freeConfig.niveau}
                    onChange={(e) =>
                      setFreeConfig((c) => ({ ...c, niveau: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cycle</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="ex: Licence"
                    value={freeConfig.cycle}
                    onChange={(e) =>
                      setFreeConfig((c) => ({ ...c, cycle: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Annee academique</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="ex: 2024/2025"
                    value={freeConfig.academicYear}
                    onChange={(e) =>
                      setFreeConfig((c) => ({
                        ...c,
                        academicYear: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Option / Specialite</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="ex: Genie Logiciel"
                    value={freeConfig.option}
                    onChange={(e) =>
                      setFreeConfig((c) => ({ ...c, option: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Semestre</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="ex: Semestre 1"
                    value={freeConfig.semesterName}
                    onChange={(e) =>
                      setFreeConfig((c) => ({
                        ...c,
                        semesterName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Credits requis</Label>
                  <Input
                    type="number"
                    min="1"
                    className="h-8 text-sm"
                    value={freeConfig.creditsRequired}
                    onChange={(e) =>
                      setFreeConfig((c) => ({
                        ...c,
                        creditsRequired: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <Switch
                    checked={freeConfig.displaySessions}
                    onCheckedChange={(v) =>
                      setFreeConfig((c) => ({ ...c, displaySessions: v }))
                    }
                  />
                  <Label className="text-xs">Afficher les sessions</Label>
                </div>
              </div>

              {freeConfig.semesterName && (
                <Button
                  onClick={() => setActiveTab("grades")}
                  className="w-full"
                >
                  Passer a la saisie des notes
                </Button>
              )}
            </div>
          ) : (
            /* Config mode: existing config selector */
            <>
              <ConfigurationSelector
                configs={configs.map((c) => ({
                  id: c.id,
                  name: c.name,
                  academicYear: c.academicYear,
                }))}
                selectedConfigId={selectedConfigId}
                isLoading={false}
                onConfigChange={handleConfigChange}
              />

              {currentConfig && (
                <SemesterSelector
                  semesters={currentConfig.semesters}
                  mergedSemesters={currentConfig.mergedSemesters}
                  selectedSemesterId={selectedSemesterId}
                  isLoading={false}
                  onSemesterChange={handleSemesterChange}
                />
              )}

              {currentConfig && currentSemester && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p>
                    <span className="font-medium">Filiere:</span>{" "}
                    {currentConfig.filiere}
                  </p>
                  <p>
                    <span className="font-medium">Niveau:</span>{" "}
                    {currentConfig.niveau}
                  </p>
                  <p>
                    <span className="font-medium">Annee:</span>{" "}
                    {currentConfig.academicYear}
                  </p>
                  <p>
                    <span className="font-medium">UEs:</span>{" "}
                    {currentSemester.ues.length} |{" "}
                    <span className="font-medium">Credits requis:</span>{" "}
                    {currentSemester.creditsRequired || 30}
                  </p>
                </div>
              )}

              {canProceedToGrades && (
                <Button
                  onClick={() => setActiveTab("grades")}
                  className="w-full"
                >
                  Passer a la saisie des notes
                </Button>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab 2: Grade Entry */}
        <TabsContent value="grades" className="space-y-4 mt-4">
          <StudentInfoForm register={register} errors={errors} />

          {effectiveSemester && (
            <GradeEntryTable
              semester={effectiveSemester}
              register={register}
              setValue={setValue}
              control={control}
              displaySessions={
                freeMode
                  ? freeConfig.displaySessions
                  : (currentConfig?.displaySessions === true)
              }
              academicYear={
                freeMode ? freeConfig.academicYear : (currentConfig?.academicYear || "")
              }
            />
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setActiveTab("config")}
            >
              Retour
            </Button>
            <Button onClick={() => setActiveTab("summary")}>
              Voir le recapitulatif
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: Summary & Export */}
        <TabsContent value="summary" className="space-y-4 mt-4">
          <TranscriptSummary stats={semesterStats} />

          <div className="flex items-center gap-3 justify-end flex-wrap">
            <Button
              variant="outline"
              onClick={() => setActiveTab("grades")}
            >
              Retour
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleNew}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {editingDocId ? "Nouveau" : "Reinitialiser"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDoc}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {editingDocId ? "Mettre a jour" : "Sauvegarder"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveConfig}
              className="gap-2"
              title="Enregistrer la structure UE/EC comme configuration academique reutilisable"
            >
              <FolderPlus className="h-4 w-4" />
              Sauvegarder la config
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="gap-2"
            >
              {isPreviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Apercu
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter PDF
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: confirm config name before saving */}
      <Dialog
        open={saveConfigDialog.open}
        onOpenChange={(open) =>
          setSaveConfigDialog((s) => ({ ...s, open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sauvegarder la configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="config-name-input" className="text-sm">
              Nom de la configuration
            </Label>
            <Input
              id="config-name-input"
              value={saveConfigDialog.name}
              onChange={(e) =>
                setSaveConfigDialog((s) => ({ ...s, name: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && confirmSaveConfig()}
              autoFocus
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Cette configuration sera disponible dans tous les selecteurs de
              l'application.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setSaveConfigDialog({ open: false, name: "", pendingData: null })
              }
            >
              Annuler
            </Button>
            <Button
              onClick={confirmSaveConfig}
              disabled={!saveConfigDialog.name.trim()}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper to build session display string
function buildSessionDisplay(
  session: { type?: string; year?: string } | undefined,
  displaySessions: boolean,
  sessionFormat: string
): string {
  if (!session || !displaySessions) return "";

  const sessionType = session.type || "N";
  const year = session.year || "";

  if (!year) return "";

  if (sessionFormat === "full") {
    const typeFull = sessionType === "R" ? "Rattrapage" : "Normale";
    return `${typeFull} ${year}`;
  }
  const typeShort = sessionType === "R" ? "Ratt/" : "N/";
  return `${typeShort}${year}`;
}
