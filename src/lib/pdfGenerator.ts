import { StudentRecord } from "../types/student";
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ipcMain } from 'electron';

interface TranscriptSettingsPayload {
  nameFrench: string;
  nameEnglish: string;
  postalBox: string;
  email: string;
  logo: string;
}

// Load header settings from a JSON file
const loadHeaderSettings = (): TranscriptSettingsPayload => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(settingsData);
    }
  } catch (error) {
    console.error("Erreur lors du chargement des paramètres d'entête:", error);
  }
  
  // Default values if settings are not found
  return {
    nameFrench: "Nom de l'établissement",
    nameEnglish: "Institution Name",
    postalBox: "B.P. 0000",
    email: "contact@example.com",
    logo: "",
  };
};

// Generate a QR code with the student ID and some verification information
function generateQRCodeSvg(student: StudentRecord): string {
  // This will be replaced with actual QR code generation in production
  // For now, we're creating a placeholder element for the QR code
  return `
    <div class="qr-code-placeholder">
      <div class="qr-code-inner">
        <div class="qr-code-text">QR Code: ${student.MATRICULE}</div>
      </div>
    </div>
  `;
}

// Create HTML template for the transcript based on the provided model
function createTranscriptHTML(student: StudentRecord): string {
  const headerSettings = loadHeaderSettings();
  
  // Helper function to generate course rows
  const generateCourseRows = () => {
    if (!student.COURSES || student.COURSES.length === 0) return '';
    
    let html = '';
    let currentUE = '';
    let ueElements = [];
    
    student.COURSES.forEach((course, index) => {
      // Extract UE code from the course code if available
      const ueMatch = course.CODE ? course.CODE.match(/UE\s*(\w+)/) : null;
      const ueCode = ueMatch ? ueMatch[0] : course.CODE;
      const ueTitle = course.INTITULE;
      
      // Check if this is a new UE or continuation of previous UE
      if (ueCode !== currentUE) {
        // If we have accumulated elements for a previous UE, output them
        if (ueElements.length > 0) {
          // Calculate average for the UE
          const ueAverage = ueElements.reduce((sum, ec) => sum + ec.note, 0) / ueElements.length;
          const ueCredit = course.CREDIT; // Use credit from current course for UE
          
          html += generateUERowsHTML(currentUE, ueElements[0].title, ueElements, ueAverage, ueCredit);
          ueElements = [];
        }
        
        currentUE = ueCode;
      }
      
      // Add this course as an element of the current UE
      ueElements.push({
        title: ueTitle,
        name: course.EC_TITRE || ueTitle,
        note: course.NOTE,
        credit: course.CREDIT
      });
    });
    
    // Don't forget to output the last UE
    if (ueElements.length > 0) {
      const ueAverage = ueElements.reduce((sum, ec) => sum + ec.note, 0) / ueElements.length;
      const ueCredit = student.COURSES[student.COURSES.length - 1].CREDIT;
      html += generateUERowsHTML(currentUE, ueElements[0].title, ueElements, ueAverage, ueCredit);
    }
    
    return html;
  };
  
  // Helper function to generate HTML for a UE and its elements
  const generateUERowsHTML = (ueCode, ueTitle, elements, average, credit) => {
    if (elements.length === 1) {
      // Single element UE
      return `
        <tr>
          <td class="table-code"><strong>${ueCode}</strong></td>
          <td colspan="3" class="table-ue"><strong>${ueTitle}</strong></td>
          <td colspan="3" class="table-ec">${elements[0].name}</td>
          <td colspan="2" class="table-note">${elements[0].note.toFixed(2)}</td>
          <td class="table-average"><strong>${average.toFixed(2)}</strong></td>
          <td class="table-credit">${credit}</td>
        </tr>
      `;
    } else {
      // Multiple elements UE
      let html = `
        <tr>
          <td rowspan="${elements.length}" class="table-code"><strong>${ueCode}</strong></td>
          <td colspan="3" rowspan="${elements.length}" class="table-ue"><strong>${ueTitle}</strong></td>
          <td colspan="3" class="table-ec">${elements[0].name}</td>
          <td colspan="2" class="table-note">${elements[0].note.toFixed(2)}</td>
          <td rowspan="${elements.length}" class="table-average"><strong>${average.toFixed(2)}</strong></td>
          <td rowspan="${elements.length}" class="table-credit">${credit}</td>
        </tr>
      `;
      
      // Add rows for remaining elements
      for (let i = 1; i < elements.length; i++) {
        html += `
          <tr>
            <td colspan="3" class="table-ec">${elements[i].name}</td>
            <td colspan="2" class="table-note">${elements[i].note.toFixed(2)}</td>
          </tr>
        `;
      }
      
      return html;
    }
  };

  // Calculate semester statistics
  const uniqueUEs = new Set(student.COURSES?.map(course => course.CODE) || []);
  const totalCredits = Array.from(uniqueUEs).reduce((sum, ueCode) => {
    const ueFirstCourse = student.COURSES?.find(course => course.CODE === ueCode);
    return sum + (ueFirstCourse?.CREDIT || 0);
  }, 0);

  const weightedSum = Array.from(uniqueUEs).reduce((sum, ueCode) => {
    const ueCourses = student.COURSES?.filter(course => course.CODE === ueCode) || [];
    const ueAverage = ueCourses.reduce((sum, course) => sum + course.NOTE, 0) / ueCourses.length;
    const ueCredit = ueCourses[0]?.CREDIT || 0;
    return sum + (ueAverage * ueCredit);
  }, 0);

  const semesterAverage = totalCredits > 0 ? weightedSum / totalCredits : 0;
  const mgp = calculateMGP(semesterAverage);
  const grade = getGradeFromAverage(semesterAverage);
  const decision = semesterAverage >= 10 ? "SEMESTRE VALIDE" : "SEMESTRE NON VALIDE";
  const qrCodeSvg = generateQRCodeSvg(student);

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relevé de Notes - ${student.NOM} ${student.PRENOM}</title>
        <style>
            @page {
                size: A4;
                margin: 0;
            }
            body {
                font-family: 'Times New Roman', Times, serif;
             
                
                width: 200mm;
                min-height: 287mm;
                box-sizing: border-box;
                background-color: white;
                margin: 5mm;
                border: 1px solid black;
                color: black;
                position: relative;
            }
            
            .header {    
                line-height: normal;
                font-size: 9px;
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
                font-size: 10px;
                line-height: 0px;
                gap: 10px;
            }
            .student-info {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                margin-bottom: 20px;
            }
            .student-info p {
                font-size: 10px;
            }
            table {
                margin-left: auto;
                margin-right: auto;
                width: 96%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 10px;
            }
            th, td {
                border: 1px solid black;
                padding: 5px;
                text-align: left;
            }
            th {
                background-color: #f0f0f0;
            }
            .grade-scale {
                display: flex;
                font-size: 6px;
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
            .signature-ipes{
            margin-left: 40px;
            font-size: 12px;
            }
            .signature {
                margin-top: 30px;
                
                float: right;
                text-align: left;
                font-size: 12px;
                margin-right: 20px;
            }
            .header-content{
                width: 35%;
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
                border: 0.5px solid #000;
            }
            body > .container{
                
                position: relative;
            }
            .watermark {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0.1;
                pointer-events: none;
            }
            .watermark img {
                width: 300px;
                height: auto;
            }
            .footer-note {
                position: absolute;
                width: 100%;
                bottom: 10px;
                font-size: 8px;
                text-align: center;
                margin-top: 20px;
                padding-top: 10px;
                font-style: italic;
            }
            .qr-code-placeholder {
                width: 100px;
                height: 100px;
                border: 1px solid #000;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .qr-code-inner {
                width: 90px;
                height: 90px;
                background-color: #f0f0f0;
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
            }
            .qr-code-text {
                font-size: 6px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- IPES Logo Watermark -->
            <div class="watermark">
                <img src=${headerSettings.logo} alt="IPES Watermark">
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
                        <strong>FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES</strong><br>
                        ********************<br>
                        B.P 2701, Douala, Cameroun<br>
                        Email: <a href="">contact@fmsp-udo.cm</a><br>
                        ********************<br>
                        <strong>${headerSettings.nameFrench}</strong><br>
                        ********************<br>
                        B.P ${headerSettings.postalBox}<br>
                        Email: <a href="">${headerSettings.email}</a></p>
                    </div>
                    <div class="header-logo-content">
                        <div><img src="assets/logo-ud.png" alt="" height="70"></div>
                        <div><img src="assets/logo-fmsp.png" alt="" height="50" style="margin: 5px;"></div>
                        <div><img src=${headerSettings.logo} alt="" height="50" style="margin: 5px;"></div>
                    </div>
                    <div class="header-content">
                        <p>REPUBLIC OF CAMEROON<br>
                        <em>Peace – Work - Fatherland</em><br>
                        ********************<br>
                        MINISTRY OF HIGHER EDUCATION<br>
                        ********************<br>
                        <strong>THE UNIVERSITY OF DOUALA</strong><br>
                        ********************<br>
                        <strong>FACULTY OF MEDICINE AND <br> PHARMACEUTICAL SCIENCES</strong><br>
                        ********************<br>
                        PO box 2701, Douala, Cameroun<br>
                        Email: <a href="">contact@fmsp-udo.cm</a><br>
                        ********************<br>
                        <strong>${headerSettings.nameEnglish}</strong><br>
                        ********************<br>
                        PO box ${headerSettings.postalBox}<br>
                        Email: <a href="">${headerSettings.email}</a></p>    
                    </div>
                </div>
                <div class="header-row2">
                    <h1><strong>RELEVE DE NOTES</strong> / TRANSCRIPT </h1>
                    <p><strong>Ref No</strong>&nbsp;&nbsp; /24/UDo/FMSP/VDPSAA/VDSSE/VDRC/CDAASR/SSE</p>
                </div>
            </div>
        
            <div class="student_block1">
                <div>
                    <p><span>NOM ET PRENOM:</span> <strong>${student.NOM} ${student.PRENOM}</strong></p>
                    <p><em>surname and name:</em></p>
                </div>
                <div>
                    <p><strong>MATRICULE:</strong> <strong>${student.MATRICULE}</strong></p>
                    <p><em>Registration N°:</em></p>
                </div>
            </div>
            <div class="student-info">
                <div>
                    <p><strong>NÉ(E) LE: ${student["DATE DE NAISSANCE"] || ""}</strong></p>
                    <div><em>Born on:</em></div>
                </div>
                <div>
                    <p><strong>A:</strong> <strong>${student["LIEU DE NAISSANCE"] || ""}</strong></p>
                    <div><em>At:</em></div>
                </div>
                <div></div>
                <div>
                    <p><strong>CYCLE:</strong> <strong>${student.CYCLE || "Master"}</strong></p>
                    <div><em>Training cycle:</em></div>
                </div>
                <div>
                    <p><strong>ANNÉE ACADÉMIQUE:</strong> <strong>${student["ANNEE ACADÉMIQUE"] || "2023 - 2024"}</strong></p>
                    <div><em>Academic Year:</em></div>
                </div>
                <div>
                    <p><strong>FILIÈRE:</strong> <strong>${student.FILIERE || "PHARMACIE"}</strong></p>
                    <div><em>Field of Study:</em></div>
                </div>
                <div>
                    <p><strong>NIVEAU:</strong> <strong>${student.NIVEAU || "V"}</strong></p>
                    <div><em>Level:</em></div>
                </div>
                <div>
                    <p><strong>SEMESTRE:</strong> <strong>${student.SEMESTRE || "III"}</strong></p>
                    <div><em>Semester:</em></div>
                </div>
                <div>
                    <p><strong>OPTION:</strong> <strong>${student.OPTION || "INDUSTRIE"}</strong></p>
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
                            <td class="summary-value"><strong>${student.SEMESTRE || "1"}</strong></td>
                            <td class="summary-value"><strong>${totalCredits}</strong></td>
                            <td colspan="2" class="summary-value"><strong>${semesterAverage.toFixed(2)}</strong></td>
                            <td class="summary-value"><strong>${mgp.toFixed(1)}</strong></td>
                            <td colspan="2" class="summary-value"><strong>${grade}</strong></td>
                            <td colspan="3" class="summary-value"><strong>${decision}</strong></td>
                        </tr>
                    </tbody>
                </table>
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
                    ${qrCodeSvg}
                    </div>
                </div>
                <div class="signature">
                    <div><strong>Douala, le</strong> 
                    <br/><i>Douala, the</i></div><br/>

                    <div><strong>Le Doyen FMSP</strong>
                    <br/><i>The Dean FMSP</i></div>
                </div>
            </div>

            <div class="signature-ipes"><strong>Le Directeur de L'${headerSettings.nameFrench}</strong>
            <br/><i>The Director of ${headerSettings.nameEnglish}</i></div>
            </div>
            <!-- Footer note -->
            <div class="footer-note">
                Il n'est délivré qu'un seul exemplaire de relevé de note, le titulaire peut en faire des copies certifiées conformes.<br>
                This transcript is delivered only once, the owner can do many certified copies as necessary
            </div>
    </body>
    </html>
  `;
}

/**
 * Generate a PDF transcript using Electron's built-in PDF generation capabilities
 */
export async function generateTranscriptPDF(student: StudentRecord): Promise<Uint8Array> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create HTML content for the transcript
        const html = createTranscriptHTML(student);
        
        // Create a temporary file to store the HTML
        const tempDir = app.getPath('temp');
        const htmlPath = path.join(tempDir, `transcript-${Date.now()}.html`);
        
        // Write HTML to temporary file
        fs.writeFileSync(htmlPath, html);
        
        // Create a hidden browser window to render the HTML
        const win = new BrowserWindow({
          width: 595, // A4 width in pixels at 72 DPI
          height: 842, // A4 height in pixels at 72 DPI
          show: false, // Keep the window hidden
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });
        
        // Load the HTML file
        await win.loadFile(htmlPath);
        
        // Wait for content to load completely
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Print the content to PDF
        const pdfData = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          margins: {
            top: 0.4,
            bottom: 0.4,
            left: 0.4,
            right: 0.4
          }
        });
        
        // Close the window
        win.close();
        
        // Clean up temporary HTML file
        try {
          fs.unlinkSync(htmlPath);
        } catch (error) {
          console.warn('Failed to clean up temporary HTML file', error);
        }
        
        // Resolve with the PDF data
        resolve(pdfData);
      } catch (error) {
        reject(error);
      }
    });
  }

// Setup IPC handler for renderer process
export function setupPDFGenerationHandlers() {
    console.log('Setting up PDF generation handlers...');
    
    ipcMain.handle('generate-transcript-pdf', async (event, studentData: StudentRecord) => {
      console.log('Received generate-transcript-pdf request from renderer process');
      
      try {
        // Validate student data
        if (!studentData || !studentData.NOM || !studentData.MATRICULE) {
          throw new Error('Invalid student data received');
        }
        
        console.log(`Generating PDF for student: ${studentData.MATRICULE} - ${studentData.NOM}`);
        
        // Generate PDF data
        const pdfData = await generateTranscriptPDF(studentData);
        
        console.log(`PDF generated successfully, size: ${pdfData.byteLength} bytes`);
        
        // Return buffer
        return Buffer.from(pdfData);
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw error; // Re-throw to be caught by the renderer process
      }
    });
    
    console.log('PDF generation handlers set up successfully');
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