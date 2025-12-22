// src/lib/form-schemas/diploma-theme-settings.ts
// Schéma de configuration des thèmes pour les diplômes

import * as z from "zod";

export const DiplomaThemeSettingsSchema = z.object({
  // === TYPOGRAPHIE ===
  // Police principale pour le contenu - Très large gamme de polices
  mainFont: z.enum([
    // Serif classiques (formelles, traditionnelles)
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
    "Hoefler Text, serif",
    "Century Schoolbook, serif",
    "Rockwell, serif",
    "Caslon, serif",
    "Cochin, serif",
    "Big Caslon, serif",
    "Goudy Old Style, serif",

    // Serif modernes/élégantes
    "Domine, serif",
    "Playfair Display, serif",
    "Lora, serif",
    "Merriweather, serif",
    "Crimson Text, serif",
    "EB Garamond, serif",
    "Libre Baskerville, serif",
    "Cormorant, serif",
    "Cinzel, serif",
    "Spectral, serif",
    "Crimson Pro, serif",
    "Cardo, serif",
    "Vollkorn, serif",
    "Alegreya, serif",
    "Bitter, serif",
    "Arvo, serif",
    "PT Serif, serif",
    "Neuton, serif",

    // Sans-serif classiques
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Calibri, sans-serif",
    "Verdana, sans-serif",
    "Tahoma, sans-serif",
    "Trebuchet MS, sans-serif",
    "Geneva, sans-serif",
    "Lucida Grande, sans-serif",
    "Arial Narrow, sans-serif",
    "Segoe UI, sans-serif",

    // Sans-serif modernes
    "Open Sans, sans-serif",
    "Roboto, sans-serif",
    "Lato, sans-serif",
    "Montserrat, sans-serif",
    "Nunito, sans-serif",
    "Source Sans Pro, sans-serif",
    "Inter, sans-serif",
    "Poppins, sans-serif",
    "Raleway, sans-serif",
    "Ubuntu, sans-serif",
    "Noto Sans, sans-serif",
    "Work Sans, sans-serif",
    "PT Sans, sans-serif",
    "Fira Sans, sans-serif",
    "DM Sans, sans-serif",
    "Manrope, sans-serif",
    "Karla, sans-serif",
    "Rubik, sans-serif",
    "Quicksand, sans-serif",
    "Barlow, sans-serif",
    "Outfit, sans-serif",
    "Plus Jakarta Sans, sans-serif",
    "Space Grotesk, sans-serif",
    "Archivo, sans-serif",
    "Josefin Sans, sans-serif",
    "Assistant, sans-serif",

    // Polices professionnelles
    "Century Gothic, sans-serif",
    "Franklin Gothic, sans-serif",
    "Gill Sans, sans-serif",
    "Futura, sans-serif",
    "Optima, sans-serif",
    "Avenir, sans-serif",
    "Gotham, sans-serif",
    "Proxima Nova, sans-serif",

    // Polices monospace/techniques
    "Courier New, monospace",
    "Monaco, monospace",
    "Consolas, monospace",
    "Source Code Pro, monospace",
    "Fira Code, monospace",
    "Roboto Mono, monospace",
    "IBM Plex Mono, monospace",
    "JetBrains Mono, monospace",
    "Inconsolata, monospace",

    // Polices display/créatives
    "Oswald, sans-serif",
    "Bebas Neue, sans-serif",
    "Anton, sans-serif",
    "Lobster, cursive",
    "Pacifico, cursive",
    "Dancing Script, cursive",
  ]),

  // Police pour les titres
  titleFont: z.enum([
    // Serif classiques (formelles, traditionnelles)
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
    "Hoefler Text, serif",
    "Century Schoolbook, serif",
    "Rockwell, serif",
    "Caslon, serif",
    "Cochin, serif",
    "Big Caslon, serif",
    "Goudy Old Style, serif",

    // Serif modernes/élégantes
    "Domine, serif",
    "Playfair Display, serif",
    "Lora, serif",
    "Merriweather, serif",
    "Crimson Text, serif",
    "EB Garamond, serif",
    "Libre Baskerville, serif",
    "Cormorant, serif",
    "Cinzel, serif",
    "Spectral, serif",
    "Crimson Pro, serif",
    "Cardo, serif",
    "Vollkorn, serif",
    "Alegreya, serif",
    "Bitter, serif",
    "Arvo, serif",
    "PT Serif, serif",
    "Neuton, serif",

    // Sans-serif classiques
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Calibri, sans-serif",
    "Verdana, sans-serif",
    "Tahoma, sans-serif",
    "Trebuchet MS, sans-serif",
    "Geneva, sans-serif",
    "Lucida Grande, sans-serif",
    "Arial Narrow, sans-serif",
    "Segoe UI, sans-serif",

    // Sans-serif modernes
    "Open Sans, sans-serif",
    "Roboto, sans-serif",
    "Lato, sans-serif",
    "Montserrat, sans-serif",
    "Nunito, sans-serif",
    "Source Sans Pro, sans-serif",
    "Inter, sans-serif",
    "Poppins, sans-serif",
    "Raleway, sans-serif",
    "Ubuntu, sans-serif",
    "Noto Sans, sans-serif",
    "Work Sans, sans-serif",
    "PT Sans, sans-serif",
    "Fira Sans, sans-serif",
    "DM Sans, sans-serif",
    "Manrope, sans-serif",
    "Karla, sans-serif",
    "Rubik, sans-serif",
    "Quicksand, sans-serif",
    "Barlow, sans-serif",
    "Outfit, sans-serif",
    "Plus Jakarta Sans, sans-serif",
    "Space Grotesk, sans-serif",
    "Archivo, sans-serif",
    "Josefin Sans, sans-serif",
    "Assistant, sans-serif",

    // Polices professionnelles
    "Century Gothic, sans-serif",
    "Franklin Gothic, sans-serif",
    "Gill Sans, sans-serif",
    "Futura, sans-serif",
    "Optima, sans-serif",
    "Avenir, sans-serif",
    "Gotham, sans-serif",
    "Proxima Nova, sans-serif",

    // Polices monospace/techniques
    "Courier New, monospace",
    "Monaco, monospace",
    "Consolas, monospace",
    "Source Code Pro, monospace",
    "Fira Code, monospace",
    "Roboto Mono, monospace",
    "IBM Plex Mono, monospace",
    "JetBrains Mono, monospace",
    "Inconsolata, monospace",

    // Polices display/créatives
    "Oswald, sans-serif",
    "Bebas Neue, sans-serif",
    "Anton, sans-serif",
    "Lobster, cursive",
    "Pacifico, cursive",
    "Dancing Script, cursive",
  ]),

  // === TAILLES DE TEXTE ===
  // Titre principal du diplôme
  titleFontSize: z.number().min(16).max(32),

  // Sous-titre (version anglaise)
  subtitleFontSize: z.number().min(12).max(24),

  // Texte d'en-tête (République du Cameroun, etc.)
  headerFontSize: z.number().min(7).max(14),

  // Texte de contenu principal
  contentFontSize: z.number().min(8).max(16),

  // Texte légal (Vu le décret, etc.)
  legalTextFontSize: z.number().min(6).max(12),

  // Texte de pied de page
  footerFontSize: z.number().min(7).max(12),

  // Nom de l'étudiant
  studentNameFontSize: z.number().min(10).max(20),

  // Informations de l'étudiant (date, lieu de naissance, etc.)
  studentInfoFontSize: z.number().min(8).max(14),

  // === COULEURS ===
  // Couleur principale (bordures, titres)
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),

  // Couleur secondaire (texte normal)
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),

  // Couleur d'accent (éléments importants)
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal"),

  // === BORDURES ===
  // Style de bordure extérieure
  outerBorderWidth: z.number().min(1).max(15),
  outerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // Style de bordure intérieure
  innerBorderWidth: z.number().min(0).max(5),
  innerBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),

  // === LOGOS ===
  // Taille du logo FMSP
  fmspLogoSize: z.number().min(30).max(100),

  // Taille du logo Université
  universityLogoSize: z.number().min(60).max(150),

  // Taille du logo MINESUP
  minesupLogoSize: z.number().min(40).max(120),

  // Taille des armoiries
  coatOfArmsSize: z.number().min(60).max(150),

  // Taille du logo watermark central
  watermarkLogoSize: z.number().min(200).max(600),

  // === QR CODE ===
  qrCodeSize: z.number().min(40).max(100),
  showQRCode: z.boolean(),
  useCompactQR: z.boolean(), // Utiliser le format QR compact (6 champs au lieu de 11)

  // === WATERMARK ===
  showWatermark: z.boolean(),
  watermarkOpacity: z.number().min(0.05).max(0.3),
  watermarkTextOpacity: z.number().min(0.02).max(0.1),

  // === ESPACEMENT ===
  // Marges du document (top, left, right, bottom)
  documentMarginTop: z.number().min(3).max(15),
  documentMarginBottom: z.number().min(3).max(15),
  documentMarginLeft: z.number().min(3).max(15),
  documentMarginRight: z.number().min(3).max(15),

  // Espacement entre les sections
  sectionSpacing: z.number().min(2).max(10),

  // === OPTIONS D'AFFICHAGE ===
  // Afficher le texte bilingue
  showBilingualText: z.boolean(),

  // Langue principale
  primaryLanguage: z.enum(["french", "english"]),
});

