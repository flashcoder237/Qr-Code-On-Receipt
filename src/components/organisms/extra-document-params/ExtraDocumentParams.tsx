import { useState, useEffect } from "react";
import {
  DEFAULT_GRADES_MANAGER_CONFIG,
  type GradesManagerConfig,
  type LocalDocumentParams,
} from "@/lib/grades-manager/config";

export function ExtraDocumentParams() {
  const [config, setConfig] = useState<GradesManagerConfig>(DEFAULT_GRADES_MANAGER_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (window as any).gradesManager
      ?.getConfig()
      .then((stored: GradesManagerConfig | null) => {
        if (stored) setConfig({ ...DEFAULT_GRADES_MANAGER_CONFIG, ...stored });
      });
  }, []);

  const update = (key: keyof LocalDocumentParams, value: string) =>
    setConfig((prev) => ({
      ...prev,
      localDocumentParams: { ...prev.localDocumentParams, [key]: value },
    }));

  const handleSave = async () => {
    await (window as any).gradesManager?.saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBrowse = async (key: keyof LocalDocumentParams) => {
    const path = await (window as any).gradesManager?.browseFile?.({
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }],
    });
    if (path) update(key, path);
  };

  const linked = config.linkedInstitutionConfig;
  const params = config.localDocumentParams ?? {};

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Paramètres Supplémentaires des Documents</h2>
        <p className="text-sm text-gray-500">
          Ces paramètres sont stockés localement et complètent les informations
          récupérées automatiquement depuis Grades Manager.
        </p>
      </div>

      {/* Server-fetched summary */}
      {linked ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-blue-800">
            Informations synchronisées depuis Grades Manager
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
            <div>
              <span className="font-medium">Institution :</span>{" "}
              {linked.institution.nameFr}
            </div>
            {linked.institution.city && (
              <div>
                <span className="font-medium">Ville :</span>{" "}
                {linked.institution.city}
              </div>
            )}
            {linked.institution.signatoryName && (
              <div>
                <span className="font-medium">Signataire :</span>{" "}
                {linked.institution.signatoryTitle} {linked.institution.signatoryName}
              </div>
            )}
            <div>
              <span className="font-medium">Programmes :</span>{" "}
              {linked.programs.length}
            </div>
          </div>
          <p className="text-xs text-blue-600">
            Pour modifier ces informations, connectez-vous à l'interface admin de Grades Manager
            → Institution → Génération de documents.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          ⚠ Non lié à Grades Manager. Configurez la connexion dans Paramètres → Grades Manager,
          puis cliquez sur "Tester et synchroniser".
        </div>
      )}

      {/* Local-only params */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Fichiers locaux</h3>
        <p className="text-sm text-gray-500">
          Ces fichiers ne peuvent pas être stockés sur le serveur — ils sont utilisés
          directement lors de la génération PDF.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Image de signature du signataire
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded px-3 py-2 text-sm font-mono"
                value={params.signatureImagePath ?? ""}
                onChange={(e) => update("signatureImagePath", e.target.value)}
                placeholder="C:\chemin\vers\signature.png"
              />
              <button
                type="button"
                onClick={() => handleBrowse("signatureImagePath")}
                className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Parcourir…
              </button>
            </div>
            {params.signatureImagePath && (
              <img
                src={`file://${params.signatureImagePath}`}
                alt="Aperçu signature"
                className="mt-2 h-12 object-contain border rounded"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Image du sceau / tampon de l'institution
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded px-3 py-2 text-sm font-mono"
                value={params.sealImagePath ?? ""}
                onChange={(e) => update("sealImagePath", e.target.value)}
                placeholder="C:\chemin\vers\sceau.png"
              />
              <button
                type="button"
                onClick={() => handleBrowse("sealImagePath")}
                className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Parcourir…
              </button>
            </div>
            {params.sealImagePath && (
              <img
                src={`file://${params.sealImagePath}`}
                alt="Aperçu sceau"
                className="mt-2 h-12 object-contain border rounded"
              />
            )}
          </div>
        </div>
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
