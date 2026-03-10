// src/lib/form-schemas/diploma-theme-settings.ts
// Schéma de configuration des thèmes pour les diplômes

import * as z from "zod";

// Liste des polices disponibles (réutilisable pour tous les éléments)
const fontList = [
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
  // Sans-serif classiques
  "Arial, sans-serif",
  "Helvetica, sans-serif",
  "Calibri, sans-serif",
  "Verdana, sans-serif",
  "Tahoma, sans-serif",
  "Trebuchet MS, sans-serif",
  "Segoe UI, sans-serif",
  // Sans-serif modernes
  "Open Sans, sans-serif",
  "Roboto, sans-serif",
  "Lato, sans-serif",
  "Montserrat, sans-serif",
  "Source Sans Pro, sans-serif",
] as const;

const fontEnum = z.enum(fontList);

export const DiplomaThemeSettingsSchema = z.object({
  // === TYPOGRAPHIE - POLICES PAR ÉLÉMENT ===
  mainFont: fontEnum, // Police principale (fallback)
  titleFont: fontEnum, // Titre du diplôme
  subtitleFont: fontEnum, // Sous-titre (version anglaise)
  headerFont: fontEnum, // Header (République du Cameroun, etc.)
  legalTextFont: fontEnum, // Texte légal (Vu le décret...)
  studentNameFont: fontEnum, // Nom de l'étudiant
  studentInfoFont: fontEnum, // Informations étudiant (date, lieu naissance)
  footerFont: fontEnum, // Pied de page
  signatureFont: fontEnum, // Texte des signatures
  mentionFont: fontEnum, // Mention/Grade
  referenceFont: fontEnum, // N° MINESUP et Matricule

  // === INTERLIGNE ===
  headerLineHeight: z.number().min(1).max(2),

  // === TAILLES DE TEXTE ===
  titleFontSize: z.number().min(16).max(32),
  subtitleFontSize: z.number().min(12).max(24),
  headerFontSize: z.number().min(7).max(14),
  contentFontSize: z.number().min(8).max(16),
  legalTextFontSize: z.number().min(6).max(12),
  footerFontSize: z.number().min(7).max(12),
  studentNameFontSize: z.number().min(10).max(20),
  studentInfoFontSize: z.number().min(8).max(14),

  // === COULEURS ===
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),

  // === BORDURES ===
  outerBorderWidth: z.number().min(1).max(15),
  outerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  innerBorderWidth: z.number().min(0).max(5),
  innerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // === LOGOS - TAILLES ===
  fmspLogoSize: z.number().min(30).max(100),
  universityLogoSize: z.number().min(60).max(150),
  minesupLogoSize: z.number().min(40).max(120),
  coatOfArmsSize: z.number().min(60).max(150),
  watermarkLogoSize: z.number().min(200).max(600),

  // === LOGOS - POSITIONS (offsets en px) ===
  fmspLogoOffsetX: z.number().min(-50).max(100),
  fmspLogoOffsetY: z.number().min(-30).max(30),
  coatOfArmsOffsetX: z.number().min(-50).max(50),
  coatOfArmsOffsetY: z.number().min(-30).max(30),
  minesupLogoOffsetX: z.number().min(-100).max(50),
  minesupLogoOffsetY: z.number().min(-30).max(30),

  // === QR CODE ===
  qrCodeSize: z.number().min(40).max(100),
  showQRCode: z.boolean(),
  useCompactQR: z.boolean(),
  qrCodeOffsetX: z.number().min(-100).max(100),
  qrCodeOffsetY: z.number().min(-50).max(50),

  // === NUMÉRO DE RÉFÉRENCE ===
  referenceNumberFontSize: z.number().min(7).max(14),
  referenceNumberOffsetX: z.number().min(-50).max(50),
  referenceNumberOffsetY: z.number().min(-20).max(20),

  // === MATRICULE ===
  matriculeFontSize: z.number().min(8).max(18),
  matriculeLineHeight: z.number().min(1).max(2),

  // === STYLES PAR CHAMP EXCEL ===
  // Nom complet (réutilise studentNameFont & studentNameFontSize)
  fullNameColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // Date/Lieu de naissance
  birthInfoFont: fontEnum,
  birthInfoFontSize: z.number().min(8).max(20),
  birthInfoColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // Matricule (réutilise matriculeFontSize)
  matriculeFont: fontEnum,
  matriculeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // Mention (réutilise mentionFont)
  mentionFontSize: z.number().min(8).max(18),
  mentionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // Titre diplôme (valeur)
  diplomaTitleValueFont: fontEnum,
  diplomaTitleValueFontSize: z.number().min(10).max(24),
  diplomaTitleValueColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // Option
  optionFont: fontEnum,
  optionFontSize: z.number().min(8).max(20),
  optionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // Année d'obtention
  yearObtentionFont: fontEnum,
  yearObtentionFontSize: z.number().min(7).max(16),
  yearObtentionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // Dates jury
  juryDatesFont: fontEnum,
  juryDatesFontSize: z.number().min(6).max(12),
  juryDatesColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // === WATERMARK ===
  showWatermark: z.boolean(),
  watermarkOpacity: z.number().min(0.05).max(0.3),
  watermarkTextOpacity: z.number().min(0.02).max(0.1),
  watermarkColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  watermarkTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  watermarkTextSize: z.number().min(12).max(40),

  // === TITRE AVANCÉ ===
  titleLineHeight: z.number().min(0.8).max(2),
  titleLetterSpacing: z.number().min(-2).max(10),
  titleTextShadow: z.boolean(),
  titleShadowOffsetX: z.number().min(0).max(10),
  titleShadowOffsetY: z.number().min(0).max(10),
  titleShadowBlur: z.number().min(0).max(20),
  titleShadowColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // === BLOCS - HAUTEURS ET MARGES ===
  headerBlockMinHeight: z.number().min(0).max(150),
  titleBlockMarginTop: z.number().min(0).max(20),
  titleBlockMarginBottom: z.number().min(0).max(20),
  ministerBlockMarginBottom: z.number().min(0).max(15),
  recipientBlockMarginBottom: z.number().min(0).max(15),
  signatureBlockMarginTop: z.number().min(0).max(15),

  // === ESPACEMENT ===
  documentMarginTop: z.number().min(3).max(15),
  documentMarginBottom: z.number().min(3).max(15),
  documentMarginLeft: z.number().min(3).max(15),
  documentMarginRight: z.number().min(3).max(15),
  sectionSpacing: z.number().min(2).max(10),

  // === OPTIONS D'AFFICHAGE ===
  showBilingualText: z.boolean(),
  primaryLanguage: z.enum(["french", "english"]),
});