export type DiplomaThemeSettingsPayload = z.infer<typeof DiplomaThemeSettingsSchema>;

// Thème par défaut basé sur diplome.html
export const defaultDiplomaTheme: DiplomaThemeSettingsPayload = {
  // Typographie
  mainFont: "Times New Roman, serif",
  titleFont: "Georgia, serif",

  // Tailles de texte (basées sur diplome.html)
  titleFontSize: 20, // 20pt dans le HTML
  subtitleFontSize: 16, // 16pt dans le HTML
  headerFontSize: 9, // 9pt dans le HTML
  contentFontSize: 10, // 10pt dans le HTML
  legalTextFontSize: 7.5, // 7.5pt dans le HTML
  footerFontSize: 8.5, // 8.5pt dans le HTML
  studentNameFontSize: 13, // 13pt dans le HTML
  studentInfoFontSize: 9.5, // 9.5pt dans le HTML

  // Couleurs (basées sur diplome.html)
  primaryColor: "#000080", // Bleu marine
  secondaryColor: "#000000", // Noir
  accentColor: "#000080", // Bleu marine

  // Bordures
  outerBorderWidth: 8, // 8px dans le HTML
  outerBorderColor: "#000080",
  innerBorderWidth: 1, // 1px dans le HTML
  innerBorderColor: "#000080",

  // Logos (tailles en pixels basées sur diplome.html)
  fmspLogoSize: 55,
  universityLogoSize: 100,
  minesupLogoSize: 70,
  coatOfArmsSize: 100,
  watermarkLogoSize: 400,

  // QR Code
  qrCodeSize: 50, // 50px dans le HTML
  showQRCode: true,
  useCompactQR: false, // Par défaut, utiliser le format complet (11 champs)

  // Watermark
  showWatermark: true,
  watermarkOpacity: 0.1, // Pour le logo central
  watermarkTextOpacity: 0.05, // Pour le texte répété

  // Espacement (en mm basées sur diplome.html)
  documentMarginTop: 6,
  documentMarginBottom: 6,
  documentMarginLeft: 6,
  documentMarginRight: 6,
  sectionSpacing: 5,

  // Options d'affichage
  showBilingualText: true,
  primaryLanguage: "french",
};

