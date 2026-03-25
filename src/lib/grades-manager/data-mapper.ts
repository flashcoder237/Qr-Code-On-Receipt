import type { DiplomationExportData, TranscriptExportData } from "./types";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/D";
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

function mapMentionToFrench(mention: string | null): string {
  const MAP: Record<string, string> = {
    passable: "Passable",
    assez_bien: "Assez Bien",
    bien: "Bien",
    tres_bien: "Très Bien",
    excellent: "Excellent",
  };
  return mention ? (MAP[mention] ?? mention) : "N/D";
}

// Shape expected by DiplomaGenerator / AttestationGenerator
export type MappedDiplomaRecord = {
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  PARCOURS: string;
  SPECIALITE: string;
  "ANNEE OBTENTION": string;
  MOYENNE: number;
  GRADE: string;
  MENTION: string;
  MENTION_EN: string;
  "TITRE DIPLOME FR": string;
  "TITRE DIPLOME EN": string;
  "DATE JURY ADMISSION": string;
  "DATE JURY DELIBERATION": string;
  OPTION?: string;
  OPTION_EN?: string;
};

export type MappedAttestationRecord = {
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  MOYENNE: number;
  MENTION: string;
  GRADE: string;
  "ANNEE ACADEMIQUE": string;
  PARCOURS: string;
  SPECIALITE: string;
  MENTION_EN?: string;
  DUREE_VALIDE?: string;
};

export type MappedTranscriptRecord = {
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  NIVEAU: string;
  SEMESTRE: string;
  CYCLE: string;
  FILIERE: string;
  "ANNEE ACADEMIQUE": string;
  TOTAL_CREDITS: number;
  ues: Array<{
    code: string;
    name: string;
    credits: number;
    average: number | null;
    decision: string;
    courses: Array<{
      code: string;
      name: string;
      coefficient: number;
      grade: number | null;
      session: string;
    }>;
  }>;
};

export function mapToDiplomaRecords(data: DiplomationExportData): MappedDiplomaRecord[] {
  return data.students
    .filter(
      (s) =>
        s.finalDecision === "admitted" || s.finalDecision === "compensated",
    )
    .map((s) => ({
      NOM: s.lastName.toUpperCase(),
      PRENOM: s.firstName,
      MATRICULE: s.registrationNumber,
      "DATE DE NAISSANCE": s.dateOfBirth ?? "N/D",
      "LIEU DE NAISSANCE": s.placeOfBirth ?? "N/D",
      PARCOURS: data.deliberation.programName,
      SPECIALITE: data.program.specialite ?? data.deliberation.programName,
      "ANNEE OBTENTION": data.deliberation.academicYearName,
      MOYENNE: s.generalAverage ?? 0,
      GRADE: s.gradeLetter ?? "N/D",
      MENTION: mapMentionToFrench(s.mention),
      MENTION_EN: s.mentionEn ?? "N/D",
      "TITRE DIPLOME FR": data.program.diplomaTitleFr ?? data.deliberation.programName,
      "TITRE DIPLOME EN": data.program.diplomaTitleEn ?? data.deliberation.programName,
      "DATE JURY ADMISSION": formatDate(data.deliberation.admissionDate),
      "DATE JURY DELIBERATION": formatDate(data.deliberation.date),
    }));
}

export function mapToAttestationRecords(
  data: DiplomationExportData,
): MappedAttestationRecord[] {
  return data.students
    .filter(
      (s) =>
        s.finalDecision === "admitted" || s.finalDecision === "compensated",
    )
    .map((s) => ({
      NOM: s.lastName.toUpperCase(),
      PRENOM: s.firstName,
      MATRICULE: s.registrationNumber,
      "DATE DE NAISSANCE": s.dateOfBirth ?? "N/D",
      "LIEU DE NAISSANCE": s.placeOfBirth ?? "N/D",
      MOYENNE: s.generalAverage ?? 0,
      MENTION: mapMentionToFrench(s.mention),
      GRADE: s.gradeLetter ?? "N/D",
      "ANNEE ACADEMIQUE": data.deliberation.academicYearName,
      PARCOURS: data.deliberation.programName,
      SPECIALITE: data.program.specialite ?? data.deliberation.programName,
      MENTION_EN: s.mentionEn ?? undefined,
      DUREE_VALIDE: data.program.attestationValidityFr ?? undefined,
    }));
}

export function mapToTranscriptRecords(
  data: TranscriptExportData,
): MappedTranscriptRecord[] {
  return data.students.map((s) => ({
    NOM: s.lastName.toUpperCase(),
    PRENOM: s.firstName,
    MATRICULE: s.registrationNumber,
    "DATE DE NAISSANCE": s.dateOfBirth ?? "N/D",
    "LIEU DE NAISSANCE": s.placeOfBirth ?? "N/D",
    NIVEAU: data.program.level,
    SEMESTRE: data.semester.name,
    CYCLE: data.program.cycle,
    FILIERE: data.program.name,
    "ANNEE ACADEMIQUE": data.academicYear.name,
    TOTAL_CREDITS: s.totalCredits,
    ues: s.ues,
  }));
}
