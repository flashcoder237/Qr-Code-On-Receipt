// src/lib/form-schemas/centre-attestation-theme.ts
// Schéma de configuration des thèmes pour les attestations de centres

import * as z from "zod";

export const CentreAttestationThemeSchema = z.object({
  // === TYPOGRAPHIE ===
  // Police principale pour le contenu
  mainFont: z.enum([
    // Serif classiques
    "Times New Roman, serif",
    "Georgia, serif",
    "Garamond, serif",
    "Palatino, serif",
    "Cambria, serif",
    "Baskerville, serif",
    "Book Antiqua, serif",
    "Didot, serif",
    "Bodoni MT, serif",
    "Constantia, serif",

    // Sans-serif
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Calibri, sans-serif",
    "Verdana, sans-serif",
  ]),

  // Police pour les titres
  titleFont: z.enum([
    "Times New Roman, serif",
    "Georgia, serif",
    "Garamond, serif",
    "Palatino, serif",
    "Cambria, serif",
    "Baskerville, serif",
    "Book Antiqua, serif",
    "Didot, serif",
    "Bodoni MT, serif",
    "Constantia, serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Calibri, sans-serif",
    "Verdana, serif",
  ]),

  // === TAILLES DE TEXTE ===
  titleFontSize: z.number().min(16).max(32),          // Titre principal
  headerFontSize: z.number().min(7).max(14),          // En-tête (République)
  contentFontSize: z.number().min(8).max(16),         // Contenu principal
  legalTextFontSize: z.number().min(6).max(12),       // Textes légaux
  footerFontSize: z.number().min(7).max(12),          // Pied de page
  studentNameFontSize: z.number().min(10).max(20),    // Nom étudiant
  studentInfoFontSize: z.number().min(8).max(14),     // Info étudiant

  // === COULEURS ===
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),

  // === BORDURES ===
  outerBorderWidth: z.number().min(1).max(15),
  outerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  innerBorderWidth: z.number().min(0).max(5),
  innerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // === QR CODE ===
  qrCodeSize: z.number().min(40).max(100),
  showQRCode: z.boolean(),
  useCompactQR: z.boolean(),                          // Format compact

  // === WATERMARK ===
  showWatermark: z.boolean(),
  watermarkOpacity: z.number().min(0.05).max(0.3),

  // === ESPACEMENT ===
  documentMarginTop: z.number().min(3).max(15),
  documentMarginBottom: z.number().min(3).max(15),
  documentMarginLeft: z.number().min(3).max(15),
  documentMarginRight: z.number().min(3).max(15),
  sectionSpacing: z.number().min(2).max(10),

  // === OPTIONS ===
  showBilingualText: z.boolean(),
  primaryLanguage: z.enum(["french", "english"]),
});

export type CentreAttestationTheme = z.infer<typeof CentreAttestationThemeSchema>;

// Thème par défaut pour les attestations de centres
export const defaultCentreAttestationTheme: CentreAttestationTheme = {
  // Typographie
  mainFont: "Times New Roman, serif",
  titleFont: "Georgia, serif",

  // Tailles de texte
  titleFontSize: 20,
  headerFontSize: 9,
  contentFontSize: 10,
  legalTextFontSize: 7.5,
  footerFontSize: 8.5,
  studentNameFontSize: 13,
  studentInfoFontSize: 9.5,

  // Couleurs
  primaryColor: "#000080",      // Bleu marine
  secondaryColor: "#000000",    // Noir
  accentColor: "#D4AF37",       // Or/doré pour les bordures

  // Bordures
  outerBorderWidth: 8,
  outerBorderColor: "#D4AF37",  // Or/doré
  innerBorderWidth: 2,
  innerBorderColor: "#D4AF37",

  // QR Code
  qrCodeSize: 50,
  showQRCode: true,
  useCompactQR: false,

  // Watermark
  showWatermark: true,
  watermarkOpacity: 0.1,

  // Espacement
  documentMarginTop: 6,
  documentMarginBottom: 6,
  documentMarginLeft: 6,
  documentMarginRight: 6,
  sectionSpacing: 5,

  // Options
  showBilingualText: true,
  primaryLanguage: "french",
};

/**
 * Thèmes préréglés pour les attestations de centres
 */
export const centreAttestationThemePresets: { [key: string]: CentreAttestationTheme } = {
  classic: {
    ...defaultCentreAttestationTheme,
  },

  elegant: {
    ...defaultCentreAttestationTheme,
    mainFont: "Garamond, serif",
    titleFont: "Didot, serif",
    titleFontSize: 22,
    primaryColor: "#1a1a4d",
    accentColor: "#1a1a4d",
    outerBorderWidth: 10,
    outerBorderColor: "#1a1a4d",
    innerBorderColor: "#1a1a4d",
  },

  modern: {
    ...defaultCentreAttestationTheme,
    mainFont: "Calibri, sans-serif",
    titleFont: "Arial, sans-serif",
    titleFontSize: 24,
    primaryColor: "#004d99",
    accentColor: "#004d99",
    outerBorderWidth: 6,
    innerBorderWidth: 2,
    outerBorderColor: "#004d99",
    innerBorderColor: "#004d99",
  },

  compact: {
    ...defaultCentreAttestationTheme,
    titleFontSize: 18,
    headerFontSize: 8,
    contentFontSize: 9,
    legalTextFontSize: 7,
    footerFontSize: 8,
    studentNameFontSize: 11,
    studentInfoFontSize: 9,
    sectionSpacing: 3,
  },
};

/**
 * Fonction pour valider un thème d'attestation de centre
 */
export function validateCentreAttestationTheme(theme: unknown): CentreAttestationTheme {
  return CentreAttestationThemeSchema.parse(theme);
}

/**
 * Fonction pour fusionner un thème partiel avec le thème par défaut
 */
export function mergeCentreAttestationTheme(
  partial: Partial<CentreAttestationTheme>
): CentreAttestationTheme {
  return {
    ...defaultCentreAttestationTheme,
    ...partial,
  };
}
