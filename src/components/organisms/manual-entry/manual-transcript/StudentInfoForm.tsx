import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { ManualTranscriptFormValues } from "../shared/manual-entry-schemas";

interface StudentInfoFormProps {
  register: UseFormRegister<ManualTranscriptFormValues>;
  errors: FieldErrors<ManualTranscriptFormValues>;
}

export const StudentInfoForm: React.FC<StudentInfoFormProps> = ({
  register,
  errors,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-4 w-4" />
          Identite de l'etudiant
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="student-nom">
            Nom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="student-nom"
            placeholder="DUPONT"
            {...register("studentInfo.nom")}
            className={errors.studentInfo?.nom ? "border-red-500" : ""}
          />
          {errors.studentInfo?.nom && (
            <p className="text-xs text-red-500">
              {errors.studentInfo.nom.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="student-prenom">
            Prenom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="student-prenom"
            placeholder="Jean"
            {...register("studentInfo.prenom")}
            className={errors.studentInfo?.prenom ? "border-red-500" : ""}
          />
          {errors.studentInfo?.prenom && (
            <p className="text-xs text-red-500">
              {errors.studentInfo.prenom.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="student-matricule">
            Matricule <span className="text-red-500">*</span>
          </Label>
          <Input
            id="student-matricule"
            placeholder="20B001"
            {...register("studentInfo.matricule")}
            className={errors.studentInfo?.matricule ? "border-red-500" : ""}
          />
          {errors.studentInfo?.matricule && (
            <p className="text-xs text-red-500">
              {errors.studentInfo.matricule.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="student-dateNaissance">Date de Naissance</Label>
          <Input
            id="student-dateNaissance"
            placeholder="01/01/2000"
            {...register("studentInfo.dateNaissance")}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="student-lieuNaissance">Lieu de Naissance</Label>
          <Input
            id="student-lieuNaissance"
            placeholder="Douala"
            {...register("studentInfo.lieuNaissance")}
          />
        </div>
      </CardContent>
    </Card>
  );
};
