// src/lib/form-schemas/attestation-presets.ts
import { AttestationThemeSettingsPayload } from './attestation-theme-settings';

export interface AttestationThemePreset {
  id: string;
  name: string;
  description: string;
  category: 'formal' | 'modern' | 'classic' | 'minimalist';
  theme: AttestationThemeSettingsPayload;
}

export const attestationThemePresets: AttestationThemePreset[] = [
  {
    id: 'classic-formal',
    name: 'Classique Formel',
    description: 'Thème traditionnel avec bordures doubles et mise en page formelle',
    category: 'classic',
    theme: {
      primaryColor: "#000000",
      secondaryColor: "#333333",
      accentColor: "#000080",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#f5f5f5",
      
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",
      
      titleFontSize: 26,
      subtitleFontSize: 24,
      headerFontSize: 10,
      contentFontSize: 12,
      footerFontSize: 8,
      
      headerLayout: "standard",
      logoSize: "medium",
      logoPosition: "header",
      
      contentLayout: "formal",
      tableStyle: "bordered",
      
      borderStyle: "double",
      borderWidth: 2,
      tableCellPadding: 6,
      documentPadding: 25,
      
      showWatermark: true,
      watermarkOpacity: 0.15,
      showQRCode: true,
      qrCodeSize: "medium",
      qrCodePosition: "bottom-left",
      
      signatureStyle: "underlined",
      signatureLayout: "side-by-side",
      
      customTitle: undefined,
      customSubtitle: undefined,
      customFooterText: undefined,
      
      showBilingualText: true,
      primaryLanguage: "french",
      
      showDomainTable: true,
      showAcademicDetails: true,
      compactMode: true,
    }
  },
  
  {
    id: 'modern-clean',
    name: 'Moderne Épuré',
    description: 'Design contemporain avec couleurs vives et mise en page aérée',
    category: 'modern',
    theme: {
      primaryColor: "#2c3e50",
      secondaryColor: "#7f8c8d",
      accentColor: "#3498db",
      tableBorderColor: "#bdc3c7",
      tableHeaderBgColor: "#ecf0f1",
      
      mainFont: "Calibri, sans-serif",
      headerFont: "Arial, sans-serif",
      
      titleFontSize: 28,
      subtitleFontSize: 26,
      headerFontSize: 11,
      contentFontSize: 13,
      footerFontSize: 9,
      
      headerLayout: "extended",
      logoSize: "large",
      logoPosition: "integrated",
      
      contentLayout: "modern",
      tableStyle: "modern",
      
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 8,
      documentPadding: 20,
      
      showWatermark: true,
      watermarkOpacity: 0.1,
      showQRCode: true,
      qrCodeSize: "large",
      qrCodePosition: "bottom-right",
      
      signatureStyle: "modern",
      signatureLayout: "side-by-side",
      
      customTitle: undefined,
      customSubtitle: undefined,
      customFooterText: undefined,
      
      showBilingualText: true,
      primaryLanguage: "french",
      
      showDomainTable: true,
      showAcademicDetails: true,
      compactMode: true,
    }
  },
  
  {
    id: 'minimalist-elegant',
    name: 'Minimaliste Élégant',
    description: 'Style épuré avec bordures subtiles et espacement généreux',
    category: 'minimalist',
    theme: {
      primaryColor: "#34495e",
      secondaryColor: "#95a5a6",
      accentColor: "#e74c3c",
      tableBorderColor: "#d5dbdb",
      tableHeaderBgColor: "#f8f9fa",
      
      mainFont: "Helvetica, sans-serif",
      headerFont: "Helvetica, sans-serif",
      
      titleFontSize: 24,
      subtitleFontSize: 22,
      headerFontSize: 10,
      contentFontSize: 12,
      footerFontSize: 8,
      
      headerLayout: "compact",
      logoSize: "small",
      logoPosition: "top",
      
      contentLayout: "standard",
      tableStyle: "simple",
      
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 4,
      documentPadding: 30,
      
      showWatermark: false,
      watermarkOpacity: 0.05,
      showQRCode: true,
      qrCodeSize: "small",
      qrCodePosition: "bottom-center",
      
      signatureStyle: "standard",
      signatureLayout: "centered",
      
      customTitle: undefined,
      customSubtitle: undefined,
      customFooterText: undefined,
      
      showBilingualText: true,
      primaryLanguage: "french",
      
      showDomainTable: true,
      showAcademicDetails: true,
      compactMode: true,
    }
  },
  
  {
    id: 'formal-institutional',
    name: 'Institutionnel Formel',
    description: 'Style officiel avec mise en page traditionnelle et couleurs sobres',
    category: 'formal',
    theme: {
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#8b0000",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#f0f0f0",
      
      mainFont: "Georgia, serif",
      headerFont: "Georgia, serif",
      
      titleFontSize: 24,
      subtitleFontSize: 22,
      headerFontSize: 9,
      contentFontSize: 11,
      footerFontSize: 7,
      
      headerLayout: "standard",
      logoSize: "medium",
      logoPosition: "header",
      
      contentLayout: "formal",
      tableStyle: "bordered",
      
      borderStyle: "solid",
      borderWidth: 2,
      tableCellPadding: 5,
      documentPadding: 20,
      
      showWatermark: true,
      watermarkOpacity: 0.2,
      showQRCode: true,
      qrCodeSize: "medium",
      qrCodePosition: "bottom-left",
      
      signatureStyle: "boxed",
      signatureLayout: "side-by-side",
      
      customTitle: undefined,
      customSubtitle: undefined,
      customFooterText: undefined,
      
      showBilingualText: true,
      primaryLanguage: "french",
      
      showDomainTable: true,
      showAcademicDetails: true,
      compactMode: true,
    }
  },
  
  {
    id: 'compact-efficient',
    name: 'Compact & Efficace',
    description: 'Optimisé pour économiser l\'espace tout en restant lisible',
    category: 'minimalist',
    theme: {
      primaryColor: "#2c3e50",
      secondaryColor: "#7f8c8d",
      accentColor: "#27ae60",
      tableBorderColor: "#95a5a6",
      tableHeaderBgColor: "#ecf0f1",
      
      mainFont: "Arial, sans-serif",
      headerFont: "Arial, sans-serif",
      
      titleFontSize: 20,
      subtitleFontSize: 18,
      headerFontSize: 8,
      contentFontSize: 10,
      footerFontSize: 7,
      
      headerLayout: "compact",
      logoSize: "small",
      logoPosition: "integrated",
      
      contentLayout: "standard",
      tableStyle: "striped",
      
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 3,
      documentPadding: 15,
      
      showWatermark: false,
      watermarkOpacity: 0.05,
      showQRCode: true,
      qrCodeSize: "small",
      qrCodePosition: "bottom-right",
      
      signatureStyle: "standard",
      signatureLayout: "stacked",
      
      customTitle: undefined,
      customSubtitle: undefined,
      customFooterText: undefined,
      
      showBilingualText: false,
      primaryLanguage: "french",
      
      showDomainTable: true,
      showAcademicDetails: true,
      compactMode: true,
    }
  },
  
  {
    id: 'premium-luxury',
    name: 'Premium Luxueux',
    description: 'Design haut de gamme avec effets visuels et mise en page sophistiquée',
    category: 'modern',
    theme: {
      primaryColor: "#2c3e50",
      secondaryColor: "#34495e",
      accentColor: "#f39c12",
      tableBorderColor: "#d4b50a",
      tableHeaderBgColor: "#fef9e7",
      
      mainFont: "Cambria, serif",
      headerFont: "Calibri, sans-serif",
      
      titleFontSize: 30,
      subtitleFontSize: 28,
      headerFontSize: 12,
      contentFontSize: 14,
      footerFontSize: 10,
      
      headerLayout: "extended",
      logoSize: "large",
      logoPosition: "header",
      
      contentLayout: "modern",
      tableStyle: "modern",
      
      borderStyle: "double",
      borderWidth: 2,
      tableCellPadding: 10,
      documentPadding: 25,
      
      showWatermark: true,
      watermarkOpacity: 0.08,
      showQRCode: true,
      qrCodeSize: "large",
      qrCodePosition: "bottom-center",
      
      signatureStyle: "modern",
      signatureLayout: "side-by-side",
      
      customTitle: undefined,
      customSubtitle: undefined,
      customFooterText: undefined,
      
      showBilingualText: true,
      primaryLanguage: "french",
      
      showDomainTable: true,
      showAcademicDetails: true,
      compactMode: true,
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