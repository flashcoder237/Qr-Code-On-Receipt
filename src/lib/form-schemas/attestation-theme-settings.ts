// src/lib/form-schemas/attestation-theme-settings.ts - Version mise à jour
import * as z from "zod";
import { AdvancedAttestationConfigSchema, defaultAdvancedAttestationConfig } from "./advanced-typography";

export const AttestationThemeSettingsSchema = z.object({
  // Couleurs générales
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  tableBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  tableHeaderBgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  
  // Typographie de base
  mainFont: z.enum([
    "Times New Roman, serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif",
    "Verdana, sans-serif",
    "Domine, sans-serif",
    "Calibri, sans-serif",
    "Cambria, serif",
  ]),
  headerFont: z.enum([
    "Times New Roman, serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif",
    "Verdana, sans-serif",
    "Domine, sans-serif",
    "Calibri, sans-serif",
    "Cambria, serif",
  ]),
  
  // Tailles de police de base
  titleFontSize: z.number().min(16).max(32),
  subtitleFontSize: z.number().min(14).max(28),
  headerFontSize: z.number().min(8).max(16),
  contentFontSize: z.number().min(10).max(18),
  footerFontSize: z.number().min(8).max(14),
  
  // Mise en page de l'en-tête
  headerLayout: z.enum(["standard", "compact", "extended"]),
  logoSize: z.enum(["small", "medium", "large"]),
  logoPosition: z.enum(["top", "header", "integrated"]),
  
  // Disposition du contenu
  contentLayout: z.enum(["standard", "modern", "formal"]),
  tableStyle: z.enum(["simple", "bordered", "striped", "modern"]),
  
  // Bordures et espacement de base
  borderStyle: z.enum(["solid", "dashed", "dotted", "double", "none"]),
  borderWidth: z.number().min(0).max(5),
  tableCellPadding: z.number().min(2).max(15),
  documentPadding: z.number().min(10).max(30),
  
  // Options d'affichage
  showWatermark: z.boolean(),
  watermarkOpacity: z.number().min(0.05).max(0.5),
  showQRCode: z.boolean(),
  qrCodeSize: z.enum(["small", "medium", "large"]),
  qrCodePosition: z.enum(["bottom-left", "bottom-right", "bottom-center", "custom"]),
  
  // Style des signatures
  signatureStyle: z.enum(["standard", "boxed", "underlined", "modern"]),
  signatureLayout: z.enum(["side-by-side", "stacked", "centered"]),
  
  // Personnalisation du texte
  customTitle: z.string().optional(),
  customSubtitle: z.string().optional(),
  customFooterText: z.string().optional(),
  
  // Options linguistiques
  showBilingualText: z.boolean(),
  primaryLanguage: z.enum(["french", "english"]),
  
  // Styles de tableau académique
  showDomainTable: z.boolean(),
  showAcademicDetails: z.boolean(),
  compactMode: z.boolean(),
  
  // NOUVEAU: Configuration typographique avancée
  advancedConfig: AdvancedAttestationConfigSchema.optional(),
});

export type AttestationThemeSettingsPayload = z.infer<typeof AttestationThemeSettingsSchema>;

// Thème par défaut pour les attestations
export const defaultAttestationTheme: AttestationThemeSettingsPayload = {
  // Couleurs
  primaryColor: "#000000",
  secondaryColor: "#333333", 
  accentColor: "#000",
  tableBorderColor: "#000000",
  tableHeaderBgColor: "#f0f0f0",
  
  // Typographie
  mainFont: "Times New Roman, serif",
  headerFont: "Times New Roman, serif",
  
  // Tailles de police
  titleFontSize: 24,
  subtitleFontSize: 22,
  headerFontSize: 10,
  contentFontSize: 12,
  footerFontSize: 8,
  
  // Mise en page
  headerLayout: "standard",
  logoSize: "medium",
  logoPosition: "integrated",
  
  // Contenu
  contentLayout: "standard",
  tableStyle: "simple",
  
  // Bordures
  borderStyle: "solid",
  borderWidth: 1,
  tableCellPadding: 4,
  documentPadding: 20,
  
  // Options d'affichage  
  showWatermark: true,
  watermarkOpacity: 0.3,
  showQRCode: true,
  qrCodeSize: "medium",
  qrCodePosition: "bottom-left",
  
  // Signatures
  signatureStyle: "standard",
  signatureLayout: "side-by-side",
  
  // Texte personnalisé
  customTitle: undefined,
  customSubtitle: undefined,
  customFooterText: undefined,
  
  // Langue
  showBilingualText: true,
  primaryLanguage: "french",
  
  // Tableau académique
  showDomainTable: true,
  showAcademicDetails: true,
  compactMode: true,
  
  // Configuration avancée par défaut
  advancedConfig: defaultAdvancedAttestationConfig,
};

