// src/lib/form-schemas/attestation-presets.ts - Préréglages ne modifiant QUE les styles
import { AttestationThemeSettingsPayload } from './attestation-theme-settings';

export interface AttestationThemePreset {
  id: string;
  name: string;
  description: string;
  category: 'formal' | 'modern' | 'classic' | 'minimalist';
  theme: Partial<AttestationThemeSettingsPayload>; // Partial car on ne définit que les styles
}

// Les préréglages ne modifient QUE les paramètres de STYLE, jamais les LAYOUTS
export const attestationThemePresets: AttestationThemePreset[] = [
  {
    id: 'classic-original',
    name: 'Classique Original',
    description: 'Thème original avec Times New Roman, bordures doubles',
    category: 'classic',
    theme: {
      // Couleurs
      primaryColor: "#000000",
      secondaryColor: "#333333",
      accentColor: "#000080",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#eeeeee",

      // Polices
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",

      // Tailles de police
      titleFontSize: 24,
      subtitleFontSize: 22,
      headerFontSize: 10,
      contentFontSize: 12,
      footerFontSize: 8,

      // Bordures et espacements
      borderStyle: "double",
      borderWidth: 2,
      tableCellPadding: 4,
      documentPadding: 20,

      // Opacité
      watermarkOpacity: 0.0,

      // Style de signature (visuel uniquement)
      signatureStyle: "standard",
    }
  },

  {
    id: 'classic-elegant',
    name: 'Classique Élégant',
    description: 'Version élégante du style classique avec espacement optimisé',
    category: 'classic',
    theme: {
      // Couleurs
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#000080",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#f0f0f0",

      // Polices
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",

      // Tailles de police
      titleFontSize: 26,
      subtitleFontSize: 24,
      headerFontSize: 10,
      contentFontSize: 12,
      footerFontSize: 8,

      // Bordures et espacements
      borderStyle: "double",
      borderWidth: 2,
      tableCellPadding: 6,
      documentPadding: 25,

      // Opacité
      watermarkOpacity: 0.15,

      // Style de signature
      signatureStyle: "underlined",
    }
  },

  {
    id: 'modern-georgia',
    name: 'Moderne Georgia',
    description: 'Style moderne avec police Georgia et couleurs contemporaines',
    category: 'modern',
    theme: {
      // Couleurs
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#2c3e50",
      tableBorderColor: "#666666",
      tableHeaderBgColor: "#f8f9fa",

      // Polices
      mainFont: "Georgia, serif",
      headerFont: "Georgia, serif",

      // Tailles de police
      titleFontSize: 24,
      subtitleFontSize: 22,
      headerFontSize: 10,
      contentFontSize: 11,
      footerFontSize: 8,

      // Bordures et espacements
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 5,
      documentPadding: 20,

      // Opacité
      watermarkOpacity: 0.12,

      // Style de signature
      signatureStyle: "standard",
    }
  },

  {
    id: 'modern-arial',
    name: 'Moderne Arial',
    description: 'Design contemporain avec Arial et bordures épurées',
    category: 'modern',
    theme: {
      // Couleurs
      primaryColor: "#2c2c2c",
      secondaryColor: "#555555",
      accentColor: "#34495e",
      tableBorderColor: "#888888",
      tableHeaderBgColor: "#f5f5f5",

      // Polices
      mainFont: "Arial, sans-serif",
      headerFont: "Arial, sans-serif",

      // Tailles de police
      titleFontSize: 22,
      subtitleFontSize: 20,
      headerFontSize: 9,
      contentFontSize: 11,
      footerFontSize: 8,

      // Bordures et espacements
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 5,
      documentPadding: 20,

      // Opacité
      watermarkOpacity: 0.10,

      // Style de signature
      signatureStyle: "modern",
    }
  },

  {
    id: 'minimalist-times',
    name: 'Minimaliste Times',
    description: 'Style épuré avec Times New Roman et bordures subtiles',
    category: 'minimalist',
    theme: {
      // Couleurs
      primaryColor: "#2c2c2c",
      secondaryColor: "#555555",
      accentColor: "#34495e",
      tableBorderColor: "#888888",
      tableHeaderBgColor: "#f9f9f9",

      // Polices
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",

      // Tailles de police
      titleFontSize: 22,
      subtitleFontSize: 20,
      headerFontSize: 9,
      contentFontSize: 10,
      footerFontSize: 7,

      // Bordures et espacements
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 4,
      documentPadding: 18,

      // Opacité
      watermarkOpacity: 0.08,

      // Style de signature
      signatureStyle: "standard",
    }
  },

  {
    id: 'minimalist-calibri',
    name: 'Minimaliste Calibri',
    description: 'Design épuré avec Calibri et espacement optimisé',
    category: 'minimalist',
    theme: {
      // Couleurs
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#2c3e50",
      tableBorderColor: "#cccccc",
      tableHeaderBgColor: "#f8f8f8",

      // Polices
      mainFont: "Calibri, sans-serif",
      headerFont: "Calibri, sans-serif",

      // Tailles de police
      titleFontSize: 20,
      subtitleFontSize: 18,
      headerFontSize: 8,
      contentFontSize: 9,
      footerFontSize: 7,

      // Bordures et espacements
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 3,
      documentPadding: 15,

      // Opacité
      watermarkOpacity: 0.08,

      // Style de signature
      signatureStyle: "standard",
    }
  },

  {
    id: 'formal-institutional',
    name: 'Institutionnel Formel',
    description: 'Style officiel avec Georgia et couleurs institutionnelles',
    category: 'formal',
    theme: {
      // Couleurs
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#8b0000",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#f0f0f0",

      // Polices
      mainFont: "Georgia, serif",
      headerFont: "Georgia, serif",

      // Tailles de police
      titleFontSize: 24,
      subtitleFontSize: 22,
      headerFontSize: 9,
      contentFontSize: 11,
      footerFontSize: 7,

      // Bordures et espacements
      borderStyle: "solid",
      borderWidth: 2,
      tableCellPadding: 5,
      documentPadding: 20,

      // Opacité
      watermarkOpacity: 0.2,

      // Style de signature
      signatureStyle: "boxed",
    }
  },

  {
    id: 'formal-traditional',
    name: 'Traditionnel Formel',
    description: 'Style traditionnel avec Times New Roman et mise en page formelle',
    category: 'formal',
    theme: {
      // Couleurs
      primaryColor: "#000000",
      secondaryColor: "#333333",
      accentColor: "#000080",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#f5f5f5",

      // Polices
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",

      // Tailles de police
      titleFontSize: 25,
      subtitleFontSize: 23,
      headerFontSize: 10,
      contentFontSize: 12,
      footerFontSize: 8,

      // Bordures et espacements
      borderStyle: "double",
      borderWidth: 2,
      tableCellPadding: 6,
      documentPadding: 25,

      // Opacité
      watermarkOpacity: 0.15,

      // Style de signature
      signatureStyle: "underlined",
    }
  }
];

export const getPresetsByCategory = (category?: string): AttestationThemePreset[] => {
  if (!category) return attestationThemePresets;
  return attestationThemePresets.filter(preset => preset.category === category);
};

export const getPresetById = (id: string): AttestationThemePreset | undefined => {
  return attestationThemePresets.find(preset => preset.id === id);
};
