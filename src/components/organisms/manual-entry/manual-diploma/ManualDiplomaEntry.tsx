import React, { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "usehooks-ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { SavedDocumentsList } from "../shared/SavedDocumentsList";
import {
  saveDocument,
  SavedManualDocument,
} from "../shared/manual-document-storage";
import {
  manualDiplomaSchema,
  ManualDiplomaFormValues,
} from "../shared/manual-entry-schemas";
import {
  calculateGrade,
  calculateMention,
} from "@/lib/attestation-generator/utils";
import { openDiplomaPreview } from "@/lib/diploma-generator/preview";
import { DiplomaStudentRecord } from "@/lib/diploma-generator/types";
import {
  defaultDiplomaTheme,
  DiplomaThemeSettingsPayload,
  mergeDiplomaTheme,
} from "@/lib/form-schemas/diploma-theme-settings";

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
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [savedListKey, setSavedListKey] = useState(0);

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

  const watchedMoyenne = watch("moyenne");

  // Auto-calcul du grade et de la mention quand la moyenne change
  useEffect(() => {
    const numMoyenne =
      typeof watchedMoyenne === "string"
        ? parseFloat(watchedMoyenne)
        : watchedMoyenne;
    if (numMoyenne && !isNaN(numMoyenne) && numMoyenne > 0) {
      const autoGrade = calculateGrade(numMoyenne);
      const autoMention = calculateMention(numMoyenne);
      const autoMentionEn = translateMentionToEnglish(autoMention);
      setValue("grade", autoGrade);
      setValue("mention", autoMention);
      setValue("mentionEn", autoMentionEn);
    }
  }, [watchedMoyenne, setValue]);

  const buildStudentRecord = useCallback(
    (data: ManualDiplomaFormValues): DiplomaStudentRecord => {
      return {
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
      };
    },
    []
  );

  const handlePreview = handleSubmit(async (data) => {
    setIsPreviewing(true);
    try {
      const student = buildStudentRecord(data);
      await openDiplomaPreview(
        student,
        {
          ...schoolSettings,
          theme: diplomaTheme,
        },
        {
          theme: diplomaTheme,
          demoMode: isDemoMode,
        }
      );
    } catch (error) {
      console.error("Erreur lors de la preview:", error);
    } finally {
      setIsPreviewing(false);
    }
  });

  const handleExport = handleSubmit(async (data) => {
    setIsGenerating(true);
    try {
      const student = buildStudentRecord(data);

      const pdfBytes = await window.ipcRenderer.invoke("generate-diploma-pdf", {
        student,
        settings: {
          ...schoolSettings,
          theme: diplomaTheme,
        },
        options: {
          theme: diplomaTheme,
          demoMode: isDemoMode,
        },
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
      }
    } catch (error) {
      console.error("Erreur lors de la generation du PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  });

  const handleSave = handleSubmit((data) => {
    const doc = saveDocument(
      {
        type: "diploma",
        label: data.titreDiplomeFr || data.anneeObtention || "",
        studentName: `${data.nom} ${data.prenom}`,
        studentMatricule: data.matricule,
        formData: data,
      },
      editingDocId || undefined
    );
    setEditingDocId(doc.id);
    setSavedListKey((k) => k + 1);
  });

  const handleLoadDoc = (doc: SavedManualDocument) => {
    setEditingDocId(doc.id);
    reset(doc.formData as ManualDiplomaFormValues);
  };

  const handleNew = () => {
    setEditingDocId(null);
    reset();
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Saisie Manuelle - Diplome</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez les donnees d'un etudiant pour generer un diplome
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
        type="diploma"
        onLoad={handleLoadDoc}
      />

      <form className="space-y-6">
        {/* Section 1 - Identite */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Identite de l'etudiant
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
                Prenom <span className="text-red-500">*</span>
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
                {...register("matricule")}
                className={errors.matricule ? "border-red-500" : ""}
              />
              {errors.matricule && (
                <p className="text-xs text-red-500">
                  {errors.matricule.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-dateNaissance">Date de Naissance</Label>
              <Input
                id="d-dateNaissance"
                placeholder="01/01/2000"
                {...register("dateNaissance")}
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

        {/* Section 2 - Informations academiques */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Informations academiques
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-parcours">Parcours</Label>
              <Input
                id="d-parcours"
                placeholder="Informatique"
                {...register("parcours")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-specialite">Specialite</Label>
              <Input
                id="d-specialite"
                placeholder="Genie Logiciel"
                {...register("specialite")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-option">Option</Label>
              <Input
                id="d-option"
                placeholder=""
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
              <Label htmlFor="d-anneeObtention">Annee d'obtention</Label>
              <Input
                id="d-anneeObtention"
                placeholder="2026"
                {...register("anneeObtention")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3 - Titres du diplome */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Titres du diplome
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-titreFr">Titre du diplome (FR)</Label>
              <Input
                id="d-titreFr"
                placeholder="DIPLOME D'ETAT DE DOCTEUR EN MEDECINE GENERALE"
                {...register("titreDiplomeFr")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-titreEn">Titre du diplome (EN)</Label>
              <Input
                id="d-titreEn"
                placeholder="DOCTOR OF GENERAL MEDICINE STATE DEGREE"
                {...register("titreDiplomeEn")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4 - Resultats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resultats
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
                {...register("moyenne")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-grade">
                Grade{" "}
                <Badge variant="outline" className="ml-1 text-xs">
                  auto
                </Badge>
              </Label>
              <Input id="d-grade" placeholder="B+" {...register("grade")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-mention">
                Mention{" "}
                <Badge variant="outline" className="ml-1 text-xs">
                  auto
                </Badge>
              </Label>
              <Input
                id="d-mention"
                placeholder="Bien"
                {...register("mention")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-mentionEn">
                Mention (EN){" "}
                <Badge variant="outline" className="ml-1 text-xs">
                  auto
                </Badge>
              </Label>
              <Input
                id="d-mentionEn"
                placeholder="Good"
                {...register("mentionEn")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 5 - Jury */}
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
              <Input
                id="d-dateJuryAdmission"
                placeholder="13/10/2020"
                {...register("dateJuryAdmission")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-dateJuryDeliberation">
                Date du Jury de Deliberation
              </Label>
              <Input
                id="d-dateJuryDeliberation"
                placeholder="28/07/2026"
                {...register("dateJuryDeliberation")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
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
            onClick={handleSave}
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
      </form>
    </div>
  );
};
