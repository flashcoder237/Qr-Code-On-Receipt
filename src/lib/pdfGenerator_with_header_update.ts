import { StudentRecord } from "../types/student";
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ipcMain } from 'electron';

// Create HTML template for the transcript based on the provided model
function createTranscriptHTML(student: StudentRecord): string {
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
          const ueCredit = ueElements[0].credit; // Assuming all ECs in a UE have same credit
          
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
      const ueCredit = ueElements[0].credit;
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
  const totalCredits = student.COURSES ? student.COURSES.reduce((sum, course) => sum + course.CREDIT, 0) : 0;
  const weightedSum = student.COURSES ? student.COURSES.reduce((sum, course) => sum + (course.NOTE * course.CREDIT), 0) : 0;
  const semesterAverage = totalCredits > 0 ? weightedSum / totalCredits : 0;
  const mgp = calculateMGP(semesterAverage);
  const grade = getGradeFromAverage(semesterAverage);
  const decision = semesterAverage >= 10 ? "SEMESTRE VALIDE" : "SEMESTRE NON VALIDE";

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
                margin: 0;
                padding: 20px;
                width: 210mm;
                min-height: 297mm;
                box-sizing: border-box;
                background-color: white;
                border: 1px solid black;
                color: black;
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
                padding: 20px;
                width: 50%;
                float: right;
                font-size: 12px;
            }
            .signature {
                margin-top: 30px;
                text-align: right;
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
                display: grid;
                grid-template-columns: 2fr 1fr 3fr;
                grid-template-rows: 100px 1fr;
                gap: 16px;
            }
        </style>
    </head>
    <body>
        <div class="container">
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
                        <strong>INSTITUT UNIVERSITAIRE DE LA COTE</strong><br>
                        ********************<br>
                        B.P 999, Douala, Cameroun<br>
                        Email: <a href="">contact@IUC.cm</a></p>
                    </div>
                    <div class="header-logo-content">
                        <div><img src="assets/logo-ud.png" alt="" height="70"></div>
                        <div><img src="assets/logo-fmsp.png" alt="" height="50" style="margin: 5px;"></div>
                        <div style="height: 50px; border: 1px solid black;"> Logo IPES</div>
                    </div>
                    <div class="header-content">
                        <p>REPUBLIC OF CAMEROON<br>
                        <em>Peace – Work - Fatherland</em><br>
                        ********************<br>
                        MINISTRY OF HIGHER EDUCATION<br>
                        ********************<br>
                        <strong>THE UNIVERSITY OF DOUALA</strong><br>
                        ********************<br>
                        <strong>FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES</strong><br>
                        ********************<br>
                        PO box 2701, Douala, Cameroun<br>
                        Email: <a href="">contact@fmsp-udo.cm</a><br>
                        ********************<br>
                        <strong>INSTITUT UNIVERSITAIRE DE LA COTE</strong><br>
                        ********************<br>
                        PO box 999, Douala, Cameroun<br>
                        Email: <a href="">contact@IUC.cm</a></p>    
                    </div>
                </div>
                <div class="header-row2">
                    <h1><strong>RELEVE DE NOTES</strong> / TRANSCRIPT </h1>
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
                    <div><em>Academic Year</em></div>
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
                    <table style="table-layout: auto;">
                        <tbody style="font-size: 8px;">
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
        
                <div class="signature">
                    <p>LE CHEF D'ETABLISSEMENT</p>
                    <p>The Dean of the Faculty</p>
                    <p>Douala, le ____________</p>
                </div>
            </div>
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
      // Create a temporary HTML file with the transcript content
      const html = createTranscriptHTML(student);
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
      
      // Generate PDF
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
      
      // Clean up temp HTML file
      try {
        fs.unlinkSync(htmlPath);
      } catch (error) {
        console.warn('Failed to clean up temporary HTML file', error);
      }
      
      resolve(pdfData);
    } catch (error) {
      reject(error);
    }
  });
}

// Setup IPC handler for renderer process
export function setupPDFGenerationHandlers() {
  ipcMain.handle('generate-transcript-pdf', async (event, studentData) => {
    try {
      const pdfData = await generateTranscriptPDF(studentData);
      return pdfData.buffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  });
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
