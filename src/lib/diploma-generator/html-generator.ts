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
 * @param student - Données de l'étudiant
 * @param useCompact - Si true, utilise le format compact (6 champs), sinon format complet (11 champs)
 */
async function generateDiplomaQRCode(student: DiplomaStudentRecord, useCompact: boolean = false): Promise<string> {
  let qrData: any;

  if (useCompact) {
    // FORMAT COMPACT (Option 1) - 6 champs essentiels avec clés courtes
    qrData = {
      mat: student.MATRICULE,
      nom: student.PRENOM && student.PRENOM.trim() !== '' && student.PRENOM.trim() !== 'N/D' ? `${student.NOM} ${student.PRENOM}` : student.NOM,
      date: student["DATE DE NAISSANCE"],
      dipl: student["ANNEE OBTENTION"],
      moy: student.MOYENNE,
      ment: student.MENTION,
    };
  } else {
    // FORMAT COMPLET - 11 champs (original)
    qrData = {
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
  }

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
      font-size: ${theme.watermarkTextSize}pt;
      font-weight: bold;
      color: ${theme.watermarkTextColor};
      font-family: Arial, Helvetica, sans-serif;
      white-space: nowrap;
      letter-spacing: 2px;
      opacity: ${theme.watermarkTextOpacity};
    }

    .watermark-text.style-1 {
      font-family: 'Times New Roman', Times, serif;
      font-size: ${theme.watermarkTextSize + 4}pt;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .watermark-text.style-2 {
      font-family: Georgia, serif;
      font-size: ${theme.watermarkTextSize - 2}pt;
      font-style: italic;
      letter-spacing: 4px;
      font-weight: normal;
    }

    .watermark-text.style-3 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${theme.watermarkTextSize + 2}pt;
      font-weight: 900;
      letter-spacing: 3px;
    }

    .watermark-text.style-4 {
      font-family: 'Courier New', monospace;
      font-size: ${theme.watermarkTextSize - 1}pt;
      font-weight: bold;
      letter-spacing: 2px;
    }

    /* En-tête avec 3 blocs */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      text-align: center;
      margin-bottom: ${theme.sectionSpacing}mm;
      gap: 3mm;
      ${theme.headerBlockMinHeight > 0 ? `min-height: ${theme.headerBlockMinHeight}px;` : ''}
    }

    .header-block {
      display: flex;
      flex-direction: column;
    
    }

    .logo-box {
      width: auto;
      height: ${theme.fmspLogoSize}px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      flex-shrink: 0;
      padding-left: ${theme.fmspLogoOffsetX}px;
      margin-top: ${theme.fmspLogoOffsetY}px;
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
      margin-left: ${theme.coatOfArmsOffsetX}px;
      margin-top: ${theme.coatOfArmsOffsetY}px;
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
      padding-right: ${Math.abs(theme.minesupLogoOffsetX)}px;
      margin-top: ${theme.minesupLogoOffsetY}px;
    }

    .ministry-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .header-text-block {
      flex: 1;
      display: flex;
    }

    .header-text-block-right{
      align-items: flex-start;
    }

    .header-text-block-left{
      align-items: flex-end;
    }

    .header-text {
      width: max-content;
      text-align: center;
      font-family: ${theme.headerFont};
      font-size: ${theme.headerFontSize}pt;
      line-height: ${theme.headerLineHeight};
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

    /* Section titre avec logos sur les côtés */
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: ${theme.titleBlockMarginTop}mm;
      margin-bottom: ${theme.titleBlockMarginBottom}mm;
      gap: 3mm;
    }

    .title {
      text-align: center;
      flex: 1;
    }

    .title h1 {
      font-size: ${theme.titleFontSize}pt;
      font-weight: bold;
      font-family: ${theme.titleFont};
      color: ${theme.primaryColor};
      margin-bottom: 3px;
      line-height: ${theme.titleLineHeight};
      letter-spacing: ${theme.titleLetterSpacing}px;
      text-shadow: ${theme.titleTextShadow ? `${theme.titleShadowOffsetX}px ${theme.titleShadowOffsetY}px ${theme.titleShadowBlur}px ${theme.titleShadowColor}40` : 'none'};
      text-transform: uppercase;
    }

    .title .subtitle {
      font-family: ${theme.subtitleFont};
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
      margin-bottom: ${theme.ministerBlockMarginBottom}mm;
    }

    .legal-text {
      font-family: ${theme.legalTextFont};
      font-size: ${theme.legalTextFontSize}pt;
      line-height: 1.25;
      margin: 1px 0;
      letter-spacing: 0.1px;
      font-weight: bold;
    }

    .legal-text-en {
      font-family: ${theme.legalTextFont};
      font-size: ${theme.legalTextFontSize - 0.7}pt;
      font-style: italic;
      line-height: 1.15;
      letter-spacing: 0.1px;
      font-weight: normal;
      display: ${theme.showBilingualText ? 'block' : 'none'};
    }

   /* Section informations destinataire */
    .recipient-section {
      display: flex;
      justify-content: space-between;
      gap: 0mm;
      margin-bottom: ${theme.recipientBlockMarginBottom}mm;
    }

    .recipient-left {
      flex: 2.5;
      font-family: ${theme.studentInfoFont};
      font-size: ${theme.contentFontSize}pt;
    }

    .recipient-right {
      flex: 1;
      padding-left: 4mm;
      text-align: left;
      font-family: ${theme.studentInfoFont};
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
      font-weight: bold;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .field-value {
      font-weight: bold;
      margin-left: 6px;
    }

    .field-value-fullname {
      font-family: ${theme.studentNameFont};
      font-size: ${theme.studentNameFontSize}pt;
      color: ${theme.fullNameColor};
    }

    .field-value-birthinfo {
      font-family: ${theme.birthInfoFont};
      font-size: ${theme.birthInfoFontSize}pt;
      color: ${theme.birthInfoColor};
    }

    .field-value-option {
      font-family: ${theme.optionFont};
      font-size: ${theme.optionFontSize}pt;
      color: ${theme.optionColor};
    }

    .field-value-diploma-title {
      font-family: ${theme.diplomaTitleValueFont};
      font-size: ${theme.diplomaTitleValueFontSize}pt;
      color: ${theme.diplomaTitleValueColor};
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
      margin-top: 0mm;
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

    .matricule-value {
      font-family: ${theme.matriculeFont};
      margin-left: 4px;
      font-weight: bold;
      font-size: ${theme.matriculeFontSize}pt;
      color: ${theme.matriculeColor};
    }

    .mention-value {
      font-family: ${theme.mentionFont};
      margin-left: 4px;
      font-weight: bold;
      font-size: ${theme.mentionFontSize}pt;
      color: ${theme.mentionColor};
    }

    .degree-main, .degree-main-en {
      color: ${theme.primaryColor};
    }

    .mention-en {
      font-style: italic;
      font-size: ${theme.contentFontSize - 1.5}pt;
    }

    .year-obtention-value {
      font-family: ${theme.yearObtentionFont};
      font-size: ${theme.yearObtentionFontSize}pt;
      color: ${theme.yearObtentionColor};
      font-weight: bold;
    }

    .jury-date-value {
      font-family: ${theme.juryDatesFont};
      font-size: ${theme.juryDatesFontSize}pt;
      color: ${theme.juryDatesColor};
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
      margin: 2mm ${theme.qrCodeOffsetX}px 2mm auto;
      margin-top: ${theme.qrCodeOffsetY}px;
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
      margin-top: ${theme.signatureBlockMarginTop}mm;
      font-size: ${theme.studentInfoFontSize}pt;
    }

    .signature-box {
      text-align: center;
      width: 30%;
    }

    .signature-box-minister {
      text-align: center;
      width: 36%;
    }

    .signature-title {
      font-family: ${theme.signatureFont};
      font-weight: bold;
      line-height: 1.2;
    }

    .signature-title-en {
      font-family: ${theme.signatureFont};
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
      text-align: left;
      font-family: ${theme.footerFont};
      font-size: ${theme.footerFontSize}pt;
      line-height: 1.3;
      letter-spacing: 0.2px;
    }

    .footer-en {
      font-family: ${theme.footerFont};
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
    qrCodeImage = await generateDiplomaQRCode(student, theme.useCompactQR);
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
  const prenom = student.PRENOM && student.PRENOM.trim() !== '' && student.PRENOM.trim() !== 'N/D' ? student.PRENOM.trim() : '';
  const fullName = prenom ? `${student.NOM} ${prenom}` : student.NOM;
  const birthDate = student["DATE DE NAISSANCE"];
  const birthPlace = student["LIEU DE NAISSANCE"];
  const matricule = student.MATRICULE;
  const diplomaTitleFr = student["TITRE DIPLOME FR"];
  const diplomaTitleEn = student["TITRE DIPLOME EN"];
  const mentionFr = student.MENTION;
  const mentionEn = student.MENTION_EN || student.MENTION;
  const option = student.OPTION && student.OPTION.trim() !== '' && student.OPTION.trim() !== 'N/D' && student.OPTION.trim() !== '/' ? student.OPTION.trim() : '';
  const optionEn = option ? (student.OPTION_EN || student.OPTION || '') : '';
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
            <!-- En-tête avec 3 blocs -->
            <div class="header">
                <!-- Bloc 1: Texte gauche -->
                <div class="header-block header-text-block header-text-block-right">
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

                <!-- Bloc 2: Armoiries (centre) -->
                <div class="header-block">
                    ${coatOfArms ? `<div class="coat-of-arms"><img src="${coatOfArms}" alt="Armoiries du Cameroun"></div>` : ''}
                </div>

                <!-- Bloc 3: Texte droit -->
                <div class="header-block header-text-block header-text-block-left">
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
            </div>

            <!-- Titre avec logos sur les côtés -->
            <div class="title-row">
                <!-- Logo Faculté (gauche) -->
                <div class="header-block">
                    ${fmspLogo ? `<div class="logo-box"><img src="${fmspLogo}" alt="Logo Faculté"></div>` : ''}
                </div>

                <!-- Titre central -->
                <div class="title">
                    <h1>${diplomaTitleFr}</h1>
                    <div class="subtitle en-text">${diplomaTitleEn}</div>
                </div>

                <!-- Logo MINESUP (droite) -->
                <div class="header-block">
                    ${ministryLogo ? `<div class="ministry-logo"><img src="${ministryLogo}" alt="Logo MINESUP"></div>` : ''}
                </div>
            </div>

            <!-- Section Ministre -->
            <div class="minister-section">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm;">
                    <div style="flex: 1;">
                        <div class="legal-text">LE MINISTRE D'ETAT, MINISTRE DE L'ENSEIGNEMENT SUPERIEUR, CHANCELIER DES ORDRES ACADEMIQUES</div>
                        <div class="legal-text legal-text-en"><em>THE MINISTER OF STATE, MINISTER OF HIGHER EDUCATION, CHANCELLOR OF ACADEMIC ORDERS</em></div>

                        <div class="legal-text">Vu le décret n°93/036 portant organisation administrative de l'Université de Douala</div>
                        <div class="legal-text legal-text-en"><em>Mindful of decree N° 93/036 to organize the administrative and academic structure of the University of Douala</em></div>

                        <div class="legal-text">Vu les textes en vigueur, portant organisation des enseignements et des évaluations à la Faculté de Médecine et des Sciences Pharmaceutiques</div>
                        <div class="legal-text legal-text-en"><em>Mindful of the text in force, of the regulations organizing the courses and examinations at the Faculty of Medicine and Pharmaceutical Sciences</em></div>

                        <div class="legal-text">Vu le Procès-verbal du jury d'admission, session du <strong class="jury-date-value">${juryAdmissionDate}</strong></div>
                        <div class="legal-text legal-text-en"><em>Mindful of the results sheets of panel admission of ${juryAdmissionDate}</em></div>

                        <div class="legal-text">Vu le Procès-verbal des délibérations du jury, session du <strong class="jury-date-value">${juryDeliberationDate}</strong></div>
                        <div class="legal-text legal-text-en"><em>Mindful of the minute of deliberations of the promotion jury sitting of ${juryDeliberationDate}</em></div>
                    </div>
                    <div style="width: 35%; padding-left: 5mm; display: flex; flex-direction: column; align-items: flex-end; font-family: ${theme.referenceFont};">
                        <div style="margin-top: 3mm; width: 100%; position: relative; top: ${theme.referenceNumberOffsetY}px; right: ${theme.referenceNumberOffsetX}px;">
                            <div style="font-weight: bold; font-size: ${theme.referenceNumberFontSize}pt; text-align: right;">N°______________MINESUP/DCAA/UD/FMSP</div>
                            <div class="qr-code">
                                ${qrCodeImage ? `<img src="${qrCodeImage}" alt="QR Code">` : 'QR'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section Destinataire -->
            <div class="recipient-section">
                <div class="recipient-left">
                    <div class="field">
                        <div class="field-label">Délivre à M./Mlle <br><span style="font-style: italic; font-weight: normal;font-size: 8.5pt;" class="en-text"><em>Confers to Mr/Ms</em></span></div>
                        <div class="field-value field-value-fullname">${fullName}</div>
                    </div>

                    <div class="field">
                        <div class="field-label">Né(e) le : <br><span style="font-style: italic; font-weight: normal;font-size: 8.5pt;" class="en-text"><em>Born on</em></span></div>
                        <div class="field-value field-value-birthinfo">${birthDate} À ${birthPlace} <br> <span style="font-weight: normal; font-size: 10pt; font-style: italic;" class="en-text"><em>${birthDate} At ${birthPlace}</em></span></div>
                    </div>
                </div>

                <div class="recipient-right">
                    <div class="mention-box">
                      <div class="mention-label">Matricule :  <br> <span class="mention-en en-text"><em>Registration :</em></span></div>
                      <div class="matricule-value">${matricule} <br> <span style="font-weight: normal; font-size: 10pt; font-style: italic;" class="en-text"><em>${matricule}</em></span></div>
                    </div>
                    <div class="mention-box" style="margin-top: 4mm;">
                        <div class="mention-label">Mention :  <br> <span class="mention-en en-text"><em>Grade:</em></span></div>
                        <div class="mention-value">${mentionFr} <br> <span style="font-weight: normal; font-size: 10pt; font-style: italic;" class="en-text"><em>${mentionEn}</em></span></div>
                    </div>
                </div>
            </div>

            <!-- Ligne titre diplôme + Douala/année -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${theme.recipientBlockMarginBottom}mm;">
                <div style="flex: 2.5; font-family: ${theme.studentInfoFont}; font-size: ${theme.contentFontSize}pt;">
                    <div class="field" style="justify-content: center; text-align: center;">
                        <div class="field-value field-value-diploma-title" style="margin-left: 0;">Le ${diplomaTitleFr} <br> <span style="font-weight: normal; font-size: 12pt; font-style: italic;" class="en-text"><em>The ${diplomaTitleEn}</em></span></div>
                    </div>
                    ${option ? `<div class="field">
                        <div class="field-label">Option : <br><span style="font-style: italic; font-weight: normal;font-size: 8.5pt;" class="en-text"><em>Speciality</em></span></div>
                        <div class="field-value field-value-option">${option} <br> <span style="font-weight: normal; font-size: 10pt; font-style: italic;" class="en-text"><em>${optionEn}</em></span></div>
                    </div>` : ''}
                </div>
                <div style="flex: 1; padding-left: 4mm; text-align: left; font-family: ${theme.studentInfoFont}; font-size: ${theme.studentInfoFontSize}pt;">
                    <div>
                        <div style="font-weight: bold; font-size: ${theme.contentFontSize}pt;">Année d'obtention : <span class="year-obtention-value">${yearObtention}</span></div>
                        <div style="font-style: italic; font-weight: normal; font-size: 8.5pt;" class="en-text"><em>Year of completion</em></div>
                    </div>
                    <div style="margin-top: 2mm; font-size: 9.5pt;">
                        <div style="font-weight: bold;">Douala, le</div>
                        <div style="font-style: italic; font-weight: normal;font-size: 8.5pt;" class="en-text"><em>Douala, in the</em></div>
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

                <div class="signature-box-minister">
                    <div class="signature-title">Le Ministre d'Etat, Ministre de l'Enseignement Supérieur,<br>Chancelier des Ordres Académiques</div>
                    <div class="signature-title-en en-text"><em>The Minister of State, Minister of Higher Education,<br>Chancellor of Academic Orders</em></div>
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
