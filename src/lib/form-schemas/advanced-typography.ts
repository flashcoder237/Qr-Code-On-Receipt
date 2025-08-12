// src/lib/form-schemas/advanced-typography.ts
import * as z from "zod";

// Liste des polices disponibles
export const AVAILABLE_FONTS = [
  "Times New Roman, serif",
  "Arial, sans-serif",
  "Helvetica, sans-serif",
  "Georgia, serif",
  "Verdana, sans-serif",
  "Domine, sans-serif",
  "Calibri, sans-serif",
  "Cambria, serif",
  "Garamond, serif",
  "Palatino, serif",
  "Book Antiqua, serif",
  "Century Gothic, sans-serif",
  "Trebuchet MS, sans-serif",
  "Tahoma, sans-serif",
  "Lucida Grande, sans-serif",
  "Franklin Gothic Medium, sans-serif",
  "Segoe UI, sans-serif",
  "Open Sans, sans-serif",
  "Roboto, sans-serif",
  "Lato, sans-serif",
  "Montserrat, sans-serif",
] as const;

export const FONT_WEIGHTS = [
  "100", "200", "300", "400", "500", "600", "700", "800", "900",
  "normal", "bold", "bolder", "lighter"
] as const;

export const FONT_STYLES = [
  "normal", "italic", "oblique"
] as const;

export const BORDER_STYLES = [
  "none", "solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"
] as const;

// Schéma pour une configuration de police avancée
export const AdvancedFontConfigSchema = z.object({
  fontFamily: z.enum(AVAILABLE_FONTS),
  fontSize: z.number().min(6).max(72),
  fontWeight: z.enum(FONT_WEIGHTS),
  fontStyle: z.enum(FONT_STYLES),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide"),
  lineHeight: z.number().min(0.8).max(3.0).optional(),
  letterSpacing: z.number().min(-2).max(5).optional(),
  textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),
});

// Schéma pour une configuration de bordure avancée
export const AdvancedBorderConfigSchema = z.object({
  style: z.enum(BORDER_STYLES),
  width: z.number().min(0).max(10),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide"),
  radius: z.number().min(0).max(20).optional(),
});

// Configuration avancée pour les relevés
export const AdvancedTranscriptConfigSchema = z.object({
  // Polices
  headerTitle: AdvancedFontConfigSchema,
  headerSubtitle: AdvancedFontConfigSchema,
  headerInfo: AdvancedFontConfigSchema,
  studentInfo: AdvancedFontConfigSchema,
  tableHeader: AdvancedFontConfigSchema,
  tableContent: AdvancedFontConfigSchema,
  footer: AdvancedFontConfigSchema,
  signature: AdvancedFontConfigSchema,
  
  // Bordures
  documentBorder: AdvancedBorderConfigSchema,
  tableBorder: AdvancedBorderConfigSchema,
  tableHeaderBorder: AdvancedBorderConfigSchema,
  tableCellBorder: AdvancedBorderConfigSchema,
  signatureBorder: AdvancedBorderConfigSchema.optional(),
  
  // Options générales
  enableAdvancedTypography: z.boolean(),
  customCSS: z.string().optional(),
});

// Schéma pour la configuration d'espacement avancée
export const AdvancedSpacingConfigSchema = z.object({
  titleSpacing: z.number().min(0).max(50).optional(), // Espacement après le titre principal
  subtitleSpacing: z.number().min(0).max(50).optional(), // Espacement après le sous-titre
  headerSpacing: z.number().min(0).max(50).optional(), // Espacement après l'en-tête
  studentInfoSpacing: z.number().min(0).max(50).optional(), // Espacement après les infos étudiant
  tableSpacing: z.number().min(0).max(50).optional(), // Espacement entre les tableaux
  paragraphSpacing: z.number().min(0).max(50).optional(), // Espacement entre paragraphes
  sectionSpacing: z.number().min(0).max(50).optional(), // Espacement entre sections
  footerSpacing: z.number().min(0).max(50).optional(), // Espacement avant le pied de page
  signatureSpacing: z.number().min(0).max(50).optional(), // Espacement entre signatures
});

