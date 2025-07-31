// src/lib/utils/advanced-css-generator.ts
import { AdvancedFontConfig, AdvancedBorderConfig, AdvancedTranscriptConfig, AdvancedAttestationConfig } from "@/lib/form-schemas/advanced-typography";

/**
 * Génère le CSS pour une configuration de police avancée
 * Utilise des propriétés CSS qui complètent plutôt que remplacent
 */
export function generateFontCSS(fontConfig: AdvancedFontConfig, selector: string): string {
  const styles: string[] = [];
  
  // Seulement ajouter les propriétés qui diffèrent des valeurs par défaut du navigateur
  if (fontConfig.fontFamily && fontConfig.fontFamily !== 'inherit') {
    styles.push(`font-family: ${fontConfig.fontFamily} !important`);
  }
  
  if (fontConfig.fontSize && fontConfig.fontSize > 0) {
    styles.push(`font-size: ${fontConfig.fontSize}px !important`);
  }
  
  if (fontConfig.fontWeight && fontConfig.fontWeight !== 'normal') {
    styles.push(`font-weight: ${fontConfig.fontWeight} !important`);
  }
  
  if (fontConfig.fontStyle && fontConfig.fontStyle !== 'normal') {
    styles.push(`font-style: ${fontConfig.fontStyle} !important`);
  }
  
  if (fontConfig.color && fontConfig.color !== '#000000') {
    styles.push(`color: ${fontConfig.color} !important`);
  }

  if (fontConfig.lineHeight && fontConfig.lineHeight !== '1') {
    styles.push(`line-height: ${fontConfig.lineHeight} !important`);
  }

  if (fontConfig.letterSpacing && fontConfig.letterSpacing !== 0) {
    styles.push(`letter-spacing: ${fontConfig.letterSpacing}px !important`);
  }

  if (fontConfig.textTransform && fontConfig.textTransform !== 'none') {
    styles.push(`text-transform: ${fontConfig.textTransform} !important`);
  }

  // Si aucun style personnalisé, ne pas générer de règle CSS
  if (styles.length === 0) {
    return '';
  }

  return `${selector} {
    ${styles.join(';\n    ')};
  }`;
}

/**
 * Génère le CSS pour une configuration de bordure avancée
 * Améliore ou modifie les bordures existantes sans casser la mise en page
 */
