// src/lib/attestation-generator/html-generator.ts - Version mise à jour avec chiffrement compact
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
  encryptionEnabled?: boolean; // Support du chiffrement compact
}

/**
 * Génère le HTML pour l'attestation de réussite avec support du chiffrement compact
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
  console.log(`🔐 Chiffrement compact: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);

  // Utiliser le thème fourni ou celui des paramètres ou le thème par défaut
  const theme = options.theme || settings.theme || defaultAttestationTheme;
  
  // Récupérer les logos au format base64
  const schoolLogo = settings.logo || '';
  const universityLogo = settings.universityLogo || '';
  const facultyLogo = settings.facultyLogo || '';
  
  // Année académique formatée
  const academicYear = sanitizedStudent["ANNEE ACADEMIQUE"];
  
  // Date du jury
  const juryDate = sanitizedStudent["DATE JURY"];
  
  // Année courante pour le numéro de référence (les 2 derniers chiffres)
  const currentYear = new Date().getFullYear() % 100;
  
  // Étudiant infos
  const studentName = sanitizedStudent.NOM;
  const studentFirstname = sanitizedStudent.PRENOM;
  const studentFullName = `${studentName} ${studentFirstname}`;
  const matricule = sanitizedStudent.MATRICULE;
  const birthDate = sanitizedStudent["DATE DE NAISSANCE"];
  const birthPlace = sanitizedStudent["LIEU DE NAISSANCE"];
  
  // Informations académiques
  const cycle = sanitizedStudent.CYCLE;
  const fieldOfStudy = sanitizedStudent.DOMAINE;
  const course = sanitizedStudent.PARCOURS;
  const specialization = sanitizedStudent.SPECIALITE;
  const option = sanitizedStudent.OPTION;
  
  // Crédits et notes
  const credits = sanitizedStudent["TOTAL CREDIT"];
  const average = typeof sanitizedStudent.MOYENNE === 'number' ? 
    sanitizedStudent.MOYENNE.toFixed(2) : String(sanitizedStudent.MOYENNE);
  const grade = sanitizedStudent.GRADE;
  const mention = sanitizedStudent.MENTION;
  
  // Finalité
  const finality = sanitizedStudent["FINALITE"];

  // Générer le QR code avec chiffrement compact
  let qrCodeImage = options.qrCodeImage;
  let qrCodeAnalysis = null;
  
  if (!qrCodeImage && theme.showQRCode) {
    try {
      console.log(`🔄 Génération QR Code intégré (Chiffrement compact: ${encryptionEnabled})`);
      
      qrCodeImage = await generateQrCodeBase64(sanitizedStudent, 'attestation', encryptionEnabled);
      
      // Analyser la taille du QR code généré
      qrCodeAnalysis = getQRCodeSizeEstimate(sanitizedStudent, 'attestation', encryptionEnabled);
      
      if (encryptionEnabled) {
        console.log('✅ QR Code avec chiffrement compact généré pour le HTML');
        console.log(`📊 Taille: ${qrCodeAnalysis.estimatedQRSize} (${qrCodeAnalysis.totalContentLength} caractères)`);
        console.log(`🔑 Clé basée sur le matricule: ${matricule}`);
      } else {
        console.log('📋 QR Code sans chiffrement généré pour le HTML');
        console.log(`📊 Taille: ${qrCodeAnalysis.estimatedQRSize} (${qrCodeAnalysis.totalContentLength} caractères)`);
      }
    } catch (qrError) {
      console.error('❌ Erreur lors de la génération du QR code pour le HTML:', qrError);
      // Continuer sans QR code
      qrCodeImage = '';
    }
  }

  // Générer les styles CSS basés sur le thème
  const generateThemeStyles = (): string => {
    function getLogoSize(){
      if(settings.establishmentType=== "ipes"){
      return  {
        small: { width: '60px', height: '60px' },
        medium: { width: '80px', height: '80px' },
        large: { width: '100px', height: '100px' }
      };
    }return  {
        small: { width: '60px', height: '60px' },
        medium: { width: '80px', height: '80px' },
        large: { width: '100px', height: '100px' }
      };
    }
  const logoSizeMap = getLogoSize();

  
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
    
   html, body {
    margin: ${theme.documentPadding}px;
    padding: 0;
    width: calc(210mm - ${theme.documentPadding * 2}px);
    height: calc(297mm - ${theme.documentPadding * 2}px);
    font-family: ${theme.mainFont};
    font-size: ${theme.contentFontSize}px;
    color: ${theme.primaryColor};
    background-color: none;
    ${theme.compactMode ? 'line-height: 1.2;' : 'line-height: 1.4;'}
  }

  body {
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: ${theme.documentPadding/2}px;
  }

    
    .container {
      width: 100%;
      height: 100%;
      padding : ${theme.documentPadding}px;
      position: relative;
      display: flex;
      flex-direction: column;
       ${theme.borderStyle !== 'none' ? `border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.tableBorderColor};` : ''}
    }

    /* En-tête */
    .header {    
      font-size: ${theme.headerFontSize}px;
      font-family: ${theme.headerFont};
      flex-shrink: 0;
    }
    
    .header-row1 {
      text-align: center;
      margin-bottom: ${theme.headerLayout === 'compact' ? '4px' : '8px'};
      display: flex;
      justify-content: space-between;
      align-items: ${theme.logoPosition === 'integrated' ? 'center' : 'flex-start'};
    }
    
    .header-content {
      width: ${theme.headerLayout === 'extended' ? '40%' : theme.headerLayout === 'compact' ? '30%' : '35%'};
      font-size: ${theme.headerFontSize}px;
      line-height: ${theme.compactMode ? '1.1' : '1.3'};
    }
    
    .header-logo-content {
      ${theme.logoPosition === 'integrated' ? 'width: 30%;' : 'width: 30%;'}
      align-content: center;
      display: flex;
      align-items: center;
      justify-content: ${theme.logoPosition === 'integrated' ? 'space-around' : 'space-between'};
    }
    
    .header-logo-content > div {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .header-logo-content > div > img {
      max-width: ${currentLogoSize.width};
      max-height: ${currentLogoSize.height};
      object-fit: contain;
    }

    #to-hidden{
     ${settings.establishmentType !== "ipes" ? 'display : none' : ''};
    }
     #to-nothidden{
    ${settings.establishmentType === "ipes" ? 'display : none' : ''};
    }

    
    .header-row2 {
      text-align: center;
    }
    
    .header-row2 h1 {
      font-weight: bold;
      font-size: ${theme.titleFontSize}px;
      color: ${theme.accentColor};
      margin: ${theme.compactMode ? '0px 0' : '4px 0'};
      font-family: ${theme.headerFont};
    }
    
    .header-row2 h2 {
      font-weight: bold;
      font-size: ${theme.subtitleFontSize}px;
      color: ${theme.secondaryColor};
      margin: ${theme.compactMode ? '0px 0' : '4px 0'};
      font-style: italic;
    }
    
    .header-row2 p {
      font-size: ${theme.contentFontSize + 1}px;
      margin: ${theme.compactMode ? '0px 0' : '8px 0'};
    }

    /* Contenu principal */
    .content {
      flex: 1;
      margin: ${theme.compactMode ? '0px 0' : '10px 0'};
      font-size: ${theme.contentFontSize}px;
    }
    
    .student-info {
      margin: ${theme.compactMode ? '5px 0' : '8px 0'};
    }
    
    .student-info p {
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
      margin-bottom: ${theme.compactMode ? '0px' : '0px'};
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
      background-color: none;
      border-bottom: 2px solid ${theme.tableBorderColor};
    }
    td {
      border-bottom: 1px solid ${theme.tableBorderColor}40;
    }` : ''}

    /* Pied de page et signatures */
    .footer {
      margin-top: auto;
      padding-top: ${theme.compactMode ? '0px' : '5px'};
      ${theme.signatureLayout === 'side-by-side' ? 'display: flex; justify-content: space-between; align-items: flex-start;' : ''}
      ${theme.signatureLayout === 'centered' ? 'text-align: center;' : ''}
      ${theme.signatureLayout === 'stacked' ? 'display: flex; flex-direction: column; align-items: center; gap: 25px;' : ''}
      flex-shrink: 0;
    }
    
    .signature {
      ${theme.signatureLayout === 'side-by-side' ? 'width: 48%;' : 'width: 100%;'}
      ${theme.signatureLayout === 'centered' ? 'margin: 15px 0;' : ''}
      font-size: ${theme.contentFontSize}px;
      ${theme.signatureStyle === 'boxed' ? `padding: 10px; border-radius: 4px;` : ''}
      ${theme.signatureStyle === 'underlined' ? `padding-bottom: 5px;` : ''}
      ${theme.signatureStyle === 'modern' ? `background-color: ${theme.tableHeaderBgColor}; padding: 8px;` : ''}
    }
    
    .qr-code {
      ${theme.qrCodePosition === 'bottom-center' ? 'text-align: center; margin: 20px 0;' : ''}
      ${theme.qrCodePosition === 'bottom-left' ? 'float: left; margin: 0 20px 20px 0;' : ''}
      ${theme.qrCodePosition === 'bottom-right' ? 'float: right; margin: 0 0 20px 20px;' : ''}
      ${!theme.showQRCode ? 'display: none;' : ''}
    }
    
    .qr-image {
      width: ${currentQrCodeSize.width};
      height: ${currentQrCodeSize.height};
      border: 1px solid ${theme.tableBorderColor};
    }

    /* Indicateur de performance QR */
    .qr-performance-indicator {
      position: absolute;
      top: 25px;
      right: 5px;
      background: ${qrCodeAnalysis?.estimatedQRSize === 'Small' ? 'rgba(0, 128, 0, 0.1)' : 
                   qrCodeAnalysis?.estimatedQRSize === 'Medium' ? 'rgba(255, 165, 0, 0.1)' : 
                   'rgba(255, 0, 0, 0.1)'};
      border: 1px solid ${qrCodeAnalysis?.estimatedQRSize === 'Small' ? 'rgba(0, 128, 0, 0.3)' : 
                          qrCodeAnalysis?.estimatedQRSize === 'Medium' ? 'rgba(255, 165, 0, 0.3)' : 
                          'rgba(255, 0, 0, 0.3)'};
      color: ${qrCodeAnalysis?.estimatedQRSize === 'Small' ? '#006400' : 
                qrCodeAnalysis?.estimatedQRSize === 'Medium' ? '#FF8C00' : 
                '#DC143C'};
      font-size: 7px;
      padding: 1px 4px;
      border-radius: 2px;
      display: ${qrCodeAnalysis && process.env.NODE_ENV === 'development' ? 'block' : 'none'};
      z-index: 999;
    }

    /* Filigrane */
    .watermark {
      position: absolute;
      top: 30%;
      left: 0;
      width: 100%;
      height: 60%;
      z-index: -1;
      display: ${theme.showWatermark ? 'flex' : 'none'};
      justify-content: center;
      align-items: center;
      opacity: ${theme.watermarkOpacity};
      pointer-events: none;
    }
    
    .watermark img {
      max-width: 400px;
      max-height: 400px;
      object-fit: contain;
    }

    /* Disclaimer */
    .disclaimer {
      font-size: ${theme.footerFontSize}px;
      font-style: italic;
      text-align: left;
      margin-top: ${theme.compactMode ? '5px' : '8px'};
      ${theme.contentLayout === 'formal' ? 'text-align: justify;' : ''}
      color: ${theme.secondaryColor};
      line-height: 1.4;
      flex-shrink: 0;
    }

    /* Styles pour les différents layouts de contenu */
    ${theme.contentLayout === 'modern' ? `
    .content {
      background: linear-gradient(135deg, transparent, ${theme.tableHeaderBgColor}20);
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .student-info {
      background: none;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid ${theme.accentColor};
    }` : ''}
    
    ${theme.contentLayout === 'formal' ? `
    .content {
      text-align: justify;
    }
    .student-info {
      border: 1px solid ${theme.tableBorderColor};
      padding: 18px;
      background-color: ${theme.tableHeaderBgColor}20;
    }` : ''}

    /* Texte bilingue */
    em {
      font-style: italic;
      color: ${theme.secondaryColor};
      ${!theme.showBilingualText ? 'display: none;' : ''}
    }

    /* Responsive pour l'impression */
    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
        box-shadow: none;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      body {
        padding: ${theme.documentPadding}px;
      }
      
      .no-print {
        display: none;
      }
      
      .container {
        min-height: calc(297mm - ${theme.documentPadding * 2}px);
      }
      
      
      .qr-performance-indicator {
        display: none !important;
      }
    }
  `;
};

  // Création du contenu HTML
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
        <!-- Indicateur de performance QR (dev uniquement) -->
        ${qrCodeAnalysis ? `
        <div class="qr-performance-indicator no-print">
            ${qrCodeAnalysis.estimatedQRSize} (${qrCodeAnalysis.totalContentLength}c)
        </div>
        ` : ''}

        <!-- Filigrane IPES -->
        <div class="watermark">
            <img src="${settings.establishmentType === "ipes" ? schoolLogo : facultyLogo}" alt="IPES Watermark">
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
                Email: <a href="mailto:${settings.email}">${settings.email}</a></p>
                </span>
              </div>
              
              ${theme.logoPosition !== 'top' ? `
              <div class="header-logo-content">
                <div>${universityLogo ? `<img src="${universityLogo}" alt="University Logo">` : ''}</div>
                <div>${facultyLogo ? `<img src="${facultyLogo}" alt="Faculty Logo">` : ''}</div>
                <div id="to-hidden">${schoolLogo ? `<img src="${schoolLogo}" alt="IPES Logo">` : ''}</div>
              </div>
              ` : ''}
              
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
                Email: <a href="mailto:${settings.email}">${settings.email}</a></p>   
                </span> 
              </div>
            </div>
            
            ${theme.logoPosition === 'top' ? `
            <div class="header-logo-content" style="margin-bottom: 15px;">
              <div>${universityLogo ? `<img src="${universityLogo}" alt="University Logo">` : ''}</div>
              <div>${facultyLogo ? `<img src="${facultyLogo}" alt="Faculty Logo">` : ''}</div>
              <div id="to-hidden">${schoolLogo ? `<img src="${schoolLogo}" alt="IPES Logo">` : ''}</div>
            </div>
            ` : ''}
            
            <div class="header-row2">
              <h1>${theme.customTitle || "ATTESTATION DE REUSSITE"}</h1>
              ${theme.showBilingualText ? `<h2>${theme.customSubtitle || "ATTESTATION OF COMPLETION OF STUDIES"}</h2>` : ''}
              
              <p><strong>Ref N°............./${currentYear-1}/UDo/FMSP/VDRC/${settings.establishmentType === "ipes" ? settings.nameAbreviation : "SSE"}</strong></p>
            </div>
        </div>
        
        <div class="content">
            <p id="to-hidden"><strong>${theme.primaryLanguage === 'english' ? 'We, the undersigned,' : 'Nous soussignés,'}</strong><br>
            ${theme.showBilingualText ? '<em>' + (theme.primaryLanguage === 'english' ? 'Nous soussignés,' : 'We, the undersigned,') + '</em>' : ''}</p>
            <p id="to-nothidden"><strong>${theme.primaryLanguage === 'english' ? 'I, the undersigned, Professor EBOUMBOU MOUKOKO Carole Else,' : 'Je soussignée, Professeur EBOUMBOU MOUKOKO Carole Else,'}</strong><br>
            ${theme.showBilingualText ? '<em>' + (theme.primaryLanguage === 'english' ? 'Je soussignée, Professeur EBOUMBOU MOUKOKO Carole Else,' : 'I, the undersigned, Professor EBOUMBOU MOUKOKO Carole Else,') + '</em>' : ''}</p>

            <div id="to-hidden" style="${settings.establishmentType !== "ipes" ? 'display : none' : 'display: flex'}; justify-content: space-between; margin: 15px 0;">
              <div style="width: 45%; text-align: left; border-top: 1px solid ${theme.tableBorderColor}; margin-top: 10px;">
                <strong>Directeur de l'${settings.nameAbreviation}</strong>
              </div>
              <div style="width: 45%; text-align: left; border-top: 1px solid ${theme.tableBorderColor}; margin-top: 10px;">
                <strong>Recteur de l'Université de Douala</strong>
              </div>
            </div>
            
            <p><strong>Vu le procès-verbal du jury N°0001 en date du ${juryDate} atteste que,</strong><br>
            ${theme.showBilingualText ? `<em>Considering the jury's decision N° 0001 dated ${juryDate} Certify that,</em>` : ''}</p>
            
            
                <p>M./Mme/Mlle <strong>${studentFullName.toUpperCase()}</strong><br>
                ${theme.showBilingualText ? '<em>Mr/Mrs/Miss</em>' : ''}</p>
                
                <p>Né(e) le: <strong>${birthDate}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;à&nbsp;<strong>${birthPlace.toUpperCase()}</strong><br>
                ${theme.showBilingualText ? `<em>Born on:</em>&nbsp;<span style="color:white">${birthDate}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<em>at:</em>` : ''}</p>
                
                <p>Inscrit(e) à <strong id="to-hidden">${settings.nameFrench}</strong><strong id="to-nothidden">la Faculté de Medecine et des Sciences Pharmaceutiques</strong> sous le matricule: <strong>${matricule}</strong><br>
                ${theme.showBilingualText ? '<em>Registered under the matricule number:</em>' : ''}</p>
                <p id="to-nothidden">A subi avec succès toutes les épreuves du cursus sanctionnant la fin du Cycle de : <strong>${cycle.toUpperCase()}</strong> en <strong>${specialization.toUpperCase()}</strong> ${option && option !== 'N/D' ? `option <strong>${option.toUpperCase()}</strong>` : ''}<br>
                ${theme.showBilingualText ? '<em>Having successfully fufilled the requirements qualifying for the :</em>' : ''}</p>
          
            
            ${theme.showDomainTable ? `
            <div class="table-container">
                <table>
                    <tr>
                        <th>Domaine<br>${theme.showBilingualText ? '<em style="font-weight: normal">Domain of the study</em>' : ''}</th>
                        <th>Parcours<br>${theme.showBilingualText ? '<em style="font-weight: normal">Course</em>' : ''}</th>
                        <th>Spécialité<br>${theme.showBilingualText ? '<em style="font-weight: normal">Specialization</em>' : ''}</th>
                        ${option && option !== 'N/D' ? '<th>Option<br>' + (theme.showBilingualText ? '<em style="font-weight: normal">Learning option</em>' : '') + '</th>' : ''}
                    </tr>
                    <tr style="background-color:${theme.tableHeaderBgColor}">
                        <td><strong>${fieldOfStudy.toUpperCase()}</strong></td>
                        <td><strong>${course.toUpperCase()}</strong></td>
                        <td><strong>${specialization.toUpperCase()}</strong></td>
                        ${option && option !== 'N/D' ? `<td><strong>${option.toUpperCase()}</strong></td>` : ''}
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
                    <tr style="background-color:${theme.tableHeaderBgColor}">
                        <td><strong>${credits}</strong></td>
                        <td><strong>${average}</strong></td>
                        <td><strong>${mention} ${grade}</strong></td>
                        <td><strong>${academicYear}</strong></td>
                        <td><strong>${finality.toUpperCase()}</strong></td>
                    </tr>
                </table>
            </div>
            ` : ''}
            
            <p>En foi de quoi la présente Attestation est délivrée pour servir et valoir ce que de droit.<br>
            ${theme.showBilingualText ? '<em>In witness where of the present testimonial is given with all the privileges there to pertaining.</em>' : ''}</p>
            <div class="footer">
                <div class="signature-ipes">
                    ${theme.signatureLayout === 'side-by-side' && theme.qrCodePosition === 'bottom-left' ? `
                    <div class="qr-code">
                        ${qrCodeImage ? `<img src="${qrCodeImage}" class="qr-image" alt="QR Code ${encryptionEnabled ? '(Chiffrement Compact)' : ''}" />` : 
                          '<div class="qr-image" style="background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10px;">QR Code</div>'}
                    </div>
                    ` : ''}
                    
                    <div id="to-hidden"><strong>Le Directeur de L'${settings.nameAbreviation}</strong><br>
                    ${theme.showBilingualText ? `<em>The Director of the ${settings.nameAbreviation}</em>` : ''}</div>
                </div>
                
                ${theme.qrCodePosition === 'bottom-center' ? `
                <div class="qr-code">
                    ${qrCodeImage ? `<img src="${qrCodeImage}" class="qr-image" alt="QR Code ${encryptionEnabled ? '(Chiffrement Compact)' : ''}" />` : 
                      '<div class="qr-image" style="background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10px;">QR Code</div>'}
                </div>
                ` : ''}
                
                <div class="signature">
                    <p><strong>Douala, le</strong><br>
                    ${theme.showBilingualText ? '<em>Douala, the</em>' : ''}</p>
    
                    <p id="to-hidden" style="padding-bottom: 30px; margin-top: ${theme.signatureLayout === 'stacked' ? '2px' : '10px'};">
                    <strong>Le Recteur de l'Université de Douala</strong><br>
                    ${theme.showBilingualText ? '<em>The Rector of the University of Douala</em>' : ''}</p>
                    <p id="to-nothidden" style="padding-bottom: 30px; margin-top: ${theme.signatureLayout === 'stacked' ? '2px' : '10px'};">
                    <strong>Le DOYEN</strong><br>
                    ${theme.showBilingualText ? '<em>The DEAN</em>' : ''}</p>
                    
                    ${theme.signatureLayout === 'side-by-side' && theme.qrCodePosition === 'bottom-right' ? `
                    <div class="qr-code">
                        ${qrCodeImage ? `<img src="${qrCodeImage}" class="qr-image" alt="QR Code ${encryptionEnabled ? '(Chiffrement Compact)' : ''}" />` : 
                          '<div class="qr-image" style="background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10px;">QR Code</div>'}
                    </div>
                    ` : ''}
                </div>
            </div>
            
        </div>
        
        <div class="disclaimer">
            ${theme.customFooterText ? theme.customFooterText : `
            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    Cette Attestation ne tient pas lieu de Diplôme et n'est délivrée qu'en un seul exemplaire et d'une validité de (6) mois à partir de la date de signature. Le Diplôme lui sera délivré ultérieurement
                </div>
                ${theme.showBilingualText ? `
                <div style="flex: 1;">
                    <em>Only one copy of this Attestation shall be delivered and is not a certificate. This Attestation is valid for (6) six months from the date of signature. The Certificate will be issued at a later date.</em>
                </div>
                ` : ''}
            </div>
            `}
        </div>
        
        ${theme.qrCodePosition === 'custom' && options.qrCodePosition ? `
        <div style="position: absolute; left: ${options.qrCodePosition.x}px; top: ${options.qrCodePosition.y}px;" class="qr-code">
            ${qrCodeImage ? `<img src="${qrCodeImage}" class="qr-image" alt="QR Code ${encryptionEnabled ? '(Chiffrement Compact)' : ''}" />` : 
              '<div class="qr-image" style="background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10px;">QR Code</div>'}
        </div>
        ` : ''}
    </div>
</body>
</html>
  `;
  
  console.log(`✅ HTML généré avec succès pour ${studentFullName}`);
  console.log(`🔐 Chiffrement compact: ${encryptionEnabled ? 'Activé' : 'Désactivé'}`);
  console.log(`📋 QR Code inclus: ${qrCodeImage ? 'Oui' : 'Non'}`);
  
  if (qrCodeAnalysis) {
    console.log(`📊 Performance QR: ${qrCodeAnalysis.estimatedQRSize} (${qrCodeAnalysis.totalContentLength} caractères)`);
    console.log(`🔧 Données chiffrées estimées: ${qrCodeAnalysis.encryptedDataLength} caractères`);
  }
  
  if (encryptionEnabled) {
    console.log(`🔑 Clé de chiffrement basée sur: ${matricule}`);
  }
  
  return html;
}