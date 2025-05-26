// src/lib/attestation-generator/-html-generator.ts
import { StudentExcelRecord } from '../helpers/qrcode';
import { formatDate, calculateGrade, calculateMention } from './utils';
import { AttestationThemeSettingsPayload, defaultAttestationTheme } from '../form-schemas/attestation-theme-settings';

interface SchoolSettings {
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
}

/**
 * Génère le HTML pour l'attestation de réussite avec support des thèmes personnalisés
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
  // Utiliser le thème fourni ou celui des paramètres ou le thème par défaut
  const theme = options.theme || settings.theme || defaultAttestationTheme;
  
  // Récupérer les logos au format base64
  const schoolLogo = settings.logo || '';
  const universityLogo = settings.universityLogo || '';
  const facultyLogo = settings.facultyLogo || '';
  
  // Année académique formatée
  const academicYear = student["ANNEE ACADEMIQUE"] || "2023/2024";
  
  // Date du jury
  const juryDate = student["DATE JURY"] || '';
  
  // Année courante pour le numéro de référence (les 2 derniers chiffres)
  const currentYear = new Date().getFullYear() % 100;
  
  // Étudiant infos
  const studentName = student.NOM;
  const studentFirstname = student.PRENOM;
  const studentFullName = `${studentName} ${studentFirstname}`;
  const matricule = student.MATRICULE;
  const birthDate = student["DATE DE NAISSANCE"] || '';
  const birthPlace = student["LIEU DE NAISSANCE"] || '';
  
  // Informations académiques
  const fieldOfStudy = student.DOMAINE || "SCIENCES MEDICO-SANITAIRES";
  const course = student.PARCOURS || "SCIENCES INFIRMIÈRES";
  const specialization = student.SPECIALITE || "SOINS INFIRMIERS";
  const option = student.OPTION || "";
  
  // Crédits et notes
  const credits = student["TOTAL CREDIT"] || '60';
  const average = typeof student.MOYENNE === 'number' ? student.MOYENNE.toFixed(2) : String(student.MOYENNE);
  const grade = student.GRADE || calculateGrade(typeof student.MOYENNE === 'number' ? student.MOYENNE : parseFloat(String(student.MOYENNE)));
  const mention = student.MENTION || calculateMention(typeof student.MOYENNE === 'number' ? student.MOYENNE : parseFloat(String(student.MOYENNE)));
  
  // Finalité
  const finality = student["FINALITE"] || 'LICENCE PROFESSIONNELLE';

  // Générer les styles CSS basés sur le thème
  const generateThemeStyles = (): string => {
    const logoSizeMap = {
      small: { width: '40px', height: '40px' },
      medium: { width: '60px', height: '60px' },
      large: { width: '80px', height: '80px' }
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
        size: A4;
        margin: 0;
      }
      body {
        margin: ${theme.documentPadding}px;
        font-family: ${theme.mainFont};
        box-sizing: border-box;
        font-size: ${theme.contentFontSize}px;
        ${theme.borderStyle !== 'none' ? `border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.tableBorderColor};` : ''}
        width: ${210 - (theme.documentPadding * 2)}mm;
        min-height: ${297 - (theme.documentPadding * 2)}mm;
        position: relative;
        color: ${theme.primaryColor};
        background-color: white;
        ${theme.compactMode ? 'line-height: 1.2;' : 'line-height: 1.4;'}
      }
      
      .container {
        width: 100%;
        height: 100%;
        position: relative;
      }

      /* En-tête */
      .header {    
        font-size: ${theme.headerFontSize}px;
        font-family: ${theme.headerFont};
        margin-bottom: ${theme.compactMode ? '10px' : '20px'};
      }
      
      .header-row1 {
        text-align: center;
        margin-bottom: ${theme.headerLayout === 'compact' ? '10px' : '15px'};
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
        ${theme.logoPosition === 'top' ? 'position: absolute; top: -10px; left: 50%; transform: translateX(-50%);' : ''}
        ${theme.logoPosition === 'integrated' ? 'width: 30%;' : 'width: 30%;'}
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
        width: ${currentLogoSize.width};
        height: ${currentLogoSize.height};
        object-fit: contain;
      }
      
      .header-row2 {
        text-align: center;
        margin-bottom: ${theme.compactMode ? '15px' : '25px'};
      }
      
      .header-row2 h1 {
        font-weight: bold;
        font-size: ${theme.titleFontSize}px;
        color: ${theme.accentColor};
        margin: ${theme.compactMode ? '5px 0' : '10px 0'};
        font-family: ${theme.headerFont};
      }
      
      .header-row2 h2 {
        font-weight: bold;
        font-size: ${theme.subtitleFontSize}px;
        color: ${theme.secondaryColor};
        margin: ${theme.compactMode ? '3px 0' : '5px 0'};
        font-style: italic;
      }
      
      .header-row2 p {
        font-size: ${theme.contentFontSize + 2}px;
        margin: ${theme.compactMode ? '5px 0' : '10px 0'};
      }

      /* Contenu principal */
      .content {
        margin: ${theme.compactMode ? '10px 0' : '20px 0'};
        font-size: ${theme.contentFontSize}px;
      }
      
      .student-info {
        margin: ${theme.compactMode ? '10px 0' : '15px 0'};
      }
      
      .student-info p {
        margin: ${theme.compactMode ? '3px 0' : '5px 0'};
      }

      /* Tableaux */
      .table-container {
        width: 100%;
        margin: ${theme.compactMode ? '10px 0' : '15px 0'};
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: ${theme.compactMode ? '8px' : '12px'};
      }
      
      th, td {
        padding: ${theme.tableCellPadding}px;
        text-align: center;
        border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.tableBorderColor};
        font-size: ${theme.contentFontSize}px;
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
        border-bottom: 2px solid ${theme.tableBorderColor};
      }
      td {
        border-bottom: 1px solid ${theme.tableBorderColor}40;
      }` : ''}

      /* Pied de page et signatures */
      .footer {
        margin-top: ${theme.compactMode ? '15px' : '25px'};
        ${theme.signatureLayout === 'side-by-side' ? 'display: flex; justify-content: space-between;' : ''}
        ${theme.signatureLayout === 'centered' ? 'text-align: center;' : ''}
        ${theme.signatureLayout === 'stacked' ? 'display: flex; flex-direction: column; align-items: center; gap: 20px;' : ''}
      }
      
      .signature {
        ${theme.signatureLayout === 'side-by-side' ? 'width: 48%;' : 'width: 100%;'}
        ${theme.signatureLayout === 'centered' ? 'margin: 10px 0;' : ''}
        font-size: ${theme.contentFontSize}px;
        ${theme.signatureStyle === 'boxed' ? `border: 1px solid ${theme.primaryColor}; padding: 10px; border-radius: 4px;` : ''}
        ${theme.signatureStyle === 'underlined' ? `border-bottom: 2px solid ${theme.primaryColor}; padding-bottom: 5px;` : ''}
        ${theme.signatureStyle === 'modern' ? `background-color: ${theme.tableHeaderBgColor}; padding: 8px; border-radius: 6px; border-left: 4px solid ${theme.accentColor};` : ''}
      }
      
      .qr-code {
        ${theme.qrCodePosition === 'bottom-center' ? 'text-align: center; margin: 15px 0;' : ''}
        ${theme.qrCodePosition === 'bottom-left' ? 'float: left; margin: 0 15px 15px 0;' : ''}
        ${theme.qrCodePosition === 'bottom-right' ? 'float: right; margin: 0 0 15px 15px;' : ''}
        ${!theme.showQRCode ? 'display: none;' : ''}
      }
      
      .qr-image {
        width: ${currentQrCodeSize.width};
        height: ${currentQrCodeSize.height};
        border: 1px solid ${theme.tableBorderColor};
      }

      /* Filigrane */
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
        opacity: ${theme.watermarkOpacity};
        pointer-events: none;
      }
      
      .watermark img {
        width: 600px;
        height: auto;
      }

      /* Disclaimer */
      .disclaimer {
        font-size: ${theme.footerFontSize}px;
        font-style: italic;
        text-align: left;
        margin-top: ${theme.compactMode ? '15px' : '25px'};
        ${theme.contentLayout === 'formal' ? 'text-align: justify;' : ''}
        color: ${theme.secondaryColor};
        line-height: 1.3;
      }

      /* Styles pour les différents layouts de contenu */
      ${theme.contentLayout === 'modern' ? `
      .content {
        background: linear-gradient(135deg, transparent, ${theme.tableHeaderBgColor}20);
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .student-info {
        background: white;
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid ${theme.accentColor};
      }` : ''}
      
      ${theme.contentLayout === 'formal' ? `
      .content {
        text-align: justify;
      }
      .student-info {
        border: 1px solid ${theme.tableBorderColor};
        padding: 15px;
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
        body {
          margin: 0;
          box-shadow: none;
        }
        .no-print {
          display: none;
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
        <!-- Filigrane IPES -->
        <div class="watermark">
            <img src="${schoolLogo}" alt="IPES Watermark">
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
                ********************<br>
                <strong>${settings.nameFrench
                            .split(" ")
                            .map((w, i) => (i > 0 && i % 4 === 0 ? "<br>" + w : w))
                            .join(" ")}</strong><br>
                ********************<br>
                ${settings.postalBox}<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a></p>
              </div>
              
              ${theme.logoPosition !== 'top' ? `
              <div class="header-logo-content">
                <div>${universityLogo ? `<img src="${universityLogo}" alt="University Logo">` : ''}</div>
                <div>${facultyLogo ? `<img src="${facultyLogo}" alt="Faculty Logo">` : ''}</div>
                <div>${schoolLogo ? `<img src="${schoolLogo}" alt="IPES Logo">` : ''}</div>
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
                ********************<br>
                <strong>${settings.nameEnglish
                            .split(" ")
                            .map((w, i) => (i > 0 && i % 4 === 0 ? "<br>" + w : w))
                            .join(" ")}</strong><br>
                ********************<br>
                ${settings.postalBoxEn}<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a></p>    
              </div>
            </div>
            
            ${theme.logoPosition === 'top' ? `
            <div class="header-logo-content" style="margin-bottom: 15px;">
              <div>${universityLogo ? `<img src="${universityLogo}" alt="University Logo">` : ''}</div>
              <div>${facultyLogo ? `<img src="${facultyLogo}" alt="Faculty Logo">` : ''}</div>
              <div>${schoolLogo ? `<img src="${schoolLogo}" alt="IPES Logo">` : ''}</div>
            </div>
            ` : ''}
            
            <div class="header-row2">
              <h1>${theme.customTitle || "ATTESTATION DE REUSSITE"}</h1>
              ${theme.showBilingualText ? `<h2>${theme.customSubtitle || "ATTESTATION OF COMPLETION OF STUDIES"}</h2>` : ''}
              
              <p><strong>Ref N°............./${currentYear-1}/UDo/FMSP/VDRC/${settings.nameAbreviation}</strong></p>
            </div>
        </div>
        
        <div class="content">
            <p><strong>${theme.primaryLanguage === 'english' ? 'We, the undersigned,' : 'Nous soussignés,'}</strong><br>
            ${theme.showBilingualText ? '<em>' + (theme.primaryLanguage === 'english' ? 'Nous soussignés,' : 'We, the undersigned,') + '</em>' : ''}</p>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
              <div style="width: 45%; text-align: center; border-top: 1px solid ${theme.tableBorderColor}; padding-top: 4px;">
                <strong>Directeur de l'${settings.nameAbreviation}</strong>
              </div>
              <div style="width: 45%; text-align: center; border-top: 1px solid ${theme.tableBorderColor}; padding-top: 4px;">
                <strong>Recteur de l'Université de Douala</strong>
              </div>
            </div>
            
            <p><strong>Vu le procès-verbal du jury N°0001 en date du ${juryDate} atteste que,</strong><br>
            ${theme.showBilingualText ? `<em>Considering the jury's decision N° 0001 dated ${juryDate} Certify that,</em>` : ''}</p>
            
            <div class="student-info">
                <p>M./Mme/Mlle <strong>${studentFullName}</strong><br>
                ${theme.showBilingualText ? '<em>Mr/Mrs/Miss</em>' : ''}</p>
                
                <p>Né(e) le: <strong>${birthDate}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;à&nbsp;<strong>${birthPlace}</strong><br>
                ${theme.showBilingualText ? '<em>Born on:</em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<em>at:</em>' : ''}</p>
                
                <p>Inscrit(e) à <strong>${settings.nameFrench}</strong> sous le matricule: <strong>${matricule}</strong><br>
                ${theme.showBilingualText ? '<em>Registered under the matricule number:</em>' : ''}</p>
            </div>
            
            ${theme.showDomainTable ? `
            <div class="table-container">
                <table>
                    <tr>
                        <th>Domaine<br>${theme.showBilingualText ? '<em style="font-weight: normal">Domain of the study</em>' : ''}</th>
                        <th>Parcours<br>${theme.showBilingualText ? '<em style="font-weight: normal">Course</em>' : ''}</th>
                        <th>Spécialité<br>${theme.showBilingualText ? '<em style="font-weight: normal">Specialization</em>' : ''}</th>
                        ${option ? '<th>Option<br>' + (theme.showBilingualText ? '<em style="font-weight: normal">Learning option</em>' : '') + '</th>' : ''}
                    </tr>
                    <tr style="background-color:${theme.tableHeaderBgColor}">
                        <td><strong>${fieldOfStudy}</strong></td>
                        <td><strong>${course}</strong></td>
                        <td><strong>${specialization}</strong></td>
                        ${option ? `<td><strong>${option}</strong></td>` : ''}
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
                        <td><strong>${finality}</strong></td>
                    </tr>
                </table>
            </div>
            ` : ''}
            
            <p>En foi de quoi la présente Attestation est délivrée pour servir et valoir ce que de droit.<br>
            ${theme.showBilingualText ? '<em>In witness where of the present testimonial is given with all the privileges there to pertaining.</em>' : ''}</p>
        </div>
        
        <div class="footer">
            <div class="signature">
                ${theme.signatureLayout === 'side-by-side' && theme.qrCodePosition === 'bottom-left' ? `
                <div class="qr-code">
                    ${options.qrCodeImage ? `<img src="${options.qrCodeImage}" class="qr-image" alt="QR Code" />` : 
                      '<div class="qr-image"></div>'}
                </div>
                ` : ''}
                
                <p><strong>Le Directeur de L'${settings.nameAbreviation}</strong><br>
                ${theme.showBilingualText ? `<em>The Director of the ${settings.nameAbreviation}</em>` : ''}</p>
            </div>
            
            ${theme.qrCodePosition === 'bottom-center' ? `
            <div class="qr-code">
                ${options.qrCodeImage ? `<img src="${options.qrCodeImage}" class="qr-image" alt="QR Code" />` : 
                  '<div class="qr-image"></div>'}
            </div>
            ` : ''}
            
            <div class="signature">
                <p><strong>Douala, le</strong><br>
                ${theme.showBilingualText ? '<em>Douala, the</em>' : ''}</p>

                <p style="margin-top: ${theme.signatureLayout === 'stacked' ? '10px' : '40px'};">
                <strong>Le Recteur de l'Université de Douala</strong><br>
                ${theme.showBilingualText ? '<em>The Rector of the University of Douala</em>' : ''}</p>
                
                ${theme.signatureLayout === 'side-by-side' && theme.qrCodePosition === 'bottom-right' ? `
                <div class="qr-code">
                    ${options.qrCodeImage ? `<img src="${options.qrCodeImage}" class="qr-image" alt="QR Code" />` : 
                      '<div class="qr-image"></div>'}
                </div>
                ` : ''}
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
            ${options.qrCodeImage ? `<img src="${options.qrCodeImage}" class="qr-image" alt="QR Code" />` : 
              '<div class="qr-image"></div>'}
        </div>
        ` : ''}
    </div>
</body>
</html>
  `;
  
  return html;
}