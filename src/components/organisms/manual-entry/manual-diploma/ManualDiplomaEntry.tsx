import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "usehooks-ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  Download,
  Loader2,
  User,
  GraduationCap,
  BarChart3,
  Gavel,
  RotateCcw,
  ScrollText,
  FileText,
  Save,
  AlertTriangle,
  ListPlus,
  Trash2,
  Settings2,
  X,
  PackagePlus,
  CheckCircle2,
} from "lucide-react";
import { SavedDocumentsList } from "../shared/SavedDocumentsList";
import {
  saveDocument,
  SavedManualDocument,
  getDocumentsByType,
  updateDocumentStatus,
  addToDiplomaBatch,
  removeFromDiplomaBatch,
  getDiplomaBatch,
  clearDiplomaBatch,
  BatchEntry,
  findDocumentByMatricule,
} from "../shared/manual-document-storage";
import {
  manualDiplomaSchema,
  ManualDiplomaFormValues,
} from "../shared/manual-entry-schemas";
import {
  calculateGrade,
  calculateMention,
} from "@/lib/attestation-generator/utils";
import { DiplomaStudentRecord } from "@/lib/diploma-generator/types";
import {
  defaultDiplomaTheme,
  DiplomaThemeSettingsPayload,
  mergeDiplomaTheme,
} from "@/lib/form-schemas/diploma-theme-settings";
import { generateDiplomaHTML } from "@/lib/diploma-generator/html-generator";
import { DatePickerInput } from "../shared/DatePickerInput";
import { AutocompleteInput } from "../shared/AutocompleteInput";
import { CompletionIndicator } from "../shared/CompletionIndicator";
import {
  getMinMoyenneThreshold,
  setMinMoyenneThreshold,
} from "@/components/organisms/diploma-generator/diploma-validator";

function translateMentionToEnglish(mentionFR: string): string {
  const translations: Record<string, string> = {
    Excellent: "Excellent",
    "Tres Bien": "Very Good",
    "Très Bien": "Very Good",
    Bien: "Good",
    "Assez Bien": "Fairly Good",
    Passable: "Satisfactory",
    Insuffisant: "Insufficient",
    Faible: "Weak",
    "Tres Faible": "Very Weak",
    "Très Faible": "Very Weak",
    Nul: "Null",
  };
  return translations[mentionFR] || mentionFR;
}