// Schéma pour la configuration de tableau avancée
export const AdvancedTableConfigSchema = z.object({
  // Couleurs avec support d'opacité
  headerBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional(),
  headerBackgroundOpacity: z.number().min(0).max(1).optional(),
  rowBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional(),
  rowBackgroundOpacity: z.number().min(0).max(1).optional(),
  alternateRowBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional(),
  alternateRowBackgroundOpacity: z.number().min(0).max(1).optional(),
  
  // Bordures avancées
  enableOuterBorder: z.boolean().optional(),
  outerBorderStyle: z.enum(BORDER_STYLES).optional(),
  outerBorderWidth: z.number().min(0).max(10).optional(),
  outerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional(),
  
  enableInnerBorder: z.boolean().optional(),
  innerBorderStyle: z.enum(BORDER_STYLES).optional(),
  innerBorderWidth: z.number().min(0).max(10).optional(),
  innerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional(),
  
  enableHeaderBorder: z.boolean().optional(),
  headerBorderStyle: z.enum(BORDER_STYLES).optional(),
  headerBorderWidth: z.number().min(0).max(10).optional(),
  headerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional(),
  
  // Effets visuels
  enableShadow: z.boolean().optional(),
  shadowColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional(),
  shadowOpacity: z.number().min(0).max(1).optional(),
  shadowBlur: z.number().min(0).max(20).optional(),
  shadowOffsetX: z.number().min(-10).max(10).optional(),
  shadowOffsetY: z.number().min(-10).max(10).optional(),
  
  enableRadius: z.boolean().optional(),
  borderRadius: z.number().min(0).max(20).optional(),
  
  // Padding et espacement
  cellPadding: z.number().min(0).max(20).optional(),
  headerCellPadding: z.number().min(0).max(20).optional(),
  
  // Styles de contenu
  enableStriped: z.boolean().optional(),
  enableHover: z.boolean().optional(),
  hoverBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide").optional(),
  hoverBackgroundOpacity: z.number().min(0).max(1).optional(),
});

// Configuration avancée pour les attestations
export const AdvancedAttestationConfigSchema = z.object({
  // Polices
  mainTitle: AdvancedFontConfigSchema,
  subtitle: AdvancedFontConfigSchema,
  headerInfo: AdvancedFontConfigSchema,
  studentInfo: AdvancedFontConfigSchema,
  tableHeader: AdvancedFontConfigSchema,
  tableContent: AdvancedFontConfigSchema,
  footer: AdvancedFontConfigSchema,
  signature: AdvancedFontConfigSchema,
  disclaimer: AdvancedFontConfigSchema,
  
  // Bordures
  documentBorder: AdvancedBorderConfigSchema,
  tableBorder: AdvancedBorderConfigSchema,
  tableHeaderBorder: AdvancedBorderConfigSchema,
  tableCellBorder: AdvancedBorderConfigSchema,
  signatureBorder: AdvancedBorderConfigSchema.optional(),
  
  // NOUVEAU: Espacement avancé
  spacing: AdvancedSpacingConfigSchema.optional(),
  
  // NOUVEAU: Configuration de tableau avancée
  tableDesign: AdvancedTableConfigSchema.optional(),
  
  // Options générales
  enableAdvancedTypography: z.boolean(),
  customCSS: z.string().optional(),
});

export type AdvancedFontConfig = z.infer<typeof AdvancedFontConfigSchema>;
export type AdvancedBorderConfig = z.infer<typeof AdvancedBorderConfigSchema>;
export type AdvancedSpacingConfig = z.infer<typeof AdvancedSpacingConfigSchema>;
export type AdvancedTableConfig = z.infer<typeof AdvancedTableConfigSchema>;
export type AdvancedTranscriptConfig = z.infer<typeof AdvancedTranscriptConfigSchema>;
export type AdvancedAttestationConfig = z.infer<typeof AdvancedAttestationConfigSchema>;

// Configurations par défaut pour les relevés - CORRIGÉES
// NOTE: These are static defaults. To have dynamic defaults based on current theme,
// consider using functions to generate these configs dynamically.
export const defaultAdvancedTranscriptConfig: AdvancedTranscriptConfig = {
  enableAdvancedTypography: false,
  
  // Header Title (basé sur .header-row2 h1)
  headerTitle: {
    fontFamily: "Times New Roman, serif",
    fontSize: 18,
    fontWeight: "100",
    fontStyle: "normal",
    color: "#0066cc",
    lineHeight: 1.2,
  },
  
  // Header Subtitle
  headerSubtitle: {
    fontFamily: "Times New Roman, serif",
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#0066cc",
    lineHeight: 1.2,
  },
  
  // Header Info
  headerInfo: {
    fontFamily: "Times New Roman, serif",
    fontSize: 10,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.0,
  },
  
  // Student Info
  studentInfo: {
    fontFamily: "Times New Roman, serif",
    fontSize: 10,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 0,
  },
  
  // Table Header
  tableHeader: {
    fontFamily: "Times New Roman, serif",
    fontSize: 10,
    fontWeight: "bold",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.1,
  },
  
  // Table Content
  tableContent: {
    fontFamily: "Times New Roman, serif",
    fontSize: 10,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.1,
  },
  
  // Footer
  footer: {
    fontFamily: "Times New Roman, serif",
    fontSize: 8,
    fontWeight: "normal",
    fontStyle: "italic",
    color: "#000000",
    lineHeight: 1.2,
  },
  
  // Signature
  signature: {
    fontFamily: "Times New Roman, serif",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.2,
  },
  
  // Document Border
  documentBorder: {
    style: "solid",
    width: 2,
    color: "#000000",
  },
  
  // Table Border
  tableBorder: {
    style: "solid",
    width: 2,
    color: "#000000",
  },
  
  // Table Header Border
  tableHeaderBorder: {
    style: "solid",
    width: 2,
    color: "#000000",
  },
  
  // Table Cell Border
  tableCellBorder: {
    style: "solid",
    width: 2,
    color: "#000000",
  },
};

