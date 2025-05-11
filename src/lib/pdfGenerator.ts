import { StudentRecord } from "../types/student";
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ipcMain } from 'electron';
import QRCode from 'qrcode';
import { getCompleteTheme } from './form-schemas/settings';
import { ThemeSettingsPayload } from './form-schemas/theme-settings';

interface TranscriptSettingsPayload {
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
}

interface GeneratePDFParams {
  student: StudentRecord;
  settings: TranscriptSettingsPayload;
}

// Génère les styles CSS basés sur les paramètres du thème et optimisés pour une seule page
function generateThemeStyles(params: GeneratePDFParams): string {
  const theme = getCompleteTheme(params.settings);
  
  // Ajustements pour assurer que le relevé tient sur une seule page
  return `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      font-family: ${theme.mainFont};
      width: 210mm;
      height: 297mm; /* Hauteur exacte d'une page A4 */
      box-sizing: border-box;
      background-color: white;
      margin: 0;
      padding: 5mm;
      border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.primaryColor};
      color: ${theme.primaryColor};
      position: relative;
      overflow: hidden; /* Empêche les débordements */
      display: flex;
      flex-direction: column;
    }
    
    .header {
      line-height: normal;
      font-size: ${Math.max(theme.headerFontSize - 1, 8)}px; /* Réduction légère de la taille */
      font-family: ${theme.headerFont};
      flex-shrink: 0;
    }
    .header-row1 {
      text-align: center;
      margin-bottom: 10px; /* Réduction de la marge */
      display: flex;
      justify-content: space-between;
    }
    .header h1 {
      font-size: ${Math.max(theme.titleFontSize - 1, 12)}px; /* Réduction légère de la taille */
      margin-top: 5px;
      margin-bottom: 5px;
    }
    .student_block1 {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .student_block1,
    .student-info {
      width: 95%;
      margin-left: auto;
      margin-right: auto;
      font-size: ${Math.max(theme.contentFontSize - 1, 8)}px; /* Réduction légère de la taille */
      line-height: 1.1;
      gap: 10px;
      flex-shrink: 0;
    }
    .student-info {
      display: ${theme.studentInfoLayout === 'grille' ? 'grid' : 
                theme.studentInfoLayout === 'colonnes' ? 'flex' : 'block'};
      ${theme.studentInfoLayout === 'grille' ? 'grid-template-columns: 1fr 1fr 1fr;' : 
        theme.studentInfoLayout === 'colonnes' ? 'flex-direction: column;' : ''}
      margin-bottom: 10px;
    }
    .student-info p {
      font-size: ${Math.max(theme.contentFontSize - 1, 8)}px;
      margin: 3px 0; /* Réduction de la marge */
    }
    
    .table-container {
      flex: 1;
      overflow: auto;
      margin-bottom: 10px;
    }
    
    table {
      margin-left: auto;
      margin-right: auto;
      width: 98%;
      border-collapse: collapse;
      font-size: ${Math.max(theme.contentFontSize - 1, 8)}px;
    }
    th, td {
      border: ${theme.borderWidth}px ${theme.borderStyle} ${theme.tableBorderColor};
      padding: ${Math.max(theme.tableCellPadding - 2, 1)}px; /* Réduction du padding */
      text-align: left;
      font-size: ${Math.max(theme.contentFontSize - 1, 8)}px;
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
      font-size: ${Math.max(theme.footerFontSize - 1, 6)}px;
      float: left;
      margin-left: 10px;
      width: 50%;
      flex-shrink: 0;
    }
    .grade-scale table {
      width: 30%;
      margin-right: 10px;
    }
    .grade-scale div {
      display: inline-block;
    }
    
    /* Styles des signatures optimisés */
    .signature-ipes {
      width: 50%;
      margin-left: 20px;
      font-size: ${Math.max(theme.contentFontSize, 9)}px;
      ${theme.signatureStyle === 'encadré' ? 'border: 1px solid ' + theme.primaryColor + '; padding: 5px;' : ''}
      ${theme.signatureStyle === 'souligné' ? 'border-bottom: 2px solid ' + theme.primaryColor + ';' : ''}
      flex-shrink: 0;
    }
    .signature {
      margin-top: 15px;
      float: right;
      text-align: left;
      font-size: ${Math.max(theme.contentFontSize, 9)}px;
      margin-right: 20px;
      ${theme.signatureStyle === 'encadré' ? 'border: 1px solid ' + theme.primaryColor + '; padding: 5px;' : ''}
      ${theme.signatureStyle === 'souligné' ? 'border-bottom: 2px solid ' + theme.primaryColor + ';' : ''}
      flex-shrink: 0;
    }
    
    /* Adaptation de la mise en page de l'en-tête basée sur le thème */
    .header-content {
      width: ${theme.headerLayout === 'standard' ? '35%' : 
               theme.headerLayout === 'compact' ? '30%' : '40%'};
      font-size: ${Math.max(theme.contentFontSize - 2, 7)}px; /* Réduction additionnelle de la taille */
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
    .header-row2 h1 {
      font-weight: ${theme.headerLayout === 'compact' ? '400' : '100'};
      text-align: center;
      font-size: ${Math.max(theme.titleFontSize - 1, 12)}px;
      color: ${theme.accentColor};
      margin: 5px 0;
    }
    .header-row2 p {
      font-size: ${Math.max(theme.contentFontSize, 9)}px;
      margin: 5px 0;
    }
    .header-row2 {
      text-align: center;
    }
    td {
      text-align: center;
    }
    .table {
      padding-left: 10px;
    }
    .table-head th {
      text-align: center;
    }
    .table-ue-code, .table-ue-label, .table-ue-avearage {
      font-weight: bold;
    }
    .table-ec {
      text-align: left;
    }
    .grade-sign {
      display: flex;
      justify-content: start;
      width: 98%;
      margin: 0 auto;
      flex-shrink: 0;
    }
    .grade-sign th, .grade-sign td {
      width: 30px;
      padding: 1px;
      border: 0.5px solid ${theme.tableBorderColor};
    }
    body > .container {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
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
      opacity: ${theme.watermarkOpacity};
      pointer-events: none;
    }
    .watermark img {
      width: 500px; /* Réduction de la taille */
      height: auto;
    }
    .footer-note {
      position: absolute;
      width: 100%;
      bottom: 5px;
      font-size: ${Math.max(theme.footerFontSize - 1, 6)}px; /* Réduction de la taille */
      text-align: center;
      margin-top: 5px;
      padding-top: 5px;
      font-style: italic;
    }
    .qr-code {
      width: 80px; /* Réduction de la taille */
      height: 80px;
      display: ${theme.showQRCode ? 'block' : 'none'};
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
    return 0;
  }

  // Récupération des paramètres de thème
  const theme = getCompleteTheme(settings);

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

  // Generate QR code only if enabled in theme
  let qrCodeDataUrl = "";
  if (theme.showQRCode) {
    // Prepare QR code data
    const qrData = `Établissement: ${settings.nameFrench}
Nom: ${student.NOM}
Prénom: ${student.PRENOM}
Matricule: ${student.MATRICULE}
Date de naissance: ${student["DATE DE NAISSANCE"]}
Lieu de naissance: ${student["LIEU DE NAISSANCE"]}
Niveau: ${student.NIVEAU}
Semestre: ${student.SEMESTRE ? student.SEMESTRE.split(" ")[1] : ""}
Moyenne: ${semesterAverage.toFixed(2)}
Grade: ${grade}
Mention: ${getMention(semesterAverage)}
Année académique: ${student["ANNEE ACADÉMIQUE"]}`;
    
    // Generate QR code with smaller size
    qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M', // Niveau moyen de correction d'erreur pour équilibrer taille et fiabilité
      margin: 1,
      width: 100 // Taille réduite
    });
  }
  
  // Helper function to generate optimized course rows
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
          const creditValue = typeof ueCredit === 'number' ? ueCredit : 
                             (typeof ueCredit === 'string' ? parseFloat(ueCredit) : 0);
          
          const ueValidatedCredits = isUEValidated ? creditValue : 0;
          
          html += generateUERowsHTML(currentUECode, ueElements[0].title, ueElements, ueAverage, ueValidatedCredits, isUEValidated);
          ueElements = [];
        }
        
        currentUECode = ueCode;
        // Récupérer le crédit associé à l'UE
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
            <!-- IPES Logo Watermark -->
            <div class="watermark">
                <img src=${settings.logo} alt="IPES Watermark">
            </div>
        
            <div class="grade-sign">
                <div class="grade-scale">
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
                    <!-- QR Code placeholder -->
                    <div>
                        ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code">` : ''}
                    </div>
                </div>
                <div class="signature">
                    <div><strong>Douala, le</strong> 
                    <br/><i>Douala, the</i></div><br/>

                    <div><strong>Le Doyen FMSP</strong>
                    <br/><i>The Dean FMSP</i></div>
                </div>
            </div>

            <div class="signature-ipes"><strong>Le Directeur de L'${settings.nameFrench.length >= 30 ? settings.nameAbreviation : settings.nameFrench}</strong>
            <br/><i>The Director of ${settings.nameFrench.length >= 30 ? settings.nameAbreviation : settings.nameEnglish}</i></div>
            
            <!-- Footer note -->
            <div class="footer-note">
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
 * with optimized settings to ensure a single page output
 */
