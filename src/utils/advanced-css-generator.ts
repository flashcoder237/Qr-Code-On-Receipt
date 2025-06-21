// src/lib/utils/advanced-css-generator.ts
import { AdvancedFontConfig, AdvancedBorderConfig, AdvancedTranscriptConfig, AdvancedAttestationConfig } from "@/lib/form-schemas/advanced-typography";

/**
 * Génère le CSS pour une configuration de police avancée
 */
export function generateFontCSS(fontConfig: AdvancedFontConfig, selector: string): string {
  const styles = [
    `font-family: ${fontConfig.fontFamily}`,
    `font-size: ${fontConfig.fontSize}px`,
    `font-weight: ${fontConfig.fontWeight}`,
    `font-style: ${fontConfig.fontStyle}`,
    `color: ${fontConfig.color}`,
  ];

  if (fontConfig.lineHeight) {
    styles.push(`line-height: ${fontConfig.lineHeight}`);
  }

  if (fontConfig.letterSpacing) {
    styles.push(`letter-spacing: ${fontConfig.letterSpacing}px`);
  }

  if (fontConfig.textTransform && fontConfig.textTransform !== 'none') {
    styles.push(`text-transform: ${fontConfig.textTransform}`);
  }

  return `${selector} {
    ${styles.join(';\n    ')};
  }`;
}

/**
 * Génère le CSS pour une configuration de bordure avancée
 */
export function generateBorderCSS(borderConfig: AdvancedBorderConfig, selector: string): string {
  if (borderConfig.style === 'none') {
    return `${selector} {
      border: none;
    }`;
  }

  const styles = [
    `border: ${borderConfig.width}px ${borderConfig.style} ${borderConfig.color}`,
  ];

  if (borderConfig.radius) {
    styles.push(`border-radius: ${borderConfig.radius}px`);
  }

  return `${selector} {
    ${styles.join(';\n    ')};
  }`;
}

/**
 * Génère tout le CSS avancé pour les relevés de notes
 */
export function generateAdvancedTranscriptCSS(config: AdvancedTranscriptConfig): string {
  if (!config.enableAdvancedTypography) {
    return '';
  }

  const cssRules: string[] = [];

  // Polices
  cssRules.push(generateFontCSS(config.headerTitle, '.header-title, .header-row2 h1'));
  cssRules.push(generateFontCSS(config.headerSubtitle, '.header-subtitle, .header-row2 h2'));
  cssRules.push(generateFontCSS(config.headerInfo, '.header-content, .header-content p'));
  cssRules.push(generateFontCSS(config.studentInfo, '.student-info, .student-info p, .student_block1'));
  cssRules.push(generateFontCSS(config.tableHeader, 'th, .table-head th'));
  cssRules.push(generateFontCSS(config.tableContent, 'td, .table tbody td'));
  cssRules.push(generateFontCSS(config.footer, '.footer-note'));
  cssRules.push(generateFontCSS(config.signature, '.signature, .signature-ipes'));

  // Bordures
  cssRules.push(generateBorderCSS(config.documentBorder, 'body, .container'));
  cssRules.push(generateBorderCSS(config.tableBorder, 'table'));
  cssRules.push(generateBorderCSS(config.tableHeaderBorder, 'th'));
  cssRules.push(generateBorderCSS(config.tableCellBorder, 'td'));
  
  if (config.signatureBorder) {
    cssRules.push(generateBorderCSS(config.signatureBorder, '.signature, .signature-ipes'));
  }

  // CSS personnalisé
  if (config.customCSS) {
    cssRules.push(config.customCSS);
  }

  return cssRules.filter(rule => rule.trim()).join('\n\n');
}

/**
 * Génère tout le CSS avancé pour les attestations
 */
export function generateAdvancedAttestationCSS(config: AdvancedAttestationConfig): string {
  if (!config.enableAdvancedTypography) {
    return '';
  }

  const cssRules: string[] = [];

  // Polices
  cssRules.push(generateFontCSS(config.mainTitle, '.header-row2 h1, .main-title'));
  cssRules.push(generateFontCSS(config.subtitle, '.header-row2 h2, .subtitle'));
  cssRules.push(generateFontCSS(config.headerInfo, '.header-content, .header-content p'));
  cssRules.push(generateFontCSS(config.studentInfo, '.student-info, .student-info p'));
  cssRules.push(generateFontCSS(config.tableHeader, 'th, .academic-table th'));
  cssRules.push(generateFontCSS(config.tableContent, 'td, .academic-table td'));
  cssRules.push(generateFontCSS(config.footer, '.content p, .list-nomination-header p'));
  cssRules.push(generateFontCSS(config.signature, '.signature, .nomination-list-item'));
  cssRules.push(generateFontCSS(config.disclaimer, '.disclaimer'));

  // Bordures
  cssRules.push(generateBorderCSS(config.documentBorder, 'body, .container'));
  cssRules.push(generateBorderCSS(config.tableBorder, 'table, .table-container table'));
  cssRules.push(generateBorderCSS(config.tableHeaderBorder, 'th'));
  cssRules.push(generateBorderCSS(config.tableCellBorder, 'td'));
  
  if (config.signatureBorder) {
    cssRules.push(generateBorderCSS(config.signatureBorder, '.signature, .nomination-list-item'));
  }

  // CSS personnalisé
  if (config.customCSS) {
    cssRules.push(config.customCSS);
  }

  return cssRules.filter(rule => rule.trim()).join('\n\n');
}

/**
 * Combine les styles de base avec les styles avancés
 */
export function combineStyles(baseCSS: string, advancedCSS: string): string {
  if (!advancedCSS) {
    return baseCSS;
  }

  return `${baseCSS}

/* Configuration typographique avancée */
${advancedCSS}`;
}

/**
 * Génère des préréglages CSS rapides
 */
export const cssPresets = {
  elegant: `
/* Style élégant avec ombres */
.main-title, .header-title {
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  letter-spacing: 2px;
}

.student-info p {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  padding: 8px;
  border-left: 4px solid #007bff;
  margin: 5px 0;
}

.signature {
  border-top: 2px solid #007bff;
  padding-top: 10px;
}
`,

  minimalist: `
/* Style minimaliste */
.container {
  box-shadow: none;
}

table {
  border: none;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
}

th, td {
  border-left: none;
  border-right: none;
}

.signature {
  border-top: 1px solid #ccc;
  font-style: italic;
}
`,

  formal: `
/* Style formel institutionnel */
.main-title, .header-title {
  text-transform: uppercase;
  letter-spacing: 3px;
  font-weight: bold;
}

.student-info {
  background: #f9f9f9;
  padding: 15px;
  border: 2px solid #000;
}

table {
  border: 2px solid #000;
}

th {
  background: #e9ecef;
  text-transform: uppercase;
  font-weight: bold;
}

.signature {
  border: 2px solid #000;
  padding: 15px;
  text-align: center;
}
`,

  modern: `
/* Style moderne */
.container {
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.main-title, .header-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

th {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.signature {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 8px;
  padding: 15px;
}
`
};

/**
 * Applique un préréglage CSS
 */
export function applyPreset(presetName: keyof typeof cssPresets): string {
  return cssPresets[presetName] || '';
}