import * as z from "zod";

export const TranscriptsettingsSchema = z.object({
  nameFrench: z.string().min(1, "Le nom en français est requis"),
  nameEnglish: z.string().min(1, "Le nom en anglais est requis"),
  nameAbreviation : z.string().min(1, "L'abréviation du nom de l'établissement est requis"),
  postalBox: z.string().min(1, "La boîte postale en français est requise"),
  postalBoxEn: z.string().min(1, "La boîte postale en anglais est requise"),
  email: z.string().email("Adresse e-mail invalide"),
  logo: z.string().optional(),
  universityLogo: z.string().optional(),
  facultyLogo: z.string().optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (ex: #000000)"),
  themeFont: z.enum([
    "Times New Roman, serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif"
  ], {
    errorMap: () => ({ message: "Police de caractères invalide" })
  })
});

export type TranscriptSettingsPayload = z.infer<typeof TranscriptsettingsSchema>;