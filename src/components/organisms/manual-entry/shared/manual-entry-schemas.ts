import { z } from "zod";

// Schema pour les informations etudiant (commun aux 2 pages)
export const studentInfoSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prenom est requis"),
  matricule: z.string().min(1, "Le matricule est requis"),
  dateNaissance: z.string().optional().default(""),
  lieuNaissance: z.string().optional().default(""),
});

export type StudentInfoFormValues = z.infer<typeof studentInfoSchema>;

// Schema pour une note EC dans le releve
export const ecGradeSchema = z.object({
  ecId: z.string(),
  ecName: z.string(),
  note: z.union([z.number(), z.string()]).optional(),
  weight: z.number().optional().default(1),
  noteBase: z.number().optional().default(20),
  displayBase: z.number().optional().default(20),
});

// Schema pour une UE avec ses notes
export const ueGradeSchema = z.object({
  ueId: z.string(),
  ueName: z.string(),
  ueCode: z.string(),
  ueCredits: z.number(),
  useExcelAverage: z.boolean().optional().default(false),
  ueAverageManual: z.union([z.number(), z.string()]).optional(),
  displayBase: z.number().optional().default(20),
  forceValidateCredits: z.boolean().optional().default(false),
  ecs: z.array(ecGradeSchema),
  session: z.object({
    type: z.enum(["N", "R"]).default("N"),
    year: z.string().optional().default(""),
  }).optional(),
});

// Schema pour le formulaire complet de saisie de releve
export const manualTranscriptSchema = z.object({
  studentInfo: studentInfoSchema,
  ues: z.array(ueGradeSchema),
});

export type ManualTranscriptFormValues = z.infer<typeof manualTranscriptSchema>;
export type UEGradeValues = z.infer<typeof ueGradeSchema>;
export type ECGradeValues = z.infer<typeof ecGradeSchema>;

// Schema pour la saisie manuelle d'attestation
export const manualAttestationSchema = z.object({
  // Identite
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prenom est requis"),
  matricule: z.string().min(1, "Le matricule est requis"),
  dateNaissance: z.string().optional().default(""),
  lieuNaissance: z.string().optional().default(""),
  // Informations academiques
  domaine: z.string().optional().default(""),
  parcours: z.string().optional().default(""),
  specialite: z.string().optional().default(""),
  option: z.string().optional().default(""),
  cycle: z.string().optional().default(""),
  niveau: z.string().optional().default(""),
  finalite: z.string().optional().default(""),
  anneeAcademique: z.string().optional().default(""),
  // Champs EN optionnels
  domaineEn: z.string().optional().default(""),
  parcoursEn: z.string().optional().default(""),
  specialiteEn: z.string().optional().default(""),
  optionEn: z.string().optional().default(""),
  finaliteEn: z.string().optional().default(""),
  // Resultats
  moyenne: z.union([z.number(), z.string()]).optional(),
  grade: z.string().optional().default(""),
  mention: z.string().optional().default(""),
  mentionEn: z.string().optional().default(""),
  totalCredit: z.string().optional().default("60"),
  // Jury
  dateJury: z.string().optional().default(""),
  numeroJury: z.string().optional().default(""),
});

export type ManualAttestationFormValues = z.infer<typeof manualAttestationSchema>;

// Schema pour la saisie manuelle de diplome
export const manualDiplomaSchema = z.object({
  // Identite
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prenom est requis"),
  matricule: z.string().min(1, "Le matricule est requis"),
  dateNaissance: z.string().optional().default(""),
  lieuNaissance: z.string().optional().default(""),
  // Informations academiques
  parcours: z.string().optional().default(""),
  specialite: z.string().optional().default(""),
  option: z.string().optional().default(""),
  optionEn: z.string().optional().default(""),
  anneeObtention: z.string().optional().default(""),
  // Titres du diplome
  titreDiplomeFr: z.string().optional().default(""),
  titreDiplomeEn: z.string().optional().default(""),
  // Resultats
  moyenne: z.union([z.number(), z.string()]).optional(),
  grade: z.string().optional().default(""),
  mention: z.string().optional().default(""),
  mentionEn: z.string().optional().default(""),
  // Jury
  dateJuryAdmission: z.string().optional().default(""),
  dateJuryDeliberation: z.string().optional().default(""),
});

export type ManualDiplomaFormValues = z.infer<typeof manualDiplomaSchema>;
