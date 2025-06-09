// src/lib/pdfGenerator.ts - Version corrigée sans localStorage dans le main process

import { StudentRecord } from "../types/student";
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ipcMain } from 'electron';
import QRCode from 'qrcode';
import { getCompleteTheme } from './form-schemas/settings';
import { ThemeSettingsPayload } from './form-schemas/theme-settings';

// Importer directement depuis html-to-pdf.ts
import { generateAttestationPDF } from './attestation-generator/html-to-pdf';

// NOUVEAU: Importer les fonctions de chiffrement compact pour les relevés
import { sanitizeStudentData, generateQrCodeBase64, getQRCodeSizeEstimate } from './helpers/qrcode';

interface TranscriptSettingsPayload {
  establishmentType: string;
  nameFrench: string;
  nameEnglish: string;
  nameAbreviation: string;
  postalBox: string;
  postalBoxEn: string;
  email: string;
  logo: string;
  universityLogo: string;
  facultyLogo: string;
  themeColor: string;
  themeFont: string;
  theme?: ThemeSettingsPayload;
  encryptionEnabled?: boolean;
  demoMode?: boolean; // NOUVEAU: Passer explicitement le mode démo
}

interface GeneratePDFParams {
  student: StudentRecord;
  settings: TranscriptSettingsPayload;
}

interface GenerateAttestationParams {
  student: any;
  settings: any;
  options: {
    demoMode?: boolean;
    qrCodePosition?: { x: number; y: number };
    theme?: any;
    qrCodeImage?: string;
    encryptionEnabled?: boolean;
  };
}

