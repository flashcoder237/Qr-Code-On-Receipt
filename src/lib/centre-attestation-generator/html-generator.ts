// src/lib/centre-attestation-generator/html-generator.ts
// Générateur HTML pour les attestations de centres de formation

import QRCode from 'qrcode';
import {
  CentreAttestationStudentRecord,
  CentreAttestationGenerationOptions,
} from './types';
import { Centre } from '../form-schemas/centre-settings';
import { defaultCentreAttestationTheme, CentreAttestationTheme } from '../form-schemas/centre-attestation-theme';

/**
 * Génère le QR code pour une attestation de centre
 */
async function generateCentreAttestationQRCode(
  student: CentreAttestationStudentRecord,
  _useCompact: boolean = true
): Promise<string> {
  const qrData = {
    mat: student.MATRICULE,
    nom: `${student.NOM} ${student.PRENOM}`,
    date: student["DATE DE NAISSANCE"],
    spec: student.SPECIALITE,
    sess: student.SESSION_EXAMEN,
    moy: student.MOYENNE,
    ment: student.MENTION,
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
function generateCentreAttestationStyles(
  theme: CentreAttestationTheme,
  isDemoMode: boolean = false
): string {
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

    .attestation-container {
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
      z-index: 1;
    }

    .inner-border {
      position: absolute;
      top: 3mm;
      left: 3mm;
      right: 3mm;
      bottom: 3mm;
      border: ${theme.innerBorderWidth}px solid ${theme.innerBorderColor};
    }

    /* Filigrane */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: ${theme.watermarkOpacity};
      z-index: ${isDemoMode ? '-1' : '0'};
      display: ${theme.showWatermark ? 'block' : 'none'};
    }

    .watermark img {
      width: auto;
      height: 300px;
      opacity: ${theme.watermarkOpacity};
    }

    /* Contenu principal */
    .content {
      position: absolute;
      top: 12mm;
      left: 12mm;
      right: 12mm;
      bottom: 12mm;
      z-index: 2;
    }

    /* En-tête bilingue */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: ${theme.sectionSpacing}mm;
      padding-bottom: ${theme.sectionSpacing}mm;
      border-bottom: 1px solid ${theme.primaryColor};
    }

    .header-left, .header-right {
      flex: 1;
      text-align: center;
    }

    .header-center {
      flex: 0 0 auto;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 15px;
      padding: 0 20px;
    }

    .header-center img {
      width: auto;
      height: 60px;
      object-fit: contain;
    }

    .header-text {
      font-family: ${theme.titleFont};
      font-size: ${theme.headerFontSize}pt;
      color: ${theme.primaryColor};
      line-height: 1.3;
      margin-bottom: 3px;
      font-weight: bold;
    }

    .header-subtext {
      font-size: ${theme.headerFontSize - 1}pt;
      color: ${theme.secondaryColor};
      font-style: italic;
      margin-top: 2px;
    }

    .ministry-name {
      font-size: ${theme.headerFontSize - 0.5}pt;
      color: ${theme.primaryColor};
      font-weight: 600;
      margin-top: 5px;
    }

    /* Informations du centre */
    .centre-info {
      text-align: center;
      margin: ${theme.sectionSpacing}mm 0;
    }

    .centre-name {
      font-family: ${theme.titleFont};
      font-size: ${theme.contentFontSize + 2}pt;
      font-weight: bold;
      color: ${theme.primaryColor};
      margin-bottom: 5px;
    }

    .authorization {
      font-size: ${theme.contentFontSize - 1}pt;
      color: ${theme.secondaryColor};
      margin: 3px 0;
    }

    .contact-info {
      font-size: ${theme.contentFontSize - 1.5}pt;
      color: ${theme.secondaryColor};
      margin-top: 5px;
    }

    /* Titre principal */
    .main-title {
      text-align: center;
      font-family: ${theme.titleFont};
      font-size: ${theme.titleFontSize}pt;
      font-weight: bold;
      color: ${theme.primaryColor};
      margin: ${theme.sectionSpacing}mm 0 5px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .main-subtitle {
      text-align: center;
      font-family: ${theme.titleFont};
      font-size: ${theme.titleFontSize - 4}pt;
      font-style: italic;
      color: ${theme.secondaryColor};
      margin-bottom: ${theme.sectionSpacing}mm;
    }

    /* Textes légaux */
    .legal-texts {
      margin: ${theme.sectionSpacing}mm 0;
      padding: 5px 0;
    }

    .legal-text {
      font-size: ${theme.legalTextFontSize}pt;
      line-height: 1.4;
      margin-bottom: 2px;
      color: ${theme.secondaryColor};
    }

    .legal-text-fr {
      font-weight: normal;
    }

    .legal-text-en {
      font-style: italic;
      color: ${theme.secondaryColor};
      opacity: 0.9;
    }

    /* Spécialité */
    .specialty-section {
      margin: ${theme.sectionSpacing}mm 0;
      text-align: center;
    }

    .specialty-label {
      font-size: ${theme.contentFontSize}pt;
      color: ${theme.secondaryColor};
    }

    .specialty-value {
      font-family: ${theme.titleFont};
      font-size: ${theme.contentFontSize + 2}pt;
      font-weight: bold;
      color: ${theme.primaryColor};
      margin: 0 5px;
    }

    .specialty-value-en {
      font-style: italic;
      color: ${theme.secondaryColor};
    }

    /* Informations étudiant */
    .student-section {
      margin: ${theme.sectionSpacing}mm 0;
      padding: ${theme.sectionSpacing}mm;
      border: 2px solid ${theme.accentColor};
      border-radius: 5px;
      background: rgba(${parseInt(theme.accentColor.slice(1, 3), 16)}, ${parseInt(theme.accentColor.slice(3, 5), 16)}, ${parseInt(theme.accentColor.slice(5, 7), 16)}, 0.05);
    }

    .conferred-label {
      text-align: center;
      font-size: ${theme.contentFontSize}pt;
      color: ${theme.secondaryColor};
      margin-bottom: 10px;
    }

    .student-name {
      text-align: center;
      font-family: ${theme.titleFont};
      font-size: ${theme.studentNameFontSize}pt;
      font-weight: bold;
      color: ${theme.primaryColor};
      text-transform: uppercase;
      margin: 10px 0;
      letter-spacing: 1px;
    }

    .birth-info {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      font-size: ${theme.studentInfoFontSize}pt;
      color: ${theme.secondaryColor};
      margin: 10px 0;
      flex-wrap: wrap;
    }

    .birth-label {
      font-weight: normal;
    }

    .birth-value {
      font-weight: bold;
      color: ${theme.primaryColor};
    }

    .results-section {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 15px;
    }

    .result-item {
      text-align: center;
    }

    .result-label {
      font-size: ${theme.studentInfoFontSize - 1}pt;
      color: ${theme.secondaryColor};
      margin-bottom: 3px;
    }

    .result-value {
      font-family: ${theme.titleFont};
      font-size: ${theme.studentInfoFontSize + 2}pt;
      font-weight: bold;
      color: ${theme.primaryColor};
    }

    /* Texte de foi */
    .certificate-text {
      text-align: center;
      font-size: ${theme.contentFontSize}pt;
      font-style: italic;
      color: ${theme.secondaryColor};
      margin: ${theme.sectionSpacing}mm 0;
      line-height: 1.5;
    }

    /* Pied de page */
    .footer {
      position: absolute;
      bottom: 15mm;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 20mm;
    }

    .issuance {
      flex: 1;
      font-size: ${theme.footerFontSize}pt;
      color: ${theme.secondaryColor};
    }

    .issuance-label {
      margin-bottom: 3px;
    }

    .signature-section {
      flex: 1;
      text-align: center;
    }

    .signature-label {
      font-size: ${theme.footerFontSize}pt;
      font-weight: bold;
      color: ${theme.primaryColor};
      margin-bottom: 40px;
    }

    .signature-line {
      width: 150px;
      border-top: 1px solid ${theme.secondaryColor};
      margin: 0 auto;
    }

    .qr-code {
      flex: 0 0 auto;
      display: ${theme.showQRCode ? 'block' : 'none'};
    }

    .qr-code img {
      width: ${theme.qrCodeSize}px;
      height: ${theme.qrCodeSize}px;
    }

    @media print {
      .attestation-container {
        page-break-after: always;
      }
    }
  `;
}

/**
 * Génère le HTML pour une attestation de centre
 */
export async function generateCentreAttestationHTML(
  student: CentreAttestationStudentRecord,
  centre: Centre,
  options: CentreAttestationGenerationOptions
): Promise<string> {
  const theme = options.theme || defaultCentreAttestationTheme;
  const includeQRCode = options.includeQRCode !== false;

  // Générer le QR code
  const qrCodeImage = includeQRCode
    ? await generateCentreAttestationQRCode(student, options.useCompactQR !== false)
    : '';

  // Générer les styles CSS
  const styles = generateCentreAttestationStyles(theme, options.isDemoMode);

  // Construire le HTML
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attestation de Qualification Professionnelle - ${student.NOM} ${student.PRENOM}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="attestation-container">
    <!-- Bordures décoratives -->
    <div class="outer-border">
      <div class="inner-border"></div>
    </div>

    <!-- Filigrane -->
    ${theme.showWatermark && centre.watermarkLogo ? `
    <div class="watermark">
      <img src="${centre.watermarkLogo}" alt="Watermark" />
    </div>
    ` : ''}

    <div class="content">
      <!-- En-tête bilingue -->
      <div class="header">
        <div class="header-left">
          <div class="header-text">RÉPUBLIQUE DU CAMEROUN</div>
          <div class="header-subtext">Paix – travail – patrie</div>
          <div class="header-subtext">---------</div>
          ${centre.administrativeInstanceNameFr ? `
          <div class="ministry-name">${centre.administrativeInstanceNameFr}</div>
          ` : ''}
          <div class="header-subtext">---------</div>
        </div>

        <div class="header-center">
          ${centre.administrativeInstanceLogo ? `
          <img src="${centre.administrativeInstanceLogo}" alt="Logo MINFOP" />
          ` : ''}
          ${centre.logo ? `
          <img src="${centre.logo}" alt="Logo Centre" />
          ` : ''}
        </div>

        <div class="header-right">
          <div class="header-text">REPUBLIC OF CAMEROON</div>
          <div class="header-subtext">Peace – Work – Fatherland</div>
          <div class="header-subtext">---------</div>
          ${centre.administrativeInstanceNameEn ? `
          <div class="ministry-name">${centre.administrativeInstanceNameEn}</div>
          ` : ''}
          <div class="header-subtext">---------</div>
        </div>
      </div>

      <!-- Informations du centre -->
      <div class="centre-info">
        <div class="centre-name">${centre.nameFrench}</div>
        ${centre.authorizationTextFr ? `
        <div class="authorization">${centre.authorizationTextFr}</div>
        ` : ''}
        ${centre.authorizationTextEn ? `
        <div class="authorization">${centre.authorizationTextEn}</div>
        ` : ''}
        ${centre.postalBox || centre.phone ? `
        <div class="contact-info">
          ${centre.postalBox || ''} ${centre.phone ? 'TEL : ' + centre.phone : ''}
        </div>
        ` : ''}
      </div>

      <!-- Titre principal -->
      <h1 class="main-title">ATTESTATION DE QUALIFICATION PROFESSIONNELLE</h1>
      <h2 class="main-subtitle">VOCATIONAL TRAINING CERTIFICATE</h2>

      <!-- Textes légaux -->
      ${centre.legalTexts && centre.legalTexts.length > 0 ? `
      <div class="legal-texts">
        ${centre.legalTexts.map(legal => `
          <div class="legal-text legal-text-fr">${legal.textFr}</div>
          <div class="legal-text legal-text-en">${legal.textEn}</div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Spécialité -->
      <div class="specialty-section">
        <div class="specialty-label">
          L'Attestation de Qualification Professionnelle dans la spécialité :
          <span class="specialty-value">${student.SPECIALITE}</span>
          ${student.SPECIALITE_EN ? `/ <span class="specialty-value-en">${student.SPECIALITE_EN}</span>` : ''}
        </div>
        <div class="specialty-label" style="margin-top: 5px; font-style: italic;">
          The Vocational Training Certificate in the speciality
        </div>
      </div>

      <!-- Informations étudiant -->
      <div class="student-section">
        <div class="conferred-label">
          Est délivrée à :<br/>
          <em>Is conferred on</em>
        </div>

        <div class="student-name">${student.NOM} ${student.PRENOM}</div>

        <div class="birth-info">
          <span class="birth-label">Né(e) le : <br/><em>Born on</em></span>
          <span class="birth-value">${student["DATE DE NAISSANCE"]}</span>
          <span class="birth-label">A : <br/><em>At</em></span>
          <span class="birth-value">${student["LIEU DE NAISSANCE"]}</span>
        </div>

        <div class="results-section">
          <div class="result-item">
            <div class="result-label">Mention :<br/><em>Honor</em></div>
            <div class="result-value">${student.MENTION}</div>
          </div>
          <div class="result-item">
            <div class="result-label">Grade :<br/><em>Grade</em></div>
            <div class="result-value">${student.GRADE}</div>
          </div>
        </div>
      </div>

      <!-- Texte de foi -->
      <div class="certificate-text">
        En foi de quoi la présente attestation lui est établie et délivrée pour servir et valoir ce que de droit.<br/>
        <em>In witness whereof this vocational training certificate is issued to serve where and when necessary</em>
      </div>

      <!-- Pied de page -->
      <div class="footer">
        <div class="issuance">
          <div class="issuance-label">Fait à ${student.LIEU_DELIVRANCE}, le :</div>
          <div class="issuance-label"><em>Issued at</em> _______________</div>
        </div>

        <div class="signature-section">
          <div class="signature-label">
            Le/La Directeur(trice) du ${centre.name || centre.nameFrench}
          </div>
          <div class="signature-line"></div>
        </div>

        ${includeQRCode && qrCodeImage ? `
        <div class="qr-code">
          <img src="${qrCodeImage}" alt="QR Code" />
        </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export default generateCentreAttestationHTML;
