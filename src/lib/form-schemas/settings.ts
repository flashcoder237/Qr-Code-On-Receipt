// src/lib/form-schemas/settings.ts - Version mise à jour avec configuration avancée
import * as z from "zod";
import { ThemeSettingsSchema, defaultTheme } from "./theme-settings";
import { AdvancedTranscriptConfigSchema, defaultAdvancedTranscriptConfig } from "./advanced-typography";

export const TranscriptsettingsSchema = z.object({
  // Type d'établissement
  establishmentType: z.enum(["ipes", "faculty"], {
    errorMap: () => ({ message: "Le type d'établissement doit être 'ipes' ou 'faculty'" })
  }),
  
  nameFrench: z.string().min(1, "Le nom en français est requis"),
  nameEnglish: z.string().min(1, "Le nom en anglais est requis"),
  nameAbreviation: z.string().min(1, "L'abréviation du nom de l'établissement est requis"),
  postalBox: z.string().min(1, "La boîte postale en français est requise"),
  postalBoxEn: z.string().min(1, "La boîte postale en anglais est requise"),
  email: z.string().email("Adresse e-mail invalide"),
  logo: z.string().optional(),
  universityLogo: z.string().optional(),
  facultyLogo: z.string().optional(),
  
  // Paramètres de base (pour rétrocompatibilité)
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (ex: #000000)"),
  themeFont: z.enum([
    "Times New Roman, serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif"
  ], {
    errorMap: () => ({ message: "Police de caractères invalide" })
  }),
  
  // Système de thème standard
  theme: ThemeSettingsSchema.optional(),
  
  // NOUVEAU: Configuration avancée pour les relevés
  advancedTranscriptConfig: AdvancedTranscriptConfigSchema.optional(),
});

export type TranscriptSettingsPayload = z.infer<typeof TranscriptsettingsSchema>;

// Fonction pour obtenir le thème complet avec support de la configuration avancée
export function getCompleteTheme(settings: TranscriptSettingsPayload): typeof defaultTheme {
  if (settings.theme) {
    return settings.theme;
  }
  
  // Si pas de thème complet, utiliser le thème par défaut avec les anciennes propriétés
  return {
    ...defaultTheme,
    primaryColor: settings.themeColor || defaultTheme.primaryColor,
    mainFont: settings.themeFont as typeof defaultTheme.mainFont || defaultTheme.mainFont,
    headerFont: settings.themeFont as typeof defaultTheme.headerFont || defaultTheme.headerFont,
  };
}

// NOUVEAU: Fonction pour obtenir la configuration avancée des relevés
export function getAdvancedTranscriptConfig(settings: TranscriptSettingsPayload) {
  return settings.advancedTranscriptConfig || defaultAdvancedTranscriptConfig;
}