export const ManualDiplomaEntry: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [savedListKey, setSavedListKey] = useState(0);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>("");

  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<SavedManualDocument | null>(null);

  // Configurable threshold
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [minMoyenne, setMinMoyenne] = useState(() => getMinMoyenneThreshold());
  const [thresholdInput, setThresholdInput] = useState(() =>
    String(getMinMoyenneThreshold())
  );

  // Batch
  const [batch, setBatch] = useState<BatchEntry[]>(() => getDiplomaBatch());
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const [schoolSettings] = useLocalStorage("settings", {
    nameFrench: "N/D",
    nameEnglish: "N/D",
    nameAbreviation: "N/D",
    logo: "",
    universityLogo: "",
    facultyLogo: "",
    coatOfArms: "",
    ministryLogo: "",
    watermarkLogo: "",
  });

  const [storedTheme] = useLocalStorage<Partial<DiplomaThemeSettingsPayload>>(
    "diploma-theme",
    defaultDiplomaTheme
  );
  const diplomaTheme = mergeDiplomaTheme(storedTheme);
  const isDemoMode = localStorage.getItem("demo_mode") === "true";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ManualDiplomaFormValues>({
    resolver: zodResolver(manualDiplomaSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      matricule: "",
      dateNaissance: "",
      lieuNaissance: "",
      parcours: "",
      specialite: "",
      option: "",
      optionEn: "",
      anneeObtention: new Date().getFullYear().toString(),
      titreDiplomeFr: "",
      titreDiplomeEn: "",
      moyenne: "",
      grade: "",
      mention: "",
      mentionEn: "",
      dateJuryAdmission: "",
      dateJuryDeliberation: "",
    },
  });

  const watchedValues = watch();
  const watchedMoyenne = watchedValues.moyenne;
  const watchedMatricule = watchedValues.matricule;

  // Auto-calcul grade/mention quand moyenne change
  useEffect(() => {
    const numMoyenne =
      typeof watchedMoyenne === "string"
        ? parseFloat(watchedMoyenne)
        : watchedMoyenne;
    if (numMoyenne && !isNaN(numMoyenne as number) && (numMoyenne as number) > 0) {
      const autoGrade = calculateGrade(numMoyenne as number);
      const autoMention = calculateMention(numMoyenne as number);
      setValue("grade", autoGrade);
      setValue("mention", autoMention);
      setValue("mentionEn", translateMentionToEnglish(autoMention));
    }
  }, [watchedMoyenne, setValue]);

  // Suggestions pour autocomplétion (depuis docs sauvegardés)
  const autocompleSuggestions = useMemo(() => {
    const docs = getDocumentsByType("diploma");
    const parcours = docs.map((d) => d.formData.parcours).filter(Boolean);
    const specialite = docs.map((d) => d.formData.specialite).filter(Boolean);
    const option = docs.map((d) => d.formData.option).filter(Boolean);
    const titreFr = docs.map((d) => d.formData.titreDiplomeFr).filter(Boolean);
    const titreEn = docs.map((d) => d.formData.titreDiplomeEn).filter(Boolean);
    return { parcours, specialite, option, titreFr, titreEn };
  }, [savedListKey]);

  // Détection de doublon sur le matricule
  const handleMatriculeBlur = useCallback(() => {
    const mat = watchedMatricule?.trim();
    if (!mat || editingDocId) {
      setDuplicateWarning(null);
      return;
    }
    const existing = findDocumentByMatricule("diploma", mat);
    if (existing && existing.id !== editingDocId) {
      setDuplicateWarning(existing);
    } else {
      setDuplicateWarning(null);
    }
  }, [watchedMatricule, editingDocId]);

  const buildStudentRecord = useCallback(
    (data: ManualDiplomaFormValues): DiplomaStudentRecord => ({
      NOM: data.nom,
      PRENOM: data.prenom,
      MATRICULE: data.matricule,
      "DATE DE NAISSANCE": data.dateNaissance || "",
      "LIEU DE NAISSANCE": data.lieuNaissance || "",
      PARCOURS: data.parcours || "",
      SPECIALITE: data.specialite || "",
      OPTION: data.option || "",
      OPTION_EN: data.optionEn || "",
      "ANNEE OBTENTION": data.anneeObtention || "",
      MOYENNE: data.moyenne ? parseFloat(String(data.moyenne)) : 0,
      GRADE: data.grade || "",
      MENTION: data.mention || "",
      MENTION_EN: data.mentionEn || "",
      "TITRE DIPLOME FR": data.titreDiplomeFr || "",
      "TITRE DIPLOME EN": data.titreDiplomeEn || "",
      "DATE JURY ADMISSION": data.dateJuryAdmission || "",
      "DATE JURY DELIBERATION": data.dateJuryDeliberation || "",
    }),
    []
  );

  // ─── Prévisualisation intégrée ─────────────────────────────────────────────
  const handlePreview = handleSubmit(async (data) => {
    setPreviewLoading(true);
    try {
      const student = buildStudentRecord(data);
      const html = await generateDiplomaHTML(
        student,
        { ...schoolSettings, theme: diplomaTheme },
        { theme: diplomaTheme, demoMode: true }
      );
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Erreur prévisualisation:", error);
    } finally {
      setPreviewLoading(false);
    }
  });

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl("");
    }
  };

  // ─── Export PDF ───────────────────────────────────────────────────────────
  const handleExport = handleSubmit(async (data) => {
    setIsGenerating(true);
    try {
      const student = buildStudentRecord(data);
      const pdfBytes = await window.ipcRenderer.invoke("generate-diploma-pdf", {
        student,
        settings: { ...schoolSettings, theme: diplomaTheme },
        options: { theme: diplomaTheme, demoMode: isDemoMode },
      });
      if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Diplome_${data.nom}_${data.prenom}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        if (editingDocId) updateDocumentStatus(editingDocId, "genere");
        setSavedListKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Erreur génération PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  });

  // ─── Sauvegarde ───────────────────────────────────────────────────────────
  const handleSave = handleSubmit((data) => {
    const doc = saveDocument(
      {
        type: "diploma",
        label: data.titreDiplomeFr || data.anneeObtention || "",
        studentName: `${data.nom} ${data.prenom}`,
        studentMatricule: data.matricule,
        formData: data,
        status: "pret",
      },
      editingDocId || undefined
    );
    setEditingDocId(doc.id);
    setDuplicateWarning(null);
    setSavedListKey((k) => k + 1);
  });

  const handleLoadDoc = (doc: SavedManualDocument) => {
    setEditingDocId(doc.id);
    setDuplicateWarning(null);
    reset(doc.formData as ManualDiplomaFormValues);
  };

  const handleNew = () => {
    setEditingDocId(null);
    setDuplicateWarning(null);
    reset();
  };

  // ─── Lot (batch) ──────────────────────────────────────────────────────────
  const handleAddToBatch = handleSubmit((data) => {
    const student = buildStudentRecord(data);
    const entry = addToDiplomaBatch({
      studentName: `${data.nom} ${data.prenom}`,
      studentMatricule: data.matricule,
      record: student as unknown as Record<string, any>,
    });
    setBatch(getDiplomaBatch());
    return entry;
  });

  const handleRemoveFromBatch = (id: string) => {
    removeFromDiplomaBatch(id);
    setBatch(getDiplomaBatch());
  };

  const handleClearBatch = () => {
    clearDiplomaBatch();
    setBatch([]);
  };

  const handleGenerateBatch = async () => {
    if (batch.length === 0) return;
    setBatchGenerating(true);
    setBatchProgress(0);
    let count = 0;
    for (const entry of batch) {
      try {
        const pdfBytes = await window.ipcRenderer.invoke("generate-diploma-pdf", {
          student: entry.record,
          settings: { ...schoolSettings, theme: diplomaTheme },
          options: { theme: diplomaTheme, demoMode: isDemoMode },
        });
        if (pdfBytes) {
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Diplome_${entry.studentMatricule}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch (err) {
        console.error(`Erreur batch pour ${entry.studentMatricule}:`, err);
      }
      count++;
      setBatchProgress(Math.round((count / batch.length) * 100));
    }
    setBatchGenerating(false);
  };

  // ─── Seuil configurable ───────────────────────────────────────────────────
  const handleSaveThreshold = () => {
    const val = parseFloat(thresholdInput);
    if (!isNaN(val) && val >= 0 && val <= 20) {
      setMinMoyenneThreshold(val);
      setMinMoyenne(val);
    }
    setThresholdOpen(false);
  };

  const currentMoyenne = parseFloat(String(watchedValues.moyenne || "0"));
  const moyenneInsuffisante =
    !isNaN(currentMoyenne) && currentMoyenne > 0 && currentMoyenne < minMoyenne;

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Saisie Manuelle — Diplôme</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez les données d'un étudiant pour générer un diplôme
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {editingDocId && (
            <Badge variant="secondary" className="text-xs">
              Modification en cours
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={`Seuil minimum: ${minMoyenne}/20 — Cliquer pour modifier`}
            onClick={() => {
              setThresholdInput(String(minMoyenne));
              setThresholdOpen(true);
            }}
          >
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Indicateur de complétude */}
      <CompletionIndicator values={watchedValues} />

      {/* Avertissement doublon matricule */}
      {duplicateWarning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            Un diplôme avec le matricule <strong>{duplicateWarning.studentMatricule}</strong> existe déjà
            pour <strong>{duplicateWarning.studentName}</strong>.
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-amber-400 text-amber-800 hover:bg-amber-100"
            onClick={() => handleLoadDoc(duplicateWarning)}
          >
            Charger
          </Button>
          <button onClick={() => setDuplicateWarning(null)} className="text-amber-600 hover:text-amber-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Avertissement moyenne insuffisante */}
      {moyenneInsuffisante && (
        <div className="flex items-center gap-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Moyenne {currentMoyenne.toFixed(2)}/20 inférieure au seuil de {minMoyenne}/20 — le diplôme ne sera pas générable en lot.
        </div>
      )}

      {/* Documents sauvegardés */}
      <SavedDocumentsList
        key={savedListKey}
        type="diploma"
        onLoad={handleLoadDoc}
        onDuplicate={(doc) => {
          setSavedListKey((k) => k + 1);
          handleLoadDoc(doc);
        }}
      />

      <form className="space-y-6">
        {/* Section 1 — Identité */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Identité de l'étudiant
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-nom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="d-nom"
                placeholder="DUPONT"
                {...register("nom")}
                className={errors.nom ? "border-red-500" : ""}
              />
              {errors.nom && (
                <p className="text-xs text-red-500">{errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-prenom">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="d-prenom"
                placeholder="Jean"
                {...register("prenom")}
                className={errors.prenom ? "border-red-500" : ""}
              />
              {errors.prenom && (
                <p className="text-xs text-red-500">{errors.prenom.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-matricule">
                Matricule <span className="text-red-500">*</span>
              </Label>
              <Input
                id="d-matricule"
                placeholder="20B001"
                {...register("matricule", { onBlur: handleMatriculeBlur })}
                className={errors.matricule ? "border-red-500" : ""}
              />
              {errors.matricule && (
                <p className="text-xs text-red-500">{errors.matricule.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-dateNaissance">Date de Naissance</Label>
              <Controller
                control={control}
                name="dateNaissance"
                render={({ field }) => (
                  <DatePickerInput
                    id="d-dateNaissance"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="d-lieuNaissance">Lieu de Naissance</Label>
              <Input
                id="d-lieuNaissance"
                placeholder="Douala"
                {...register("lieuNaissance")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Informations académiques */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Informations académiques
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-parcours">Parcours</Label>
              <AutocompleteInput
                id="d-parcours"
                placeholder="Informatique"
                suggestions={autocompleSuggestions.parcours}
                {...register("parcours")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-specialite">Spécialité</Label>
              <AutocompleteInput
                id="d-specialite"
                placeholder="Génie Logiciel"
                suggestions={autocompleSuggestions.specialite}
                {...register("specialite")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-option">Option (FR)</Label>
              <AutocompleteInput
                id="d-option"
                placeholder=""
                suggestions={autocompleSuggestions.option}
                {...register("option")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-optionEn">Option (EN)</Label>
              <Input
                id="d-optionEn"
                placeholder=""
                {...register("optionEn")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-anneeObtention">Année d'obtention</Label>
              <Input
                id="d-anneeObtention"
                placeholder="2026"
                {...register("anneeObtention")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3 — Titres du diplôme */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Titres du diplôme
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-titreFr">Titre du diplôme (FR)</Label>
              <AutocompleteInput
                id="d-titreFr"
                placeholder="DIPLOME D'ETAT DE DOCTEUR EN MEDECINE GENERALE"
                suggestions={autocompleSuggestions.titreFr}
                {...register("titreDiplomeFr")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-titreEn">Titre du diplôme (EN)</Label>
              <AutocompleteInput
                id="d-titreEn"
                placeholder="DOCTOR OF GENERAL MEDICINE STATE DEGREE"
                suggestions={autocompleSuggestions.titreEn}
                {...register("titreDiplomeEn")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4 — Résultats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Résultats
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Seuil: {minMoyenne}/20
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-moyenne">Moyenne (/20)</Label>
              <Input
                id="d-moyenne"
                type="number"
                step="0.01"
                min="0"
                max="20"
                placeholder="14.50"
                className={moyenneInsuffisante ? "border-orange-400" : ""}
                {...register("moyenne")}
              />
              {moyenneInsuffisante && (
                <p className="text-xs text-orange-600">
                  En dessous du seuil ({minMoyenne}/20)
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-grade">
                Grade{" "}
                <Badge variant="outline" className="ml-1 text-xs">auto</Badge>
              </Label>
              <Input id="d-grade" placeholder="B+" {...register("grade")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-mention">
                Mention{" "}
                <Badge variant="outline" className="ml-1 text-xs">auto</Badge>
              </Label>
              <Input id="d-mention" placeholder="Bien" {...register("mention")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-mentionEn">
                Mention (EN){" "}
                <Badge variant="outline" className="ml-1 text-xs">auto</Badge>
              </Label>
              <Input id="d-mentionEn" placeholder="Good" {...register("mentionEn")} />
            </div>
          </CardContent>
        </Card>

        {/* Section 5 — Jury */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Jury
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-dateJuryAdmission">Date du Jury d'Admission</Label>
              <Controller
                control={control}
                name="dateJuryAdmission"
                render={({ field }) => (
                  <DatePickerInput
                    id="d-dateJuryAdmission"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-dateJuryDeliberation">Date du Jury de Délibération</Label>
              <Controller
                control={control}
                name="dateJuryDeliberation"
                render={({ field }) => (
                  <DatePickerInput
                    id="d-dateJuryDeliberation"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleNew}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {editingDocId ? "Nouveau" : "Réinitialiser"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {editingDocId ? "Mettre à jour" : "Sauvegarder"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddToBatch}
            className="gap-2"
            title="Ajouter au lot de génération"
          >
            <ListPlus className="h-4 w-4" />
            Ajouter au lot
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handlePreview}
            disabled={previewLoading}
            className="gap-2"
          >
            {previewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Aperçu
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
      </form>

      {/* ─── Lot de génération ─────────────────────────────────────────────── */}
      {batch.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PackagePlus className="h-4 w-4 text-primary" />
              Lot de génération ({batch.length} étudiant{batch.length > 1 ? "s" : ""})
              <div className="ml-auto flex items-center gap-2">
                {batchGenerating && (
                  <span className="text-xs text-muted-foreground">
                    {batchProgress}%
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={handleClearBatch}
                  disabled={batchGenerating}
                >
                  Vider
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleGenerateBatch}
                  disabled={batchGenerating}
                >
                  {batchGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Générer le lot
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {batchGenerating && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
            )}
            {batch.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded border bg-muted/20 text-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">{entry.studentName}</span>
                  <Badge variant="outline" className="text-xs">
                    {entry.studentMatricule}
                  </Badge>
                </div>
                <button
                  onClick={() => handleRemoveFromBatch(entry.id)}
                  disabled={batchGenerating}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── Modal prévisualisation ────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu — {watchedValues.nom} {watchedValues.prenom}
              <Badge variant="secondary" className="ml-2 text-xs">DÉMO</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-4 pb-4">
            {previewBlobUrl && (
              <iframe
                src={previewBlobUrl}
                className="w-full h-full rounded border"
                title="Aperçu diplôme"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Modal seuil de moyenne ────────────────────────────────────────── */}
      <Dialog open={thresholdOpen} onOpenChange={setThresholdOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Seuil minimum de moyenne
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Les diplômes avec une moyenne inférieure à ce seuil ne pourront pas être générés en lot.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">/ 20</span>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setThresholdOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveThreshold}>Appliquer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
