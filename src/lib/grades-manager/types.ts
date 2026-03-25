export type JuryMember = {
  domainUserId: string;
  name: string;
  role: string;
};

export type UeResult = {
  ueId: string;
  ueCode: string;
  ueName: string;
  ueCredits: number;
  ueAverage: number | null;
  decision: string;
  creditsEarned: number;
};

export type InstitutionInfo = {
  name: string;
  nameEn: string;
  code: string;
  logoUrl: string | null;
  sloganFr: string | null;
  address: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  city: string | null;
};

export type ClassInfo = {
  id: string;
  name: string;
  programId: string | null;
  programName: string | null;
  programCode: string | null;
  cycle: string | null;
  level: string | null;
  academicYearId: string | null;
  academicYearName: string | null;
  isActiveYear: boolean;
  semesterName: string | null;
  semesterCode: string | null;
};

export type ProgramConfig = {
  id: string;
  name: string;
  code: string;
  diplomaTitleFr: string | null;
  diplomaTitleEn: string | null;
  attestationValidityFr: string | null;
  attestationValidityEn: string | null;
};

export type DiplomationConfig = {
  institution: InstitutionInfo & {
    nameFr: string;
    shortName: string | null;
    contactEmail: string | null;
    website: string | null;
  };
  programs: ProgramConfig[];
  academicYears: Array<{ id: string; name: string; startDate: string | null; endDate: string | null; isActive: boolean }>;
};

export type DiplomationExportData = {
  institution: InstitutionInfo;
  deliberation: {
    id: string; type: string; date: string | null; status: string;
    className: string; programName: string; academicYearName: string;
    semesterName: string | null; admissionDate: string | null;
  };
  program: {
    diplomaTitleFr: string | null; diplomaTitleEn: string | null;
    specialite: string | null;
    attestationValidityFr: string | null; attestationValidityEn: string | null;
  };
  jury: { president: { name: string; role: string } | null; members: JuryMember[] };
  students: Array<{
    rank: number | null; registrationNumber: string;
    lastName: string; firstName: string;
    dateOfBirth: string | null; placeOfBirth: string | null;
    generalAverage: number | null;
    totalCreditsEarned: number; totalCreditsPossible: number;
    finalDecision: string | null;
    mention: string | null;
    gradeLetter: string | null; mentionEn: string | null;
    ueResults: UeResult[];
  }>;
  stats: Record<string, unknown> | null;
  signatures: Array<{ position: string; name: string }>;
};

export type TranscriptCourse = {
  code: string; name: string; coefficient: number;
  grade: number | null; session: "normal" | "retake";
};

export type TranscriptUe = {
  code: string; name: string; credits: number;
  average: number | null; decision: "ADM" | "AJ";
  courses: TranscriptCourse[];
};

export type TranscriptStudent = {
  registrationNumber: string; lastName: string; firstName: string;
  dateOfBirth: string | null; placeOfBirth: string | null;
  totalCredits: number; generalAverage: number | null;
  ues: TranscriptUe[];
};

export type TranscriptExportData = {
  institution: InstitutionInfo;
  academicYear: { name: string };
  program: { name: string; cycle: string; level: string };
  semester: { name: string; code: string };
  className: string;
  students: TranscriptStudent[];
};

export type DeliberationSummary = {
  id: string; status: string; type: string;
  signedAt: string | null; createdAt: string;
  classRef?: { name: string; program?: { name: string } };
  academicYear?: { name: string };
};

export type WebhookEvent =
  | { event: "deliberation.signed"; deliberationId: string; institutionId: string; deliberationType: string; signedAt: string; classId: string; academicYearId: string }
  | { event: "semester.grades_locked"; semesterId: string; institutionId: string; classId: string; academicYearId: string; lockedAt: string };