/**
 * Thèmes préréglés pour les diplômes
 */
export const diplomaThemePresets: { [key: string]: DiplomaThemeSettingsPayload } = {
  classic: {
    ...defaultDiplomaTheme,
  },

  elegant: {
    ...defaultDiplomaTheme,
    mainFont: "Garamond, serif",
    titleFont: "Didot, serif",
    titleFontSize: 22,
    subtitleFontSize: 18,
    primaryColor: "#1a1a4d",
    accentColor: "#1a1a4d",
    outerBorderWidth: 10,
  },

  modern: {
    ...defaultDiplomaTheme,
    mainFont: "Calibri, sans-serif",
    titleFont: "Arial, sans-serif",
    titleFontSize: 24,
    subtitleFontSize: 20,
    primaryColor: "#004d99",
    accentColor: "#004d99",
    outerBorderWidth: 6,
    innerBorderWidth: 2,
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
  },
};

/**
 * Fonction pour valider un thème de diplôme
 */
export function validateDiplomaTheme(theme: unknown): DiplomaThemeSettingsPayload {
  return DiplomaThemeSettingsSchema.parse(theme);
}

/**
 * Fonction pour fusionner un thème partiel avec le thème par défaut
 */
export function mergeDiplomaTheme(
  partial: Partial<DiplomaThemeSettingsPayload>
): DiplomaThemeSettingsPayload {
  return {
    ...defaultDiplomaTheme,
    ...partial,
  };
}