export function generateBorderCSS(borderConfig: AdvancedBorderConfig, selector: string): string {
  const styles: string[] = [];

  if (borderConfig.style === 'none') {
    styles.push('border: none !important');
  } else if (borderConfig.style && borderConfig.width && borderConfig.color) {
    // Améliorer les bordures existantes
    styles.push(`border: ${borderConfig.width}px ${borderConfig.style} ${borderConfig.color} !important`);
  }

  if (borderConfig.radius && borderConfig.radius > 0) {
    styles.push(`border-radius: ${borderConfig.radius}px !important`);
  }

  // Si aucun style de bordure personnalisé, ne pas générer de règle
  if (styles.length === 0) {
    return '';
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

  // Ajout d'un commentaire d'en-tête
  cssRules.push('/* Styles typographiques avancés pour relevés de notes */');

  // Polices - seulement ajouter si la configuration est différente des valeurs par défaut
  const fontRules = [
    generateFontCSS(config.headerTitle, '.header-title, .header-row2 h1'),
    generateFontCSS(config.headerSubtitle, '.header-subtitle, .header-row2 h2'),
    generateFontCSS(config.headerInfo, '.header-content, .header-content p'),
    generateFontCSS(config.studentInfo, '.student-info, .student-info p, .student_block1'),
    generateFontCSS(config.tableHeader, 'th, .table-head th'),
    generateFontCSS(config.tableContent, 'td, .table tbody td'),
    generateFontCSS(config.footer, '.footer-note'),
    generateFontCSS(config.signature, '.signature, .signature-ipes')
  ].filter(rule => rule.trim() !== '');

  cssRules.push(...fontRules);

  // Bordures - seulement ajouter si configurées
  const borderRules = [
    generateBorderCSS(config.documentBorder, 'body, .container'),
    generateBorderCSS(config.tableBorder, 'table'),
    generateBorderCSS(config.tableHeaderBorder, 'th'),
    generateBorderCSS(config.tableCellBorder, 'td')
  ].filter(rule => rule.trim() !== '');

  if (config.signatureBorder) {
    const sigBorderRule = generateBorderCSS(config.signatureBorder, '.signature, .signature-ipes');
    if (sigBorderRule.trim() !== '') {
      borderRules.push(sigBorderRule);
    }
  }

  cssRules.push(...borderRules);

  // CSS personnalisé
  if (config.customCSS && config.customCSS.trim() !== '') {
    cssRules.push('/* CSS personnalisé */');
    cssRules.push(config.customCSS);
  }

  return cssRules.filter(rule => rule.trim() !== '').join('\n\n');
}

/**
 * Génère tout le CSS avancé pour les attestations
 */
export function generateAdvancedAttestationCSS(config: AdvancedAttestationConfig): string {
  if (!config.enableAdvancedTypography) {
    return '';
  }

  const cssRules: string[] = [];

  // Ajout d'un commentaire d'en-tête
  cssRules.push('/* Styles typographiques avancés pour attestations */');

  // Polices - seulement ajouter si la configuration est différente des valeurs par défaut
  const fontRules = [
    generateFontCSS(config.mainTitle, '.header-row2 h1, .main-title'),
    generateFontCSS(config.subtitle, '.header-row2 h2, .subtitle'),
    generateFontCSS(config.headerInfo, '.header-content, .header-content p'),
    generateFontCSS(config.studentInfo, '.student-info, .student-info p'),
    generateFontCSS(config.tableHeader, 'th, .academic-table th'),
    generateFontCSS(config.tableContent, 'td, .academic-table td'),
    generateFontCSS(config.footer, '.content p, .list-nomination-header p'),
    generateFontCSS(config.signature, '.signature, .nomination-list-item'),
    generateFontCSS(config.disclaimer, '.disclaimer')
  ].filter(rule => rule.trim() !== '');

  cssRules.push(...fontRules);

  // Bordures - seulement ajouter si configurées
  const borderRules = [
    generateBorderCSS(config.documentBorder, 'body, .container'),
    generateBorderCSS(config.tableBorder, 'table, .table-container table'),
    generateBorderCSS(config.tableHeaderBorder, 'th'),
    generateBorderCSS(config.tableCellBorder, 'td')
  ].filter(rule => rule.trim() !== '');

  if (config.signatureBorder) {
    const sigBorderRule = generateBorderCSS(config.signatureBorder, '.signature, .nomination-list-item');
    if (sigBorderRule.trim() !== '') {
      borderRules.push(sigBorderRule);
    }
  }

  cssRules.push(...borderRules);

  // CSS personnalisé
  if (config.customCSS && config.customCSS.trim() !== '') {
    cssRules.push('/* CSS personnalisé */');
    cssRules.push(config.customCSS);
  }

  return cssRules.filter(rule => rule.trim() !== '').join('\n\n');
}

/**
 * Combine les styles de base avec les styles avancés
 * Les styles avancés complètent et améliorent les styles de base sans les détruire
 */
export function combineStyles(baseCSS: string, advancedCSS: string): string {
  if (!advancedCSS || advancedCSS.trim() === '') {
    console.log('🎨 Styles avancés: Aucun style avancé défini, utilisation des styles de base uniquement');
    return baseCSS;
  }

  console.log('🎨 Styles avancés: Combinaison des styles de base avec les styles avancés');
  console.log(`📏 Longueur CSS de base: ${baseCSS.length} caractères`);
  console.log(`📏 Longueur CSS avancé: ${advancedCSS.length} caractères`);

  return `${baseCSS}

/* Configuration typographique avancée - Améliore le style existant */
${advancedCSS}

/* Assure la compatibilité entre styles de base et avancés */
.header-content, .header-content p {
  /* Préserve l'alignement et l'espacement de base */
  margin: inherit !important;
  padding: inherit !important; 
}

.student-info, .student-info p {
  /* Préserve la structure de base */
  display: inherit !important;
  margin: inherit !important;
}

table, th, td {
  /* Préserve la structure de table de base */
  border-collapse: inherit !important;
  border-spacing: inherit !important;
}`;
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