import * as z from "zod";

export const ThemeSettingsSchema = z.object({
  // Couleurs
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (ex: #000000)"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (ex: #000000)"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (ex: #000000)"),
  tableHeaderBgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (ex: #000000)"),
  tableBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (ex: #000000)"),
  
  // Typographie
  mainFont: z.enum([
    "Times New Roman, serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif",
    "Verdana, sans-serif",
    "Calibri, sans-serif",
    "Cambria, serif",
  ], {
    errorMap: () => ({ message: "Police de caractères invalide" })
  }),
  headerFont: z.enum([
    "Times New Roman, serif",
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif",
    "Verdana, sans-serif", 
    "Calibri, sans-serif",
    "Cambria, serif",
  ], {
    errorMap: () => ({ message: "Police de caractères invalide" })
  }),
  
  // Tailles de police
  titleFontSize: z.number().min(8).max(24),
  headerFontSize: z.number().min(6).max(16),
  contentFontSize: z.number().min(6).max(14),
  footerFontSize: z.number().min(6).max(12),
  
  // Bordures et espacement
  borderStyle: z.enum(["solid", "dashed", "dotted", "double", "groove", "ridge"]),
  borderWidth: z.number().min(1).max(5),
  tableCellPadding: z.number().min(1).max(10),
  
  // Format du relevé
  watermarkOpacity: z.number().min(0.05).max(0.5),
  signatureStyle: z.enum(["standard", "encadré", "souligné"]),
  
  // Mise en page
  headerLayout: z.enum(["standard", "compact", "étendu"]),
  studentInfoLayout: z.enum(["grille", "colonnes", "ligne"]),
  
  // Options d'affichage
  showWatermark: z.boolean(),
  showQRCode: z.boolean(),
  showGradeScale: z.boolean(),
  highlightValidatedUE: z.boolean(),
});

export type ThemeSettingsPayload = z.infer<typeof ThemeSettingsSchema>;

// Thème par défaut qui sera utilisé si aucun thème n'est défini
export const defaultTheme: ThemeSettingsPayload = {
  primaryColor: "#000000", // Couleur principale (texte standard)
  secondaryColor: "#505050", // Couleur secondaire (pour les sous-titres)
  accentColor: "#000080", // Couleur d'accent (pour les éléments à mettre en valeur)
  tableHeaderBgColor: "#f0f0f0", // Couleur d'arrière-plan des en-têtes de tableau
  tableBorderColor: "#000000", // Couleur des bordures de tableau
  
  mainFont: "Times New Roman, serif", // Police principale
  headerFont: "Times New Roman, serif", // Police pour les en-têtes
  
  titleFontSize: 14, // Taille de police pour les titres principaux
  headerFontSize: 10, // Taille de police pour les en-têtes
  contentFontSize: 10, // Taille de police pour le contenu
  footerFontSize: 8, // Taille de police pour le pied de page
  
  borderStyle: "solid", // Style de bordure
  borderWidth: 1, // Largeur de bordure
  tableCellPadding: 5, // Espacement interne des cellules de tableau
  
  watermarkOpacity: 0.1, // Opacité du filigrane
  signatureStyle: "standard", // Style des zones de signature
  
  headerLayout: "standard", // Disposition de l'en-tête
  studentInfoLayout: "grille", // Disposition des informations sur l'étudiant
  
  showWatermark: true, // Afficher le filigrane
  showQRCode: true, // Afficher le code QR
  showGradeScale: true, // Afficher l'échelle de notation
  highlightValidatedUE: true, // Mettre en évidence les UE validées
};