export type DiplomaThemeSettingsPayload = z.infer<typeof DiplomaThemeSettingsSchema>;

// Thème par défaut
export const defaultDiplomaTheme: DiplomaThemeSettingsPayload = {
  // Polices par élément (toutes Times New Roman par défaut sauf titre)
  mainFont: "Times New Roman, serif",
  titleFont: "Georgia, serif",
  subtitleFont: "Times New Roman, serif",
  headerFont: "Times New Roman, serif",
  legalTextFont: "Times New Roman, serif",
  studentNameFont: "Times New Roman, serif",
  studentInfoFont: "Times New Roman, serif",
  footerFont: "Times New Roman, serif",
  signatureFont: "Times New Roman, serif",
  mentionFont: "Times New Roman, serif",
  referenceFont: "Times New Roman, serif",

  // Interligne
  headerLineHeight: 1.15,

  // Tailles de texte
  titleFontSize: 20,
  subtitleFontSize: 16,
  headerFontSize: 9,
  contentFontSize: 10,
  legalTextFontSize: 7.5,
  footerFontSize: 8.5,
  studentNameFontSize: 13,
  studentInfoFontSize: 9.5,

  // Couleurs
  primaryColor: "#000080",
  secondaryColor: "#000000",
  accentColor: "#000080",

  // Bordures
  outerBorderWidth: 8,
  outerBorderColor: "#000080",
  innerBorderWidth: 1,
  innerBorderColor: "#000080",

  // Logos - Tailles
  fmspLogoSize: 55,
  universityLogoSize: 100,
  minesupLogoSize: 70,
  coatOfArmsSize: 100,
  watermarkLogoSize: 400,

  // Logos - Positions
  fmspLogoOffsetX: 50,
  fmspLogoOffsetY: 0,
  coatOfArmsOffsetX: 0,
  coatOfArmsOffsetY: 0,
  minesupLogoOffsetX: -50,
  minesupLogoOffsetY: 0,

  // QR Code
  qrCodeSize: 50,
  showQRCode: true,
  useCompactQR: false,
  qrCodeOffsetX: 0,
  qrCodeOffsetY: 0,

  // Numéro de référence
  referenceNumberFontSize: 9,
  referenceNumberOffsetX: 0,
  referenceNumberOffsetY: 0,

  // Matricule
  matriculeFontSize: 11.5,
  matriculeLineHeight: 1.3,

  // Styles par champ Excel
  fullNameColor: "#000080",

  birthInfoFont: "Times New Roman, serif",
  birthInfoFontSize: 13,
  birthInfoColor: "#000080",

  matriculeFont: "Times New Roman, serif",
  matriculeColor: "#000080",

  mentionFontSize: 11.5,
  mentionColor: "#000080",

  diplomaTitleValueFont: "Times New Roman, serif",
  diplomaTitleValueFontSize: 14,
  diplomaTitleValueColor: "#000080",

  optionFont: "Times New Roman, serif",
  optionFontSize: 13,
  optionColor: "#000080",

  yearObtentionFont: "Times New Roman, serif",
  yearObtentionFontSize: 10,
  yearObtentionColor: "#000080",

  juryDatesFont: "Times New Roman, serif",
  juryDatesFontSize: 7.5,
  juryDatesColor: "#000000",

  // Watermark
  showWatermark: true,
  watermarkOpacity: 0.1,
  watermarkTextOpacity: 0.05,
  watermarkColor: "#000080",
  watermarkTextColor: "#000080",
  watermarkTextSize: 20,

  // Titre avancé
  titleLineHeight: 1.1,
  titleLetterSpacing: 0,
  titleTextShadow: true,
  titleShadowOffsetX: 3,
  titleShadowOffsetY: 3,
  titleShadowBlur: 6,
  titleShadowColor: "#000080",

  // Blocs
  headerBlockMinHeight: 0,
  titleBlockMarginTop: 0,
  titleBlockMarginBottom: 5,
  ministerBlockMarginBottom: 3,
  recipientBlockMarginBottom: 0,
  signatureBlockMarginTop: 4,

  // Espacement
  documentMarginTop: 6,
  documentMarginBottom: 6,
  documentMarginLeft: 6,
  documentMarginRight: 6,
  sectionSpacing: 5,

  // Options d'affichage
  showBilingualText: true,
  primaryLanguage: "french",
};

