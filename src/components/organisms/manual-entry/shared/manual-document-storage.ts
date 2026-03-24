export type ManualDocumentType = "transcript" | "attestation" | "diploma";
export type DocumentStatus = "brouillon" | "pret" | "genere";

export interface SavedManualDocument {
  id: string;
  type: ManualDocumentType;
  label: string;
  studentName: string;
  studentMatricule: string;
  createdAt: string;
  updatedAt: string;
  formData: Record<string, any>;
  status?: DocumentStatus;
  // For transcripts: store config/semester IDs to reload context
  configId?: string;
  semesterId?: string;
}

const STORAGE_KEY = "manual-documents";
const BATCH_KEY = "diploma-batch";

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

export function saveDocument(
  doc: Omit<SavedManualDocument, "id" | "createdAt" | "updatedAt">,
  existingId?: string
): SavedManualDocument {
  const all = getAll();
  const now = new Date().toISOString();

  if (existingId) {
    const idx = all.findIndex((d) => d.id === existingId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...doc, updatedAt: now };
      saveAll(all);
      return all[idx];
    }
  }

  const newDoc: SavedManualDocument = {
    ...doc,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: doc.status ?? "brouillon",
  };
  all.push(newDoc);
  saveAll(all);
  return newDoc;
}

export function updateDocumentStatus(id: string, status: DocumentStatus) {
  const all = getAll();
  const idx = all.findIndex((d) => d.id === id);
  if (idx !== -1) {
    all[idx].status = status;
    all[idx].updatedAt = new Date().toISOString();
    saveAll(all);
  }
}

export function deleteDocument(id: string) {
  saveAll(getAll().filter((d) => d.id !== id));
}

export function duplicateDocument(id: string): SavedManualDocument | null {
  const original = getDocumentById(id);
  if (!original) return null;
  const now = new Date().toISOString();
  const copy: SavedManualDocument = {
    ...original,
    id: crypto.randomUUID(),
    label: original.label ? `${original.label} (copie)` : "(copie)",
    status: "brouillon",
    createdAt: now,
    updatedAt: now,
  };
  const all = getAll();
  all.push(copy);
  saveAll(all);
  return copy;
}

export function findDocumentByMatricule(
  type: ManualDocumentType,
  matricule: string
): SavedManualDocument | null {
  if (!matricule.trim()) return null;
  return (
    getAll().find(
      (d) =>
        d.type === type &&
        d.studentMatricule.trim().toLowerCase() === matricule.trim().toLowerCase()
    ) ?? null
  );
}

export function getTypeLabel(type: ManualDocumentType): string {
  switch (type) {
    case "transcript":
      return "Releve";
    case "attestation":
      return "Attestation";
    case "diploma":
      return "Diplome";
  }
}

// ─── Batch management ──────────────────────────────────────────────────────────

export interface BatchEntry {
  id: string;
  studentName: string;
  studentMatricule: string;
  record: Record<string, any>;
  addedAt: string;
}

function getBatchRaw(): BatchEntry[] {
  try {
    const raw = localStorage.getItem(BATCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBatch(batch: BatchEntry[]) {
  localStorage.setItem(BATCH_KEY, JSON.stringify(batch));
}

export function getDiplomaBatch(): BatchEntry[] {
  return getBatchRaw();
}

export function addToDiplomaBatch(entry: Omit<BatchEntry, "id" | "addedAt">): BatchEntry {
  const batch = getBatchRaw();
  const existing = batch.findIndex(
    (e) => e.studentMatricule.trim().toLowerCase() === entry.studentMatricule.trim().toLowerCase()
  );
  const newEntry: BatchEntry = {
    ...entry,
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
  };
  if (existing !== -1) {
    batch[existing] = newEntry;
  } else {
    batch.push(newEntry);
  }
  saveBatch(batch);
  return newEntry;
}

export function removeFromDiplomaBatch(id: string) {
  saveBatch(getBatchRaw().filter((e) => e.id !== id));
}

export function clearDiplomaBatch() {
  saveBatch([]);
}
