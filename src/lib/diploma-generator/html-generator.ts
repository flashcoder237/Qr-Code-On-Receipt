// src/lib/diploma-generator/html-generator.ts
// Générateur HTML pour les diplômes avec thèmes personnalisables

import QRCode from 'qrcode';
import {
  DiplomaStudentRecord,
  DiplomaSchoolSettings,
  DiplomaGenerationOptions,
  DiplomaQRData
} from './types';
import { defaultDiplomaTheme, DiplomaThemeSettingsPayload } from '../form-schemas/diploma-theme-settings';

/**
 * Génère le QR code pour un diplôme
 */
async function generateDiplomaQRCode(student: DiplomaStudentRecord): Promise<string> {
  const qrData: DiplomaQRData = {
    nom: student.NOM,
    prenom: student.PRENOM,
    matricule: student.MATRICULE,
    dateNaissance: student["DATE DE NAISSANCE"],
    lieuNaissance: student["LIEU DE NAISSANCE"],
    parcours: student.PARCOURS,
    specialite: student.SPECIALITE,
    anneeObtention: student["ANNEE OBTENTION"],
    moyenne: student.MOYENNE,
    grade: student.GRADE,
    mention: student.MENTION,
  };

  const qrString = JSON.stringify(qrData);

  try {
    return await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
    });
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error);
    return '';
  }
}

/**
 * Génère les styles CSS basés sur le thème
 */
