// Modification de src/lib/helpers/qrcode.ts
import QRCode from "qrcode";

export type StudentExcelRecord = {
  ETABLISSEMENT: string;
  NOM: string;
  PRENOM: string;
  MATRICULE: string;
  "DATE DE NAISSANCE": string;
  "LIEU DE NAISSANCE": string;
  NIVEAU?: string;
  SEMESTRE?: string;
  MOYENNE?: number | string;
  GRADE?: string;
  MENTION?: string;
  "ANNEE ACADEMIQUE"?: string;
  "ANNEE D'OBTENTION"?: string;
  PARCOURS?: string;
  SPECIALITE?: string;
  OPTION?: string;
  "DATE JURY"?: string;
  FINALITE?: string;
  "TOTAL CREDIT"?: string;
  "DOMAINE"?: string;

};

export function getQrCodePayload(
  payload: StudentExcelRecord,
  documentType: "releve" | "attestation" | "diplome"
): string {
  if (documentType === "releve") {
    return `Établissement: ${payload.ETABLISSEMENT}
Nom: ${payload.NOM}
Prénom: ${payload.PRENOM}
Matricule: ${payload.MATRICULE}
Date de naissance: ${payload["DATE DE NAISSANCE"]}
Lieu de naissance: ${payload["LIEU DE NAISSANCE"]}
Niveau: ${payload.NIVEAU}
Semestre: ${payload.SEMESTRE}
Moyenne: ${payload.MOYENNE}
Grade: ${payload.GRADE}
Mention: ${payload.MENTION}
Année académique: ${payload["ANNEE ACADEMIQUE"]}`;
  } else if (documentType === "attestation") {
    return `Établissement: ${payload.ETABLISSEMENT}
Nom: ${payload.NOM}
Prénom: ${payload.PRENOM}
Matricule: ${payload.MATRICULE}
Date de naissance: ${payload["DATE DE NAISSANCE"]}
Lieu de naissance: ${payload["LIEU DE NAISSANCE"]}
Parcours: ${payload.PARCOURS || ""}
Spécialité: ${payload.SPECIALITE || ""}
Option: ${payload.OPTION || ""}
Moyenne: ${payload.MOYENNE}
Grade: ${payload.GRADE}
Mention: ${payload.MENTION}
Année académique: ${payload["ANNEE ACADEMIQUE"]}`;
  } else if (documentType === "diplome") {
    return `Établissement: ${payload.ETABLISSEMENT}
Nom: ${payload.NOM}
Prénom: ${payload.PRENOM}
Matricule: ${payload.MATRICULE}
Date de naissance: ${payload["DATE DE NAISSANCE"]}
Lieu de naissance: ${payload["LIEU DE NAISSANCE"]}
Moyenne: ${payload.MOYENNE}
Grade: ${payload.GRADE}
Mention: ${payload.MENTION}
Année d'obtention: ${payload["ANNEE D'OBTENTION"]}
Site Web: https://fmsp-udo.cm`;
  }
  return "";
}

export async function generateQrCode(
  payload: StudentExcelRecord,
  documentType: "releve" | "attestation" | "diplome" = "releve"
) {
  const qrCodeDataURL = await QRCode.toDataURL(
    getQrCodePayload(payload, documentType)
  );
  const qrCodeImage = await fetch(qrCodeDataURL).then((res) =>
    res.arrayBuffer()
  );
  return qrCodeImage;
}