// Thèmes préréglés
export const diplomaThemePresets: { [key: string]: DiplomaThemeSettingsPayload } = {
  classic: {
    ...defaultDiplomaTheme,
  },

  elegant: {
    ...defaultDiplomaTheme,
    mainFont: "Garamond, serif",
    titleFont: "Didot, serif",
    subtitleFont: "Garamond, serif",
    headerFont: "Garamond, serif",
    legalTextFont: "Garamond, serif",
    studentNameFont: "Garamond, serif",
    studentInfoFont: "Garamond, serif",
    footerFont: "Garamond, serif",
    signatureFont: "Garamond, serif",
    mentionFont: "Garamond, serif",
    referenceFont: "Garamond, serif",
    titleFontSize: 22,
    subtitleFontSize: 18,
    primaryColor: "#1a1a4d",
    accentColor: "#1a1a4d",
    outerBorderWidth: 10,
    watermarkColor: "#1a1a4d",
    watermarkTextColor: "#1a1a4d",
    titleShadowColor: "#1a1a4d",
    titleLetterSpacing: 2,
    // Champs Excel
    fullNameColor: "#1a1a4d",
    birthInfoFont: "Garamond, serif",
    birthInfoColor: "#1a1a4d",
    matriculeFont: "Garamond, serif",
    matriculeColor: "#1a1a4d",
    mentionColor: "#1a1a4d",
    diplomaTitleValueFont: "Garamond, serif",
    diplomaTitleValueColor: "#1a1a4d",
    optionFont: "Garamond, serif",
    optionColor: "#1a1a4d",
    yearObtentionFont: "Garamond, serif",
    yearObtentionColor: "#1a1a4d",
    juryDatesFont: "Garamond, serif",
  },

  modern: {
    ...defaultDiplomaTheme,
    mainFont: "Calibri, sans-serif",
    titleFont: "Arial, sans-serif",
    subtitleFont: "Calibri, sans-serif",
    headerFont: "Calibri, sans-serif",
    legalTextFont: "Calibri, sans-serif",
    studentNameFont: "Calibri, sans-serif",
    studentInfoFont: "Calibri, sans-serif",
    footerFont: "Calibri, sans-serif",
    signatureFont: "Calibri, sans-serif",
    mentionFont: "Calibri, sans-serif",
    referenceFont: "Calibri, sans-serif",
    titleFontSize: 24,
    subtitleFontSize: 20,
    primaryColor: "#004d99",
    accentColor: "#004d99",
    outerBorderWidth: 6,
    innerBorderWidth: 2,
    watermarkColor: "#004d99",
    watermarkTextColor: "#004d99",
    titleShadowColor: "#004d99",
    titleTextShadow: false,
    // Champs Excel
    fullNameColor: "#004d99",
    birthInfoFont: "Calibri, sans-serif",
    birthInfoColor: "#004d99",
    matriculeFont: "Calibri, sans-serif",
    matriculeColor: "#004d99",
    mentionColor: "#004d99",
    diplomaTitleValueFont: "Calibri, sans-serif",
    diplomaTitleValueColor: "#004d99",
    optionFont: "Calibri, sans-serif",
    optionColor: "#004d99",
    yearObtentionFont: "Calibri, sans-serif",
    yearObtentionColor: "#004d99",
    juryDatesFont: "Calibri, sans-serif",
  },

  compact: {
    ...defaultDiplomaTheme,
    titleFontSize: 18,
    subtitleFontSize: 14,
    headerFontSize: 8,
    contentFontSize: 9,
    legalTextFontSize: 7,
    footerFontSize: 8,
    studentNameFontSize: 11,
    studentInfoFontSize: 9,
    sectionSpacing: 3,
    // Champs Excel (tailles réduites)
    birthInfoFontSize: 11,
    matriculeFontSize: 10,
    mentionFontSize: 10,
    diplomaTitleValueFontSize: 12,
    optionFontSize: 11,
    yearObtentionFontSize: 9,
    juryDatesFontSize: 7,
  },

  large: {
    ...defaultDiplomaTheme,
    titleFontSize: 24,
    subtitleFontSize: 20,
    headerFontSize: 11,
    contentFontSize: 12,
    legalTextFontSize: 9,
    footerFontSize: 10,
    studentNameFontSize: 16,
    studentInfoFontSize: 12,
    sectionSpacing: 7,
    // Champs Excel (tailles augmentées)
    birthInfoFontSize: 15,
    matriculeFontSize: 13,
    mentionFontSize: 13,
    diplomaTitleValueFontSize: 16,
    optionFontSize: 15,
    yearObtentionFontSize: 12,
    juryDatesFontSize: 9,
  },
};

export function validateDiplomaTheme(theme: unknown): DiplomaThemeSettingsPayload {
  return DiplomaThemeSettingsSchema.parse(theme);
}

export function mergeDiplomaTheme(
  partial: Partial<DiplomaThemeSettingsPayload>
): DiplomaThemeSettingsPayload {
  return {
    ...defaultDiplomaTheme,
    ...partial,
  };
}
