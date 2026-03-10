import React, { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "usehooks-ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Download,
  Loader2,
  User,
  GraduationCap,
  BarChart3,
  Gavel,
  RotateCcw,
  FileSignature,
  Save,
} from "lucide-react";
import { SavedDocumentsList } from "../shared/SavedDocumentsList";
import {
  saveDocument,
  SavedManualDocument,
} from "../shared/manual-document-storage";
import {
  manualAttestationSchema,
  ManualAttestationFormValues,
} from "../shared/manual-entry-schemas";
import {
  calculateGrade,
  calculateMention,
  getCurrentAcademicYear,
} from "@/lib/attestation-generator/utils";
import { openAttestationPreview } from "@/lib/attestation-generator/preview";
import {
  AttestationThemeSettingsPayload,
  defaultAttestationTheme,
} from "@/lib/form-schemas/attestation-theme-settings";
import {
  AdvancedAttestationConfig,
  defaultAdvancedAttestationConfig,
} from "@/lib/form-schemas/advanced-typography";
import { StudentExcelRecord } from "@/lib/helpers/qrcode";

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

export const ManualAttestationEntry: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [savedListKey, setSavedListKey] = useState(0);

  const [schoolSettings] = useLocalStorage("settings", {
    nameFrench: "N/D",
    establishmentType: "ipes",
    nameEnglish: "N/D",
    nameAbreviation: "N/D",
    postalBox: "N/D",
    postalBoxEn: "N/D",
    email: "N/D",
    logo: "",
    universityLogo: "",
    facultyLogo: "",
  });

  const [attestationTheme] = useLocalStorage<AttestationThemeSettingsPayload>(
    "attestation-theme",
    defaultAttestationTheme
  );

  const [advancedConfig] = useLocalStorage<AdvancedAttestationConfig>(
    "attestation-advanced-config",
    defaultAdvancedAttestationConfig
  );

  const [position] = useLocalStorage("attestation-qrcode-position", {
    x: 470,
    y: 220,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ManualAttestationFormValues>({
    resolver: zodResolver(manualAttestationSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      matricule: "",
      dateNaissance: "",
      lieuNaissance: "",
      domaine: "",
      parcours: "",
      specialite: "",
      option: "",
      cycle: "",
      niveau: "",
      finalite: "",
      anneeAcademique: getCurrentAcademicYear(),
      domaineEn: "",
      parcoursEn: "",
      specialiteEn: "",
      optionEn: "",
      finaliteEn: "",
      moyenne: "",
      grade: "",
      mention: "",
      mentionEn: "",
      totalCredit: "60",
      dateJury: "",
      numeroJury: "",
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
    (data: ManualAttestationFormValues): StudentExcelRecord => {
      return {
        NOM: data.nom,
        PRENOM: data.prenom,
        MATRICULE: data.matricule,
        "DATE DE NAISSANCE": data.dateNaissance || "",
        "LIEU DE NAISSANCE": data.lieuNaissance || "",
        DOMAINE: data.domaine || "",
        PARCOURS: data.parcours || "",
        SPECIALITE: data.specialite || "",
        OPTION: data.option || "",
        CYCLE: data.cycle || "",
        NIVEAU: data.niveau || "",
        FINALITE: data.finalite || "",
        "ANNEE ACADEMIQUE": data.anneeAcademique || "",
        MOYENNE: data.moyenne ? parseFloat(String(data.moyenne)) : 0,
        GRADE: data.grade || "",
        MENTION: data.mention || "",
        "TOTAL CREDIT": data.totalCredit || "60",
        "DATE JURY": data.dateJury || "",
        "NUMERO JURY": data.numeroJury || "",
        ETABLISSEMENT: schoolSettings.nameFrench || "",
        DOMAINE_EN: data.domaineEn || "",
        PARCOURS_EN: data.parcoursEn || "",
        SPECIALITE_EN: data.specialiteEn || "",
        OPTION_EN: data.optionEn || "",
        FINALITE_EN: data.finaliteEn || "",
        MENTION_EN: data.mentionEn || "",
      };
    },
    [schoolSettings.nameFrench]
  );

  const getSettings = useCallback(() => {
    return {
      ...schoolSettings,
      theme: attestationTheme,
      advancedConfig: advancedConfig.enableAdvancedTypography
        ? advancedConfig
        : undefined,
    };
  }, [schoolSettings, attestationTheme, advancedConfig]);

  const handlePreview = handleSubmit(async (data) => {
    setIsPreviewing(true);
    try {
      const student = buildStudentRecord(data);
      const settings = getSettings();
      await openAttestationPreview(student, settings, {
        qrCodePosition: position,
        theme: attestationTheme,
        encryptionEnabled: true,
      });
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
      const settings = getSettings();

      const safePosition =
        position &&
        typeof position.x === "number" &&
        typeof position.y === "number"
          ? position
          : { x: 470, y: 220 };

      const pdfData = {
        student,
        settings,
        options: {
          demoMode: false,
          qrCodePosition: safePosition,
          theme: attestationTheme,
          encryptionEnabled: true,
        },
      };

      const pdfBytes = await window.ipcRenderer.invoke(
        "generate-attestation-pdf",
        pdfData
      );

      if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Attestation_${data.nom}_${data.prenom}.pdf`;
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
        type: "attestation",
        label: data.anneeAcademique || "",
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
    reset(doc.formData as ManualAttestationFormValues);
  };

  const handleNew = () => {
    setEditingDocId(null);
    reset();
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <FileSignature className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Saisie Manuelle - Attestation</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez les donnees d'un etudiant pour generer une attestation de
            reussite
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
        type="attestation"
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
              <Label htmlFor="nom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                placeholder="DUPONT"
                {...register("nom")}
                className={errors.nom ? "border-red-500" : ""}
              />
              {errors.nom && (
                <p className="text-xs text-red-500">{errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prenom">
                Prenom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prenom"
                placeholder="Jean"
                {...register("prenom")}
                className={errors.prenom ? "border-red-500" : ""}
              />
              {errors.prenom && (
                <p className="text-xs text-red-500">{errors.prenom.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="matricule">
                Matricule <span className="text-red-500">*</span>
              </Label>
              <Input
                id="matricule"
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
              <Label htmlFor="dateNaissance">Date de Naissance</Label>
              <Input
                id="dateNaissance"
                placeholder="01/01/2000"
                {...register("dateNaissance")}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="lieuNaissance">Lieu de Naissance</Label>
              <Input
                id="lieuNaissance"
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="domaine">Domaine</Label>
                <Input
                  id="domaine"
                  placeholder="Sciences et Technologies"
                  {...register("domaine")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parcours">Parcours</Label>
                <Input
                  id="parcours"
                  placeholder="Informatique"
                  {...register("parcours")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="specialite">Specialite</Label>
                <Input
                  id="specialite"
                  placeholder="Genie Logiciel"
                  {...register("specialite")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="option">Option</Label>
                <Input
                  id="option"
                  placeholder=""
                  {...register("option")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cycle">Cycle</Label>
                <Input
                  id="cycle"
                  placeholder="Licence / BTS"
                  {...register("cycle")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="niveau">Niveau</Label>
                <Input
                  id="niveau"
                  placeholder="3"
                  {...register("niveau")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="finalite">Finalite</Label>
                <Input
                  id="finalite"
                  placeholder="Professionnelle"
                  {...register("finalite")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anneeAcademique">Annee Academique</Label>
                <Input
                  id="anneeAcademique"
                  placeholder="2025/2026"
                  {...register("anneeAcademique")}
                />
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Traductions anglaises (optionnel)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="domaineEn">Domain (EN)</Label>
                  <Input
                    id="domaineEn"
                    placeholder="Science and Technology"
                    {...register("domaineEn")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parcoursEn">Course (EN)</Label>
                  <Input
                    id="parcoursEn"
                    placeholder="Computer Science"
                    {...register("parcoursEn")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="specialiteEn">Specialty (EN)</Label>
                  <Input
                    id="specialiteEn"
                    placeholder="Software Engineering"
                    {...register("specialiteEn")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="optionEn">Option (EN)</Label>
                  <Input
                    id="optionEn"
                    placeholder=""
                    {...register("optionEn")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="finaliteEn">Finality (EN)</Label>
                  <Input
                    id="finaliteEn"
                    placeholder="Professional"
                    {...register("finaliteEn")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 - Resultats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resultats
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="moyenne">Moyenne (/20)</Label>
              <Input
                id="moyenne"
                type="number"
                step="0.01"
                min="0"
                max="20"
                placeholder="14.50"
                {...register("moyenne")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade">
                Grade{" "}
                <Badge variant="outline" className="ml-1 text-xs">
                  auto
                </Badge>
              </Label>
              <Input id="grade" placeholder="B+" {...register("grade")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mention">
                Mention{" "}
                <Badge variant="outline" className="ml-1 text-xs">
                  auto
                </Badge>
              </Label>
              <Input id="mention" placeholder="Bien" {...register("mention")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mentionEn">
                Mention (EN){" "}
                <Badge variant="outline" className="ml-1 text-xs">
                  auto
                </Badge>
              </Label>
              <Input
                id="mentionEn"
                placeholder="Good"
                {...register("mentionEn")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalCredit">Total Credits</Label>
              <Input
                id="totalCredit"
                placeholder="60"
                {...register("totalCredit")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4 - Jury */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Jury
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dateJury">Date du Jury</Label>
              <Input
                id="dateJury"
                placeholder="15/07/2026"
                {...register("dateJury")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numeroJury">Numero du Jury</Label>
              <Input
                id="numeroJury"
                placeholder="001"
                {...register("numeroJury")}
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
