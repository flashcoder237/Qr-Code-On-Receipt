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
  const juryDate = "28/08/2024"; // Date à paramétrer si nécessaire
  
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
  const fieldOfStudy = "SCIENCES MEDICO-SANITAIRES"; // Domaine d'études (à paramétrer si nécessaire)
  const course = student.PARCOURS || "SCIENCES INFIRMIERES";
  const specialization = student.SPECIALITE || "SCIENCES INFIRMIERES";
  const option = student.OPTION || "SCIENCES INFIRMIERES";
  
  // Crédits et notes
  const credits = "60"; // Nombre total de crédits (à paramétrer si nécessaire)
  const average = typeof student.MOYENNE === 'number' ? student.MOYENNE.toFixed(2) : String(student.MOYENNE);
  const grade = student.GRADE || calculateGrade(typeof student.MOYENNE === 'number' ? student.MOYENNE : parseFloat(String(student.MOYENNE)));
  const mention = student.MENTION || calculateMention(typeof student.MOYENNE === 'number' ? student.MOYENNE : parseFloat(String(student.MOYENNE)));
  
  // Finalité
  const finality = "LICENCE PROFESSIONNELLE";

  
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
      font-size: 13px;
      border: 2px solid #333;
      width: 200mm;
      height: 287mm;
      position: relative;
    }
    .container {
      width: 100%;
      height: 100%;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
    }
    .watermark {
      position: absolute;
      align-self: center;
      align-item: center;
      opacity: 0.1;
      width: 80%;
      height: 80%;
      z-index: -1;
    }
      .watermark img {
      align-self: center;
      width: 600px;
      height: auto;
    }
    .header {    
      line-height: normal;
      font-size: 8px;
    }
    .header-row1{
      text-align: center;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }
    .header h1 {
      font-size: 10px;
    }
    .header-content{
      width: 35%;
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
      max-height: 70px;
      object-fit: contain;
    }
    .header-row2 h1{
      font-weight: 100;
      text-align: center;
      font-size: large;
    }
    .header-row2 p{
      font-size: 12px;
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
      font-size: 20px;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
    }
    .subtitle {
      text-align: center;
      font-style: italic;
      font-size: 18px;
      margin-bottom: 20px;
    }
    .ref {
      text-align: center;
      margin: 5px 0;
      font-size:13px;
    }
    .content {
      margin: 20px 0;
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
      border: 1px solid #333;
      padding: 8px;
      text-align: center;
    }
    .footer {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
    }
    .signature {
      width: 48%;
      text-align: left;
    }
    .qr-code {
      text-align: center;
      margin: 0px 0;
    }
    .qr-image {
      width: 100px;
      height: 100px;
      background-color: #eee;
      margin: 0 auto;
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
      width: 80px;
      height: 80px;
      margin: 0 10px;
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
      justify-content: center;
      align-items: center;
      opacity: 0.1;
      pointer-events: none;
    }
    .watermark img {
      width: 600px;
      height: auto;
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
        <!-- IPES Logo Watermark -->
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
                B.P ${settings.postalBox}, Douala, Cameroun<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a><br>
                ********************<br>
                <strong>${settings.nameFrench}</strong><br>
                ********************<br>
                B.P ${settings.postalBox}, Douala, Cameroun<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a></p>
              </div>
              <div class="header-logo-content">
                <div>${universityLogo ? `<img src="${universityLogo}" alt="University Logo" height="70">` : ''}</div>
                <div>${facultyLogo ? `<img src="${facultyLogo}" alt="Faculty Logo" height="50" style="margin: 5px;">` : ''}</div>
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
                PO box ${settings.postalBoxEn}, Douala, Cameroun<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a><br>
                ********************<br>
                <strong>${settings.nameEnglish}</strong><br>
                ********************<br>
                PO box ${settings.postalBoxEn}, Douala, Cameroun<br>
                Email: <a href="mailto:${settings.email}">${settings.email}</a></p>    
              </div>
            </div>
            <div class="header-row2">
              <div class="title">ATTESTATION DE REUSSITE</div>
              <div class="subtitle">ATTESTATION OF COMPLETION OF STUDIES</div>
              
              <div class="ref">Ref N°............./${currentYear}/UDo/FMSP/VDRC/${settings.nameAbreviation}</div>
            </div>
        </div>
        
        <div class="content">
            <p><strong>Je soussigné,</strong><br>
            <em>I, the undersigned,</em></p>
            
            <p><strong>Vu le procès-verbal du jury N°0001 en date du ${juryDate} atteste que,</strong><br>
            <em>Considering the jury's decision N° 0001 dated ${juryDate} Certify that,</em></p>
            
            <div class="student-info">
                <p>M./Mme/Mlle <strong>${studentFullName}</strong><br>
                <em>Mr/Mrs/Miss</em></p>
                
                <p>Né(e) le: <strong>${birthDate}</strong>   à <strong>${birthPlace}</strong><br>
                <em>Born on: <strong style="opacity:0">${birthDate}</strong></em> <em>  at:</em></p>
                
                <p>Inscrit(e) à <strong>${settings.nameFrench}</strong> sous le matricule: <strong>${matricule}</strong><br>
                <em>Registered under the matricule number:</em></p>
            </div>
            
            <div class="table-container">
                <table>
                    <tr>
                        <th>Domaine<br><em>Domain of the study</em></th>
                        <th>Parcours<br><em>Course</em></th>
                        <th>Spécialité<br><em>Specialization</em></th>
                        <th>Option<br><em>Learning option</em></th>
                    </tr>
                    <tr>
                        <td>${fieldOfStudy}</td>
                        <td>${course}</td>
                        <td>${specialization}</td>
                        <td>${option}</td>
                    </tr>
                </table>
            </div>
            
            <div class="table-container">
                <table>
                    <tr>
                        <th>Total de credits<br><em>Credits earned</em></th>
                        <th>Moyenne<br><em>Average</em></th>
                        <th>Mention<br><em>Grade</em></th>
                        <th>Année académique<br><em>Academic year</em></th>
                        <th>Finalité/Voie<br><em>Finality/Vocation</em></th>
                    </tr>
                    <tr>
                        <td>${credits}</td>
                        <td>${average}</td>
                        <td>${mention} ${grade}</td>
                        <td>${academicYear}</td>
                        <td>${finality}</td>
                    </tr>
                </table>
            </div>
            
            <p>En foi de quoi la présente Attestation est délivrée pour servir et valoir ce que de droit.<br>
            <em>In witness where of the present testimonial is given with all the privileges there to pertaining.</em></p>
        </div>
        
        <div class="footer">
            <div class="signature" style="display: flex; flex-direction: column; align-items: center;">
                <div class="qr-code" style="margin-bottom: 5px;">
                    ${options.qrCodeImage ? `<img src="${options.qrCodeImage}" class="qr-image" />` : 
                      '<div class="qr-image"></div>'}
                </div>
                <p>Le Directeur de L'Institut Universitaire Des Bâtisseurs-SIGMEN<br>
                <em>The Director of the University Institute of Builders-SIGMEN</em></p>
            </div>
            
            <div class="signature">
                <p>Douala, le<br>
                 <em>Douala, the</em></p>

                <p>Le Recteur de l'Université de Douala<br>
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