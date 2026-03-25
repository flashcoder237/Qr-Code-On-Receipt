import type {
  ClassInfo,
  DeliberationSummary,
  DiplomationConfig,
  DiplomationExportData,
  TranscriptExportData,
} from "./types";

type Config = { apiBaseUrl: string; apiKey: string };

async function apiFetch<T>(path: string, config: Config): Promise<T> {
  const url = `${config.apiBaseUrl.replace(/\/$/, "")}/api/diplomation${path}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": config.apiKey },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Grades Manager API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost(path: string, body: unknown, config: Config): Promise<void> {
  const url = `${config.apiBaseUrl.replace(/\/$/, "")}/api/diplomation${path}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": config.apiKey },
    body: JSON.stringify(body),
  });
}

export const GradesManagerClient = {
  listDeliberations: (config: Config, status?: string) =>
    apiFetch<DeliberationSummary[]>(
      `/deliberations${status ? `?status=${status}` : ""}`,
      config,
    ),

  getDeliberation: (id: string, config: Config) =>
    apiFetch<DiplomationExportData>(`/deliberations/${id}`, config),

  getDeliberationStatus: (id: string, config: Config) =>
    apiFetch<{ id: string; status: string; type: string; signedAt: string | null }>(
      `/deliberations/${id}/status`,
      config,
    ),

  getClassTranscripts: (classId: string, config: Config) =>
    apiFetch<TranscriptExportData>(`/transcripts/class/${classId}`, config),

  getDeliberationTranscript: (deliberationId: string, config: Config) =>
    apiFetch<TranscriptExportData>(`/deliberations/${deliberationId}/transcript`, config),

  reportGeneratedDocument: (
    doc: {
      sourceId: string;
      documentType: string;
      studentId?: string;
      generatedAt: string;
      fileReference?: string;
    },
    config: Config,
  ) => apiPost("/documents", doc, config),

  fetchConfig: (config: Config) =>
    apiFetch<DiplomationConfig>("/config", config),

  listClasses: (config: Config) =>
    apiFetch<ClassInfo[]>("/classes", config),

  testConnection: async (config: Config) => {
    try {
      await apiFetch("/deliberations?status=signed", config);
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
