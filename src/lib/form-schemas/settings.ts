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
  watermarkLogo: z.string().optional(), // NOUVEAU: Logo personnalisé pour le fond des relevés
  
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
  if (settings.advancedTranscriptConfig) {
    return settings.advancedTranscriptConfig;
  }
  // Use the current theme to generate the advanced config dynamically
  const theme = getCompleteTheme(settings);
  return convertThemeToAdvancedConfig(theme);
}

// NOUVEAU: Fonction pour convertir un thème en configuration avancée des relevés
export function convertThemeToAdvancedConfig(theme: typeof defaultTheme): typeof defaultAdvancedTranscriptConfig {
  // Map basic theme properties to advanced config structure
  // This is a simplified example; adjust mappings as needed
  const baseFont = theme.mainFont || defaultAdvancedTranscriptConfig.headerTitle.fontFamily;
  const baseFontSize = theme.contentFontSize || 10;
  const baseLineHeight = 1.2;

  return {
    enableAdvancedTypography: true,
    headerTitle: {
      fontFamily: theme.headerFont || baseFont,
      fontSize: theme.titleFontSize || 18,
      fontWeight: "bold",
      lineHeight: baseLineHeight,
      color: theme.primaryColor || "#000000",
    },
    headerSubtitle: {
      fontFamily: baseFont,
      fontSize: theme.headerFontSize || 10,
      fontWeight: "normal",
      lineHeight: baseLineHeight,
      color: theme.secondaryColor || "#505050",
    },
    headerInfo: {
      fontFamily: baseFont,
      fontSize: theme.headerFontSize || 10,
      fontWeight: "normal",
      lineHeight: baseLineHeight,
      color: theme.secondaryColor || "#505050",
    },
    studentInfo: {
      fontFamily: baseFont,
      fontSize: baseFontSize,
      fontWeight: "normal",
      lineHeight: baseLineHeight,
      color: theme.primaryColor || "#000000",
    },
    tableHeader: {
      fontFamily: baseFont,
      fontSize: theme.headerFontSize || 10,
      fontWeight: "bold",
      lineHeight: baseLineHeight,
      color: theme.accentColor || "#000080",
    },
    tableContent: {
      fontFamily: baseFont,
      fontSize: baseFontSize,
      fontWeight: "normal",
      lineHeight: baseLineHeight,
      color: theme.primaryColor || "#000000",
    },
    footer: {
      fontFamily: baseFont,
      fontSize: theme.footerFontSize || 8,
      fontWeight: "normal",
      lineHeight: baseLineHeight,
      color: theme.secondaryColor || "#505050",
    },
    signature: {
      fontFamily: baseFont,
      fontSize: theme.footerFontSize || 8,
      fontWeight: "normal",
      lineHeight: baseLineHeight,
      color: theme.primaryColor || "#000000",
    },
    documentBorder: {
      borderStyle: theme.borderStyle || "solid",
      borderWidth: theme.borderWidth || 1,
      borderColor: theme.tableBorderColor || "#000000",
      borderRadius: 0,
    },
    tableBorder: {
      borderStyle: theme.borderStyle || "solid",
      borderWidth: theme.borderWidth || 1,
      borderColor: theme.tableBorderColor || "#000000",
      borderRadius: 0,
    },
    tableHeaderBorder: {
      borderStyle: theme.borderStyle || "solid",
      borderWidth: theme.borderWidth || 1,
      borderColor: theme.tableBorderColor || "#000000",
      borderRadius: 0,
    },
    tableCellBorder: {
      borderStyle: theme.borderStyle || "solid",
      borderWidth: theme.borderWidth || 1,
      borderColor: theme.tableBorderColor || "#000000",
      borderRadius: 0,
    },
    signatureBorder: {
      borderStyle: theme.borderStyle || "solid",
      borderWidth: theme.borderWidth || 1,
      borderColor: theme.tableBorderColor || "#000000",
      borderRadius: 0,
    },
    customCSS: "",
  };
}
