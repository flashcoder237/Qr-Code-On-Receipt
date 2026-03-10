import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { ClassConfig } from "@/components/organisms/configs/types";
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

  // Reset UE form when semester changes
  useEffect(() => {
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
  }, [currentSemester, setValue, skipNextUeReset]);

  const watchedUes = watch("ues");

  // Calculate semester statistics in real-time
  const semesterStats = useMemo(() => {
    if (!currentSemester || !watchedUes || watchedUes.length === 0) return null;

    const ueStats: Array<{
      credits: number;
      average: number;
      displayBase?: number;
    }> = [];

    for (const ueData of watchedUes) {
      let ueAverage: number | null = null;

      if (ueData.useExcelAverage && ueData.ueAverageManual) {
        const manualAvg =
          typeof ueData.ueAverageManual === "string"
            ? parseFloat(ueData.ueAverageManual)
            : ueData.ueAverageManual;
        if (!isNaN(manualAvg)) {
          // Convert to /20 for semester statistics
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
          ueAverage = result.average; // Already on /20 scale
        }
      }

      if (ueAverage !== null) {
        ueStats.push({
          credits: ueData.ueCredits,
          average: ueAverage,
          displayBase: 20,
        });
      }
    }

    if (ueStats.length === 0) return null;

    const creditsRequired = currentSemester.creditsRequired || 30;
    const ignoreCredits = currentConfig?.ignoreCreditsInAverage || false;
    return calculateSemesterStatistics(ueStats, creditsRequired, ignoreCredits);
  }, [watchedUes, currentSemester, currentConfig]);

  // Build StudentRecord from form data (uses form UE/EC data, not config lookups)
  const buildStudentRecord = useCallback(
    (data: ManualTranscriptFormValues): StudentRecord | null => {
      if (!currentConfig || !currentSemester) return null;

      const courses: CourseRecord[] = [];
      const ueAverages = new Map<string, number>();

      // Process each UE from form data
      data.ues.forEach((ueData) => {
        const ueCode = ueData.ueCode || "";
        const ueName = ueData.ueName || "";
        const ueCredits = ueData.ueCredits || 0;
        const ueId = ueData.ueId;
        let ueAverage: number;

        if (ueData.useExcelAverage && ueData.ueAverageManual) {
          const manualAvg =
            typeof ueData.ueAverageManual === "string"
              ? parseFloat(ueData.ueAverageManual)
              : ueData.ueAverageManual;
          ueAverage = !isNaN(manualAvg) ? manualAvg : 0;
        } else {
          // Calculate from ECs
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
          ueAverage = result.displayAverage;
        }

        ueAverages.set(ueId, ueAverage);

        // Build course records
        if (ueData.useExcelAverage) {
          const sessionDisplay = buildSessionDisplay(
            ueData.session,
            currentConfig
          );

          courses.push({
            CODE: ueCode,
            INTITULE: ueName,
            EC_TITRE: ueName,
            NOTE: ueAverage,
            UE_CREDIT: ueCredits,
            UE_ID: ueId,
            UE_AVERAGE: ueAverage,
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
              currentConfig
            );

            courses.push({
              CODE: ueCode,
              INTITULE: ueName,
              EC_TITRE: ecData.ecName || "",
              NOTE: displayGrade,
              UE_CREDIT: ueCredits,
              UE_ID: ueId,
              UE_AVERAGE: 0, // Will be filled below
              SESSION: sessionDisplay,
            });
          });
        }
      });

      // Assign UE averages to courses
      courses.forEach((course) => {
        const avg = ueAverages.get(course.UE_ID!);
        if (avg !== undefined) {
          course.UE_AVERAGE = avg;
        }
      });

      if (courses.length === 0) return null;

      return {
        NOM: data.studentInfo.nom,
        PRENOM: data.studentInfo.prenom,
        MATRICULE: data.studentInfo.matricule,
        "DATE DE NAISSANCE": data.studentInfo.dateNaissance || "",
        "LIEU DE NAISSANCE": data.studentInfo.lieuNaissance || "",
        CYCLE: currentConfig.cycle || "",
        "ANNEE ACADÉMIQUE": currentConfig.academicYear || "",
        FILIERE: currentConfig.filiere || "",
        NIVEAU: currentConfig.niveau || "",
        SEMESTRE: currentSemester.name || "",
        OPTION: currentConfig.option || "",
        COURSES: courses,
        TOTAL_CREDITS: currentSemester.creditsRequired || 30,
        DISPLAY_SESSIONS: currentConfig.displaySessions !== false,
        SESSION_FORMAT: currentConfig.sessionDisplayFormat || "short",
      };
    },
    [currentConfig, currentSemester]
  );

  const getEffectiveSettings = useCallback(() => {
    const semesterTheme = currentSemester?.theme || currentConfig?.theme;

    // Load centre info if applicable
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
        window.alert(
          "Impossible de generer l'apercu. Verifiez que des notes ont ete saisies."
        );
        return;
      }

      if (!window.transcriptRenderer) {
        window.alert(
          "Le moteur de rendu n'est pas disponible. Relancez l'application."
        );
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
        window.alert(
          "Impossible de generer le PDF. Verifiez que des notes ont ete saisies."
        );
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

  const handleSaveDoc = handleSubmit((data) => {
    const doc = saveDocument(
      {
        type: "transcript",
        label: currentConfig
          ? `${currentConfig.name} - ${currentSemester?.name || ""}`
          : "",
        studentName: `${data.studentInfo.nom} ${data.studentInfo.prenom}`,
        studentMatricule: data.studentInfo.matricule,
        formData: data,
        configId: selectedConfigId || undefined,
        semesterId: selectedSemesterId || undefined,
      },
      editingDocId || undefined
    );
    setEditingDocId(doc.id);
    setSavedListKey((k) => k + 1);
  });

  const handleLoadDoc = (doc: SavedManualDocument) => {
    // Validate that the config and semester still exist
    if (doc.configId) {
      const configExists = configs.some((c) => c.id === doc.configId);
      if (!configExists) {
        window.alert(
          "La configuration associee a ce document n'existe plus. Veuillez en selectionner une nouvelle."
        );
        setEditingDocId(doc.id);
        // Still load student info
        const formData = doc.formData as ManualTranscriptFormValues;
        setValue("studentInfo", formData.studentInfo);
        setActiveTab("config");
        return;
      }
    }

    // Skip the next UE reset triggered by semester change
    setSkipNextUeReset(true);
    setEditingDocId(doc.id);
    if (doc.configId) {
      setSelectedConfigId(doc.configId);
    }
    if (doc.semesterId) {
      setSelectedSemesterId(doc.semesterId);
    }
    reset(doc.formData as ManualTranscriptFormValues);
    setActiveTab("grades");
  };

  const handleNew = () => {
    setEditingDocId(null);
    reset();
    setActiveTab("config");
  };

  const canProceedToGrades = !!currentConfig && !!currentSemester;

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
        </TabsContent>

        {/* Tab 2: Grade Entry */}
        <TabsContent value="grades" className="space-y-4 mt-4">
          <StudentInfoForm register={register} errors={errors} />

          {currentSemester && (
            <GradeEntryTable
              semester={currentSemester}
              register={register}
              setValue={setValue}
              control={control}
              displaySessions={currentConfig?.displaySessions !== false}
              academicYear={currentConfig?.academicYear || ""}
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

          <div className="flex items-center gap-3 justify-end">
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
    </div>
  );
};

// Helper to build session display string
function buildSessionDisplay(
  session: { type?: string; year?: string } | undefined,
  config: ClassConfig | null
): string {
  if (!session || config?.displaySessions === false) return "";

  const sessionType = session.type || "N";
  const year = session.year || "";

  if (!year) return "";

  const format = config?.sessionDisplayFormat || "short";
  if (format === "full") {
    const typeFull = sessionType === "R" ? "Rattrapage" : "Normale";
    return `${typeFull} ${year}`;
  }
  const typeShort = sessionType === "R" ? "Ratt/" : "N/";
  return `${typeShort}${year}`;
}