// Configurations par défaut pour les attestations
export const defaultAdvancedAttestationConfig: AdvancedAttestationConfig = {
  enableAdvancedTypography: false,
  
  mainTitle: {
    fontFamily: "Times New Roman, serif",
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "normal",
    color: "#000080",
    lineHeight: 1.2,
    textTransform: "uppercase",
  },
  
  subtitle: {
    fontFamily: "Times New Roman, serif",
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#333333",
    lineHeight: 1.2,
  },
  
  headerInfo: {
    fontFamily: "Times New Roman, serif",
    fontSize: 10,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.2,
  },
  
  studentInfo: {
    fontFamily: "Times New Roman, serif",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.4,
  },
  
  tableHeader: {
    fontFamily: "Times New Roman, serif",
    fontSize: 11,
    fontWeight: "bold",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.2,
  },
  
  tableContent: {
    fontFamily: "Times New Roman, serif",
    fontSize: 11,
    fontWeight: "bold",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.2,
  },
  
  footer: {
    fontFamily: "Times New Roman, serif",
    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.4,
  },
  
  signature: {
    fontFamily: "Times New Roman, serif",
    fontSize: 12,
    fontWeight: "bold",
    fontStyle: "normal",
    color: "#000000",
    lineHeight: 1.2,
  },
  
  disclaimer: {
    fontFamily: "Times New Roman, serif",
    fontSize: 8,
    fontWeight: "normal",
    fontStyle: "italic",
    color: "#333333",
    lineHeight: 1.4,
  },
  
  documentBorder: {
    style: "solid",
    width: 1,
    color: "#000000",
  },
  
  tableBorder: {
    style: "solid",
    width: 1,
    color: "#000000",
  },
  
  tableHeaderBorder: {
    style: "solid",
    width: 1,
    color: "#000000",
  },
  
  tableCellBorder: {
    style: "solid",
    width: 1,
    color: "#000000",
  },

  // NOUVEAU: Configuration d'espacement par défaut
  spacing: {
    titleSpacing: 8,        // 8px après le titre
    subtitleSpacing: 6,     // 6px après le sous-titre
    headerSpacing: 15,      // 15px après l'en-tête
    studentInfoSpacing: 10, // 10px après les infos étudiant
    tableSpacing: 8,        // 8px entre tableaux
    paragraphSpacing: 6,    // 6px entre paragraphes
    sectionSpacing: 20,     // 20px entre sections
    footerSpacing: 15,      // 15px avant le pied de page
    signatureSpacing: 25,   // 25px entre signatures
  },

  // NOUVEAU: Configuration de tableau par défaut
  tableDesign: {
    // Couleurs avec opacité
    headerBackgroundColor: "#f0f0f0",
    headerBackgroundOpacity: 1.0,
    rowBackgroundColor: "#ffffff",
    rowBackgroundOpacity: 1.0,
    alternateRowBackgroundColor: "#f9f9f9",
    alternateRowBackgroundOpacity: 1.0,
    
    // Bordures
    enableOuterBorder: true,
    outerBorderStyle: "solid",
    outerBorderWidth: 1,
    outerBorderColor: "#000000",
    
    enableInnerBorder: true,
    innerBorderStyle: "solid",
    innerBorderWidth: 1,
    innerBorderColor: "#000000",
    
    enableHeaderBorder: true,
    headerBorderStyle: "solid",
    headerBorderWidth: 1,
    headerBorderColor: "#000000",
    
    // Effets visuels
    enableShadow: false,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowBlur: 4,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
    
    enableRadius: false,
    borderRadius: 0,
    
    // Espacement
    cellPadding: 4,
    headerCellPadding: 6,
    
    // Styles
    enableStriped: false,
    enableHover: false,
    hoverBackgroundColor: "#e9ecef",
    hoverBackgroundOpacity: 1.0,
  },
};