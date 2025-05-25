// src/lib/attestation-generator/html-generator.ts
import { StudentExcelRecord } from '../helpers/qrcode';
import { formatDate, calculateGrade, calculateMention } from './utils';

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
}

interface GenerationOptions {
  qrCodeImage?: string; // Base64 encoded QR code image
  qrCodePosition?: {
    x: number;
    y: number;
  };
}

/**
 * Génère le HTML pour l'attestation de réussite
 */
export async function generateAttestationHTML(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: GenerationOptions = {}
): Promise<string> {
  // Récupérer les logos au format base64
  const schoolLogo = settings.logo || '';
  const universityLogo = settings.universityLogo || '';
  const facultyLogo = settings.facultyLogo || '';
  
  // Année académique formatée
  const academicYear = student["ANNEE ACADEMIQUE"] || "2023/2024";
  
  // Date du jury
  const juryDate = student["DATE JURY"] || ''; // Date à paramétrer si nécessaire
  
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
  const fieldOfStudy = student.DOMAINE; // Domaine d'études (à paramétrer si nécessaire)
  const course = student.PARCOURS || "";
  const specialization = student.SPECIALITE || "";
  const option = student.OPTION || "";
  
  // Crédits et notes
  const credits = student["TOTAL CREDIT"] || ''; // Nombre total de crédits (à paramétrer si nécessaire)
  const average = typeof student.MOYENNE === 'number' ? student.MOYENNE.toFixed(2) : String(student.MOYENNE);
  const grade = student.GRADE || calculateGrade(typeof student.MOYENNE === 'number' ? student.MOYENNE : parseFloat(String(student.MOYENNE)));
  const mention = student.MENTION || calculateMention(typeof student.MOYENNE === 'number' ? student.MOYENNE : parseFloat(String(student.MOYENNE)));
  
  // Finalité
  const finality = student["FINALITE"] || '';

  
  // Styles CSS
  const styles = `
    @page {
      size: A4;
      margin: 0;
    }
    body {
      margin: 5mm;
      font-family: ${settings.themeFont || "'Times New Roman', Times, serif"};
      box-sizing: border-box;
      font-size: 14px;
      border: 2px double #333;
      width: 200mm;
      height: 287mm;
      position: relative;
    }
    .container {
      width: 100%;
      height: 100%;
      padding: 10px 20px;
      box-sizing: border-box;
      position: relative;
    }

      
    .header {    
      line-height: normal;
      font-size: 8px;
    }
    .header-row1{
      text-align: center;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    }
    .header h1 {
      font-size: 10px;
    }
    .header-content{
      width: 33%;
      font-size: 10px;
      line-height: 11px;
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
    .header-logo-content > div > img{
      max-width: 100%;
      min-height: 70px;
      object-fit: contain;
    }
    .header-row2 h1{
      font-weight: 100;
      text-align: center;
      font-size: large;
    }
    .header-row2 p{
      font-size: 16px;
    }
    .header-row2{
      text-align: center;
    }
    .divider {
      text-align: center;
      margin: 5px 0;
    }
    .title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
    }
    .subtitle {
      text-align: center;
      font-style: italic;
      font-size: 22px;
      margin-bottom: 10px;
    }
    .ref {
      text-align: center;
      margin: 5px 0;
      font-size:18px;
    }
    .content {
      margin: 0px 0;
    }
    .student-info {
      margin: 15px 0;
    }
    .table-container {
      width: 100%;
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 4px 8px;
      text-align: center;
    }
    .footer {
      margin-top: 2px;
      display: flex;
      justify-content: space-between;
    }
    .signature {
      width: 48%;
      text-align: left;
    }
      .sign-ipes{
      width: 100%;
      text-align: center;
      }
    .qr-code {
      text-align: center;
      margin: 0px 0;
    }
    .qr-image {
      width: 100px;
      height: 100px;
      background-color: #eee;
      display: block;
    }
    .disclaimer {
      font-size: 8px;
      font-style: italic;
      text-align: left;
      margin-top: 20px;
      display: flex;
      flex-direction: row;
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
    }
    .disclaimer div{
      padding-right: 10px;
    }
    .logos {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 10px 0;
    }
    .logo {
      width: 100px;
      height: 100px;
      margin: 0 3px;
      background-color: #eee;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    em {
      font-style: italic;
    }
      .watermark {
      position: absolute;
      top: 25%;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity:0.3;
      pointer-events: none;
    }
    .watermark img {
      width: 600px;
      height: auto;
    }

      .nomination-list{
       display : flex;
       width: 100%;
       gap: 30%;
      }
       .nomination-list-item{
        border-top : 1px solid black;
        width: 30%;
        padding-top: 4px;
       }
        .recteur-sign{
          margin-top : 65px;
        }
  `;

  // Création du contenu HTML
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attestation de Réussite</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        <!-- IPES Logo Watermark    -->
            <div class="watermark">
                <img src=${schoolLogo} alt="IPES Watermark">
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
                ********************<br>
                <strong>FACULTE DE MEDECINE ET <br> DES SCIENCES PHARMACEUTIQUES</strong><br>
                ********************<br>
                B.P 2701, Douala, Cameroun<br>
                Email: <a href="mailto:mailto:contact@fmsp-udo.cm">contact@fmsp-udo.cm</a><br>
                ********************<br>
                <strong>${settings.nameFrench
                            .split(" ")
                            .map((w, i) => (i > 0 && i % 4 === 0 ? "<br>" + w : w))
                            .join(" ")}</strong><br>
                ********************<br>
                ${settings.postalBox}<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a></p>
              </div>
              <div class="header-logo-content">
                <div>${universityLogo ? `<img src="${universityLogo}" alt="University Logo" height="70">` : ''}</div>
                <div>${facultyLogo ? `<img src="${facultyLogo}" alt="Faculty Logo" height="50">` : ''}</div>
                <div>${schoolLogo ? `<img src="${schoolLogo}" alt="IPES Logo" height="50">` : ''}</div>
              </div>
              <div class="header-content">
                <p>REPUBLIC OF CAMEROON<br>
                <em>Peace – Work - Fatherland</em><br>
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
            <div class="header-row2">
              <div class="title">ATTESTATION DE REUSSITE</div>
              <div class="subtitle"><strong>ATTESTATION OF COMPLETION OF STUDIES</strong></div>
              
              <div class="ref"><strong>Ref N°............./${currentYear-1}/UDo/FMSP/VDRC/${settings.nameAbreviation}</strong></div>
            </div>
        </div>
        
        <div class="content">
            <p><strong>Nous soussignés,</strong><br>
            <em>We, the undersigned,</em></p><br>
            <div class="nomination-list">
              <div class="nomination-list-item">
                <strong>Directeur de l’${settings.nameAbreviation}</strong>
              </div>
              <div class="nomination-list-item">
                <strong>Recteur de l’Université de Douala</strong>
              </div>
            </div>
            
            <p><strong>Vu le procès-verbal du jury N°0001 en date du ${juryDate} atteste que,</strong><br>
            <em>Considering the jury's decision N° 0001 dated ${juryDate} Certify that,</em></p>
            
            <div class="student-info">
                <p>M./Mme/Mlle <strong>${studentFullName}</strong><br>
                <em>Mr/Mrs/Miss</em></p>
                
                <p>Né(e) le: <strong>${birthDate}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;à&nbsp;<strong>${birthPlace}</strong><br>
                <em>Born on: <strong style="opacity:0">${birthDate}</strong></em><em>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;at:</em></p>
                
                <p>Inscrit(e) à <strong>${settings.nameFrench}</strong> sous le matricule: <strong>${matricule}</strong><br>
                <em>Registered under the matricule number:</em></p>
            </div>
            
            <div class="table-container">
                <table>
                    <tr>
                        <th>Domaine<br><em style="font-weight: normal">Domain of the study</em></th>
                        <th>Parcours<br><em style="font-weight: normal">Course</em></th>
                        <th>Spécialité<br><em style="font-weight: normal">Specialization</em></th>
                        <th>Option<br><em style="font-weight: normal">Learning option</em></th>
                    </tr>
                    <tr style="border-top: 1px solid #333; background-color:#eeeeee">
                        <td><strong>${fieldOfStudy}</strong></td>
                        <td><strong>${course}</strong></td>
                        <td><strong>${specialization}</strong></td>
                        <td><strong>${option}</strong></td>
                    </tr>
                </table>
            </div>
            
            <div class="table-container">
                <table>
                    <tr>
                        <th>Total de credits<br><em style="font-weight: normal">Credits earned</em></th>
                        <th>Moyenne<br><em style="font-weight: normal">Average</em></th>
                        <th>Mention<br><em style="font-weight: normal">Grade</em></th>
                        <th>Année académique<br><em style="font-weight: normal">Academic year</em></th>
                        <th>Finalité/Voie<br><em style="font-weight: normal">Finality/Vocation</em></th>
                    </tr>
                    <tr style="border-top: 1px solid #333; background-color:#eeeeee">
                        <td><strong>${credits}</strong></td>
                        <td><strong>${average}</strong></td>
                        <td><strong>${mention} ${grade}</strong></td>
                        <td><strong>${academicYear}</strong></td>
                        <td><strong>${finality}</strong></td>
                    </tr>
                </table>
            </div>
            
            <p>En foi de quoi la présente Attestation est délivrée pour servir et valoir ce que de droit.<br>
            <em>In witness where of the present testimonial is given with all the privileges there to pertaining.</em></p>
        </div>
        
        <div class="footer">
            <div class="signature" style="display: flex; flex-direction: column; align-items: center;">
                <div class="qr-code">
                    ${options.qrCodeImage ? `<img src="${options.qrCodeImage}" class="qr-image" />` : 
                      '<div class="qr-image"></div>'}
                </div>
                <div class="sign-ipes">
                  <p><strong>Le Directeur de L'${settings.nameAbreviation}</strong><br>
                  <em>The Director of the ${settings.nameAbreviation}</em></p>
                </div>
            </div>
            
            <div class="signature">
                <p><strong>Douala, le</strong><br>
                 <em>Douala, the</em></p>

                <p class="recteur-sign"><strong>Le Recteur de l'Université de Douala</strong><br>
                <em>The Rector of the University of Douala</em></p>
            </div>
        </div>
        
        <div class="disclaimer">
            <div>
                Cette Attestation ne tient pas lieu de Diplôme et n'est délivrée qu'en un seul exemplaire et d'une validité de (6) mois à partir de la date de signature. Le Diplôme lui sera délivré ultérieurement
            </div>
            <div>
                <em>Only one copy of this Attestation shall be delivered and is not a certificate. This Attestation is valid for (6) six months from the date of signature. The Certificate will be issued at a later date.</em>
            </div>
        </div>
    </div>
</body>
</html>
  `;
  
  return html;
}