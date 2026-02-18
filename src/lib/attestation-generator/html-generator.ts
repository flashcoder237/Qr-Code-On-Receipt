// src/lib/attestation-generator/html-generator.ts - Version avec support typographie avancée

import { StudentExcelRecord, sanitizeStudentData, generateQrCodeBase64 } from '../helpers/qrcode';
import { formatDate, calculateGrade, calculateMention, formatJuryNumber } from './utils';
import { calculateMGP } from '../helpers/grades';
import { AttestationThemeSettingsPayload, defaultAttestationTheme, getAdvancedAttestationConfig } from '../form-schemas/attestation-theme-settings';
import { getQRCodeSizeEstimate } from '../helpers/qrcode';
import { generateAdvancedAttestationCSS, combineStyles } from '../../utils/advanced-css-generator'; // NOUVEAU
import { formatDateForAttestation } from '../../utils/date-formatter'; // NOUVEAU
import { SchoolSettings, GenerationOptions } from './types';

/**
 * Helper function to format numbers in French format (comma as decimal separator)
 */
function formatFrenchNumber(value: number, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  return value.toFixed(decimals).replace('.', ',');
}

/**
 * Traduit une mention française vers l'anglais
 */
function translateMentionToEnglish(mentionFR: string): string {
  if (!mentionFR) return 'N/A';
  
  const translations: { [key: string]: string } = {
    // Système de mentions standard - utilisé pour tous les étudiants
    'Excellent': 'Excellent',
    'Très Bien': 'Very Good',
    'Bien': 'Good',
    'Assez Bien': 'Fairly Good',
    'Passable': 'Satisfactory',
    'Insuffisant': 'Insufficient',
    'Faible': 'Weak',
    'Très Faible': 'Very Weak',
    'Nul': 'Null'
  };
  
  return translations[mentionFR] || mentionFR;
}

// Les types SchoolSettings et GenerationOptions sont maintenant importés depuis ./types

/**
 * Génère le HTML pour l'attestation de réussite avec support de la typographie avancée
 * 
 * @feature Logo de fond personnalisé
 * - Utilisez settings.watermarkLogo pour définir un logo de fond personnalisé
 * - Si non défini, utilise le logo par défaut selon le type d'établissement
 * - Le logo apparaît en filigrane derrière le contenu de l'attestation
 */