// Génère les styles CSS basés sur les paramètres du thème
function generateThemeStyles(params: GeneratePDFParams): string {
  const theme = getCompleteTheme(params.settings);
  
  // CORRECTION: Récupérer le mode démo depuis les paramètres au lieu de localStorage
  const isDemoMode = params.settings.demoMode === true;
  
  return `
    @page {
      size: A4;
      margin: 0;
    }
    body {
      font-family: ${theme.mainFont};
      width: 200mm;
      min-height: 287mm;
      box-sizing: border-box;
      background-color: white;
      margin: 5mm;
      border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.primaryColor};
      color: ${theme.primaryColor};
      position: relative;
      overflow: hidden;
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
        transparent 80px,
        rgba(255, 0, 0, 0.08) 80px,
        rgba(255, 0, 0, 0.08) 100px
      );
    }
    
    .demo-watermark::before {
      content: "DÉMO";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      font-weight: bold;
      color: rgba(255, 0, 0, 0.12);
      font-family: Arial, sans-serif;
      letter-spacing: 15px;
    }
    
    .demo-watermark::after {
      content: "MODE DÉMO - DOCUMENT NON OFFICIEL";
      position: absolute;
      bottom: 25%;
      left: 50%;
      transform: translate(-50%, 0) rotate(-45deg);
      font-size: 18px;
      font-weight: bold;
      color: rgba(255, 0, 0, 0.15);
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
      padding: 3px;
      font-size: 10px;
      font-weight: bold;
      z-index: 1001;
      display: ${isDemoMode ? 'block' : 'none'};
    }

    /* Badge démo sur le QR code */
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
    }
    
    /* ... tous les autres styles existants ... */
    
    .header {    
      line-height: normal;
      font-size: ${theme.headerFontSize}px;
      font-family: ${theme.headerFont};
    }
    
    .watermark {
      position: absolute;
      top: 25%;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      display: ${theme.showWatermark ? 'flex' : 'none'};
      justify-content: center;
      align-items: center;
      opacity: ${isDemoMode ? theme.watermarkOpacity * 0.5 : theme.watermarkOpacity};
      pointer-events: none;
    }
    
    .watermark img {
      width: 600px;
      height: auto;
    }
    
    .qr-code {
      width: 100px;
      height: 100px;
      display: ${theme.showQRCode ? 'block' : 'none'};
      position: relative;
    }
    
    /* Style spécial pour le texte en mode démo */
    ${isDemoMode ? `
    .student-info p, .table td, .table th {
      position: relative;
    }
    
    .student-info p::after, .table td::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="20" fill="rgba(255,0,0,0.1)" transform="rotate(-45 50 50)">DÉMO</text></svg>');
      pointer-events: none;
    }
    ` : ''}
    
    /* Impression avec filigrane démo */
    @media print {
      .demo-watermark,
      .demo-banner,
      .qr-demo-badge {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    
    /* ... reste des styles CSS existants ... */
    .header-row1{
      text-align: center;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }
    .header h1 {
      font-size: ${theme.titleFontSize}px;
    }
    .student_block1 {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }
    .student_block1,
    .student-info {
      width: 90%;
      margin-left: auto;
      margin-right: auto;
      font-size: ${theme.contentFontSize}px;
      line-height: 0px;
      gap: 10px;
    }
    .student-info {
      display: ${theme.studentInfoLayout === 'grille' ? 'grid' : 
                theme.studentInfoLayout === 'colonnes' ? 'flex' : 'block'};
      ${theme.studentInfoLayout === 'grille' ? 'grid-template-columns: 1fr 1fr 1fr;' : 
        theme.studentInfoLayout === 'colonnes' ? 'flex-direction: column;' : ''}
      margin-bottom: 20px;
    }
    .student-info p {
      font-size: ${theme.contentFontSize}px;
    }
    table {
      margin-left: auto;
      margin-right: auto;
      width: 96%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: ${theme.contentFontSize}px;
    }
    th, td {
      border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.tableBorderColor};
      padding: ${theme.tableCellPadding}px;
      text-align: left;
    }
    th {
      background-color: ${theme.tableHeaderBgColor};
    }
    
    /* Styles spécifiques pour les UE validées si l'option est activée */
    ${theme.highlightValidatedUE ? `
    tr.validated-ue {
      background-color: rgba(0, 128, 0, 0.1);
    }
    ` : ''}
    
    .grade-scale {
      display: ${theme.showGradeScale ? 'flex' : 'none'};
      font-size: ${theme.footerFontSize}px;
      float: left;
      margin-left: 20px;
      width: 50%;
    }
    .grade-scale table {
      witdth: 30%;
      margin-right : 10px;
    }
    .grade-scale div {
      display: inline-block;
    }
    
    /* Styles des signatures basés sur le thème */
    .signature-ipes{
      width: 50%;
      margin-left: 40px;
      font-size: ${theme.contentFontSize + 2}px;
      ${theme.signatureStyle === 'encadré' ? 'border: 1px solid ' + theme.primaryColor + '; padding: 10px;' : ''}
      ${theme.signatureStyle === 'souligné' ? 'border-bottom: 2px solid ' + theme.primaryColor + ';' : ''}
    }
    .signature {
      margin-top: 30px;
      float: right;
      text-align: left;
      font-size: ${theme.contentFontSize + 2}px;
      margin-right: 20px;
      ${theme.signatureStyle === 'encadré' ? 'border: 1px solid ' + theme.primaryColor + '; padding: 10px;' : ''}
      ${theme.signatureStyle === 'souligné' ? 'border-bottom: 2px solid ' + theme.primaryColor + ';' : ''}
    }

    #to-hidden{
     ${params.settings.establishmentType !== "ipes" ? 'display : none' : ''};
    }
     #to-nothidden{
    ${params.settings.establishmentType === "ipes" ? 'display : none' : ''};
    }
    
    /* Adaptation de la mise en page de l'en-tête basée sur le thème */
    .header-content{
      width: ${theme.headerLayout === 'standard' ? '35%' : 
               theme.headerLayout === 'compact' ? '30%' : '40%'};
    }
    .header-logo-content{
      align-content: center;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-logo-content > div{
      width: 100%;
      height: 100%;
      align-items: center;
      align-content: center;
    }
    .header-row2 h1{
      font-weight: ${theme.headerLayout === 'compact' ? '400' : '100'};
      text-align: center;
      font-size: ${theme.titleFontSize}px;
      color: ${theme.accentColor};
    }
    .header-row2 p{
      font-size: ${theme.contentFontSize + 2}px;
    }
    .header-row2{
      text-align: center;
    }
    td{
      text-align: center;
    }
    .table{
      padding-left: 20px;
    }
    .table-head th{
      text-align: center;
    }
    .table-ue-code, .table-ue-label, .table-ue-avearage{
      font-weight: bold;
    }
    .table-ec{
      text-align: left;
    }
    .grade-sign{
      display: flex;
      justify-content: start;
      width: 96%;
      margin: 0 auto;
    }
    .grade-sign th, .grade-sign td{
      width:30px;
      padding: 1px;
      border: 0.5px solid ${theme.tableBorderColor};
    }
    body > .container{
      position: relative;
    }
    .footer-note {
      position: absolute;
      width: 100%;
      bottom: 10px;
      font-size: ${theme.footerFontSize}px;
      text-align: center;
      margin-top: 20px;
      padding-top: 10px;
      font-style: italic;
    }
    
    /* Styles supplémentaires pour les en-têtes */
    .header-title {
      color: ${theme.accentColor};
    }
    
    /* Styles pour les mentions validées/non validées */
    .validated {
      color: ${theme.accentColor};
      font-weight: bold;
    }
    .not-validated {
      color: #cc0000;
    }
  `;
}