export async function generateTranscriptPDF(params: GeneratePDFParams): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a temporary HTML file with the transcript content
      const html = await createTranscriptHTML(params);
      const tempDir = app.getPath('temp');
      const htmlPath = path.join(tempDir, `transcript-${Date.now()}.html`);
      
      // Write HTML to temp file
      fs.writeFileSync(htmlPath, html);
      
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate PDF with optimized settings for single page
      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: {
          top: 0, // Minimize margins
          bottom: 0,
          left: 0,
          right: 0
        },
        pageRanges: '1', // Only print the first page
        scaleFactor: 100, // Scale to fit
        preferCSSPageSize: true // Use CSS page size and margins
      });
      
      // Close the window
      win.close();
      
      // Clean up temp HTML file
      try {
        fs.unlinkSync(htmlPath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary HTML file:', cleanupError);
        // Continue execution even if cleanup fails
      }

      console.log(`PDF generated successfully, size: ${pdfData.byteLength} bytes`);
      
      // Resolve with the PDF data
      resolve(Buffer.from(pdfData));
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

export function setupPDFGenerationHandlers() {
  // Set up IPC handler for PDF generation
  ipcMain.handle('generate-transcript-pdf', async (_, params: GeneratePDFParams) => {
    try {
      return await generateTranscriptPDF(params);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  });

  // Set up IPC handler for HTML preview - new feature for improved previewing
  ipcMain.handle('generate-transcript-html', async (_, params: GeneratePDFParams) => {
    try {
      // Return the HTML directly for preview in the renderer
      const html = await createTranscriptHTML(params);
      return html;
    } catch (error) {
      console.error('Error generating HTML preview:', error);
      throw error;
    }
  });

  console.log('PDF generation handlers set up successfully');
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