export async function generateAttestationHTML(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: GenerationOptions = {}
): Promise<string> {
  if (!student) {
    throw new Error("Les données de l'étudiant sont requises");
  }
  
  if (!settings) {
    throw new Error("Les paramètres de l'école sont requis");
  }

  
  
  // Sanitiser les données de l'étudiant
  const sanitizedStudent = sanitizeStudentData(student);
  
  console.log('🔍 Colonnes EN dans données brutes:', {
    DOMAINE_EN: student.DOMAINE_EN,
    PARCOURS_EN: student.PARCOURS_EN, 
    SPECIALITE_EN: student.SPECIALITE_EN,
    OPTION_EN: student.OPTION_EN,
    FINALITE_EN: student.FINALITE_EN,
    MENTION_EN: student.MENTION_EN
  });
  console.log('🔍 Colonnes EN après sanitisation:', {
    DOMAINE_EN: sanitizedStudent.DOMAINE_EN,
    PARCOURS_EN: sanitizedStudent.PARCOURS_EN,
    SPECIALITE_EN: sanitizedStudent.SPECIALITE_EN,
    OPTION_EN: sanitizedStudent.OPTION_EN,
    FINALITE_EN: sanitizedStudent.FINALITE_EN,
    MENTION_EN: sanitizedStudent.MENTION_EN
  });
  
  // Par défaut, le chiffrement compact est activé sauf indication contraire
  const encryptionEnabled = options.encryptionEnabled !== false;
  const isDemoMode = options.demoMode === true;
  
  
  

  // Utiliser le thème fourni ou celui des paramètres ou le thème par défaut
  const theme = options.theme || settings.theme || defaultAttestationTheme;

   // NOUVEAU: Obtenir la configuration avancée SEULEMENT si elle est explicitement fournie dans settings
  // Ne pas utiliser getAdvancedAttestationConfig qui pourrait appliquer des styles non désirés
  const advancedConfig = settings.advancedConfig || { 
    enableAdvancedTypography: false,
    spacing: { titleSpacing: 8, subtitleSpacing: 6, headerSpacing: 15, studentInfoSpacing: 10, tableSpacing: 8, paragraphSpacing: 6, sectionSpacing: 20, footerSpacing: 15, signatureSpacing: 25 },
    tableDesign: {}
  };
  
  
  
  // Récupérer les logos au format base64
  const schoolLogo = settings.logo || '';
  const universityLogo = settings.universityLogo || '';
  const facultyLogo = settings.facultyLogo || '';
  
  // Données de l'étudiant formatées
  const academicYear = sanitizedStudent["ANNEE ACADEMIQUE"];
  const juryDateRaw = sanitizedStudent["DATE JURY"];
  const juryNumber = sanitizedStudent["NUMERO JURY"];
  const currentYear = new Date().getFullYear() % 100;
  
  const studentName = sanitizedStudent.NOM;
  const studentFirstname = sanitizedStudent.PRENOM !== "N/D" ? sanitizedStudent.PRENOM : "";
  const studentFullName = `${studentName} ${studentFirstname}`;
  const matricule = sanitizedStudent.MATRICULE;
  const birthDateRaw = sanitizedStudent["DATE DE NAISSANCE"];
  const birthPlace = sanitizedStudent["LIEU DE NAISSANCE"];

  // NOUVEAU: Formatage des dates en lettres
  const primaryLanguage = theme.primaryLanguage;
  const juryDate = formatDateForAttestation(juryDateRaw, settings.establishmentType, primaryLanguage);
  const birthDate = formatDateForAttestation(birthDateRaw, settings.establishmentType, primaryLanguage);

  // Formatage du numéro de jury sur 3 chiffres
  const formattedJuryNumber = formatJuryNumber(juryNumber);

  
  
  
  
  
  const cycle = sanitizedStudent.CYCLE;
  const niveau = sanitizedStudent.NIVEAU;
  const dureeValide = sanitizedStudent.DUREE_VALIDE;
  const dureeValideEn = sanitizedStudent.DUREE_VALIDE_EN;
  
  // Récupérer la moyenne numérique d'abord
  const numericAverage = typeof sanitizedStudent.MOYENNE === 'number' ? 
    sanitizedStudent.MOYENNE : parseFloat(String(sanitizedStudent.MOYENNE)) || 0;

  // NOUVEAU: Support des traductions anglaises pour les établissements faculty
  const isFacultyEstablishment = settings.establishmentType?.toLowerCase().includes('faculty') || 
                                  settings.establishmentType?.toLowerCase().includes('faculté');
  const useEnglishTranslations = isFacultyEstablishment && theme.primaryLanguage === 'english';
  const useBilingualDisplay = true; // Toujours bilingue pour Faculty
  
  // Valeurs principales (français ou anglais selon primaryLanguage)
  const fieldOfStudy = useEnglishTranslations && sanitizedStudent.DOMAINE_EN ? 
    sanitizedStudent.DOMAINE_EN : sanitizedStudent.DOMAINE;
  const course = useEnglishTranslations && sanitizedStudent.PARCOURS_EN ? 
    sanitizedStudent.PARCOURS_EN : sanitizedStudent.PARCOURS;
  const specialization = useEnglishTranslations && sanitizedStudent.SPECIALITE_EN ? 
    sanitizedStudent.SPECIALITE_EN : sanitizedStudent.SPECIALITE;
  const option = useEnglishTranslations && sanitizedStudent.OPTION_EN ? 
    sanitizedStudent.OPTION_EN : sanitizedStudent.OPTION;
  const finality = useEnglishTranslations && sanitizedStudent.FINALITE_EN ? 
    sanitizedStudent.FINALITE_EN : sanitizedStudent.FINALITE;
  // Calculer la mention de base d'abord - NETTOYER LES VALEURS PROBLÉMATIQUES
  let baseMention = 'Passable'; // Valeur par défaut
  if (sanitizedStudent.MENTION) {
    const mentionValue = String(sanitizedStudent.MENTION).trim();
    // Vérifier si c'est une vraie mention (contient des lettres, pas juste un chiffre)
    const isValidMention = mentionValue && 
                          mentionValue !== '1' && 
                          mentionValue !== 'true' && 
                          mentionValue !== 'false' &&
                          /[a-zA-Z]/.test(mentionValue) &&  // Doit contenir des lettres
                          !/^\d+$/.test(mentionValue);      // Ne doit pas être juste un chiffre
    
    if (isValidMention) {
      baseMention = mentionValue;
      
    } else {
      // Si MENTION contient une valeur problématique (comme "2"), calculer la mention
      baseMention = calculateMention(numericAverage, sanitizedStudent.PARCOURS, sanitizedStudent.NIVEAU, sanitizedStudent.FINALITE) || 'Passable';
      
    }
  } else {
    // Si pas de MENTION, calculer 
    baseMention = calculateMention(numericAverage, sanitizedStudent.PARCOURS, sanitizedStudent.NIVEAU, sanitizedStudent.FINALITE) || 'Passable';
    
  }
  
  
  // Priorité : MENTION_EN du fichier Excel > mention traduite > mention de base
  let mentionTranslated = String(baseMention); // Valeur par défaut sécurisée
  if (useEnglishTranslations && sanitizedStudent.MENTION_EN) {
    // Convertir en chaîne et nettoyer si nécessaire
    const mentionENValue = String(sanitizedStudent.MENTION_EN).trim();
    if (mentionENValue && mentionENValue !== '1' && mentionENValue !== 'true' && mentionENValue !== 'false') {
      mentionTranslated = mentionENValue;
    }
  }
  
  
  
  

  // Versions anglaises pour affichage bilingue Faculty - CORRECTION DE LA LOGIQUE
  const fieldOfStudyEN = (sanitizedStudent.DOMAINE_EN && sanitizedStudent.DOMAINE_EN !== 'N/D') ? 
    sanitizedStudent.DOMAINE_EN : (sanitizedStudent.DOMAINE || 'N/A');
  const courseEN = (sanitizedStudent.PARCOURS_EN && sanitizedStudent.PARCOURS_EN !== 'N/D') ? 
    sanitizedStudent.PARCOURS_EN : (sanitizedStudent.PARCOURS || 'N/A');
  const specializationEN = (sanitizedStudent.SPECIALITE_EN && sanitizedStudent.SPECIALITE_EN !== 'N/D') ? 
    sanitizedStudent.SPECIALITE_EN : (sanitizedStudent.SPECIALITE || 'N/A');
  const optionEN = (sanitizedStudent.OPTION_EN && sanitizedStudent.OPTION_EN !== 'N/D') ? 
    sanitizedStudent.OPTION_EN : (sanitizedStudent.OPTION || 'N/A');
  const finalityEN = (sanitizedStudent.FINALITE_EN && sanitizedStudent.FINALITE_EN !== 'N/D') ? 
    sanitizedStudent.FINALITE_EN : (sanitizedStudent.FINALITE || 'N/A');
  
  console.log('🔍 Versions anglaises calculées:', {
    'DOMAINE_EN raw': sanitizedStudent.DOMAINE_EN,
    'fieldOfStudyEN final': fieldOfStudyEN,
    'PARCOURS_EN raw': sanitizedStudent.PARCOURS_EN,
    'courseEN final': courseEN,
    'SPECIALITE_EN raw': sanitizedStudent.SPECIALITE_EN,
    'specializationEN final': specializationEN
  });
  
  // Calculer la mention en anglais si manquante pour Faculty - RESPECTER LES VERSIONS EXCEL
  // Calculer mentionTranslatedEN en nettoyant les valeurs problématiques  
  let mentionTranslatedEN = null;
  if (useBilingualDisplay) {
    // Priorité 1: Si MENTION_EN dans Excel est une vraie traduction anglaise (pas un chiffre)
    if (sanitizedStudent.MENTION_EN) {
      const mentionENValue = String(sanitizedStudent.MENTION_EN).trim();
      // Vérifier si c'est une vraie traduction (contient des lettres ET n'est pas juste un chiffre)
      const isValidTranslation = mentionENValue && 
                                mentionENValue !== '1' && 
                                mentionENValue !== 'true' && 
                                mentionENValue !== 'false' && 
                                /[a-zA-Z]/.test(mentionENValue) &&
                                !/^\d+$/.test(mentionENValue); // Exclure les chiffres purs comme "2", "3", etc.
      
      if (isValidTranslation) {
        mentionTranslatedEN = mentionENValue;
        
      } 
    }
    
    // Priorité 2: Traduire la MENTION du fichier Excel s'il y en a une
    if (!mentionTranslatedEN && sanitizedStudent.MENTION) {
      mentionTranslatedEN = translateMentionToEnglish(sanitizedStudent.MENTION);
      
    } 
    
    // Priorité 3: Calculer et traduire
    if (!mentionTranslatedEN) {
      const calculatedMention = calculateMention(numericAverage, sanitizedStudent.PARCOURS, sanitizedStudent.NIVEAU, sanitizedStudent.FINALITE);
      mentionTranslatedEN = translateMentionToEnglish(calculatedMention);
      
    }
  }
  

  
  
  
  
  
  
  
  
  
  const credits = sanitizedStudent["TOTAL CREDIT"];
  
  // Calculer automatiquement les valeurs à partir de la moyenne
  const average = formatFrenchNumber(numericAverage);
  const grade = calculateGrade(numericAverage);
  // Calcul sécurisé de la mention finale
  let mention = 'Passable'; // Valeur par défaut
  if (mentionTranslated && typeof mentionTranslated === 'string') {
    mention = mentionTranslated;
  } else {
    mention = calculateMention(numericAverage, sanitizedStudent.PARCOURS, sanitizedStudent.NIVEAU, sanitizedStudent.FINALITE) || 'Passable';
  }
  
  
  
  // S'assurer que mentionTranslatedEN existe pour l'affichage bilingue
  if (useBilingualDisplay && !mentionTranslatedEN) {
    mentionTranslatedEN = translateMentionToEnglish(mention);
    
  }
  
  const mgp = calculateMGP(grade);
  
  
  
  
  
  
  
  
  
  
  // Calculer la traduction finale de la mention pour le template
  let finalMentionEN = '';
  if (useBilingualDisplay) {
    // Nettoyer mentionTranslatedEN des valeurs problématiques
    let cleanMentionTranslatedEN = null;
    if (mentionTranslatedEN && typeof mentionTranslatedEN === 'string') {
      const cleanValue = mentionTranslatedEN.trim();
      if (cleanValue && cleanValue !== '1' && cleanValue !== 'true' && cleanValue !== 'false') {
        cleanMentionTranslatedEN = cleanValue;
      }
    }
    
    finalMentionEN = String(cleanMentionTranslatedEN || translateMentionToEnglish(mention) || 'N/A');
    
    
    
    
    
    
    
    
  }

  const getCycleTranslateEn = (cycle : string, niveau?: string) => {
    if (niveau && niveau.trim() !== '' && niveau.trim().toUpperCase() !== 'N/D') {
      return `OF ${cycle.toUpperCase()} ${niveau.trim()}`;
    }
    switch (cycle.toUpperCase()) {
      case "DOCTORAT":
        return "OF DOCTORATE";
      case "DOCTORAT PHARMACIE":
        return "OF DOCTORATE OF PHARMACY";
      case "MASTER":
        return "OF MASTER'S DEGREE";
      case "LICENCE":
        return "OF BACHELOR'S DEGREE";
      case "N/D":
        return "OF XXXX";
      default:
        return "OF XXXX";
    }
  };

  const getCycleTranslateFr = (cycle : string, niveau?: string) => {
    if (niveau && niveau.trim() !== '' && niveau.trim().toUpperCase() !== 'N/D') {
      return `DE ${cycle.toUpperCase()} ${niveau.trim()}`;
    }
    switch (cycle.toUpperCase()) {
      case "DOCTORAT":
        return "AU DIPLÔME DE DOCTORAT";
      case "MASTER":
        return "AU DIPLÔME DE MASTER";
      case "LICENCE":
        return "AU DIPLÔME DE LICENCE";
      case "N/D":
        return "AU DIPLÔME DE XXXXX";
      default:
        return "AU DIPLÔME DE XXXXX";
    }
  };

  // Générer le QR code avec chiffrement compact
  let qrCodeImage = options.qrCodeImage;
  let qrCodeAnalysis = null;
  
  if (!qrCodeImage && theme.showQRCode) {
    try {
      
      
      qrCodeImage = await generateQrCodeBase64(sanitizedStudent, 'attestation', encryptionEnabled);
      qrCodeAnalysis = getQRCodeSizeEstimate(sanitizedStudent, 'attestation', encryptionEnabled);
      
      if (encryptionEnabled) {
        
        
      } 
    } catch (qrError) {
      console.error('❌ Erreur lors de la génération du QR code pour le HTML:', qrError);
      qrCodeImage = '';
    }
  }

  // NOUVEAU: Génère les styles CSS basés sur le thème avec support avancé
  const generateThemeStyles = (): string => {
    const logoSizeMap = {
      small: { width: '60px', height: '60px' },
      medium: { width: '80px', height: '80px' },
      large: { width: '100px', height: '100px' }
    };
    
    const qrCodeSizeMap = {
      small: { width: '80px', height: '80px' },
      medium: { width: '100px', height: '100px' },
      large: { width: '120px', height: '120px' }
    };

    const currentLogoSize = logoSizeMap[theme.logoSize];
    const currentQrCodeSize = qrCodeSizeMap[theme.qrCodeSize];

    // CSS de base
    const baseCSS = `
      @page {
        size: A4 portrait;
        margin: 0;
      }
      
      * {
        box-sizing: border-box;
      }
      html {
        width: 210mm;
        height: 297mm;
      }
      body {
        margin: ${theme.documentPadding}px;
        padding: 0;
        width: calc(210mm - ${theme.documentPadding * 2}px);
        height: calc(297mm - ${theme.documentPadding * 2}px);
        font-family: ${theme.mainFont};
        font-size: ${theme.contentFontSize}px !important;
        color: ${theme.primaryColor};
        background-color: white;
        ${theme.compactMode ? 'line-height: 1.2;' : 'line-height: 1.4;'}
        position: relative;
      }
      
      .container {
        width: 100%;
        height: 100%;
        padding: ${theme.documentPadding}px;
        box-sizing: border-box;
        position: relative;
        ${theme.borderStyle !== 'none' ? `border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.tableBorderColor};` : ''}
      }

      /* Filigrane DÉMO */
      .demo-watermark {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        pointer-events: none;
        display: ${isDemoMode ? 'block' : 'none'};
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 100px,
          rgba(255, 0, 0, 0.1) 100px,
          rgba(255, 0, 0, 0.1) 120px
        );
      }
      
      .demo-watermark::before {
        content: "DÉMO";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 120px;
        font-weight: bold;
        color: rgba(255, 0, 0, 0.15);
        font-family: Arial, sans-serif;
        letter-spacing: 20px;
        
      }
      
      .demo-watermark::after {
        content: "MODE DÉMO - FONCTIONNALITÉS LIMITÉES";
        position: absolute;
        bottom: 20%;
        left: 50%;
        transform: translate(-50%, 0) rotate(-45deg);
        font-size: 24px;
        font-weight: bold;
        color: rgba(255, 0, 0, 0.2);
        font-family: Arial, sans-serif;
        white-space: nowrap;
      }

      /* Bannière démo en haut */
      .demo-banner {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(255, 0, 0, 0.4);
        color: white;
        text-align: center;
        padding: 5px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1001;
        display: ${isDemoMode ? 'block' : 'none'};
      }

      /* Filigrane IPES - modifié pour être sous le filigrane démo */
      .watermark {
        position: absolute;
        top: 25%;
        left: 0;
        width: 100%;
        height: 50%;
        z-index: -1;
        display: ${theme.showWatermark ? 'flex' : 'none'};
        justify-content: center;
        align-items: center;
        opacity: ${isDemoMode ? theme.watermarkOpacity * 0.3 : theme.watermarkOpacity};
        pointer-events: none;
      }
      
      .watermark img {
        max-width: 600px;
        max-height: 400px;
        object-fit: contain;
      }

      /* En-tête - STRUCTURE CLASSIQUE MAINTENUE */
      .header {    
        line-height: normal;
        font-size: ${theme.headerFontSize}px;
        font-family: ${theme.headerFont};
      }
      
      .header-row1 {
        text-align: center;
        margin-bottom: ${theme.headerLayout === 'compact' ? '4px' : theme.headerLayout === 'extended' ? '12px' : '8px'};
        display: flex;
        justify-content: space-between;
      }
      
      .header-content {
        width: ${theme.headerLayout === 'extended' ? '40%' : theme.headerLayout === 'compact' ? '30%' : '33%'};
        font-size: ${theme.headerFontSize}px;
        line-height: ${theme.compactMode ? '1.1' : '1.3'};
      }
      
      .header-logo-content {
        align-content: center;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .header-logo-content > div {
        width: 100%;
        height: 100%;
        align-items: center;
        margin: 3px;
        align-content: center;
      }
      
      .header-logo-content > div > img {
        max-width: ${currentLogoSize.width};
        max-height: ${currentLogoSize.height};
        object-fit: contain;
      }

      /* Masquage conditionnel selon le type d'établissement */
      #to-hidden {
        ${settings.establishmentType !== "ipes" ? 'display: none;' : ''}
      }
      
      #to-nothidden {
        ${settings.establishmentType === "ipes" ? 'display: none;' : ''}
      }

      .header-row2 {
        text-align: center;
        margin-bottom: ${theme.compactMode ? '10px' : '15px'};
      }
      
      .header-row2 h1 {
        font-weight: bold;
        text-align: center;
        font-size: ${theme.titleFontSize}px;
        color: ${theme.accentColor};
        margin: ${theme.compactMode ? '2px 0' : '4px 0'};
        text-transform: uppercase;
        font-family: ${theme.headerFont};
      }
      
      .header-row2 h2 {
        font-weight: bold;
        font-size: ${theme.subtitleFontSize}px;
        color: ${theme.secondaryColor};
        margin: ${theme.compactMode ? '2px 0' : '4px 0'};
        font-style: italic;
      }
      
      .header-row2 p {
        font-size: ${theme.contentFontSize + 4}px;
        margin: ${theme.compactMode ? '2px 0' : '5px 0'};
      }

      /* Contenu principal */
      .content {
        margin: ${theme.compactMode ? '16px 0' : '25px 0'};
      }
      
      .student-info, .list-nomination-header {
        margin: ${theme.compactMode ? '5px 0' : '8px 0'};
      }
      
      .student-info p, .list-nomination-header p {
        margin: ${theme.compactMode ? '5px 0' : '8px 0'};
      }

      /* Tableaux */
      .table-container {
        width: 100%;
        margin: ${theme.compactMode ? '2px 0' : '5px 0'};
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: ${theme.compactMode ? '2px' : '5px'};
      }
      
      th, td {
        padding: ${theme.tableCellPadding}px;
        text-align: center;
        border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.tableBorderColor};
        font-size: ${theme.contentFontSize}px;
        vertical-align: middle;
      }
      
      th {
        background-color: ${theme.tableHeaderBgColor};
        font-weight: bold;
        color: ${theme.primaryColor};
      }
      
      /* Styles de tableau selon le thème choisi */
      ${theme.tableStyle === 'striped' ? `
      tbody tr:nth-child(even) {
        background-color: ${theme.tableHeaderBgColor};
      }` : ''}
      
      ${theme.tableStyle === 'modern' ? `
      table {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      th {
        background: linear-gradient(135deg, ${theme.tableHeaderBgColor}, ${theme.accentColor}20);
      }` : ''}
      
      ${theme.tableStyle === 'simple' ? `
      table, th, td {
        border: none;
      }
      th {
        background: none;
        border-bottom: 2px solid ${theme.tableBorderColor};
      }
      td {
        border-bottom: 1px solid ${theme.tableBorderColor}40;
      }` : ''}

      /* Section nominations */
      .nomination-list {
        display: flex;
        width: 100%;
        gap: 30%;
        margin: ${theme.compactMode ? '8px 0' : '15px 0'};
      }
      
      .nomination-list-item {
        border-top: 1px solid ${theme.tableBorderColor};
        width: 30%;
        padding-top: 4px;
        margin-top: 15px;
      }

      /* Pied de page et signatures */
      .footer {
        margin-top: ${theme.compactMode ? '8px' : '15px'};
        ${theme.signatureLayout === 'side-by-side' ? 'display: flex; justify-content: space-between;' : ''}
        ${theme.signatureLayout === 'centered' ? 'text-align: center;' : ''}
        ${theme.signatureLayout === 'stacked' ? 'display: flex; flex-direction: column; align-items: center; gap: 25px;' : ''}
      }
      
      .signature {
        ${theme.signatureLayout === 'side-by-side' ? 'width: 48%;' : 'width: 100%;'}
        ${theme.signatureLayout === 'centered' ? 'margin: 15px 0;' : ''}
        font-size: ${theme.contentFontSize}px;
        
        /* Styles de signature personnalisables */
        ${theme.signatureStyle === 'boxed' ? `
          padding: 10px;
          border: 1px solid ${theme.primaryColor};
          border-radius: 4px;
        ` : ''}
        ${theme.signatureStyle === 'underlined' ? `
          padding-bottom: 5px;
          border-bottom: 2px solid ${theme.primaryColor};
        ` : ''}
        ${theme.signatureStyle === 'modern' ? `
          background-color: ${theme.tableHeaderBgColor};
          padding: 8px;
          border-radius: 4px;
        ` : ''}
      }
      
      .sign-ipes {
        width: 100%;
        text-align: center;
        padding-bottom: 100px;
      }
      
      .recteur-sign {
        margin-top: ${theme.signatureLayout === 'stacked' ? '20px' : '65px'};
        padding-bottom: 100px;
      }

      /* QR Code */
      .qr-code {
        ${theme.qrCodePosition === 'bottom-center' ? 'text-align: center;' : ''}
        ${theme.qrCodePosition === 'bottom-left' ? 'float: left;' : ''}
        ${theme.qrCodePosition === 'bottom-right' ? 'float: right;' : ''}
        ${!theme.showQRCode ? 'display: none;' : ''}
        position: relative;
      }
      
      .qr-image {
        width: ${currentQrCodeSize.width};
        height: ${currentQrCodeSize.height};
        background-color: #eee;
        display: block;
      }

      /* Badge démo sur QR code */
      .qr-demo-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: red;
        color: white;
        font-size: 8px;
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: bold;
        display: ${isDemoMode ? 'block' : 'none'};
        z-index: 1002;
      }

      /* Disclaimer */
      .disclaimer {
        font-size: ${theme.footerFontSize}px;
        font-style: italic;
        text-align: left;
        margin-top: ${theme.compactMode ? '10px' : '20px'};
        display: flex;
        flex-direction: row;
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        color: ${theme.secondaryColor};
        line-height: 1.4;
      }
      
      .disclaimer div {
        padding-right: 10px;
      }

      /* Texte bilingue */
      em {
        font-style: italic;
        color: ${theme.secondaryColor};
        ${!theme.showBilingualText ? 'display: none;' : ''}
      }

      /* Styles pour différents layouts de contenu */
      ${theme.contentLayout === 'modern' ? `
      .content {
        background: linear-gradient(135deg, transparent, ${theme.tableHeaderBgColor}20);
        padding: 15px;
        border-radius: 6px;
      }` : ''}
      
      ${theme.contentLayout === 'formal' ? `
      .content {
        text-align: justify;
      }` : ''}

      /* Responsive pour l'impression */
      @media print {
        body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: ${theme.documentPadding}px;
          box-shadow: none;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .no-print {
          display: none;
        }
        
        /* S'assurer que le filigrane démo s'imprime */
        .demo-watermark,
        .demo-banner,
        .qr-demo-badge {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;

    // NOUVEAU: Générer le CSS avancé si activé
    const advancedCSS = generateAdvancedAttestationCSS(advancedConfig);
    
    // Combiner les styles
    return combineStyles(baseCSS, advancedCSS);
  };

  // Création du contenu HTML - STRUCTURE CLASSIQUE MAINTENUE AVEC SUPPORT DÉMO
  const html = `
<!DOCTYPE html>
<html lang="${theme.primaryLanguage === 'english' ? 'en' : 'fr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attestation de Réussite - ${studentFullName}</title>
    <style>${generateThemeStyles()}</style>
</head>
<body>
    <div class="container">
        ${isDemoMode ? `
        <!-- Bannière mode démo -->
        <div class="demo-banner">
          ⚠️ MODE DÉMO - DOCUMENT NON OFFICIEL ⚠️
        </div>
        
        <!-- Filigrane mode démo -->
        <div class="demo-watermark"></div>
        ` : ''}
        
        <!-- Logo de fond personnalisé ou par défaut -->
        <div class="watermark">
            <img src="${settings.watermarkLogo || (settings.establishmentType === "ipes" ? schoolLogo : facultyLogo)}" alt="Watermark">
        </div>
     
        <div class="header">
            <div class="header-row1">
              <div class="header-content">
                <p>REPUBLIQUE DU CAMEROUN <br>
                ${theme.showBilingualText ? '<em>Paix – Travail – Patrie</em>' : '<strong>Paix – Travail – Patrie</strong>'}<br>
                ********************<br>
                MINISTERE DE L'ENSEIGNEMENT SUPERIEUR<br>
                ********************<br>
                <strong>UNIVERSITE DE DOUALA</strong><br>
                ********************<br>
                <strong>FACULTE DE MEDECINE ET <br> DES SCIENCES PHARMACEUTIQUES</strong><br>
                ********************<br>
                B.P 2701, Douala, Cameroun<br>
                Email: <a href="mailto:contact@fmsp-udo.cm">contact@fmsp-udo.cm</a><br>
                 <span id="to-hidden">********************<br>
                <strong>${settings.nameFrench
                            .split(" ")
                            .map((w, i) => (i > 0 && i % 4 === 0 ? "<br>" + w : w))
                            .join(" ")}</strong><br>
                ********************<br>
                ${settings.postalBox}<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a></span></p>
              </div>
              
              <div class="header-logo-content">
                <div>${universityLogo ? `<img src="${universityLogo}" alt="University Logo">` : ''}</div>
                <div>${facultyLogo ? `<img src="${facultyLogo}" alt="Faculty Logo">` : ''}</div>
                <div id="to-hidden">${schoolLogo ? `<img src="${schoolLogo}" alt="IPES Logo">` : ''}</div>
              </div>
              
              <div class="header-content">
                <p>REPUBLIC OF CAMEROON<br>
                ${theme.showBilingualText ? '<em>Peace – Work - Fatherland</em>' : '<strong>Peace – Work - Fatherland</strong>'}<br>
                ********************<br>
                MINISTRY OF HIGHER EDUCATION<br>
                ********************<br>
                <strong>UNIVERSITY OF DOUALA</strong><br>
                ********************<br>
                <strong>FACULTY OF MEDICINE AND <br>PHARMACEUTICAL SCIENCES</strong><br>
                ********************<br>
                PO box 2701, Douala, Cameroon<br>
                Email: <a href="mailto:contact@fmsp-udo.cm">contact@fmsp-udo.cm</a><br>
               <span id="to-hidden">********************<br>
                <strong >${settings.nameEnglish
                            .split(" ")
                            .map((w, i) => (i > 0 && i % 4 === 0 ? "<br>" + w : w))
                            .join(" ")}</strong><br>
                ********************<br>
                ${settings.postalBoxEn}<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a></span></p>    
              </div>
            </div>
            
            <div class="header-row2">
              <h1 class="main-title">${theme.customTitle || `ATTESTATION DE REUSSITE ${getCycleTranslateFr(cycle, niveau)}`}</h1>
              ${theme.showBilingualText ? `<h2 class="subtitle">${theme.customSubtitle || `ATTESTATION OF COMPLETION ${getCycleTranslateEn(cycle, niveau)}`}</h2>` : ''}
              
              <p style="margin-top: 6px"><strong>Ref N°............./${currentYear-1}/UDo/FMSP${settings.establishmentType === "ipes" ? "/VDRC/"+settings.nameAbreviation : "/VDPSAA/VDSSE/VDRC/CDAASR/SSE"}</strong></p>
            </div>
        </div>
        
        <div class="content">
            <div class="list-nomination-header">
              <p style="font-size: ${theme.contentFontSize-4}px;" id="to-hidden">${settings.convTextFr}<br>
              <em>${theme.showBilingualText ? settings.convTextEn : ''}</em></p>
              
              <p id="to-hidden"><strong>Nous soussignés,</strong><br>
              ${theme.showBilingualText ? '<em>We, the undersigned,</em>' : ''}</p>

               <p id="to-nothidden"><strong>Je soussignée, Professeur EBOUMBOU MOUKOKO Carole Else,</strong><br>
              ${theme.showBilingualText ? '<em>I, the undersigned, Professor EBOUMBOU MOUKOKO Carole Else,</em>' : ''}</p>
              
              <div class="nomination-list" id="to-hidden">
                <div class="nomination-list-item">
                  <strong>Directeur de l'${settings.nameAbreviation}</strong><br>
                  ${theme.showBilingualText ? '<em>Director of the ' + settings.nameAbreviation + '</em>' : ''}<br>
                </div>
                <div class="nomination-list-item">
                  <strong>Recteur de l'Université de Douala</strong><br>
                  ${theme.showBilingualText ? '<em>Rector of the University of Douala</em>' : ''}
                </div>
              </div>
              
              <p><strong>Vu le procès-verbal du jury N° ${formattedJuryNumber} en date du ${juryDate} <span id="to-nothidden">atteste</span><span id="to-hidden">attestons</span> que,</strong><br>
              ${theme.showBilingualText ? `<em>Considering the jury's decision N° ${formattedJuryNumber} dated ${juryDate} Certify that,</em>` : ''}</p>
            </div> 
            <div class="student-info">
                <p>M./Mme/Mlle <strong>${studentFullName}</strong><br>
                ${theme.showBilingualText ? '<em>Mr/Mrs/Miss</em>' : ''}</p>
                
                <p>Né(e) le: <strong>${birthDate}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;à&nbsp;<strong>${birthPlace}</strong><br>
                ${theme.showBilingualText ? '<em>Born on: <strong style="opacity:0">' + birthDate + '</strong></em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<em>at:</em>' : ''}</p>
                
                <p id="to-hidden">Inscrit(e) à <strong>La ${settings.nameFrench}</strong> sous le matricule: <strong>${matricule}</strong><br>
                ${theme.showBilingualText ? `<em>Registered at the <strong>${settings.nameEnglish}</strong> under the matricule number:</em>` : ''}</p>

                <p id="to-nothidden">${niveau && niveau.trim() !== '' && niveau.trim().toUpperCase() !== 'N/D'
                  ? `A subi avec succès toutes les épreuves de : <strong>${cycle.toUpperCase()} ${niveau.trim()}</strong> en <strong>${course.toUpperCase()}</strong>`
                  : `A subi avec succès toutes les épreuves du cursus sanctionnant la fin du Cycle de : <strong>${cycle.toUpperCase()}</strong> en <strong>${course.toUpperCase()}</strong>`}<br>
                ${theme.showBilingualText ? (niveau && niveau.trim() !== '' && niveau.trim().toUpperCase() !== 'N/D'
                  ? `<em>Having successfully passed all examinations for: </em>`
                  : `<em>Having successfully fulfilled the requirements qualifying for the : </em>`) : ''}</p>
          
            </div>
            
           ${theme.showDomainTable ? `
    <div class="table-container">
        <table class="academic-table">
            <tr>
                <th>Domaine<br>${theme.showBilingualText ? '<em style="font-weight: normal">Domain of the study</em>' : ''}</th>
                <th>Parcours<br>${theme.showBilingualText ? '<em style="font-weight: normal">Course</em>' : ''}</th>
                <th>Spécialité<br>${theme.showBilingualText ? '<em style="font-weight: normal">Specialization</em>' : ''}</th>
                ${option && option.trim().toUpperCase() !== 'N/D' && option != mention ? `
                    <th>Option<br>${theme.showBilingualText ? '<em style="font-weight: normal">Learning option</em>' : ''}</th>
                ` : ''}
            </tr>
            <tr style="border-top: 1px solid ${theme.tableBorderColor}; background-color:${theme.tableHeaderBgColor}">
                <td><strong>${fieldOfStudy}${useBilingualDisplay ? `<br><em style="font-weight: normal">${fieldOfStudyEN}</em>` : ''}</strong></td>
                <td><strong>${course}${useBilingualDisplay ? `<br><em style="font-weight: normal">${courseEN}</em>` : ''}</strong></td>
                <td><strong>${specialization}${useBilingualDisplay ? `<br><em style="font-weight: normal">${specializationEN}</em>` : ''}</strong></td>
                ${option && option.trim().toUpperCase() !== 'N/D' && option != mention ? `
                    <td><strong>${option}${useBilingualDisplay ? `<br><em style="font-weight: normal">${optionEN}</em>` : ''}</strong></td>
                ` : ''}
            </tr>
        </table>
    </div>
` : ''}

            
            ${theme.showAcademicDetails ? `
            <div class="table-container">
                <table class="academic-table">
                    <tr>
                        <th>Total de credits<br>${theme.showBilingualText ? '<em style="font-weight: normal">Credits earned</em>' : ''}</th>
                        <th>Moyenne<br>${theme.showBilingualText ? '<em style="font-weight: normal">Average</em>' : ''}</th>
                        <th>Grade<br>${theme.showBilingualText ? '<em style="font-weight: normal">Grade</em>' : ''}</th>
                        <th>MGP<br>${theme.showBilingualText ? '<em style="font-weight: normal">GPA</em>' : ''}</th>
                        <th>Mention<br>${theme.showBilingualText ? '<em style="font-weight: normal">Honor</em>' : ''}</th>
                        <th>Année académique<br>${theme.showBilingualText ? '<em style="font-weight: normal">Academic year</em>' : ''}</th>
                        <th>Finalité/Voie<br>${theme.showBilingualText ? '<em style="font-weight: normal">Finality/Vocation</em>' : ''}</th>
                    </tr>
                    <tr style="border-top: 1px solid ${theme.tableBorderColor}; background-color:${theme.tableHeaderBgColor}">
                        <td><strong>${credits}</strong></td>
                        <td><strong>${average}</strong></td>
                        <td><strong>${grade}</strong></td>
                        <td><strong>${formatFrenchNumber(mgp)}</strong></td>
                        <td><strong>${String(mention) || 'ERREUR_MENTION'}${useBilingualDisplay ? `<br><em style="font-weight: normal">${finalMentionEN}</em>` : ''}</strong></td>
                        <td><strong>${academicYear}</strong></td>
                        <td><strong>${finality}${useBilingualDisplay ? `<br><em style="font-weight: normal">${finalityEN}</em>` : ''}</strong></td>
                    </tr>
                </table>
            </div>
            ` : ''}
            
            <p>En foi de quoi la présente Attestation est délivrée pour servir et valoir ce que de droit.<br>
            ${theme.showBilingualText ? '<em>In witness where of the present testimonial is given with all the privileges there to pertaining.</em>' : ''}</p>
        </div>
        
        <div class="footer">
            <div class="signature signature-area" style="display: flex; flex-direction: column; align-items: center;">
                <div class="qr-code">
                    ${qrCodeImage ? `
                      <img src="${qrCodeImage}" class="qr-image" alt="QR Code ${encryptionEnabled ? '(Chiffrement Compact)' : ''}" />
                      ${isDemoMode ? '<div class="qr-demo-badge">DÉMO</div>' : ''}
                    ` : '<div class="qr-image"></div>'}
                </div>
                <div class="sign-ipes" id="to-hidden">
                  <p><strong>Le Directeur de L'${settings.nameAbreviation}</strong><br>
                  ${theme.showBilingualText ? '<em>The Director of the ' + settings.nameAbreviation + '</em>' : ''}</p>
                </div>
            </div>
            
            <div class="signature signature-area">
              <p><strong>Douala, le</strong><br>
              ${theme.showBilingualText ? '<em>Douala, the</em>' : ''}</p>
          
              <p id="to-hidden" class="recteur-sign">
              <strong>Le Recteur de l'Université de Douala</strong><br>
              ${theme.showBilingualText ? '<em>The Rector of the University of Douala</em>' : ''}</p>
              <p id="to-nothidden" class="recteur-sign">
              <strong>LE CHEF D'ÉTABLISSEMENT</strong><br>
              ${theme.showBilingualText ? '<em>The Dean of the Faculty</em>' : ''}</p>
            </div>
        </div>
        
        <div class="disclaimer">
            <div>
            ${isDemoMode ? `
            <span style="color: red; font-weight: bold;">
              ⚠️ DOCUMENT GÉNÉRÉ EN MODE DÉMO - NON OFFICIEL ⚠️
            </span><br>
            ` : ''}
                ${dureeValide && dureeValide.trim() !== '' && dureeValide.trim().toUpperCase() !== 'N/D'
                  ? `Cette Attestation ne tient pas lieu de Diplôme et n'est délivrée qu'en un seul exemplaire et d'une validité de ${dureeValide.trim()} à partir de la date de signature. Le Diplôme lui sera délivré ultérieurement.`
                  : theme.customFooterText
                    ? theme.customFooterText
                    : `Il n'est délivré qu'un seul exemplaire d'attestation, le titulaire peut en faire des copies certifiées conformes.`}
            </div>
            ${theme.showBilingualText ? `
            <div>
                ${dureeValide && dureeValide.trim() !== '' && dureeValide.trim().toUpperCase() !== 'N/D'
                  ? `<em>This Certificate does not serve as a Diploma and is issued in a single copy, valid for ${dureeValideEn && dureeValideEn.trim() !== '' && dureeValideEn.trim().toUpperCase() !== 'N/D' ? dureeValideEn.trim() : dureeValide.trim()} from the date of signature. The Diploma will be issued at a later date.</em>`
                  : `<em>This certificate is delivered only once, the owner can make certified copies as necessary.</em>`}
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
  `;
  
  
  
  
  
  
  
  

  
  return html;
}