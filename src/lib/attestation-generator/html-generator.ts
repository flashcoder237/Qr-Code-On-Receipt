// src/lib/attestation-generator/html-generator.ts - Version corrigée sans localStorage
import { StudentExcelRecord, sanitizeStudentData, generateQrCodeBase64 } from '../helpers/qrcode';
import { formatDate, calculateGrade, calculateMention } from './utils';
import { AttestationThemeSettingsPayload, defaultAttestationTheme } from '../form-schemas/attestation-theme-settings';
import { getQRCodeSizeEstimate } from '../helpers/qrcode';

interface SchoolSettings {
  establishmentType: string;
  nameFrench: string;
  nameEnglish: string;
  nameAbreviation: string;
  postalBox: string;
  postalBoxEn: string;
  email: string;
  logo?: string;
  universityLogo?: string;
  facultyLogo?: string;
  themeColor?: string;
  themeFont?: string;
  theme?: AttestationThemeSettingsPayload;
}

interface GenerationOptions {
  qrCodeImage?: string;
  qrCodePosition?: {
    x: number;
    y: number;
  };
  theme?: AttestationThemeSettingsPayload;
  encryptionEnabled?: boolean;
  demoMode?: boolean; // NOUVEAU: Passer explicitement le mode démo
}

/**
 * Génère le HTML pour l'attestation de réussite avec support du chiffrement compact et mode démo
 * Structure classique maintenue, seuls les éléments visuels sont personnalisables
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

  console.log(`🔄 Génération HTML attestation pour ${student.NOM} ${student.PRENOM}...`);
  
  // Sanitiser les données de l'étudiant
  const sanitizedStudent = sanitizeStudentData(student);
  console.log('🧹 Données étudiant sanitisées');
  
  // Par défaut, le chiffrement compact est activé sauf indication contraire
  const encryptionEnabled = options.encryptionEnabled !== false;
  
  // CORRECTION: Récupérer le mode démo depuis les options au lieu de localStorage
  const isDemoMode = options.demoMode === true;
  
  console.log(`🔐 Chiffrement compact: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);
  console.log(`🎭 Mode démo: ${isDemoMode ? 'Activé' : 'Désactivé'}`);

  // Utiliser le thème fourni ou celui des paramètres ou le thème par défaut
  const theme = options.theme || settings.theme || defaultAttestationTheme;
  
  // Récupérer les logos au format base64
  const schoolLogo = settings.logo || '';
  const universityLogo = settings.universityLogo || '';
  const facultyLogo = settings.facultyLogo || '';
  
  // Données de l'étudiant formatées
  const academicYear = sanitizedStudent["ANNEE ACADEMIQUE"];
  const juryDate = sanitizedStudent["DATE JURY"];
  const currentYear = new Date().getFullYear() % 100;
  
  const studentName = sanitizedStudent.NOM;
  const studentFirstname = sanitizedStudent.PRENOM;
  const studentFullName = `${studentName} ${studentFirstname}`;
  const matricule = sanitizedStudent.MATRICULE;
  const birthDate = sanitizedStudent["DATE DE NAISSANCE"];
  const birthPlace = sanitizedStudent["LIEU DE NAISSANCE"];
  
  const cycle = sanitizedStudent.CYCLE;
  const fieldOfStudy = sanitizedStudent.DOMAINE;
  const course = sanitizedStudent.PARCOURS;
  const specialization = sanitizedStudent.SPECIALITE;
  const option = sanitizedStudent.OPTION;
  
  const credits = sanitizedStudent["TOTAL CREDIT"];
  const average = typeof sanitizedStudent.MOYENNE === 'number' ? 
    sanitizedStudent.MOYENNE.toFixed(2) : String(sanitizedStudent.MOYENNE);
  const grade = sanitizedStudent.GRADE;
  const mention = sanitizedStudent.MENTION;
  const finality = sanitizedStudent["FINALITE"];

  const getCycleTranslateEn = (cycle : string) => {
    switch (cycle.toUpperCase()) {
      case "MASTER":
        return "OF MASTER'S DEGREE";
      case "LICENCE":
        return "OF BACHELOR'S DEGREE";
      case "N/D":
        return "OF STUDIES";
      default:
        return "OF STUDIES";
    }
  };

  const getCycleTranslateFr = (cycle : string) => {
    switch (cycle.toUpperCase()) {
      case "MASTER":
        return "DE MASTER";
      case "LICENCE":
        return "DE LICENCE";
      case "N/D":
        return "";
      default:
        return "";
    }
  };

  // Générer le QR code avec chiffrement compact
  let qrCodeImage = options.qrCodeImage;
  let qrCodeAnalysis = null;
  
  if (!qrCodeImage && theme.showQRCode) {
    try {
      console.log(`🔄 Génération QR Code intégré (Chiffrement compact: ${encryptionEnabled}, Mode démo: ${isDemoMode})`);
      
      qrCodeImage = await generateQrCodeBase64(sanitizedStudent, 'attestation', encryptionEnabled);
      qrCodeAnalysis = getQRCodeSizeEstimate(sanitizedStudent, 'attestation', encryptionEnabled);
      
      if (encryptionEnabled) {
        console.log('✅ QR Code avec chiffrement compact généré pour le HTML');
        console.log(`📊 Taille: ${qrCodeAnalysis.estimatedQRSize} (${qrCodeAnalysis.totalContentLength} caractères)`);
      } else {
        console.log('📋 QR Code sans chiffrement généré pour le HTML');
      }
    } catch (qrError) {
      console.error('❌ Erreur lors de la génération du QR code pour le HTML:', qrError);
      qrCodeImage = '';
    }
  }

  // Génère les styles CSS basés sur le thème - STRUCTURE CLASSIQUE MAINTENUE AVEC SUPPORT DÉMO
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

    return `
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
        font-size: ${theme.contentFontSize}px;
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

      /* Filigrane DÉMO - NOUVEAU */
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
        background: rgba(255, 0, 0, 0.8);
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
        margin-bottom: ${theme.compactMode ? '5px' : '10px'};
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

      /* Contenu principal - STRUCTURE CLASSIQUE MAINTENUE */
      .content {
        margin: ${theme.compactMode ? '5px 0' : '10px 0'};
      }
      
      .student-info, .list-nomination-header {
        margin: ${theme.compactMode ? '5px 0' : '8px 0'};
      }
      
      .student-info p, .list-nomination-header p {
        margin: ${theme.compactMode ? '5px 0' : '8px 0'};
      }

      /* Tableaux - STYLES PERSONNALISABLES */
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

      /* Section nominations - STRUCTURE CLASSIQUE MAINTENUE */
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

      /* Pied de page et signatures - STRUCTURE CLASSIQUE MAINTENUE */
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
        paddind-bottom: 100px;
      }
      
      .recteur-sign {
        margin-top: ${theme.signatureLayout === 'stacked' ? '20px' : '65px'};
        paddind-bottom: 100px;
      }

      /* QR Code - POSITION PERSONNALISABLE */
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

      /* Disclaimer - STRUCTURE CLASSIQUE MAINTENUE */
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

      /* Texte bilingue - PERSONNALISABLE */
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
        
        <!-- Filigrane IPES existant -->
        <div class="watermark">
            <img src="${settings.establishmentType === "ipes" ? schoolLogo : facultyLogo}" alt="Watermark">
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
              <h1>${theme.customTitle || `ATTESTATION DE REUSSITE ${getCycleTranslateFr(cycle)}`}</h1>
              ${theme.showBilingualText ? `<h2>${theme.customSubtitle || `ATTESTATION OF COMPLETION ${getCycleTranslateEn(cycle)}`}</h2>` : ''}
              
              <p style="margin-top: 6px"><strong>Ref N°............./${currentYear-1}/UDo/FMSP/VDRC/${settings.establishmentType === "ipes" ? settings.nameAbreviation : "SSE"}</strong></p>
            </div>
        </div>
        
        <div class="content">
            <div class="list-nomination-header">
              <p style="font-size: ${theme.contentFontSize-1}px;" id="to-hidden">${settings.convTextFr}<br>
              <em>${theme.showBilingualText ? settings.convTextFr : ''}</em></p>
              
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
              
              <p><strong>Vu le procès-verbal du jury N°0001 en date du ${juryDate} <span id="to-nothidden">atteste</span><span id="to-hidden">attestons</span> que,</strong><br>
              ${theme.showBilingualText ? `<em>Considering the jury's decision N° 0001 dated ${juryDate} Certify that,</em>` : ''}</p>
            </div> 
            <div class="student-info">
                <p>M./Mme/Mlle <strong>${studentFullName}</strong><br>
                ${theme.showBilingualText ? '<em>Mr/Mrs/Miss</em>' : ''}</p>
                
                <p>Né(e) le: <strong>${birthDate}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;à&nbsp;<strong>${birthPlace}</strong><br>
                ${theme.showBilingualText ? '<em>Born on: <strong style="opacity:0">' + birthDate + '</strong></em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<em>at:</em>' : ''}</p>
                
                <p id="to-hidden">Inscrit(e) à <strong>${settings.nameFrench}</strong> sous le matricule: <strong>${matricule}</strong><br>
                ${theme.showBilingualText ? `<em>Registered <strong>${settings.nameFrench}</strong> under the matricule number:</em>` : ''}</p>

                <p id="to-nothidden">A subi avec succès toutes les épreuves du cursus sanctionnant la fin du Cycle de : <strong>${cycle.toUpperCase()}</strong> en <strong>${specialization.toUpperCase()}</strong> ${option && option !== 'N/D' ? `option <strong>${option.toUpperCase()}</strong>` : ''}<br>
                ${theme.showBilingualText ? '<em>Having successfully fufilled the requirements qualifying for the :</em>' : ''}</p>
          
            </div>
            
            ${theme.showDomainTable ? `
            <div class="table-container">
                <table>
                    <tr>
                        <th>Domaine<br>${theme.showBilingualText ? '<em style="font-weight: normal">Domain of the study</em>' : ''}</th>
                        <th>Parcours<br>${theme.showBilingualText ? '<em style="font-weight: normal">Course</em>' : ''}</th>
                        <th>Spécialité<br>${theme.showBilingualText ? '<em style="font-weight: normal">Specialization</em>' : ''}</th>
                        <th>Option<br>${theme.showBilingualText ? '<em style="font-weight: normal">Learning option</em>' : ''}</th>
                    </tr>
                    <tr style="border-top: 1px solid ${theme.tableBorderColor}; background-color:${theme.tableHeaderBgColor}">
                        <td><strong>${fieldOfStudy}</strong></td>
                        <td><strong>${course}</strong></td>
                        <td><strong>${specialization}</strong></td>
                        <td><strong>${option}</strong></td>
                    </tr>
                </table>
            </div>
            ` : ''}
            
            ${theme.showAcademicDetails ? `
            <div class="table-container">
                <table>
                    <tr>
                        <th>Total de credits<br>${theme.showBilingualText ? '<em style="font-weight: normal">Credits earned</em>' : ''}</th>
                        <th>Moyenne<br>${theme.showBilingualText ? '<em style="font-weight: normal">Average</em>' : ''}</th>
                        <th>Mention<br>${theme.showBilingualText ? '<em style="font-weight: normal">Grade</em>' : ''}</th>
                        <th>Année académique<br>${theme.showBilingualText ? '<em style="font-weight: normal">Academic year</em>' : ''}</th>
                        <th>Finalité/Voie<br>${theme.showBilingualText ? '<em style="font-weight: normal">Finality/Vocation</em>' : ''}</th>
                    </tr>
                    <tr style="border-top: 1px solid ${theme.tableBorderColor}; background-color:${theme.tableHeaderBgColor}">
                        <td><strong>${credits}</strong></td>
                        <td><strong>${average}</strong></td>
                        <td><strong>${mention} ${grade}</strong></td>
                        <td><strong>${academicYear}</strong></td>
                        <td><strong>${finality}</strong></td>
                    </tr>
                </table>
            </div>
            ` : ''}
            
            <p>En foi de quoi la présente Attestation est délivrée pour servir et valoir ce que de droit.<br>
            ${theme.showBilingualText ? '<em>In witness where of the present testimonial is given with all the privileges there to pertaining.</em>' : ''}</p>
        </div>
        
        <div class="footer">
            <div class="signature" style="display: flex; flex-direction: column; align-items: center;">
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
            
            <div class="signature">
              <p><strong>Douala, le</strong><br>
              ${theme.showBilingualText ? '<em>Douala, the</em>' : ''}</p>
          
              <p id="to-hidden" class="recteur-sign">
              <strong>Le Recteur de l'Université de Douala</strong><br>
              ${theme.showBilingualText ? '<em>The Rector of the University of Douala</em>' : ''}</p>
              <p id="to-nothidden" class="recteur-sign">
              <strong>Le DOYEN</strong><br>
              ${theme.showBilingualText ? '<em>The DEAN</em>' : ''}</p>
            </div>
        </div>
        
        <div class="disclaimer">
            ${theme.customFooterText ? `<div>${theme.customFooterText}</div>` : `
            <div>
            ${isDemoMode ? `
            <span style="color: red; font-weight: bold;">
              ⚠️ DOCUMENT GÉNÉRÉ EN MODE DÉMO - NON OFFICIEL ⚠️
            </span><br>
            ` : ''}
                Cette Attestation ne tient pas lieu de Diplôme et n'est délivrée qu'en un seul exemplaire et d'une validité de (6) mois à partir de la date de signature. Le Diplôme lui sera délivré ultérieurement
            </div>
            ${theme.showBilingualText ? `
            <div>
                <em>Only one copy of this Attestation shall be delivered and is not a certificate. This Attestation is valid for (6) six months from the date of signature. The Certificate will be issued at a later date.</em>
            </div>
            ` : ''}
            `}
        </div>
    </div>
</body>
</html>
  `;
  
  console.log(`✅ HTML généré avec succès pour ${studentFullName}`);
  console.log(`🔐 Chiffrement compact: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);
  console.log(`📋 QR Code inclus: ${qrCodeImage ? 'Oui' : 'Non'}`);
  console.log(`🎭 Mode démo: ${isDemoMode ? 'Activé (filigrane ajouté)' : 'Désactivé'}`);
  
  if (qrCodeAnalysis) {
    console.log(`📊 Performance QR: ${qrCodeAnalysis.estimatedQRSize} (${qrCodeAnalysis.totalContentLength} caractères)`);
  }
  
  return html;
}