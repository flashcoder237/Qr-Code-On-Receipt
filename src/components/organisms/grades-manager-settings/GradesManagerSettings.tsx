import { useState, useEffect } from "react";
import { GradesManagerClient } from "@/lib/grades-manager/api-client";
import {
  DEFAULT_GRADES_MANAGER_CONFIG,
  type GradesManagerConfig,
} from "@/lib/grades-manager/config";
import type { ClassInfo, DiplomationConfig } from "@/lib/grades-manager/types";

type SyncStatus =
  | { state: "idle" }
  | { state: "syncing" }
  | { state: "done"; classCount: number; programCount: number }
  | { state: "error"; message: string };

export function GradesManagerSettings() {
  const [config, setConfig] = useState<GradesManagerConfig>(DEFAULT_GRADES_MANAGER_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: "idle" });
  const [localIPs, setLocalIPs] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (window as any).gradesManager
      ?.getConfig()
      .then((stored: GradesManagerConfig | null) => {
        if (stored) setConfig({ ...DEFAULT_GRADES_MANAGER_CONFIG, ...stored });
      });
    (window as any).gradesManager
      ?.getLocalIPs?.()
      .then((ips: string[]) => setLocalIPs(ips ?? []));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSave = async () => {
    await (window as any).gradesManager?.saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /**
   * Auto-sync: fetch config + classes from grades-manager-api and create
   * AcademicConfig entries in the local electron-store.
   */
  const handleSync = async (baseConfig: GradesManagerConfig) => {
    setSyncStatus({ state: "syncing" });
    try {
      const [remoteConfig, classes] = await Promise.all([
        GradesManagerClient.fetchConfig(baseConfig),
        GradesManagerClient.listClasses(baseConfig),
      ]);

      // Build AcademicConfig stubs from classes
      const academicConfigs = buildAcademicConfigs(classes, remoteConfig);

      // Persist: store linked institution config + academic configs
      const updated: GradesManagerConfig = {
        ...baseConfig,
        linkedInstitutionConfig: remoteConfig,
      };
      await (window as any).gradesManager?.saveConfig(updated);
      setConfig(updated);

      // Persist academic configs to electron-store (dedicated key)
      await (window as any).gradesManager?.saveAcademicConfigs?.(academicConfigs);

      setSyncStatus({
        state: "done",
        classCount: academicConfigs.length,
        programCount: remoteConfig.programs.length,
      });
    } catch (err: unknown) {
      setSyncStatus({
        state: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setSyncStatus({ state: "idle" });
    const result = await GradesManagerClient.testConnection(config);
    setTestResult(result);
    setTesting(false);

    if (result.ok) {
      // Auto-sync on successful connection
      await handleSync(config);
    }
  };

  const update = (key: keyof GradesManagerConfig, value: unknown) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const linked = config.linkedInstitutionConfig;

  return (
    <div className="space-y-6">
      {/* Connection */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Connexion</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              URL de l'API Grades Manager
            </label>
            <input
              type="url"
              className="w-full border rounded px-3 py-2 text-sm"
              value={config.apiBaseUrl}
              onChange={(e) => update("apiBaseUrl", e.target.value)}
              placeholder="http://192.168.1.100:3000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Clé API</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm font-mono"
              value={config.apiKey}
              onChange={(e) => update("apiKey", e.target.value)}
              placeholder="Clé fournie par l'administrateur"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !config.apiKey || !config.apiBaseUrl}
              className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {testing ? "Test en cours..." : "Tester et synchroniser"}
            </button>
            {testResult && (
              <span className={`text-sm ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
                {testResult.ok ? "✓ Connexion réussie" : `✗ ${testResult.error}`}
              </span>
            )}
          </div>

          {/* Sync status */}
          {syncStatus.state === "syncing" && (
            <p className="text-sm text-blue-600">⟳ Synchronisation en cours…</p>
          )}
          {syncStatus.state === "done" && (
            <p className="text-sm text-green-700">
              ✓ Synchronisé — {syncStatus.programCount} programme(s),{" "}
              {syncStatus.classCount} configuration(s) de relevés créées automatiquement.
            </p>
          )}
          {syncStatus.state === "error" && (
            <p className="text-sm text-red-600">
              ✗ Synchronisation échouée : {syncStatus.message}
            </p>
          )}

          {/* Linked institution badge */}
          {linked && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
              <span className="font-medium text-green-800">
                {linked.institution.nameFr}
              </span>
              {linked.institution.city && (
                <span className="text-green-700"> — {linked.institution.city}</span>
              )}
              {linked.institution.signatoryName && (
                <p className="text-green-600 text-xs mt-0.5">
                  Signataire : {linked.institution.signatoryTitle}{" "}
                  {linked.institution.signatoryName}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Webhook */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Webhook (réception)</h3>
        <p className="text-sm text-gray-500 mb-3">
          Grades Manager envoie des événements à DIPLOMATION via une requête HTTP POST
          sur le réseau local. Ce logiciel doit être joignable depuis le serveur Grades Manager.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Port d'écoute</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 text-sm"
              value={config.webhookListenPort}
              onChange={(e) => update("webhookListenPort", parseInt(e.target.value, 10))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Secret webhook (HMAC)
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm font-mono"
              value={config.webhookSecret}
              onChange={(e) => update("webhookSecret", e.target.value)}
            />
          </div>

          {/* Local IP addresses — copy-to-configure */}
          <div className="rounded-md border bg-gray-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              URL(s) webhook de cette machine
            </p>
            <p className="text-xs text-gray-500">
              Copiez l'une de ces URLs et collez-la dans la clé API de Grades Manager
              (Admin → Clés API → Nouvelle clé → Webhook URL).
            </p>
            {localIPs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Détection des IPs…</p>
            ) : (
              <ul className="space-y-1">
                {localIPs.map((ip) => {
                  const url = `http://${ip}:${config.webhookListenPort}/webhook`;
                  return (
                    <li key={ip} className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white border rounded px-2 py-1 font-mono select-all">
                        {url}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(url)}
                        className="px-2 py-1 text-xs border rounded hover:bg-white"
                      >
                        {copied === url ? "✓ Copié" : "Copier"}
                      </button>
                    </li>
                  );
                })}
                <li className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border rounded px-2 py-1 font-mono select-all text-gray-400">
                    {`http://localhost:${config.webhookListenPort}/webhook`}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`http://localhost:${config.webhookListenPort}/webhook`)}
                    className="px-2 py-1 text-xs border rounded hover:bg-white"
                  >
                    {copied === `http://localhost:${config.webhookListenPort}/webhook` ? "✓ Copié" : "Copier"}
                  </button>
                </li>
              </ul>
            )}
            <p className="text-xs text-gray-400">
              Si le pare-feu bloque le port {config.webhookListenPort}, autorisez-le dans les
              paramètres Windows Defender / pare-feu.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-generation */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Génération automatique</h3>
        <div className="space-y-2">
          {[
            {
              key: "autoGenerateDiplomas" as const,
              label: "Diplômes (délibération de diplomation signée)",
            },
            {
              key: "autoGenerateAttestations" as const,
              label: "Attestations de réussite (délibération signée)",
            },
            {
              key: "autoGenerateTranscripts" as const,
              label: "Relevés de notes (notes de semestre verrouillées)",
            },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config[key] as boolean}
                onChange={(e) => update(key, e.target.checked)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Output dir */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Répertoire de sortie automatique</h3>
        <input
          type="text"
          className="w-full border rounded px-3 py-2 text-sm"
          value={config.autoOutputDir}
          onChange={(e) => update("autoOutputDir", e.target.value)}
          placeholder="C:\Users\...\Documents\DIPLOMATION\auto"
        />
        <p className="text-xs text-gray-500 mt-1">
          Les documents générés automatiquement seront sauvegardés dans ce répertoire.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        {saved ? "✓ Enregistré" : "Enregistrer"}
      </button>
    </div>
  );
}

/**
 * Build AcademicConfig stubs from the classes list for electron-store.
 * The full UE structure will be enriched lazily on first transcript import.
 */
function buildAcademicConfigs(
  classes: ClassInfo[],
  remoteConfig: DiplomationConfig,
): Array<{
  id: string;
  name: string;
  academicYear: string;
  filiere: string;
  niveau: string;
  cycle: string;
  option: string;
  semesters: unknown[];
  isHidden: boolean;
  _source: "grades-manager";
}> {
  // Deduplicate by program + cycle + level
  const seen = new Set<string>();
  const configs: ReturnType<typeof buildAcademicConfigs> = [];

  for (const cls of classes) {
    const key = `${cls.programId}-${cls.level}-${cls.cycle}-${cls.academicYearId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    configs.push({
      id: key,
      name: [cls.programName, cls.level, cls.academicYearName]
        .filter(Boolean)
        .join(" — "),
      academicYear: cls.academicYearName ?? "",
      filiere: cls.programName ?? "",
      niveau: cls.level ?? "",
      cycle: cls.cycle ?? "",
      option: "",
      semesters: [], // enriched lazily on first transcript import
      isHidden: false,
      _source: "grades-manager",
    });
  }

  return configs;
}
