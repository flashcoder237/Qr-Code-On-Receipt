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
 * Convertit une moyenne en grade (ex: 15 → B+)
 */
function convertAverageToGrade(average: number | string): string {
  const avg = typeof average === 'string' ? parseFloat(average) : average;

  if (isNaN(avg)) return '';

  if (avg >= 18) return 'A+';
  if (avg >= 16) return 'A';
  if (avg >= 15) return 'B+';
  if (avg >= 14) return 'B';
  if (avg >= 13) return 'C+';
  if (avg >= 12) return 'C';
  if (avg >= 10) return 'D';
  return 'F';
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
      top: 60%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .watermark img {
      width: auto;
      height: 550px;
      opacity:0.1;
    }

    /* Contenu principal */
    .content {
      position: absolute;
      top: 12mm;
      left: 20mm;
      right: 20mm;
      bottom: 12mm;
      z-index: 2;
    }

    /* En-tête bilingue */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin: ${theme.sectionSpacing/2}mm;
    }

    .header-left, .header-right {
      flex: 1;
      text-align: center;
      padding: 0px 30px;
    }

    .header-center {
      flex: 0 0 auto;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 15px;
      padding: 0 20px;
    }

    .header-center img {
      width: auto;
      height: 80px;
      object-fit: contain;
    }

    .header-text {
      font-family: ${theme.titleFont};
      font-size: ${theme.headerFontSize}pt;
      color: #000000;
      line-height: 1.1;
      font-weight: bold;
    }

    .header-subtext {
      font-size: ${theme.headerFontSize - 1}pt;
      color: #000000;
      font-style: italic;
    }

    .ministry-name {
      font-size: ${theme.headerFontSize - 0.5}pt;
      color: #000000;
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
      color: ${theme.secondaryColor};
    }

    .legal-text-fr {
      font-weight: normal;
    }

    .legal-text-en {
      font-style: italic;
      color: ${theme.secondaryColor};
      opacity: 0.9;
      font-size: ${theme.legalTextFontSize - 1}pt;
    }

    /* Section ministre (textes légaux) */
    .minister-section {
      
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
      font-size: ${theme.contentFontSize}pt;
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

    .mention-box {
      display: inline-flex;
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

    /* Texte de foi */
    .certificate-text {
      position: absolute;
      text-align: center;
      font-size: ${theme.contentFontSize-2}pt;
      font-style: italic;
      color: ${theme.secondaryColor};
      bottom: ${theme.sectionSpacing}mm;
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
      font-size: ${theme.contentFontSize+2}pt;
      font-weight: bold;
      color: ${theme.primaryColor};
      margin-bottom: 40px;
    }

    .signature-line {
      width: 150px;
      border-top: 1px solid ${theme.secondaryColor};
      margin: 0 auto;
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
  <title>${student.TITRE_ATTESTATION_FR || 'ATTESTATION DE QUALIFICATION PROFESSIONNELLE'} - ${student.NOM} ${student.PRENOM}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="attestation-container">
    <!-- Bordures décoratives -->
    <div class="outer-border">
      <div class="inner-border"></div>
    </div>

    <!-- Filigrane -->
    ${centre.watermarkLogo ? `
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
          ${centre.administrativeInstances && centre.administrativeInstances.length > 0 ?
            centre.administrativeInstances.map(inst => `
            <div class="ministry-name">${inst.nameFr}</div>
            <div class="header-subtext">---------</div>
            `).join('') :
            centre.administrativeInstanceNameFr ? `
            <div class="ministry-name">${centre.administrativeInstanceNameFr}</div>
            <div class="header-subtext">---------</div>
            ` : ''
          }
        </div>

        <div class="header-center">
          ${centre.administrativeInstances && centre.administrativeInstances.length > 0 ?
            centre.administrativeInstances
              .filter(inst => inst.showLogoOnAttestations && inst.logo)
              .map(inst => `<img src="${inst.logo}" alt="${inst.nameFr}" />`).join('') :
            centre.administrativeInstanceLogo ? `<img src="${centre.administrativeInstanceLogo}" alt="Logo MINFOP" />` : ''
          }
          ${centre.logo ? `
          <img src="${centre.logo}" alt="Logo Centre" />
          ` : ''}
        </div>

        <div class="header-right">
          <div class="header-text">REPUBLIC OF CAMEROON</div>
          <div class="header-subtext">Peace – Work – Fatherland</div>
          <div class="header-subtext">---------</div>
          ${centre.administrativeInstances && centre.administrativeInstances.length > 0 ?
            centre.administrativeInstances.map(inst => `
            <div class="ministry-name">${inst.nameEn}</div>
            <div class="header-subtext">---------</div>
            `).join('') :
            centre.administrativeInstanceNameEn ? `
            <div class="ministry-name">${centre.administrativeInstanceNameEn}</div>
            <div class="header-subtext">---------</div>
            ` : ''
          }
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

      <!-- Titre principal (depuis Excel ou par défaut) -->
      <h1 class="main-title">${student.TITRE_ATTESTATION_FR || 'ATTESTATION DE QUALIFICATION PROFESSIONNELLE'}</h1>
      <h2 class="main-subtitle">${student.TITRE_ATTESTATION_EN || 'VOCATIONAL TRAINING CERTIFICATE'}</h2>

      <!-- Section textes légaux (comme minister-section dans diplômes) -->
      <div class="minister-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm;">
          <!-- Textes légaux à gauche -->
          <div style="flex: 1;">
            ${centre.legalTexts && centre.legalTexts.length > 0 ?
              centre.legalTexts.map(legal => `
                <div class="legal-text">${legal.textFr}</div>
                <div class="legal-text-en"><em>${legal.textEn}</em></div>
              `).join('') : ''}

            <!-- Session d'examen -->
            ${student.SESSION_EXAMEN ? `
            <div class="legal-text">Vu le procès-verbal de délibération, session de ${student.SESSION_EXAMEN}</div>
            <div class="legal-text-en"><em>Mindful of the results of examination session of ${student.SESSION_EXAMEN}</em></div>
            ` : ''}
          </div>

          <!-- QR Code et numéro à droite -->
          <div style="width: 35%; padding-left: 5mm; display: flex; flex-direction: column; align-items: flex-end;">
            <div style="width: 100%;">
              ${student.NUMERO_ORDRE ? `
              <div style="font-weight: bold; font-size: 9pt; text-align: right;">N° ${student.NUMERO_ORDRE}${centre.acronymFr ? '/' + centre.acronymFr : ''}${student.SPECIALITE_ABR ? '/' + student.SPECIALITE_ABR : ''} / ${new Date().getFullYear()}</div>
              ` : ''}
              ${includeQRCode && qrCodeImage ? `
              <div class="qr-code">
                <img src="${qrCodeImage}" alt="QR Code">
              </div>
              ` : ''}
              <div style="text-align: right;">
                <div style="font-weight: bold; font-size: 9pt;">N° Matricule : ${student.MATRICULE}</div>
                <div style="font-style: italic; font-size: 7.5pt; font-weight: normal;"><em>Matriculation N°: ${student.MATRICULE}</em></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section destinataire (comme recipient-section dans diplômes) -->
      <div class="recipient-section">
        <div class="recipient-left">
          <div class="field">
            <div class="field-label">Délivre à M./Mlle <br><span style="font-style: italic; font-size: 8.5pt;"><em>Confers on Mr/Ms</em></span></div>
            <div class="field-value">${student.NOM} ${student.PRENOM}</div>
          </div>

          <div class="field">
            <div class="field-label">Né(e) le : <br><span style="font-style: italic; font-size: 8.5pt;"><em>Born on</em></span></div>
            <div class="field-value">${student["DATE DE NAISSANCE"]} à ${student["LIEU DE NAISSANCE"]} <br> <span style="font-weight: normal; font-size: 10pt; font-style: italic;"><em>${student["DATE DE NAISSANCE"]} in ${student["LIEU DE NAISSANCE"]}</em></span></div>
          </div>
           <div class="mention-box">
            <div class="mention-label">Mention :  <br> <span style="font-style: italic; font-size: ${theme.contentFontSize - 1.5}pt;"><em>Grade:</em></span></div>
            <div class="mention-value">${student.MENTION}</div>
          </div>

          <div class="mention-box">
            <div class="mention-label">Grade :  <br> <span style="font-style: italic; font-size: ${theme.contentFontSize - 1.5}pt;"><em>Level:</em></span></div>
            <div class="mention-value">${convertAverageToGrade(student.MOYENNE)}</div>
          </div>
        </div>

        <div class="recipient-right">
          <div class="degree-box" style="margin-top: 2mm;">
            <div class="degree-title"><span style="font-size: ${theme.studentNameFontSize}pt; font-weight: bold; color: ${theme.primaryColor};">L'Attestation de Qualification Professionnelle dans la spécialité</span></div>
            <div style="font-style: italic; font-size: ${theme.contentFontSize}pt; margin-top: 1mm;"><em><span style="color: ${theme.primaryColor};">The Vocational Training Certificate in the speciality</span></em></div>
            <div style="font-weight: bold; font-size: ${theme.studentNameFontSize + 2}pt; margin-top: 2mm; color: ${theme.primaryColor};">${student.SPECIALITE}</div>
            ${student.SPECIALITE_EN ? `<div style="font-style: italic; font-size: ${theme.contentFontSize}pt; margin-top: 1mm;"><em>${student.SPECIALITE_EN}</em></div>` : ''}
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
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export default generateCentreAttestationHTML;
