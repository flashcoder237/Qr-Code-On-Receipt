import { useState, useEffect } from "react";
import { GradesManagerClient } from "@/lib/grades-manager/api-client";
import {
  mapToAttestationRecords,
  mapToDiplomaRecords,
  mapToTranscriptRecords,
} from "@/lib/grades-manager/data-mapper";
import type {
  DeliberationSummary,
  TranscriptExportData,
  DiplomationExportData,
} from "@/lib/grades-manager/types";
import type { GradesManagerConfig } from "@/lib/grades-manager/config";

function buildPdfSettings(config: GradesManagerConfig) {
  const inst = config.linkedInstitutionConfig?.institution;
  return {
    centre: {
      nameFrench: inst?.nameFr ?? "",
      nameEnglish: inst?.nameEn ?? inst?.nameFr ?? "",
      email: inst?.contactEmail ?? "",
    },
    centreLogo: inst?.logoUrl ?? undefined,
    email: inst?.contactEmail ?? "",
  };
}

type DocType = "diploma" | "attestation" | "transcript";

const SUBDIR: Record<DocType, string> = {
  transcript: "releves",
  attestation: "attestations",
  diploma: "diplomes",
};

function sanitizeName(s: string) {
  return s.replace(/[^a-zA-Z0-9À-ÿ _-]/g, "").trim().replace(/\s+/g, "_");
}

export function GradesManagerImport() {
  const [config, setConfig] = useState<GradesManagerConfig | null>(null);
  const [deliberations, setDeliberations] = useState<DeliberationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);
  const [docType, setDocType] = useState<DocType>("attestation");
  const [selectedId, setSelectedId] = useState<string>("");
  const [outputDir, setOutputDir] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ count: number; dir: string } | null>(null);

  useEffect(() => {
    (window as any).gradesManager
      ?.getConfig()
      .then((c: GradesManagerConfig | null) => {
        if (c) {
          setConfig(c);
          if (c.autoOutputDir) setOutputDir(c.autoOutputDir);
        }
      });
  }, []);

  const pickDirectory = async () => {
    const dir = await (window as any).gradesManager?.browseDirectory();
    if (dir) setOutputDir(dir);
  };

  const loadDeliberations = async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const list = await GradesManagerClient.listDeliberations(config, "signed");
      setDeliberations(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const savePdf = async (pdfBytes: Uint8Array, filename: string) => {
    const sep = outputDir.includes("/") ? "/" : "\\";
    const dir = `${outputDir}${sep}${SUBDIR[docType]}`;
    const fullPath = `${dir}${sep}${filename}`;
    await (window as any).gradesManager?.savePDF(fullPath, pdfBytes);
    return dir;
  };

  const handleGenerate = async () => {
    if (!config || !selectedId || !outputDir) return;
    setGenerating(true);
    setError(null);
    setDone(null);
    setProgress(null);
    let savedDir = outputDir;

    try {
      if (docType === "transcript") {
        const data = (await GradesManagerClient.getDeliberationTranscript(
          selectedId,
          config,
        )) as TranscriptExportData;
        const records = mapToTranscriptRecords(data);
        for (let i = 0; i < records.length; i++) {
          setProgress({
            current: i + 1,
            total: records.length,
            name: `${records[i].NOM} ${records[i].PRENOM}`,
          });
          const pdfBytes = await (window as any).ipcRenderer.invoke("generate-transcript-pdf", {
            student: records[i],
            settings: buildPdfSettings(config),
            options: {},
          });
          if (pdfBytes) {
            const fname = `${sanitizeName(records[i].MATRICULE)}_${sanitizeName(records[i].NOM)}_${sanitizeName(records[i].PRENOM)}.pdf`;
            savedDir = await savePdf(pdfBytes, fname);
          }
        }
        setDone({ count: records.length, dir: savedDir });
      } else {
        const data = (await GradesManagerClient.getDeliberation(
          selectedId,
          config,
        )) as DiplomationExportData;
        const records =
          docType === "diploma"
            ? mapToDiplomaRecords(data)
            : mapToAttestationRecords(data);
        const ipcHandler =
          docType === "diploma" ? "generate-diploma-pdf" : "generate-attestation-pdf";
        for (let i = 0; i < records.length; i++) {
          setProgress({
            current: i + 1,
            total: records.length,
            name: `${records[i].NOM} ${records[i].PRENOM}`,
          });
          const pdfBytes = await (window as any).ipcRenderer.invoke(ipcHandler, {
            student: records[i],
            settings: buildPdfSettings(config),
            options: {},
          });
          if (pdfBytes) {
            const fname = `${sanitizeName(records[i].MATRICULE)}_${sanitizeName(records[i].NOM)}_${sanitizeName(records[i].PRENOM)}.pdf`;
            savedDir = await savePdf(pdfBytes, fname);
          }
        }
        setDone({ count: records.length, dir: savedDir });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  if (!config?.apiKey) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Configurez d'abord la connexion Grades Manager dans les Paramètres.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Import depuis Grades Manager</h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={loadDeliberations}
          disabled={loading}
          className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Chargement..." : "Charger les délibérations signées"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {deliberations.length > 0 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Type de document</label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType)}
            >
              <option value="attestation">Attestation de réussite</option>
              <option value="diploma">Diplôme</option>
              <option value="transcript">Relevé de notes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Délibération / Classe
            </label>
            <select
              className="border rounded px-3 py-2 text-sm w-full"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              {deliberations.map((d) => (
                <option key={d.id} value={d.id}>
                  {(d.classRef as any)?.name ?? d.id} —{" "}
                  {(d.academicYear as any)?.name ?? ""} ({d.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Dossier de sortie
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={outputDir}
                placeholder="Sélectionner un dossier..."
                className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50 text-gray-700"
              />
              <button
                type="button"
                onClick={pickDirectory}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Parcourir
              </button>
            </div>
            {outputDir && (
              <p className="text-xs text-gray-500 mt-1">
                Les fichiers seront enregistrés dans : {outputDir}\{SUBDIR[docType]}\
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !selectedId || !outputDir}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {generating ? "Génération en cours..." : "Générer les documents"}
          </button>

          {progress && (
            <div className="text-sm text-gray-700">
              {progress.current}/{progress.total} — {progress.name}
            </div>
          )}

          {done && (
            <div className="text-sm text-green-600">
              <p>✓ {done.count} document(s) enregistré(s)</p>
              <p className="text-xs text-gray-500 mt-0.5">{done.dir}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
