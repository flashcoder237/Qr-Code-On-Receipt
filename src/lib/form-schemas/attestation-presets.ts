// src/lib/form-schemas/attestation-presets.ts - Version mise à jour avec structure classique
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
    id: 'classic-original',
    name: 'Classique Original',
    description: 'Thème original avec Times New Roman, bordures doubles et mise en page traditionnelle',
    category: 'classic',
    theme: {
      primaryColor: "#000000",
      secondaryColor: "#333333",
      accentColor: "#000080",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#eeeeee",
      
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",
      
      titleFontSize: 24,
      subtitleFontSize: 22,
      headerFontSize: 10,
      contentFontSize: 12,
      footerFontSize: 8,
      
      headerLayout: "standard",
      logoSize: "medium",
      logoPosition: "integrated",
      
      contentLayout: "standard",
      tableStyle: "bordered",
      
      borderStyle: "double",
      borderWidth: 2,
      tableCellPadding: 4,
      documentPadding: 20,
      
      showWatermark: true,
      watermarkOpacity: 0.0,
      showQRCode: true,
      qrCodeSize: "medium",
      qrCodePosition: "bottom-left",
      
      signatureStyle: "standard",
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
    id: 'classic-elegant',
    name: 'Classique Élégant',
    description: 'Version élégante du style classique avec Times New Roman et espacement optimisé',
    category: 'classic',
    theme: {
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#000080",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#f0f0f0",
      
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",
      
      titleFontSize: 26,
      subtitleFontSize: 24,
      headerFontSize: 10,
      contentFontSize: 12,
      footerFontSize: 8,
      
      headerLayout: "standard",
      logoSize: "medium",
      logoPosition: "integrated",
      
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
    id: 'modern-georgia',
    name: 'Moderne Georgia',
    description: 'Style moderne avec police Georgia et couleurs contemporaines',
    category: 'modern',
    theme: {
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#2c3e50",
      tableBorderColor: "#666666",
      tableHeaderBgColor: "#f8f9fa",
      
      mainFont: "Georgia, serif",
      headerFont: "Georgia, serif",
      
      titleFontSize: 24,
      subtitleFontSize: 22,
      headerFontSize: 10,
      contentFontSize: 11,
      footerFontSize: 8,
      
      headerLayout: "standard",
      logoSize: "medium",
      logoPosition: "integrated",
      
      contentLayout: "modern",
      tableStyle: "bordered",
      
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 5,
      documentPadding: 20,
      
      showWatermark: true,
      watermarkOpacity: 0.12,
      showQRCode: true,
      qrCodeSize: "medium",
      qrCodePosition: "bottom-right",
      
      signatureStyle: "standard",
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
    id: 'modern-arial',
    name: 'Moderne Arial',
    description: 'Design contemporain avec Arial et mise en page épurée',
    category: 'modern',
    theme: {
      primaryColor: "#2c2c2c",
      secondaryColor: "#555555",
      accentColor: "#34495e",
      tableBorderColor: "#888888",
      tableHeaderBgColor: "#f5f5f5",
      
      mainFont: "Arial, sans-serif",
      headerFont: "Arial, sans-serif",
      
      titleFontSize: 22,
      subtitleFontSize: 20,
      headerFontSize: 9,
      contentFontSize: 11,
      footerFontSize: 8,
      
      headerLayout: "standard",
      logoSize: "medium",
      logoPosition: "integrated",
      
      contentLayout: "modern",
      tableStyle: "modern",
      
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 5,
      documentPadding: 20,
      
      showWatermark: true,
      watermarkOpacity: 0.10,
      showQRCode: true,
      qrCodeSize: "medium",
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
    id: 'minimalist-times',
    name: 'Minimaliste Times',
    description: 'Style épuré avec Times New Roman et bordures subtiles',
    category: 'minimalist',
    theme: {
      primaryColor: "#2c2c2c",
      secondaryColor: "#555555",
      accentColor: "#34495e",
      tableBorderColor: "#888888",
      tableHeaderBgColor: "#f9f9f9",
      
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",
      
      titleFontSize: 22,
      subtitleFontSize: 20,
      headerFontSize: 9,
      contentFontSize: 10,
      footerFontSize: 7,
      
      headerLayout: "compact",
      logoSize: "small",
      logoPosition: "integrated",
      
      contentLayout: "standard",
      tableStyle: "simple",
      
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 4,
      documentPadding: 18,
      
      showWatermark: true,
      watermarkOpacity: 0.08,
      showQRCode: true,
      qrCodeSize: "small",
      qrCodePosition: "bottom-left",
      
      signatureStyle: "standard",
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
    id: 'minimalist-calibri',
    name: 'Minimaliste Calibri',
    description: 'Design épuré avec Calibri et espacement optimisé',
    category: 'minimalist',
    theme: {
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#2c3e50",
      tableBorderColor: "#cccccc",
      tableHeaderBgColor: "#f8f8f8",
      
      mainFont: "Calibri, sans-serif",
      headerFont: "Calibri, sans-serif",
      
      titleFontSize: 20,
      subtitleFontSize: 18,
      headerFontSize: 8,
      contentFontSize: 9,
      footerFontSize: 7,
      
      headerLayout: "compact",
      logoSize: "small",
      logoPosition: "integrated",
      
      contentLayout: "standard",
      tableStyle: "simple",
      
      borderStyle: "solid",
      borderWidth: 1,
      tableCellPadding: 3,
      documentPadding: 15,
      
      showWatermark: true,
      watermarkOpacity: 0.08,
      showQRCode: true,
      qrCodeSize: "small",
      qrCodePosition: "bottom-right",
      
      signatureStyle: "standard",
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
    id: 'formal-institutional',
    name: 'Institutionnel Formel',
    description: 'Style officiel avec Georgia et couleurs institutionnelles',
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
      logoPosition: "integrated",
      
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
    id: 'formal-traditional',
    name: 'Traditionnel Formel',
    description: 'Style traditionnel avec Times New Roman et mise en page formelle',
    category: 'formal',
    theme: {
      primaryColor: "#000000",
      secondaryColor: "#333333",
      accentColor: "#000080",
      tableBorderColor: "#000000",
      tableHeaderBgColor: "#f5f5f5",
      
      mainFont: "Times New Roman, serif",
      headerFont: "Times New Roman, serif",
      
      titleFontSize: 25,
      subtitleFontSize: 23,
      headerFontSize: 10,
      contentFontSize: 12,
      footerFontSize: 8,
      
      headerLayout: "extended",
      logoSize: "large",
      logoPosition: "integrated",
      
      contentLayout: "formal",
      tableStyle: "bordered",
      
      borderStyle: "double",
      borderWidth: 2,
      tableCellPadding: 6,
      documentPadding: 25,
      
      showWatermark: true,
      watermarkOpacity: 0.15,
      showQRCode: true,
      qrCodeSize: "large",
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
      compactMode: false,
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