import { AdvancedAttestationConfig, defaultAdvancedAttestationConfig } from "./advanced-typography";

// NOUVEAU: Fonction pour convertir un thème d'attestation en configuration avancée
export function convertAttestationThemeToAdvancedConfig(theme: AttestationThemeSettingsPayload): AdvancedAttestationConfig {
  const baseFont = theme.mainFont || defaultAdvancedAttestationConfig.mainTitle.fontFamily;
  const baseFontSize = theme.contentFontSize || 12;
  const baseLineHeight = 1.2;

  return {
    enableAdvancedTypography: true,
    mainTitle: {
      fontFamily: theme.headerFont || baseFont,
      fontSize: theme.titleFontSize || 24,
      fontWeight: "bold",
      fontStyle: "normal",
      color: theme.primaryColor || "#000080",
      lineHeight: baseLineHeight,
      textTransform: "uppercase",
    },
    subtitle: {
      fontFamily: baseFont,
      fontSize: theme.subtitleFontSize || 22,
      fontWeight: "bold",
      fontStyle: "italic",
      color: theme.secondaryColor || "#333333",
      lineHeight: baseLineHeight,
    },
    headerInfo: {
      fontFamily: baseFont,
      fontSize: theme.headerFontSize || 10,
      fontWeight: "normal",
      fontStyle: "normal",
      color: theme.secondaryColor || "#505050",
      lineHeight: baseLineHeight,
    },
    studentInfo: {
      fontFamily: baseFont,
      fontSize: baseFontSize,
      fontWeight: "normal",
      fontStyle: "normal",
      color: theme.primaryColor || "#000000",
      lineHeight: baseLineHeight,
    },
    tableHeader: {
      fontFamily: baseFont,
      fontSize: theme.headerFontSize || 11,
      fontWeight: "bold",
      fontStyle: "normal",
      color: theme.primaryColor || "#000000",
      lineHeight: baseLineHeight,
    },
    tableContent: {
      fontFamily: baseFont,
      fontSize: baseFontSize,
      fontWeight: "normal",
      fontStyle: "normal",
      color: theme.primaryColor || "#000000",
      lineHeight: baseLineHeight,
    },
    footer: {
      fontFamily: baseFont,
      fontSize: theme.footerFontSize || 12,
      fontWeight: "normal",
      fontStyle: "normal",
      color: theme.secondaryColor || "#505050",
      lineHeight: baseLineHeight,
    },
    signature: {
      fontFamily: baseFont,
      fontSize: theme.footerFontSize || 12,
      fontWeight: "bold",
      fontStyle: "normal",
      color: theme.primaryColor || "#000000",
      lineHeight: baseLineHeight,
    },
    disclaimer: {
      fontFamily: baseFont,
      fontSize: theme.footerFontSize || 8,
      fontWeight: "normal",
      fontStyle: "italic",
      color: theme.secondaryColor || "#333333",
      lineHeight: baseLineHeight,
    },
    documentBorder: {
      style: theme.borderStyle || "solid",
      width: theme.borderWidth || 1,
      color: theme.tableBorderColor || "#000000",
      radius: 0,
    },
    tableBorder: {
      style: theme.borderStyle || "solid",
      width: theme.borderWidth || 1,
      color: theme.tableBorderColor || "#000000",
      radius: 0,
    },
    tableHeaderBorder: {
      style: theme.borderStyle || "solid",
      width: theme.borderWidth || 1,
      color: theme.tableBorderColor || "#000000",
      radius: 0,
    },
    tableCellBorder: {
      style: theme.borderStyle || "solid",
      width: theme.borderWidth || 1,
      color: theme.tableBorderColor || "#000000",
      radius: 0,
    },
    signatureBorder: {
      style: theme.borderStyle || "solid",
      width: theme.borderWidth || 1,
      color: theme.tableBorderColor || "#000000",
      radius: 0,
    },
    customCSS: "",
  };
}

// NOUVEAU: Fonction pour obtenir la configuration avancée des attestations
export function getAdvancedAttestationConfig(theme: AttestationThemeSettingsPayload) {
  if (theme.advancedConfig) {
    return theme.advancedConfig;
  }
  return convertAttestationThemeToAdvancedConfig(theme);
}

// Export pour compatibilité
export { defaultAdvancedAttestationConfig, AdvancedAttestationConfigSchema } from "./advanced-typography";