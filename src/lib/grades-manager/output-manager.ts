export function buildOutputPath(
  baseDir: string,
  type: "diploma" | "attestation" | "transcript",
  metadata: {
    institutionCode: string;
    academicYear: string;
    sourceId: string;
  },
): string {
  const typeDir =
    type === "diploma"
      ? "diplomes"
      : type === "attestation"
        ? "attestations"
        : "releves";
  return [
    baseDir,
    metadata.institutionCode,
    metadata.academicYear,
    typeDir,
    metadata.sourceId,
  ]
    .join("/")
    .replace(/\/+/g, "/");
}

export function buildFileName(
  type: "diploma" | "attestation" | "transcript",
  matricule: string,
  semesterCode?: string,
): string {
  switch (type) {
    case "diploma":
      return `${matricule}_Diplome.pdf`;
    case "attestation":
      return `${matricule}_Attestation.pdf`;
    case "transcript":
      return `${matricule}_Releve${semesterCode ? `_${semesterCode}` : ""}.pdf`;
  }
}

export interface ManifestEntry {
  matricule: string;
  fileName: string;
  status: "ok" | "error";
  error?: string;
}

export interface BatchManifest {
  type: string;
  sourceId: string;
  institutionCode: string;
  academicYear: string;
  generatedAt: string;
  totalStudents: number;
  successCount: number;
  errorCount: number;
  files: ManifestEntry[];
}

export function buildManifest(
  type: string,
  sourceId: string,
  institutionCode: string,
  academicYear: string,
  files: ManifestEntry[],
): BatchManifest {
  return {
    type,
    sourceId,
    institutionCode,
    academicYear,
    generatedAt: new Date().toISOString(),
    totalStudents: files.length,
    successCount: files.filter((f) => f.status === "ok").length,
    errorCount: files.filter((f) => f.status === "error").length,
    files,
  };
}