// Create HTML template for the transcript based on the provided model
async function createTranscriptHTML({ student, settings }: GeneratePDFParams): Promise<string> {
  // Helper function to ensure values are always numbers
  function ensureNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'object') {
      // Si c'est un objet Map ou un autre type d'objet, essayez d'extraire une valeur numérique
      if (value.toString() === '[object Map]') {
        // Si c'est une Map, utilisez la première valeur ou 0
        return value.size > 0 ? ensureNumber(Array.from(value.values())[0]) : 0;
      }
      
      // Pour d'autres objets, essayez de voir s'ils ont une propriété numérique
      for (const key in value) {
        if (typeof value[key] === 'number') return value[key];
      }
    }
    return 0;
  }

  // Récupération des paramètres de thème
  const theme = getCompleteTheme(settings);

  // CORRECTION: Récupérer le mode démo depuis les paramètres au lieu de localStorage
  const encryptionEnabled = settings.encryptionEnabled !== false;
  const isDemoMode = settings.demoMode === true;
  
  console.log(`🔐 Génération du relevé avec chiffrement compact: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);
  console.log(`🎭 Mode démo: ${isDemoMode ? 'Activé' : 'Désactivé'}`);

  // Calculate semester statistics first
  const uniqueUEs = new Set();
  const ueData = new Map();
  const ueValidatedCredits = new Map();

  // Première étape : regrouper les EC par UE et calculer les moyennes des UE
  student.COURSES?.forEach(course => {
    const ueCode = course.CODE;
    
    if (!ueValidatedCredits.has(ueCode)) {
      const ecNotes = student.COURSES
        .filter(c => c.CODE === ueCode)
        .map(c => c.NOTE);
      
      const ueAverage = course.UE_AVERAGE || 0;
      const hasFailingEC = ecNotes.some(note => note <= 6);
      const isUEValidated = ueAverage >= 10 && !hasFailingEC;
      
      // Stocker si l'UE est validée ou non et ses informations
      ueValidatedCredits.set(ueCode, {
        isValidated: isUEValidated,
        credits: course.UE_CREDIT || 0,
        average: ueAverage
      });
    }
  });

  // Deuxième étape : calcul des crédits validés et de la moyenne du semestre
  let totalCreditsValidated = 0;
  let weightedSum = 0;

  ueValidatedCredits.forEach((ueInfo, ueCode) => {
    // Utilisez ensureNumber pour garantir que vous travaillez avec des nombres
    const credits = ensureNumber(ueInfo.credits);
    const average = ensureNumber(ueInfo.average);
    
    // Pour la formule de moyenne, on considère toutes les UE, validées ou non
    weightedSum += average * credits;
    
    // Mais pour le total des crédits validés, on ne compte que les UE validées
    if (ueInfo.isValidated) {
      totalCreditsValidated += credits;
    }
  });

  const totalSemesterCredits = ensureNumber(student.TOTAL_CREDITS) || 30;
  const semesterAverage = weightedSum / totalSemesterCredits;
  const mgp = calculateMGP(semesterAverage);
  const grade = getGradeFromAverage(semesterAverage);

  // Un semestre est validé si on obtient au moins 70% des crédits (règle LMD standard)
  // ou selon la règle spécifique de l'institution
  const isEnoughCredits = totalCreditsValidated >= (totalSemesterCredits * 0.7);
  const decision = isEnoughCredits ? "SEMESTRE VALIDE" : "SEMESTRE NON VALIDE";

  // NOUVEAU: Générer le QR code avec chiffrement compact si activé
  let qrCodeDataUrl = "";
  if (theme.showQRCode) {
    try {
      console.log(`🔄 Génération QR Code pour relevé (Chiffrement: ${encryptionEnabled}, Mode démo: ${isDemoMode})`);
      
      // Créer un objet étudiant compatible avec le système de chiffrement compact
      const studentForQR = {
        ETABLISSEMENT: settings.nameFrench || 'N/D',
        NOM: student.NOM,
        PRENOM: student.PRENOM,
        MATRICULE: student.MATRICULE,
        "DATE DE NAISSANCE": student["DATE DE NAISSANCE"] || 'N/D',
        "LIEU DE NAISSANCE": student["LIEU DE NAISSANCE"] || 'N/D',
        NIVEAU: student.NIVEAU || 'N/D',
        SEMESTRE: student.SEMESTRE || 'N/D',
        CYCLE: student.CYCLE || 'N/D',
        FILIERE: student.FILIERE || 'N/D',
        "ANNEE ACADEMIQUE": student["ANNEE ACADÉMIQUE"] || 'N/D',
        MOYENNE: semesterAverage,
        GRADE: grade,
        MENTION: getMention(semesterAverage)
      };

      // Sanitiser les données
      const sanitizedStudent = sanitizeStudentData(studentForQR);
      
      // Générer le QR code avec chiffrement compact
      qrCodeDataUrl = await generateQrCodeBase64(sanitizedStudent, 'releve', encryptionEnabled);
      
      if (encryptionEnabled) {
        console.log('✅ QR Code avec chiffrement compact généré pour le relevé');
        
        // Analyser la taille du QR code
        const sizeAnalysis = getQRCodeSizeEstimate(sanitizedStudent, 'releve', encryptionEnabled);
        console.log(`📊 Taille QR pour relevé: ${sizeAnalysis.estimatedQRSize} (${sizeAnalysis.totalContentLength} caractères)`);
      } else {
        console.log('📋 QR Code sans chiffrement généré pour le relevé');
      }
    } catch (qrError) {
      console.error('❌ Erreur lors de la génération du QR code pour le relevé:', qrError);
      
      // Fallback vers l'ancien système si le nouveau échoue
      const qrData = `Établissement: ${settings.nameFrench}
Nom: ${student.NOM}
Prénom: ${student.PRENOM}
Matricule: ${student.MATRICULE}
Date de naissance: ${student["DATE DE NAISSANCE"]}
Lieu de naissance: ${student["LIEU DE NAISSANCE"]}
Niveau: ${student.NIVEAU}
Semestre: ${student.SEMESTRE.split(" ")[1]}
Moyenne: ${semesterAverage.toFixed(2)}
Grade: ${grade}
Mention: ${getMention(semesterAverage)}
Année académique: ${student["ANNEE ACADÉMIQUE"]}`;
      
      qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 150
      });
      
      console.log('⚠️ QR Code généré en mode fallback (ancien système)');
    }
  }
  
  // Helper function to generate course rows
  const generateCourseRows = () => {
    if (!student.COURSES || student.COURSES.length === 0) return '';
    
    let html = '';
    let currentUECode = '';
    let ueElements = [];
    let ueCredit = 0;
    
    student.COURSES.forEach((course, index) => {
      // Utiliser le CODE explicite du cours qui contient le code UE
      const ueCode = course.CODE || '';
      const ueTitle = course.INTITULE || '';
      
      // Check if this is a new UE or continuation of previous UE
      if (ueCode !== currentUECode) {
        // If we have accumulated elements for a previous UE, output them
        if (ueElements.length > 0) {
          // Utiliser la moyenne UE pré-calculée
          const ueAverage = ueElements[0].ueAverage;
          
          // Check if any EC has a note of 6 or less
          const hasFailingEC = ueElements.some(ec => ec.note <= 6);
          
          // Determine if UE is validated (average >= 10 AND no EC with note <= 6)
          const isUEValidated = ueAverage >= 10 && !hasFailingEC;
          
          // Apply credits only if UE is validated
          // CORRECTION ICI: Assurez-vous que ueCredit est un nombre
          const creditValue = typeof ueCredit === 'number' ? ueCredit : 
                             (typeof ueCredit === 'string' ? parseFloat(ueCredit) : 0);
          
          const ueValidatedCredits = isUEValidated ? creditValue : 0;
          
          html += generateUERowsHTML(currentUECode, ueElements[0].title, ueElements, ueAverage, ueValidatedCredits, isUEValidated);
          ueElements = [];
        }
        
        currentUECode = ueCode;
        // Récupérer le crédit associé à l'UE
        // CORRECTION ICI: Convertir explicitement en nombre
        ueCredit = typeof course.UE_CREDIT === 'number' ? course.UE_CREDIT : 
                  (typeof course.UE_CREDIT === 'string' ? parseFloat(course.UE_CREDIT) : 0);
      }
      
      // Add this course as an element of the current UE
      ueElements.push({
        title: ueTitle,
        name: course.EC_TITRE || '',
        note: course.NOTE || 0,
        ueAverage: course.UE_AVERAGE || 0 // Utiliser la moyenne UE pré-calculée
      });
    });
    
    // Don't forget to output the last UE
    if (ueElements.length > 0) {
      const ueAverage = ueElements[0].ueAverage;
      
      // Check if any EC has a note of 6 or less
      const hasFailingEC = ueElements.some(ec => ec.note <= 6);
      
      // Determine if UE is validated (average >= 10 AND no EC with note <= 6)
      const isUEValidated = ueAverage >= 10 && !hasFailingEC;
      
      // CORRECTION ICI: Assurez-vous que ueCredit est un nombre
      const creditValue = typeof ueCredit === 'number' ? ueCredit : 
                         (typeof ueCredit === 'string' ? parseFloat(ueCredit) : 0);
      
      const ueValidatedCredits = isUEValidated ? creditValue : 0;
      
      html += generateUERowsHTML(currentUECode, ueElements[0].title, ueElements, ueAverage, ueValidatedCredits, isUEValidated);
    }
    
    return html;
  };

  const generateUERowsHTML = (ueCode, ueTitle, elements, average, credit, isUEValidated) => {
    const creditValue = ensureNumber(credit);
    const cssClass = theme.highlightValidatedUE && isUEValidated ? 'validated-ue' : '';
    
    if (elements.length === 1) {
      // Single element UE
      return `
        <tr class="${cssClass}">
          <td class="table-code"><strong>${ueCode}</strong></td>
          <td colspan="3" class="table-ue"><strong>${ueTitle}</strong></td>
          <td colspan="3" class="table-ec">${elements[0].name}</td>
          <td colspan="2" class="table-note">${elements[0].note.toFixed(2)}</td>
          <td class="table-average"><strong>${average.toFixed(2)}</strong></td>
          <td class="table-credit">${creditValue}</td>
        </tr>
      `;
    } else {
      // Multiple elements UE
      let html = `
        <tr class="${cssClass}">
          <td rowspan="${elements.length}" class="table-code"><strong>${ueCode}</strong></td>
          <td colspan="3" rowspan="${elements.length}" class="table-ue"><strong>${ueTitle}</strong></td>
          <td colspan="3" class="table-ec">${elements[0].name}</td>
          <td colspan="2" class="table-note">${elements[0].note.toFixed(2)}</td>
          <td rowspan="${elements.length}" class="table-average"><strong>${average.toFixed(2)}</strong></td>
          <td rowspan="${elements.length}" class="table-credit">${creditValue}</td>
        </tr>
      `;
      
      // Add rows for remaining elements
      for (let i = 1; i < elements.length; i++) {
        html += `
          <tr class="${cssClass}">
            <td colspan="3" class="table-ec">${elements[i].name}</td>
            <td colspan="2" class="table-note">${elements[i].note.toFixed(2)}</td>
          </tr>
        `;
      }
      
      return html;
    }
  };

  // Convert logos to base64
  const universityLogoBase64 = settings.universityLogo;
  const facultyLogoBase64 = settings.facultyLogo;
  
  const currentYear = new Date().getFullYear() % 100;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relevé de Notes - ${student.NOM} ${student.PRENOM}</title>
        <style>
            ${generateThemeStyles({ student, settings })}
        </style>
    </head>
    <body>
        <div class="container">
            ${isDemoMode ? `
            <!-- Bannière mode démo -->
            <div class="demo-banner">
              ⚠️ MODE DÉMO - RELEVÉ NON OFFICIEL - FONCTIONNALITÉS LIMITÉES ⚠️
            </div>
            
            <!-- Filigrane mode démo -->
            <div class="demo-watermark"></div>
            ` : ''}
            
            <!-- IPES Logo Watermark -->
            <div class="watermark">
                <img src="${settings.establishmentType === "ipes" ? settings.logo : facultyLogoBase64}" alt="Watermark">
            </div>
            
            <div class="header">
                <div class="header-row1">
                    <div class="header-content">
                        <p>REPUBLIQUE DU CAMEROUN <br>
                        <em>Paix – Travail – Patrie</em><br>
                        ********************<br>
                        MINISTERE DE L'ENSEIGNEMENT SUPERIEUR<br>
                        ********************<br>
                        <strong>UNIVERSITE DE DOUALA</strong><br>
                        <span id="to-hidden">********************<br>
                        <strong>FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES</strong><br>
                        ********************<br>
                        B.P 2701, Douala, Cameroun<br>
                        Email: <a href="mailto:contact@fmsp-udo.cm">contact@fmsp-udo.cm</a><br>
                        ********************<br>
                        <strong>${
                          settings.nameFrench
                            .split(" ")
                            .map((w, i) => (i > 0 && i % 4 === 0 ? "<br>" + w : w))
                            .join(" ")
                        }</strong><br>
                        ********************<br>
                        B.P ${settings.postalBox}<br>
                        Email: <a href="mailto:${settings.email}">${settings.email}</a></p></span>
                    </div>
                    <div class="header-logo-content">
                        <div>
                          ${universityLogoBase64 ? `<img src="${universityLogoBase64}" alt="University Logo" height="70">` : 
                            '<div style="height: 70px; border: 1px solid black;"> University Logo</div>'}
                        </div>
                        <div>
                          ${facultyLogoBase64 ? `<img src="${facultyLogoBase64}" alt="Faculty Logo" height="50" style="margin: 5px;">` : 
                            '<div style="height: 50px; border: 1px solid black; margin: 5px;"> Faculty Logo</div>'}
                        </div>
                        <div id="to-hidden">
                          ${settings.logo ? `<img src="${settings.logo}" alt="IPES Logo" height="50">` : 
                            '<div style="height: 50px; border: 1px solid black;"> IPES Logo</div>'}
                        </div>
                    </div>
                    <div class="header-content">
                        <p>REPUBLIC OF CAMEROON<br>
                        <em>Peace – Work - Fatherland</em><br>
                        ********************<br>
                        MINISTRY OF HIGHER EDUCATION<br>
                        ********************<br>
                        <strong>THE UNIVERSITY OF DOUALA</strong><br>
                        <span id="to-hidden">********************<br>
                        <strong>FACULTY OF MEDICINE AND<br>PHARMACEUTICAL SCIENCES</strong><br>
                        ********************<br>
                        PO box 2701, Douala, Cameroon<br>
                        Email: <a href="mailto:contact@fmsp-udo.cm">contact@fmsp-udo.cm</a><br>
                        ********************<br>
                        <strong>${
                          settings.nameEnglish
                            .split(" ")
                            .map((w, i) => (i > 0 && i % 4 === 0 ? "<br>" + w : w))
                            .join(" ")
                        }</strong><br>
                        ********************<br>
                        PO box ${settings.postalBoxEn}<br>
                        Email: <a href="mailto:${settings.email}">${settings.email}</a></p></span>   
                    </div>
                </div>
                <div class="header-row2">
                <span id="to-nothidden">
                    <h2 class="header-title"><strong>FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES</strong><br>
                    <strong><em>FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES</em></strong><br>
                    <h4 class="header-title"><strong>B.P. 2701. e-mail : <em><a href="mailto:contact@fmsp-udo.cm">contact@fmsp-udo.cm</a></em></strong></h4></h2></span>
                    <h1 class="header-title"><strong>RELEVE DE NOTES</strong> / TRANSCRIPT</h1>
                    <p><strong>Ref No</strong>&nbsp;&nbsp;  /${currentYear}/UDo/FMSP/VDPSAA/VDSSE/VDRC/CDAASSR/${settings.establishmentType === "ipes" ? settings.nameAbreviation : "SSE"}</p>
                </div>
            </div>
        
            <div class="student_block1">
                <div>
                    <p><span>NOM ET PRENOM:</span> <strong>${student.NOM.toUpperCase()} ${student.PRENOM.toUpperCase()}</strong></p>
                    <p><em>surname and name:</em></p>
                </div>
                <div>
                    <p><strong>MATRICULE:</strong> <strong>${student.MATRICULE.toUpperCase()}</strong></p>
                    <p><em>Registration N°:</em></p>
                </div>
            </div>
            <div class="student-info">
                <div>
                    <p><strong>NÉ(E) LE: ${student["DATE DE NAISSANCE"]|| "N/D"}</strong></p>
                    <div><em>Born on:</em></div>
                </div>
                <div>
                    <p><strong>A:</strong> <strong>${student["LIEU DE NAISSANCE"].toUpperCase() || ""}</strong></p>
                    <div><em>At:</em></div>
                </div>
                <div></div>
                <div>
                    <p><strong>CYCLE:</strong> <strong>${student.CYCLE.toUpperCase() || "N/D"}</strong></p>
                    <div><em>Training cycle:</em></div>
                </div>
                <div>
                    <p><strong>ANNÉE ACADÉMIQUE:</strong> <strong>${student["ANNEE ACADÉMIQUE"] || "N/D"}</strong></p>
                    <div><em>Academic Year:</em></div>
                </div>
                <div>
                    <p><strong>FILIÈRE:</strong> <strong>${student.FILIERE.toUpperCase() || "N/D"}</strong></p>
                    <div><em>Field of Study:</em></div>
                </div>
                <div>
                    <p><strong>NIVEAU:</strong> <strong>${student.NIVEAU || "N/D"}</strong></p>
                    <div><em>Level:</em></div>
                </div>
                <div>
                    <p><strong>SEMESTRE:</strong> <strong>${student.SEMESTRE ? (student.SEMESTRE.split(" ")[1] || "N/D") : "N/D"}</strong></p>
                    <div><em>Semester:</em></div>
                </div>
                <div>
                    <p><strong>OPTION:</strong> <strong>${student.OPTION.toUpperCase() || "N/D"}</strong></p>
                    <div><em>Option:</em></div>
                </div>
            </div>
        
            <div class="table">
                <table>
                    <thead>
                        <tr class="table-head">
                            <th class="table-code">CODE</th>
                            <th colspan="3" class="table-ue">UNITE D'ENSEIGNEMENT</th>
                            <th colspan="3" class="table-ec">ELEMENT CONSTITUTIF</th>
                            <th colspan="2" class="table-note">NOTE/20</th>
                            <th class="table-average">MOYENNE</th>
                            <th class="table-credit">CREDIT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateCourseRows()}
                        <tr class="table-summary">
                            <td colspan="11">&nbsp;</td>
                        </tr>
                        <tr class="table-footer">
                            <td class="summary-label">RELEVE NIVEAU</td>
                            <td class="summary-label">SEMESTRE</td>
                            <td class="summary-label">TOTAL CREDIT / 30</td>
                            <td colspan="2" class="summary-label">MOYENNE SEMESTRIELLE / 20</td>
                            <td class="summary-label">MGP</td>
                            <td colspan="2" class="summary-label">GRADE</td>
                            <td colspan="3" class="summary-label">DECISION DU JURY</td>
                        </tr>
                        <tr class="table-footer-values">
                            <td class="summary-value"><strong>${student.NIVEAU || "1"}</strong></td>
                            <td class="summary-value"><strong>${student.SEMESTRE ? (student.SEMESTRE.split(" ")[1] || "1") : "1"}</strong></td>
                            <td class="summary-value"><strong>${totalCreditsValidated}</strong></td>
                            <td colspan="2" class="summary-value"><strong>${semesterAverage.toFixed(2)}</strong></td>
                            <td class="summary-value"><strong>${mgp.toFixed(1)}</strong></td>
                            <td colspan="2" class="summary-value"><strong>${grade}</strong></td>
                            <td colspan="3" class="summary-value ${decision === "SEMESTRE VALIDE" ? "validated" : "not-validated"}"><strong>${decision}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="grade-sign">
                <div class="grade-scale">
                    <!-- ... tableau des grades existant ... -->
                    <div>
                    <table style="table-layout: auto;">
                            <tbody style="font-size: 6px;">
                            <tr>
                                <td><strong>Grade</strong></td>
                                <td><strong>Note/4</strong></td>
                                <td><strong>Appréciation</strong></td>
                                <td><strong>Moy /20</strong></td>
                            </tr>
                            <tr>
                                <td><strong>A+</strong></td>
                                <td><strong>4.0</strong></td>
                                <td><strong>Excellent</strong></td>
                                <td><strong>[18-20]</strong></td>
                            </tr>
                            <tr>
                                <td><strong>A</strong></td>
                                <td><strong>3.7</strong></td>
                                <td><strong>Très Bien</strong></td>
                                <td><strong>[16-18[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>B+</strong></td>
                                <td><strong>3.3</strong></td>
                                <td><strong>Bien</strong></td>
                                <td><strong>[14-16[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>B</strong></td>
                                <td><strong>3</strong></td>
                                <td><strong>Assez Bien</strong></td>
                                <td><strong>[13-14[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>B-</strong></td>
                                <td><strong>2.7</strong></td>
                                <td><strong>Assez Bien</strong></td>
                                <td><strong>[12-13[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>C+</strong></td>
                                <td><strong>2.3</strong></td>
                                <td><strong>Passable</strong></td>
                                <td><strong>[11-12[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>C</strong></td>
                                <td><strong>2.0</strong></td>
                                <td><strong>Passable</strong></td>
                                <td><strong>[10-11[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>C-</strong></td>
                                <td><strong>1.7</strong></td>
                                <td><strong>Insuffisant</strong></td>
                                <td><strong>[09-10[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>D</strong></td>
                                <td><strong>1.3</strong></td>
                                <td><strong>Faible</strong></td>
                                <td><strong>[08-09[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>E</strong></td>
                                <td><strong>1.0</strong></td>
                                <td><strong>Très Faible</strong></td>
                                <td><strong>[06-08[</strong></td>
                            </tr>
                            <tr>
                                <td><strong>F</strong></td>
                                <td><strong>0.0</strong></td>
                                <td><strong>Nul</strong></td>
                                <td><strong>[00-06[</strong></td>
                            </tr>
                        </tbody>
                    </table>        
                </div>
                    
                    <!-- QR Code avec badge démo si nécessaire -->
                    <div style="position: relative;">
                        ${qrCodeDataUrl ? `
                          <img src="${qrCodeDataUrl}" alt="QR Code ${encryptionEnabled ? '(Chiffrement Compact)' : '(Standard)'}" class="qr-code">
                          ${isDemoMode ? '<div class="qr-demo-badge">DÉMO</div>' : ''}
                        ` : ''}
                    </div>
                </div>
                
                <div class="signature">
                    <div><strong>Douala, le</strong> 
                    <br/><i>Douala, the</i></div><br/>

                    <div><strong>Le Doyen FMSP</strong>
                    <br/><i>The Dean FMSP</i></div>
                </div>
            </div>

            <div id="to-hidden" class="signature-ipes"><strong>Le Directeur de L'${settings.nameFrench.length >= 30 ? settings.nameAbreviation : settings.nameFrench}</strong>
            <br/><i>The Director of ${settings.nameFrench.length >= 30 ? settings.nameAbreviation : settings.nameEnglish}</i></div>
            </div>
            
            <!-- Footer note avec mention démo si nécessaire -->
            <div class="footer-note">
                ${isDemoMode ? `
                <div style="color: red; font-weight: bold; margin-bottom: 5px;">
                  ⚠️ DOCUMENT GÉNÉRÉ EN MODE DÉMO - NON OFFICIEL ⚠️
                </div>
                ` : ''}
                Il n'est délivré qu'un seul exemplaire de relevé de note, le titulaire peut en faire des copies certifiées conformes.<br>
                This transcript is delivered only once, the owner can do many certified copies as necessary
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Generate a PDF transcript using Electron's built-in PDF generation capabilities
 */
export async function generateTranscriptPDF(params: GeneratePDFParams): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🔄 Début de la génération PDF de relevé avec chiffrement:', params.settings.encryptionEnabled);
      console.log('🎭 Mode démo PDF:', params.settings.demoMode);
      
      // Create a temporary HTML file with the transcript content
      const html = await createTranscriptHTML(params);
      const tempDir = app.getPath('temp');
      const timestamp = Date.now();
      const studentId = `${params.student.NOM}_${params.student.PRENOM}_${params.student.MATRICULE}`.replace(/[^a-zA-Z0-9]/g, '_');
      const htmlPath = path.join(tempDir, `transcript-${studentId}-${timestamp}.html`);
      
      // Write HTML to temp file
      fs.writeFileSync(htmlPath, html);
      console.log(`📄 Fichier HTML temporaire créé: ${htmlPath}`);
      
      // Create a hidden browser window
      const win = new BrowserWindow({
        width: 595, // A4 width in pixels at 72 DPI
        height: 842, // A4 height in pixels at 72 DPI
        show: false, // Keep window hidden
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      
      // Load the HTML file
      await win.loadFile(htmlPath);
      
      // Wait for content to load completely
      // Plus de temps pour les QR codes chiffrés et le mode démo
      const loadingDelay = params.settings.encryptionEnabled || params.settings.demoMode ? 2000 : 1000;
      await new Promise(resolve => setTimeout(resolve, loadingDelay));
      console.log(`⏱️ Attente de ${loadingDelay}ms pour le chargement complet du relevé`);
      
      // Generate PDF
      console.log('🔄 Génération du PDF de relevé...');
      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        pageRanges: '1-1',
        margins: {
          top: 0.4,
          bottom: 0.4,
          left: 0.4,
          right: 0.4
        }
      });
      
      // Close the window
      win.close();
      
      // Clean up temp HTML file
      try {
        fs.unlinkSync(htmlPath);
        console.log('🧹 Fichier HTML temporaire supprimé');
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary HTML file:', cleanupError);
        // Continue execution even if cleanup fails
      }

      const resultData = Buffer.from(pdfData);
      console.log(`✅ PDF de relevé généré avec succès`);
      console.log(`📊 Taille: ${resultData.byteLength} bytes`);
      console.log(`🔐 Chiffrement QR: ${params.settings.encryptionEnabled ? 'Activé' : 'Désactivé'}`);
      console.log(`🎭 Mode démo: ${params.settings.demoMode ? 'Activé (filigrane)' : 'Désactivé'}`);
      
      // Resolve with the PDF data
      resolve(resultData);
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF de relevé:', error);
      reject(error);
    }
  });
}

export function setupPDFGenerationHandlers() {
  // Set up IPC handler for PDF generation
  ipcMain.handle('render-transcript-html', async (_, params) => {
    try {
      console.log('🔄 Rendu HTML de relevé avec chiffrement:', params.settings?.encryptionEnabled);
      console.log('🎭 Rendu HTML mode démo:', params.settings?.demoMode);
      const html = await createTranscriptHTML(params);
      return html;
    } catch (error) {
      console.error('Error generating HTML:', error);
      throw error;
    }
  });
  
  ipcMain.handle('generate-transcript-pdf', async (_, params: GeneratePDFParams) => {
    try {
      console.log('🔄 Génération PDF de relevé avec chiffrement:', params.settings?.encryptionEnabled);
      console.log('🎭 Génération PDF mode démo:', params.settings?.demoMode);
      return await generateTranscriptPDF(params);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  });

 ipcMain.handle('render-attestation-html', async (_, params) => {
  try {
    console.log('🔄 Rendu HTML d\'attestation avec chiffrement:', params.options?.encryptionEnabled);
    console.log('🎭 Rendu HTML attestation mode démo:', params.options?.demoMode);
    // Au lieu d'utiliser require, qui peut causer des problèmes,
    // importons le module de manière dynamique avec la syntaxe import()
    const attestationModule = await import('./attestation-generator/html-generator');
    const html = await attestationModule.generateAttestationHTML(
      params.student, 
      params.settings, 
      params.options
    );
    return html;
  } catch (error) {
    console.error('Error generating attestation HTML:', error);
    throw error;
  }
});
  
  ipcMain.handle('generate-attestation-pdf', async (_, params: GenerateAttestationParams) => {
    try {
      console.log('🔄 Génération PDF d\'attestation avec chiffrement:', params.options?.encryptionEnabled);
      console.log('🎭 Génération PDF attestation mode démo:', params.options?.demoMode);
      const options = {
      ...params.options,
      demoMode: params.options?.demoMode || false
    };
      return await generateAttestationPDF(params.student, params.settings, params.options);
    } catch (error) {
      console.error('Error generating attestation PDF:', error);
      throw error;
    }
  });

  console.log('✅ PDF generation handlers set up successfully with encryption and demo mode support');
  return {
    generateTranscriptPDF
  };
}

// Grade calculation functions
function calculateMGP(average: number): number {
  if (average >= 18) return 4.0;
  if (average >= 16) return 3.7;
  if (average >= 14) return 3.3;
  if (average >= 13) return 3.0;
  if (average >= 12) return 2.7;
  if (average >= 11) return 2.3;
  if (average >= 10) return 2.0;
  if (average >= 9) return 1.7;
  if (average >= 8) return 1.3;
  if (average >= 6) return 1.0;
  return 0.0;
}

function getGradeFromAverage(average: number): string {
  if (average >= 18) return "A+";
  if (average >= 16) return "A";
  if (average >= 14) return "B+";
  if (average >= 13) return "B";
  if (average >= 12) return "B-";
  if (average >= 11) return "C+";
  if (average >= 10) return "C";
  if (average >= 9) return "C-";
  if (average >= 8) return "D";
  if (average >= 6) return "E";
  return "F";
}

function getMention(average: number): string {
  if (average >= 16) return "Très Bien";
  if (average >= 14) return "Bien";
  if (average >= 12) return "Assez Bien";
  if (average >= 10) return "Passable";
  return "Insuffisant";
}