function generateDiplomaStyles(theme: DiplomaThemeSettingsPayload, isDemoMode: boolean = false): string {
  return `
    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${theme.mainFont};
      background: white;
      margin: 0;
      padding: 0;
    }

    .diploma-container {
      width: 297mm;
      height: 210mm;
      background: white;
      position: relative;
      margin: 0 auto;
      overflow: hidden;
    }

    /* Bordures décoratives */
    .outer-border {
      position: absolute;
      top: ${theme.documentMarginTop}mm;
      left: ${theme.documentMarginLeft}mm;
      right: ${theme.documentMarginRight}mm;
      bottom: ${theme.documentMarginBottom}mm;
      border: ${theme.outerBorderWidth}px solid ${theme.outerBorderColor};
    }

    .inner-border {
      position: absolute;
      top: 1mm;
      left: 1mm;
      right: 1mm;
      bottom: 1mm;
      border: ${theme.innerBorderWidth}px solid ${theme.innerBorderColor};
    }

    .content {
      position: absolute;
      top: 14mm;
      left: 14mm;
      right: 14mm;
      bottom: 14mm;
      z-index: 10;
    }

    /* Filigrane */
    .watermark {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 1;
      z-index: ${isDemoMode ? '-1' : '10'};
      overflow: hidden;
      display: ${theme.showWatermark ? 'block' : 'none'};
    }

    .watermark-center-logo {
      position: absolute;
      top: 60%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${theme.watermarkLogoSize}px;
      height: auto;
      opacity: ${theme.watermarkOpacity};
      z-index: 2;
    }

    .watermark-grid {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 45px 70px;
      width: 180%;
      height: 180%;
      padding: 150px;
      z-index: 1;
    }

    .watermark-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .watermark-text {
      font-size: 20pt;
      font-weight: bold;
      color: ${theme.primaryColor};
      font-family: Arial, Helvetica, sans-serif;
      white-space: nowrap;
      letter-spacing: 2px;
      opacity: ${theme.watermarkTextOpacity};
    }

    .watermark-text.style-1 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 24pt;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .watermark-text.style-2 {
      font-family: Georgia, serif;
      font-size: 18pt;
      font-style: italic;
      letter-spacing: 4px;
      font-weight: normal;
    }

    .watermark-text.style-3 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 22pt;
      font-weight: 900;
      letter-spacing: 3px;
    }

    .watermark-text.style-4 {
      font-family: 'Courier New', monospace;
      font-size: 19pt;
      font-weight: bold;
      letter-spacing: 2px;
    }

    /* En-tête avec 5 blocs */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      text-align: center;
      margin-bottom: ${theme.sectionSpacing}mm;
      gap: 3mm;
    }

    .header-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .logo-box {
      width: auto;
      height: ${theme.fmspLogoSize}px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      flex-shrink: 0;
      padding-left: 50px;
    }

    .logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .coat-of-arms {
      width: auto;
      height: ${theme.coatOfArmsSize}px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      flex-shrink: 0;
    }

    .coat-of-arms img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .ministry-logo {
      width: auto;
      height: ${theme.minesupLogoSize}px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      flex-shrink: 0;
      padding-right: 50px;
    }

    .ministry-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .header-text-block {
      flex: 1;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-text {
      font-size: ${theme.headerFontSize}pt;
      line-height: 1.15;
    }

    .header-text .country {
      font-weight: bold;
      font-size: ${theme.headerFontSize + 0.5}pt;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .header-text .motto {
      font-size: ${theme.headerFontSize - 1}pt;
      font-style: italic;
      letter-spacing: 0.5px;
    }

    .header-text .stars {
      font-size: ${theme.headerFontSize - 2}pt;
      letter-spacing: 0.5px;
    }

    .header-text .institution {
      font-size: ${theme.headerFontSize - 0.5}pt;
      margin: 1px 0;
      letter-spacing: 0.2px;
    }

    .header-text .faculty {
      font-weight: bold;
      font-size: ${theme.headerFontSize}pt;
      letter-spacing: 0.3px;
    }

    /* Section titre */
    .title {
      text-align: center;
      margin-bottom: ${theme.sectionSpacing}mm;
    }

    .title h1 {
      font-size: ${theme.titleFontSize}pt;
      font-weight: bold;
      font-family: ${theme.titleFont};
      color: ${theme.primaryColor};
      margin-bottom: 3px;
      text-shadow: 3px 3px 6px rgba(0, 0, 128, 0.2);
      text-transform: uppercase;
    }

    .title .subtitle {
      font-size: ${theme.subtitleFontSize}pt;
      font-style: italic;
      color: ${theme.primaryColor};
      font-weight: 500;
    }

    .en-text {
      font-style: italic;
      display: ${theme.showBilingualText ? 'inline' : 'none'};
    }

    /* Section ministre */
    .minister-section {
      margin-bottom: ${theme.sectionSpacing - 2}mm;
    }

    .legal-text {
      font-size: ${theme.legalTextFontSize}pt;
      line-height: 1.25;
      margin: 1px 0;
      letter-spacing: 0.1px;
    }

    .legal-text-en {
      font-size: ${theme.legalTextFontSize - 0.7}pt;
      font-style: italic;
      line-height: 1.15;
      letter-spacing: 0.1px;
      display: ${theme.showBilingualText ? 'block' : 'none'};
    }

    /* Section informations destinataire */
    .recipient-section {
      display: flex;
      justify-content: space-between;
      gap: 0mm;
    }

    .recipient-left {
      flex: 1;
      font-size: ${theme.contentFontSize}pt;
    }

    .recipient-right {
      flex: 1;
      text-align: right;
      font-size: ${theme.studentInfoFontSize}pt;
    }

    .field {
      margin: 2mm 0;
      line-height: 1.3;
      display: flex;
      align-items: flex-start;
      margin-bottom: 2%;
    }

    .field-label, .field-value {
      display: inline-block;
      height: 100%;
      line-height: 90%;
    }

    .field-label {
      font-weight: normal;
    }

    .field-value {
      font-weight: bold;
      margin-left: 6px;
      font-size: ${theme.studentNameFontSize}pt;
      color: ${theme.primaryColor};
    }

    .degree-box {
      margin: 4mm 0;
      text-align: left;
      padding: 0;
      line-height: 90%;
    }

    .degree-title {
      font-size: ${theme.contentFontSize + 1}pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }

    .degree-main {
      font-size: ${theme.studentNameFontSize}pt;
      font-weight: bold;
    }

    .degree-title-en {
      font-size: ${theme.contentFontSize}pt;
      font-style: italic;
      margin-top: 1mm;
    }

    .mention-box {
      margin-top: 4mm;
      padding: 2mm;
      display: flex;
      align-items: flex-start;
      text-align: left;
      line-height: 105%;
    }

    .mention-label {
      font-weight: bold;
      font-size: ${theme.contentFontSize}pt;
      letter-spacing: 0.3px;
    }

    .mention-value {
      margin-left: 4px;
      font-weight: bold;
      font-size: ${theme.contentFontSize + 1.5}pt;
      color: ${theme.primaryColor};
    }

    .degree-main, .degree-main-en {
      color: ${theme.primaryColor};
    }

    .mention-en {
      font-style: italic;
      font-size: ${theme.contentFontSize - 1.5}pt;
    }

    /* QR Code */
    .qr-code {
      width: ${theme.qrCodeSize}px;
      height: ${theme.qrCodeSize}px;
      border: 2px solid ${theme.primaryColor};
      background: white;
      display: ${theme.showQRCode ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: ${theme.primaryColor};
      margin: 2mm 0 2mm auto;
      font-weight: bold;
    }

    .qr-code img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    /* Section signatures */
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 4mm;
      font-size: ${theme.studentInfoFontSize}pt;
    }

    .signature-box {
      text-align: center;
      width: 30%;
    }

    .signature-title {
      font-weight: bold;
      line-height: 1.2;
    }

    .signature-title-en {
      font-style: italic;
      font-size: ${theme.contentFontSize - 1.5}pt;
      display: ${theme.showBilingualText ? 'block' : 'none'};
    }

    /* Pied de page */
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: ${theme.footerFontSize}pt;
      line-height: 1.3;
      letter-spacing: 0.2px;
    }

    .footer-en {
      font-style: italic;
      font-size: ${theme.footerFontSize - 1}pt;
      letter-spacing: 0.2px;
      display: ${theme.showBilingualText ? 'block' : 'none'};
    }

    /* Styles d'impression */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }

      .diploma-container {
        page-break-after: always;
      }
    }

    /* Mode démo */
    ${isDemoMode ? `
    .demo-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      font-weight: bold;
      color: rgba(255, 0, 0, 0.15);
      z-index: 9999;
      pointer-events: none;
    }
    ` : ''}
  `;
}

