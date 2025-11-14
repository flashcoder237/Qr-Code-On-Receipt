// src/utils/advanced-css-generator.ts
import { AdvancedFontConfig, AdvancedBorderConfig, AdvancedSpacingConfig, AdvancedTableConfig, AdvancedTranscriptConfig, AdvancedAttestationConfig } from "@/lib/form-schemas/advanced-typography";

/**
 * Génère le CSS pour une configuration de police avancée
 * SEULEMENT LES PROPRIÉTÉS TYPOGRAPHIQUES - PAS LES COULEURS
 */
export function generateFontCSS(fontConfig: AdvancedFontConfig, selector: string): string {
  const styles: string[] = [];
  
  // SEULEMENT les propriétés de police - pas les couleurs
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
 * Génère le CSS pour les couleurs de police avancées
 * Fonction séparée pour éviter d'affecter les couleurs involontairement
 */
export function generateFontColorCSS(fontConfig: AdvancedFontConfig, selector: string): string {
  const styles: string[] = [];
  
  // SEULEMENT les couleurs
  if (fontConfig.color && fontConfig.color !== '#000000') {
    styles.push(`color: ${fontConfig.color} !important`);
  }

  // Si aucune couleur personnalisée, ne pas générer de règle CSS
  if (styles.length === 0) {
    return '';
  }

  return `${selector} {
    ${styles.join(';\n    ')};
  }`;
}

/**
 * Génère le CSS pour une configuration d'espacement avancée
 * Utilise des sélecteurs simples et directs pour maximum de compatibilité
 */
export function generateSpacingCSS(spacingConfig: AdvancedSpacingConfig): string {
  const cssRules: string[] = [];

  // Espacement après le titre principal
  if (spacingConfig.titleSpacing !== undefined && spacingConfig.titleSpacing > 0) {
    cssRules.push(`/* Titre principal */
.main-title,
.header-row2 h1,
h1.main-title {
  margin-bottom: ${spacingConfig.titleSpacing}px !important;
  padding-bottom: 0 !important;
}`);
  }

  // Espacement après le sous-titre
  if (spacingConfig.subtitleSpacing !== undefined && spacingConfig.subtitleSpacing > 0) {
    cssRules.push(`/* Sous-titre */
.subtitle,
.header-row2 h2,
h2.subtitle {
  margin-bottom: ${spacingConfig.subtitleSpacing}px !important;
  padding-bottom: 0 !important;
}`);
  }

  // Espacement après l'en-tête complet
  if (spacingConfig.headerSpacing !== undefined && spacingConfig.headerSpacing > 0) {
    cssRules.push(`/* En-tête */
.header {
  margin-bottom: ${spacingConfig.headerSpacing}px !important;
}

.header-row2 {
  margin-bottom: ${Math.max(5, Math.round(spacingConfig.headerSpacing * 0.6))}px !important;
}`);
  }

  // Espacement après les informations étudiant (texte d'introduction)
  if (spacingConfig.studentInfoSpacing !== undefined && spacingConfig.studentInfoSpacing > 0) {
    cssRules.push(`/* Informations étudiant */
.list-nomination-header {
  margin-bottom: ${spacingConfig.studentInfoSpacing}px !important;
}

.list-nomination-header p {
  margin-bottom: ${Math.max(2, Math.round(spacingConfig.studentInfoSpacing * 0.4))}px !important;
}`);
  }

  // Espacement entre les tableaux
  if (spacingConfig.tableSpacing !== undefined && spacingConfig.tableSpacing > 0) {
    cssRules.push(`/* Tableaux */
table {
  margin-bottom: ${spacingConfig.tableSpacing}px !important;
  margin-top: ${Math.max(2, Math.round(spacingConfig.tableSpacing * 0.5))}px !important;
}

.table-container {
  margin-bottom: ${spacingConfig.tableSpacing}px !important;
}`);
  }

  // Espacement entre les paragraphes
  if (spacingConfig.paragraphSpacing !== undefined && spacingConfig.paragraphSpacing > 0) {
    cssRules.push(`/* Paragraphes */
.content p {
  margin-bottom: ${spacingConfig.paragraphSpacing}px !important;
}

.list-nomination-header p {
  margin-bottom: ${spacingConfig.paragraphSpacing}px !important;
}

body p {
  margin-bottom: ${spacingConfig.paragraphSpacing}px !important;
}`);
  }

  // Espacement entre les sections principales
  if (spacingConfig.sectionSpacing !== undefined && spacingConfig.sectionSpacing > 0) {
    cssRules.push(`/* Sections */
.content {
  margin-top: ${spacingConfig.sectionSpacing}px !important;
}

.list-nomination-header {
  margin-top: ${Math.max(5, Math.round(spacingConfig.sectionSpacing * 0.7))}px !important;
}`);
  }

  // Espacement avant le pied de page
  if (spacingConfig.footerSpacing !== undefined && spacingConfig.footerSpacing > 0) {
    cssRules.push(`/* Pied de page */
.footer {
  margin-top: ${spacingConfig.footerSpacing}px !important;
  padding-top: ${Math.max(5, Math.round(spacingConfig.footerSpacing * 0.3))}px !important;
}

.signature-area {
  margin-top: ${Math.max(10, Math.round(spacingConfig.footerSpacing * 0.8))}px !important;
}`);
  }

  // Espacement entre les signatures
  if (spacingConfig.signatureSpacing !== undefined && spacingConfig.signatureSpacing > 0) {
    cssRules.push(`/* Signatures */
.signature {
  margin-top: ${spacingConfig.signatureSpacing}px !important;
}

.recteur-sign {
  margin-top: ${spacingConfig.signatureSpacing}px !important;
}

.qr-code {
  margin-top: ${Math.max(5, Math.round(spacingConfig.signatureSpacing * 0.6))}px !important;
}`);
  }

  return cssRules.join('\n\n');
}

/**
 * Fonction utilitaire pour convertir une couleur hex en rgba avec opacité
 */
function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Génère le CSS pour une configuration de tableau avancée
 * Inclut opacités, couleurs de texte et effets de survol
 */
export function generateTableDesignCSS(tableConfig: AdvancedTableConfig): string {
  const cssRules: string[] = [];

  // Styles généraux du tableau
  const tableStyles: string[] = [];
  
  // Bordures extérieures
  if (tableConfig.enableOuterBorder && tableConfig.outerBorderWidth && tableConfig.outerBorderStyle !== 'none') {
    const borderColor = tableConfig.outerBorderColor || '#000000';
    tableStyles.push(`border: ${tableConfig.outerBorderWidth}px ${tableConfig.outerBorderStyle} ${borderColor}`);
  } else if (tableConfig.enableOuterBorder === false || tableConfig.outerBorderStyle === 'none') {
    tableStyles.push('border: none');
  }
  
  // Radius
  if (tableConfig.enableRadius && tableConfig.borderRadius && tableConfig.borderRadius > 0) {
    tableStyles.push(`border-radius: ${tableConfig.borderRadius}px`);
    tableStyles.push('overflow: hidden'); // Pour que le radius fonctionne avec les cellules
  }
  
  // Ombre
  if (tableConfig.enableShadow && tableConfig.shadowBlur !== undefined) {
    const shadowColor = tableConfig.shadowColor || '#000000';
    const shadowOpacity = tableConfig.shadowOpacity || 0.1;
    const offsetX = tableConfig.shadowOffsetX || 0;
    const offsetY = tableConfig.shadowOffsetY || 2;
    const blur = tableConfig.shadowBlur;
    
    const rgba = hexToRgba(shadowColor, shadowOpacity);
    tableStyles.push(`box-shadow: ${offsetX}px ${offsetY}px ${blur}px ${rgba}`);
  }

  if (tableStyles.length > 0) {
    cssRules.push(`table, .table-container table, .academic-table {
      ${tableStyles.join(';\n  ')};
    }`);
  }

  // Styles des en-têtes
  const headerStyles: string[] = [];
  
  if (tableConfig.headerBackgroundColor) {
    const opacity = tableConfig.headerBackgroundOpacity ?? 1;
    const bgColor = opacity < 1 ? 
      hexToRgba(tableConfig.headerBackgroundColor, opacity) : 
      tableConfig.headerBackgroundColor;
    headerStyles.push(`background-color: ${bgColor} !important`);
  }

  // Couleur du texte des en-têtes
  if (tableConfig.headerTextColor) {
    headerStyles.push(`color: ${tableConfig.headerTextColor} !important`);
  }
  
  if (tableConfig.headerCellPadding !== undefined) {
    headerStyles.push(`padding: ${tableConfig.headerCellPadding}px`);
  }
  
  // Bordures d'en-tête
  if (tableConfig.enableHeaderBorder && tableConfig.headerBorderStyle !== 'none') {
    const width = tableConfig.headerBorderWidth || 1;
    const style = tableConfig.headerBorderStyle || 'solid';
    const color = tableConfig.headerBorderColor || '#000000';
    headerStyles.push(`border: ${width}px ${style} ${color}`);
  } else if (tableConfig.enableHeaderBorder === false || tableConfig.headerBorderStyle === 'none') {
    headerStyles.push('border: none');
  }

  if (headerStyles.length > 0) {
    cssRules.push(`th, .academic-table th {
      ${headerStyles.join(';\n  ')};
    }`);
  }

  // Styles des cellules
  const cellStyles: string[] = [];
  
  if (tableConfig.cellPadding !== undefined) {
    cellStyles.push(`padding: ${tableConfig.cellPadding}px`);
  }
  
  // Bordures intérieures
  if (tableConfig.enableInnerBorder && tableConfig.innerBorderStyle !== 'none') {
    const width = tableConfig.innerBorderWidth || 1;
    const style = tableConfig.innerBorderStyle || 'solid';
    const color = tableConfig.innerBorderColor || '#000000';
    cellStyles.push(`border: ${width}px ${style} ${color}`);
  } else if (tableConfig.enableInnerBorder === false || tableConfig.innerBorderStyle === 'none') {
    cellStyles.push('border: none');
  }

  if (cellStyles.length > 0) {
    cssRules.push(`td, .academic-table td {
      ${cellStyles.join(';\n  ')};
    }`);
  }

  // Couleur de fond et texte des lignes
  const rowStyles: string[] = [];
  if (tableConfig.rowBackgroundColor) {
    const opacity = tableConfig.rowBackgroundOpacity ?? 1;
    const bgColor = opacity < 1 ? 
      hexToRgba(tableConfig.rowBackgroundColor, opacity) : 
      tableConfig.rowBackgroundColor;
    rowStyles.push(`background-color: ${bgColor} !important`);
  }

  // Couleur du texte des cellules
  if (tableConfig.rowTextColor) {
    rowStyles.push(`color: ${tableConfig.rowTextColor} !important`);
  }

  if (rowStyles.length > 0) {
    cssRules.push(`tbody tr, .academic-table tbody tr {
      ${rowStyles.join(';\n  ')};
    }`);
  }

  // Couleur du texte pour toutes les cellules td
  if (tableConfig.rowTextColor) {
    cssRules.push(`td, .academic-table td {
      color: ${tableConfig.rowTextColor} !important;
    }`);
  }

  // Lignes alternées (striped)
  if (tableConfig.enableStriped && tableConfig.alternateRowBackgroundColor) {
    const opacity = tableConfig.alternateRowOpacity ?? 1;
    const bgColor = opacity < 1 ? 
      hexToRgba(tableConfig.alternateRowBackgroundColor, opacity) : 
      tableConfig.alternateRowBackgroundColor;
    
    cssRules.push(`tbody tr:nth-child(even), .academic-table tbody tr:nth-child(even) {
      background-color: ${bgColor} !important;
    }`);
  }

  // Effet hover
  if (tableConfig.enableHover && tableConfig.hoverBackgroundColor) {
    const opacity = tableConfig.hoverOpacity ?? 0.8;
    const bgColor = opacity < 1 ? 
      hexToRgba(tableConfig.hoverBackgroundColor, opacity) : 
      tableConfig.hoverBackgroundColor;
    
    cssRules.push(`tbody tr:hover, .academic-table tbody tr:hover {
      background-color: ${bgColor} !important;
      transition: background-color 0.2s ease;
    }`);
  }

  return cssRules.join('\n\n');
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
  const cssRules: string[] = [];

  // Protection: si pas de config ou config invalide, ne rien faire
  if (!config || typeof config !== 'object') {
    
    return '';
  }

  // Ajout d'un commentaire d'en-tête seulement si on génère du CSS
  let hasAnyCss = false;

  // ESPACEMENT AVANCÉ - TOUJOURS APPLIQUÉ (indépendant de enableAdvancedTypography)
  if (config.spacing && Object.keys(config.spacing).length > 0) {
    const spacingCSS = generateSpacingCSS(config.spacing);
    if (spacingCSS.trim() !== '') {
      if (!hasAnyCss) {
        cssRules.push('/* Styles avancés pour attestations */');
        hasAnyCss = true;
      }
      cssRules.push('/* Espacement avancé - Styles personnalisés appliqués */');
      cssRules.push(spacingCSS);
      
    }
  }

  // DESIGN DE TABLEAU AVANCÉ - TOUJOURS APPLIQUÉ
  if (config.tableDesign && Object.keys(config.tableDesign).length > 0) {
    const tableCSS = generateTableDesignCSS(config.tableDesign);
    if (tableCSS.trim() !== '') {
      if (!hasAnyCss) {
        cssRules.push('/* Styles avancés pour attestations */');
        hasAnyCss = true;
      }
      cssRules.push('/* Design de tableau avancé */');
      cssRules.push(tableCSS);
      
    }
  }

  // TYPOGRAPHIE AVANCÉE - SEULEMENT SI EXPLICITEMENT ACTIVÉE
  if (config.enableAdvancedTypography === true) {
    if (!hasAnyCss) {
      cssRules.push('/* Styles avancés pour attestations */');
      hasAnyCss = true;
    }
    cssRules.push('/* Typographie avancée activée - SEULEMENT LES POLICES */');
    
    // SEULEMENT les polices - pas les couleurs ni bordures
    const fontRules = [
      config.mainTitle ? generateFontCSS(config.mainTitle, '.header-row2 h1, .main-title') : '',
      config.subtitle ? generateFontCSS(config.subtitle, '.header-row2 h2, .subtitle') : '',
      config.headerInfo ? generateFontCSS(config.headerInfo, '.header-content, .header-content p') : '',
      config.studentInfo ? generateFontCSS(config.studentInfo, '.student-info, .student-info p') : '',
      config.tableHeader ? generateFontCSS(config.tableHeader, 'th, .academic-table th') : '',
      config.tableContent ? generateFontCSS(config.tableContent, 'td, .academic-table td') : '',
      config.footer ? generateFontCSS(config.footer, '.content p, .list-nomination-header p') : '',
      config.signature ? generateFontCSS(config.signature, '.signature, .nomination-list-item') : '',
      config.disclaimer ? generateFontCSS(config.disclaimer, '.disclaimer') : ''
    ].filter(rule => rule && rule.trim() !== '');

    if (fontRules.length > 0) {
      cssRules.push(...fontRules);
      
    }
  } else {
    
  }

  // CSS personnalisé
  if (config.customCSS && config.customCSS.trim() !== '') {
    if (!hasAnyCss) {
      cssRules.push('/* Styles avancés pour attestations */');
      hasAnyCss = true;
    }
    cssRules.push('/* CSS personnalisé */');
    cssRules.push(config.customCSS);
  }

  const result = cssRules.filter(rule => rule.trim() !== '').join('\n\n');
  
  if (!result.trim()) {
    
  }
  
  return result;
}

/**
 * Combine les styles de base avec les styles avancés
 * Les styles avancés complètent et améliorent les styles de base sans les détruire
 */
export function combineStyles(baseCSS: string, advancedCSS: string): string {
  if (!advancedCSS || advancedCSS.trim() === '') {
    
    return baseCSS;
  }

  
  
  

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

/**
 * Designs de tableau prédéfinis
 */
export const tableDesignPresets = {
  // Design classique avec bordures simples
  classic: {
    headerBackgroundColor: "#f0f0f0",
    headerBackgroundOpacity: 1.0,
    rowBackgroundColor: "#ffffff",
    rowBackgroundOpacity: 1.0,
    alternateRowBackgroundColor: "#f9f9f9",
    alternateRowBackgroundOpacity: 1.0,
    
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
    headerBorderWidth: 2,
    headerBorderColor: "#000000",
    
    enableShadow: false,
    enableRadius: false,
    cellPadding: 6,
    headerCellPadding: 8,
    enableStriped: false,
    enableHover: false,
  },

  // Design moderne avec ombres et arrondis
  modern: {
    headerBackgroundColor: "#667eea",
    headerBackgroundOpacity: 1.0,
    rowBackgroundColor: "#ffffff",
    rowBackgroundOpacity: 1.0,
    alternateRowBackgroundColor: "#f8f9fa",
    alternateRowBackgroundOpacity: 1.0,
    
    enableOuterBorder: false,
    enableInnerBorder: false,
    enableHeaderBorder: false,
    
    enableShadow: true,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowBlur: 8,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    
    enableRadius: true,
    borderRadius: 8,
    
    cellPadding: 12,
    headerCellPadding: 16,
    enableStriped: true,
    enableHover: true,
    hoverBackgroundColor: "#e3f2fd",
    hoverBackgroundOpacity: 0.8,
  },

  // Design minimaliste sans bordures
  minimal: {
    headerBackgroundColor: "#ffffff",
    headerBackgroundOpacity: 1.0,
    rowBackgroundColor: "#ffffff",
    rowBackgroundOpacity: 1.0,
    alternateRowBackgroundColor: "#ffffff",
    alternateRowBackgroundOpacity: 1.0,
    
    enableOuterBorder: false,
    enableInnerBorder: false,
    enableHeaderBorder: true,
    headerBorderStyle: "solid",
    headerBorderWidth: 2,
    headerBorderColor: "#000000",
    
    enableShadow: false,
    enableRadius: false,
    
    cellPadding: 8,
    headerCellPadding: 8,
    enableStriped: false,
    enableHover: true,
    hoverBackgroundColor: "#f5f5f5",
    hoverBackgroundOpacity: 1.0,
  },

  // Design formel avec fond gris et bordures doubles
  formal: {
    headerBackgroundColor: "#e9ecef",
    headerBackgroundOpacity: 1.0,
    rowBackgroundColor: "#ffffff",
    rowBackgroundOpacity: 1.0,
    alternateRowBackgroundColor: "#f8f9fa",
    alternateRowBackgroundOpacity: 1.0,
    
    enableOuterBorder: true,
    outerBorderStyle: "double",
    outerBorderWidth: 3,
    outerBorderColor: "#000000",
    
    enableInnerBorder: true,
    innerBorderStyle: "solid",
    innerBorderWidth: 1,
    innerBorderColor: "#6c757d",
    
    enableHeaderBorder: true,
    headerBorderStyle: "double",
    headerBorderWidth: 2,
    headerBorderColor: "#000000",
    
    enableShadow: false,
    enableRadius: false,
    
    cellPadding: 10,
    headerCellPadding: 12,
    enableStriped: true,
    enableHover: false,
  },

  // Design élégant avec dégradés et effets subtils
  elegant: {
    headerBackgroundColor: "#6f42c1",
    headerBackgroundOpacity: 0.9,
    rowBackgroundColor: "#ffffff",
    rowBackgroundOpacity: 1.0,
    alternateRowBackgroundColor: "#f8f5ff",
    alternateRowBackgroundOpacity: 0.6,
    
    enableOuterBorder: true,
    outerBorderStyle: "solid",
    outerBorderWidth: 1,
    outerBorderColor: "#dee2e6",
    
    enableInnerBorder: true,
    innerBorderStyle: "solid",
    innerBorderWidth: 1,
    innerBorderColor: "#e9ecef",
    
    enableHeaderBorder: false,
    
    enableShadow: true,
    shadowColor: "#6f42c1",
    shadowOpacity: 0.1,
    shadowBlur: 6,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
    
    enableRadius: true,
    borderRadius: 4,
    
    cellPadding: 10,
    headerCellPadding: 14,
    enableStriped: true,
    enableHover: true,
    hoverBackgroundColor: "#f3e8ff",
    hoverBackgroundOpacity: 0.7,
  },

  // Design sans bordures (transparent)
  borderless: {
    headerBackgroundColor: "#f8f9fa",
    headerBackgroundOpacity: 0.8,
    rowBackgroundColor: "#ffffff",
    rowBackgroundOpacity: 0.0,
    alternateRowBackgroundColor: "#f8f9fa",
    alternateRowBackgroundOpacity: 0.3,
    
    enableOuterBorder: false,
    enableInnerBorder: false,
    enableHeaderBorder: false,
    
    enableShadow: false,
    enableRadius: false,
    
    cellPadding: 8,
    headerCellPadding: 10,
    enableStriped: true,
    enableHover: true,
    hoverBackgroundColor: "#e9ecef",
    hoverBackgroundOpacity: 0.5,
  },
};

/**
 * Applique un design de tableau prédéfini
 */
export function applyTableDesignPreset(presetName: keyof typeof tableDesignPresets): AdvancedTableConfig {
  return tableDesignPresets[presetName] || tableDesignPresets.classic;
}

/**
 * Obtient la liste des designs de tableau disponibles avec descriptions
 */
export function getTableDesignPresets(): Array<{key: keyof typeof tableDesignPresets, name: string, description: string}> {
  return [
    {
      key: 'classic',
      name: 'Classique',
      description: 'Design traditionnel avec bordures noires et en-têtes gris'
    },
    {
      key: 'modern', 
      name: 'Moderne',
      description: 'Design contemporain avec ombres, arrondis et dégradés bleus'
    },
    {
      key: 'minimal',
      name: 'Minimaliste', 
      description: 'Design épuré sans bordures avec seulement une ligne d\'en-tête'
    },
    {
      key: 'formal',
      name: 'Formel',
      description: 'Design institutionnel avec bordures doubles et lignes alternées'
    },
    {
      key: 'elegant',
      name: 'Élégant',
      description: 'Design raffiné avec couleurs violettes et effets subtils'
    },
    {
      key: 'borderless',
      name: 'Sans bordures',
      description: 'Design transparent avec arrière-plans légers et sans bordures'
    }
  ];
}