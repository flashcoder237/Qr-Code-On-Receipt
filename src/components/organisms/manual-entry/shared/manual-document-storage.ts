export type ManualDocumentType = "transcript" | "attestation" | "diploma";

export interface SavedManualDocument {
  id: string;
  type: ManualDocumentType;
  label: string;
  studentName: string;
  studentMatricule: string;
  createdAt: string;
  updatedAt: string;
  formData: Record<string, any>;
  // For transcripts: store config/semester IDs to reload context
  configId?: string;
  semesterId?: string;
}

const STORAGE_KEY = "manual-documents";

function getAll(): SavedManualDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(docs: SavedManualDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function getDocumentsByType(type: ManualDocumentType): SavedManualDocument[] {
  return getAll()
    .filter((d) => d.type === type)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getDocumentById(id: string): SavedManualDocument | null {
  return getAll().find((d) => d.id === id) || null;
}

export function saveDocument(doc: Omit<SavedManualDocument, "id" | "createdAt" | "updatedAt">, existingId?: string): SavedManualDocument {
  const all = getAll();
  const now = new Date().toISOString();

  if (existingId) {
    const idx = all.findIndex((d) => d.id === existingId);
    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        ...doc,
        updatedAt: now,
      };
      saveAll(all);
      return all[idx];
    }
  }

  const newDoc: SavedManualDocument = {
    ...doc,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  all.push(newDoc);
  saveAll(all);
  return newDoc;
}

export function deleteDocument(id: string) {
  const all = getAll().filter((d) => d.id !== id);
  saveAll(all);
}

export function getTypeLabel(type: ManualDocumentType): string {
  switch (type) {
    case "transcript": return "Releve";
    case "attestation": return "Attestation";
    case "diploma": return "Diplome";
  }
}
