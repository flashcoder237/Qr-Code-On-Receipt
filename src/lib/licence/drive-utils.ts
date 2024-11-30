import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";

const FILE_ID = "VOTRE_FILE_ID"; // Remplacez par l'ID du fichier sur Drive

export const fetchLicenses = async (auth: OAuth2Client): Promise<Record<string, any>> => {
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.get({
    fileId: FILE_ID,
    alt: "media",
  });
  return JSON.parse(res.data as string); // Cast explicite en chaîne
};

export const updateLicense = async (auth: OAuth2Client, licenseKey: string): Promise<boolean> => {
  const drive = google.drive({ version: "v3", auth });
  const licenses = await fetchLicenses(auth);

  if (licenses[licenseKey]?.status === "unused") {
    licenses[licenseKey].status = "used";

    // Enregistrer localement un fichier temporaire
    const tempFile = "licenses_temp.json";
    fs.writeFileSync(tempFile, JSON.stringify(licenses, null, 2));

    // Mettre à jour le fichier sur Drive
    await drive.files.update({
      fileId: FILE_ID,
      media: {
        mimeType: "application/json",
        body: fs.createReadStream(tempFile),
      },
    });

    fs.unlinkSync(tempFile); // Nettoyer le fichier temporaire
    return true;
  }

  return false;
};