/**
 * Génère le HTML pour un diplôme
 */
export async function generateDiplomaHTML(
  student: DiplomaStudentRecord,
  settings: DiplomaSchoolSettings,
  options: DiplomaGenerationOptions = {}
): Promise<string> {
  if (!student) {
    throw new Error("Les données de l'étudiant sont requises");
  }

  if (!settings) {
    throw new Error("Les paramètres de l'école sont requis");
  }

  // Utiliser le thème fourni ou le thème par défaut
  const theme = options.theme || settings.theme || defaultDiplomaTheme;
  const isDemoMode = options.demoMode || false;

  // Générer le QR code si nécessaire
  let qrCodeImage = options.qrCodeImage;
  if (!qrCodeImage && theme.showQRCode) {
    qrCodeImage = await generateDiplomaQRCode(student);
  }

  // Récupérer les logos - IMPORTANT: Utiliser le logo de la faculté
  const fmspLogo = settings.facultyLogo || ''; // Logo de la faculté (principal)
  const universityLogo = settings.universityLogo || '';
  const coatOfArms = settings.coatOfArms || '';
  const ministryLogo = settings.ministryLogo || '';
  // IMPORTANT: Utiliser le logo de l'université comme fond/watermark par défaut
  // Ordre de priorité inversé: universityLogo > facultyLogo > watermarkLogo personnalisé
  const watermarkLogo = universityLogo || settings.facultyLogo || settings.watermarkLogo;

  // Données de l'étudiant
  const fullName = `${student.NOM} ${student.PRENOM}`;
  const birthDate = student["DATE DE NAISSANCE"];
  const birthPlace = student["LIEU DE NAISSANCE"];
  const matricule = student.MATRICULE;
  const diplomaTitleFr = student["TITRE DIPLOME FR"];
  const diplomaTitleEn = student["TITRE DIPLOME EN"];
  const mentionFr = student.MENTION;
  const mentionEn = student.MENTION_EN || student.MENTION;
  const option = student.OPTION || '/';
  const optionEn = student.OPTION_EN || student.OPTION || '/';
  const yearObtention = student["ANNEE OBTENTION"];
  const juryAdmissionDate = student["DATE JURY ADMISSION"];
  const juryDeliberationDate = student["DATE JURY DELIBERATION"];

  // Générer le HTML
  const html = `<!DOCTYPE html>
<html lang="${theme.primaryLanguage === 'english' ? 'en' : 'fr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${diplomaTitleFr}</title>
    <style>${generateDiplomaStyles(theme, isDemoMode)}</style>
</head>
<body>
    <div class="diploma-container">
        ${isDemoMode ? '<div class="demo-watermark">DÉMO</div>' : ''}

        <!-- Bordures décoratives -->
        <div class="outer-border">
            <div class="inner-border"></div>
        </div>

        <!-- Filigrane -->
        <div class="watermark">
            <!-- Grand logo central -->
            ${watermarkLogo ? `<img src="${watermarkLogo}" alt="" class="watermark-center-logo">` : ''}

            <!-- Motif de texte autour -->
            <div class="watermark-grid">
                ${Array(24).fill(0).map((_, i) => {
                  const styleClass = `style-${(i % 4) + 1}`;
                  return `<div class="watermark-item"><div class="watermark-text ${i % 4 === 0 ? '' : styleClass}">FMSP • UDo</div></div>`;
                }).join('\n')}
            </div>
        </div>

        <div class="content">
            <!-- En-tête avec 5 blocs -->
            <div class="header">
                <!-- Bloc 1: Logo Faculté -->
                <div class="header-block">
                    ${fmspLogo ? `<div class="logo-box"><img src="${fmspLogo}" alt="Logo Faculté"></div>` : ''}
                </div>

                <!-- Bloc 2: Texte gauche -->
                <div class="header-block header-text-block">
                    <div class="header-text">
                        <div class="country">REPUBLIQUE DU CAMEROUN</div>
                        <div class="motto">Paix-Travail-Patrie</div>
                        <div class="stars">********************</div>
                        <div class="institution">MINISTERE DE L'ENSEIGNEMENT SUPERIEUR</div>
                        <div class="stars">********************</div>
                        <div class="institution">UNIVERSITE DE DOUALA</div>
                        <div class="stars">********************</div>
                        <div class="faculty">FACULTE DE MEDECINE ET DES<br>SCIENCES PHARMACEUTIQUES</div>
                    </div>
                </div>

                <!-- Bloc 3: Armoiries (plus grand) -->
                <div class="header-block">
                    ${coatOfArms ? `<div class="coat-of-arms"><img src="${coatOfArms}" alt="Armoiries du Cameroun"></div>` : ''}
                </div>

                <!-- Bloc 4: Texte droit -->
                <div class="header-block header-text-block">
                    <div class="header-text">
                        <div class="country">REPUBLIC OF CAMEROON</div>
                        <div class="motto">Peace-Work-Fatherland</div>
                        <div class="stars">********************</div>
                        <div class="institution">MINISTRY OF HIGHER EDUCATION</div>
                        <div class="stars">********************</div>
                        <div class="institution">UNIVERSITY OF DOUALA</div>
                        <div class="stars">********************</div>
                        <div class="faculty">FACULTY OF MEDICINE AND<br>PHARMACEUTICAL SCIENCES</div>
                    </div>
                </div>

                <!-- Bloc 5: Logo MINESUP -->
                <div class="header-block">
                    ${ministryLogo ? `<div class="ministry-logo"><img src="${ministryLogo}" alt="Logo MINESUP"></div>` : ''}
                </div>
            </div>

            <!-- Titre -->
            <div class="title">
                <h1>${diplomaTitleFr}</h1>
                <div class="subtitle en-text">${diplomaTitleEn}</div>
            </div>

            <!-- Section Ministre -->
            <div class="minister-section">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm;">
                    <div style="flex: 1;">
                        <div class="legal-text">Vu le décret n°93/036 portant organisation administrative de l'Université de Douala</div>
                        <div class="legal-text legal-text-en"><em>Mindful of decree N° 93/036 to organize the administrative and academic structure of the University of Douala</em></div>

                        <div class="legal-text">Vu les textes en vigueur, portant organisation des enseignements et des évaluations à la Faculté de Médecine et des Sciences Pharmaceutiques</div>
                        <div class="legal-text legal-text-en"><em>Mindful of the text in force, of the regulations organizing the courses and examinations at the Faculty of Medicine and Pharmaceutical Sciences</em></div>

                        <div class="legal-text">Vu le Procès-verbal du jury d'admission, session du <strong>${juryAdmissionDate}</strong></div>
                        <div class="legal-text legal-text-en"><em>Mindful of the results sheets of panel admission of ${juryAdmissionDate}</em></div>

                        <div class="legal-text">Vu le Procès-verbal des délibérations du jury, session du <strong>${juryDeliberationDate}</strong></div>
                        <div class="legal-text legal-text-en"><em>Mindful of the minute of deliberations of the promotion jury sitting of ${juryDeliberationDate}</em></div>
                    </div>
                    <div style="width: 35%; padding-left: 5mm; display: flex; flex-direction: column; align-items: flex-end;">
                        <div style="margin-top: 3mm; width: 100%;">
                            <div style="font-weight: bold; font-size: 9pt; text-align: right;">N°______________MINESUP/DCAA/UD/FMSP</div>
                            <div class="qr-code">
                                ${qrCodeImage ? `<img src="${qrCodeImage}" alt="QR Code">` : 'QR'}
                            </div>
                            <div style="margin-top: 2mm; text-align: right;">
                                <div style="font-weight: bold; font-size: 9pt;">N° Matricule : ${matricule}</div>
                                <div style="font-style: italic; font-size: 7.5pt; font-weight: normal;" class="en-text"><em>Matriculation N<sup>o</sup> : ${matricule}</em></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section Destinataire -->
            <div class="recipient-section">
                <div class="recipient-left">
                    <div class="field">
                        <div class="field-label">Délivre à M./Mlle <br><span style="font-style: italic; font-size: 8.5pt;" class="en-text"><em>Confers on Mr/Ms</em></span></div>
                        <div class="field-value">${fullName}</div>
                    </div>

                    <div class="field">
                        <div class="field-label">Né(e) le : <br><span style="font-style: italic; font-size: 8.5pt;" class="en-text"><em>Born on</em></span></div>
                        <div class="field-value">${birthDate} à ${birthPlace} <br> <span style="font-weight: normal; font-size: 10pt; font-style: italic;" class="en-text"><em>${birthDate} in ${birthPlace}</em></span></div>
                    </div>

                    <div class="field">
                        <div class="field-label">Option : <br> <span style="font-style: italic; font-size: 8.5pt;" class="en-text"><em>Speciality</em></span></div>
                        <div class="field-value">${option}</div>
                    </div>

                    <div class="field">
                        <div class="field-label">Année d'obtention: <br>  <span style="font-style: italic; font-size: 8.5pt;" class="en-text"><em>Year of completion</em></span> </div>
                        <div class="field-value">${yearObtention}</div>
                    </div>
                </div>

                <div class="recipient-right">
                    <div class="degree-box" style="margin-top: 2mm;">
                        <div class="degree-title"><span class="degree-main">${diplomaTitleFr}</span></div>
                        <div class="degree-title-en en-text"><em><span class="degree-main-en">${diplomaTitleEn}</span></em></div>
                    </div>
                    <div class="mention-box">
                        <div class="mention-label">Mention :  <br> <span class="mention-en en-text"><em>Grade:</em></span></div>
                        <div class="mention-value">${mentionFr} <br> <span style="font-weight: normal; font-size: 10pt; font-style: italic;" class="en-text"><em>${mentionEn}</em></span></div>
                    </div>

                    <div style="margin-top: 6mm; padding-right: 41%;">
                        <div style="font-size: 9.5pt;">
                            <div style="font-weight: bold;">Fait à Douala, Le</div>
                            <div style="font-style: italic; font-size: 8.5pt;" class="en-text"><em>Done in Douala, The</em></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Signatures -->
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-title">L'impétrant</div>
                    <div class="signature-title-en en-text"><em>The Holder</em></div>
                </div>

                <div class="signature-box">
                    <div class="signature-title">Le Recteur</div>
                    <div class="signature-title-en en-text"><em>The Rector</em></div>
                </div>

                <div class="signature-box">
                    <div class="signature-title">Le Ministre d'Etat, Ministre de l'Enseignement Supérieur,<br>Chancelier des Ordres Académiques</div>
                    <div class="signature-title-en en-text"><em>The Minister of State, Minister of Higher Education,<br>Chancellor of Academics Orders</em></div>
                </div>
            </div>

            <!-- Pied de page -->
            <div class="footer">
                <div>En foi de quoi ce diplôme lui est délivré pour servir et valoir ce que de droit</div>
                <div class="footer-en en-text"><em>In witness this diploma is issued to serve when and where necessary</em></div>
            </div>
        </div>
    </div>
</body>
</html>`;

  return html;
}
