import React from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { ManualDiplomaFormValues } from "./manual-entry-schemas";

const REQUIRED_FIELDS: Array<{ key: keyof ManualDiplomaFormValues; label: string }> = [
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prénom" },
  { key: "matricule", label: "Matricule" },
  { key: "dateNaissance", label: "Date de naissance" },
  { key: "lieuNaissance", label: "Lieu de naissance" },
  { key: "parcours", label: "Parcours" },
  { key: "specialite", label: "Spécialité" },
  { key: "titreDiplomeFr", label: "Titre FR" },
  { key: "titreDiplomeEn", label: "Titre EN" },
  { key: "anneeObtention", label: "Année d'obtention" },
  { key: "moyenne", label: "Moyenne" },
  { key: "grade", label: "Grade" },
  { key: "mention", label: "Mention" },
  { key: "dateJuryAdmission", label: "Date jury admission" },
  { key: "dateJuryDeliberation", label: "Date jury délibération" },
];

interface CompletionIndicatorProps {
  values: ManualDiplomaFormValues;
}

export const CompletionIndicator: React.FC<CompletionIndicatorProps> = ({ values }) => {
  const missing = REQUIRED_FIELDS.filter(({ key }) => {
    const val = values[key];
    return val === undefined || val === null || String(val).trim() === "";
  });

  const count = REQUIRED_FIELDS.length - missing.length;
  const total = REQUIRED_FIELDS.length;
  const percent = Math.round((count / total) * 100);
  const isComplete = missing.length === 0;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span className="font-medium">
            {isComplete ? "Formulaire complet — prêt à générer" : "Complétude du formulaire"}
          </span>
        </div>
        <span
          className={`text-xs font-semibold ${
            isComplete ? "text-green-600" : percent >= 60 ? "text-amber-600" : "text-red-500"
          }`}
        >
          {count}/{total}
        </span>
      </div>
      <Progress
        value={percent}
        className={`h-1.5 ${isComplete ? "[&>div]:bg-green-500" : percent >= 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
      />
      {!isComplete && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Champs manquants: {missing.map((f) => f.label).join(" · ")}
        </p>
      )}
    </div>
  );
};
