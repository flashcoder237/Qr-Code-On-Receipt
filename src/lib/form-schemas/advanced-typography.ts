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
  
  // Options générales
  enableAdvancedTypography: z.boolean(),
  customCSS: z.string().optional(),
});

export type AdvancedFontConfig = z.infer<typeof AdvancedFontConfigSchema>;
export type AdvancedBorderConfig = z.infer<typeof AdvancedBorderConfigSchema>;
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
};