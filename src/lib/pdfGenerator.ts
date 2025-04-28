import { StudentRecord } from "../types/student";
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ipcMain } from 'electron';

// Create HTML template for the transcript
function createTranscriptHTML(student: StudentRecord): string {
  const courseRows = student.COURSES ? student.COURSES.map(course => {
    return `
      <tr>
        <td>${course.CODE}</td>
        <td>${course.INTITULE}</td>
        <td>${course.NOTE.toFixed(2)}</td>
        <td>${course.CREDIT}</td>
      </tr>
    `;
  }).join('') : '';

  // Calculate course statistics
  const totalCredits = student.COURSES ? student.COURSES.reduce((sum, course) => sum + course.CREDIT, 0) : 0;
  const weightedSum = student.COURSES ? student.COURSES.reduce((sum, course) => sum + (course.NOTE * course.CREDIT), 0) : 0;
  const semesterAverage = totalCredits > 0 ? weightedSum / totalCredits : 0;
  const mgp = calculateMGP(semesterAverage);
  const grade = getGradeFromAverage(semesterAverage);
  const decision = semesterAverage >= 10 ? "SEMESTRE VALIDE" : "SEMESTRE NON VALIDE";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relevé de Notes - ${student.NOM} ${student.PRENOM}</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 8pt;
        }
        .header-left, .header-right {
          width: 45%;
        }
        .document-title {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          margin: 20px 0 10px;
        }
        .document-ref {
          text-align: center;
          font-size: 10pt;
          margin-bottom: 20px;
        }
        .student-info {
          margin: 20px 0;
          font-size: 10pt;
        }
        .student-info-row {
          display: flex;
          margin-bottom: 10px;
        }
        .student-info-item {
          margin-right: 30px;
        }
        .student-info-label {
          font-style: italic;
          font-size: 8pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #f0f0f0;
          text-align: left;
          padding: 8px;
          font-size: 9pt;
        }
        td {
          padding: 8px;
          border: 1px solid #ddd;
          font-size: 9pt;
        }
        .summary-row {
          font-weight: bold;
          background-color: #f0f0f0;
        }
        .grade-scale {
          width: 50%;
          float: left;
          font-size: 8pt;
        }
        .signature {
          width: 45%;
          float: right;
          text-align: left;
          font-size: 10pt;
          margin-top: 20px;
        }
        .signature-date {
          margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <p>REPUBLIQUE DU CAMEROUN<br>
          <i>Paix – Travail – Patrie</i><br>
          ********************<br>
          MINISTERE DE L'ENSEIGNEMENT SUPERIEUR<br>
          ********************<br>
          <b>UNIVERSITE DE DOUALA</b><br>
          ********************<br>
          <b>FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES</b><br>
          ********************<br>
          B.P 2701, Douala, Cameroun<br>
          Email: contact@fmsp-udo.cm<br>
          ********************<br>
          <b>INSTITUT UNIVERSITAIRE DE LA COTE</b><br>
          ********************<br>
          B.P 999, Douala, Cameroun<br>
          Email: contact@IUC.cm</p>
        </div>
        <div class="header-right">
          <p>REPUBLIC OF CAMEROON<br>
          <i>Peace – Work - Fatherland</i><br>
          ********************<br>
          MINISTRY OF HIGHER EDUCATION<br>
          ********************<br>
          <b>THE UNIVERSITY OF DOUALA</b><br>
          ********************<br>
          <b>FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES</b><br>
          ********************<br>
          PO box 2701, Douala, Cameroun<br>
          Email: contact@fmsp-udo.cm<br>
          ********************<br>
          <b>INSTITUT UNIVERSITAIRE DE LA COTE</b><br>
          ********************<br>
          PO box 999, Douala, Cameroun<br>
          Email: contact@IUC.cm</p>
        </div>
      </div>
      
      <div class="document-title">RELEVE DE NOTES / TRANSCRIPT</div>
      <div class="document-ref">Ref No /24/UDo/FMSP/VDPSAA/VDSSE/VDRC/CDAASR/SSE</div>
      
      <div class="student-info">
        <div class="student-info-row">
          <div class="student-info-item">
            <div>NOM ET PRENOM: ${student.NOM} ${student.PRENOM}</div>
            <div class="student-info-label">surname and name:</div>
          </div>
          <div class="student-info-item">
            <div>MATRICULE: ${student.MATRICULE}</div>
            <div class="student-info-label">Registration N°:</div>
          </div>
        </div>
        
        <div class="student-info-row">
          <div class="student-info-item">
            <div>NÉ(E) LE: ${student["DATE DE NAISSANCE"] || ""}</div>
            <div class="student-info-label">Born on:</div>
          </div>
          <div class="student-info-item">
            <div>A: ${student["LIEU DE NAISSANCE"] || ""}</div>
            <div class="student-info-label">At:</div>
          </div>
        </div>
        
        <div class="student-info-row">
          <div class="student-info-item">
            <div>CYCLE: ${student.CYCLE || "Master"}</div>
            <div class="student-info-label">Training cycle:</div>
          </div>
          <div class="student-info-item">
            <div>ANNÉE ACADÉMIQUE: ${student["ANNEE ACADÉMIQUE"] || "2023 - 2024"}</div>
            <div class="student-info-label">Academic Year:</div>
          </div>
          <div class="student-info-item">
            <div>FILIÈRE: ${student.FILIERE || "PHARMACIE"}</div>
            <div class="student-info-label">Field of Study:</div>
          </div>
        </div>
        
        <div class="student-info-row">
          <div class="student-info-item">
            <div>NIVEAU: ${student.NIVEAU || "V"}</div>
            <div class="student-info-label">Level:</div>
          </div>
          <div class="student-info-item">
            <div>SEMESTRE: ${student.SEMESTRE || "III"}</div>
            <div class="student-info-label">Semester:</div>
          </div>
          <div class="student-info-item">
            <div>OPTION: ${student.OPTION || "INDUSTRIE"}</div>
            <div class="student-info-label">Option:</div>
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>CODE</th>
            <th>UNITE D'ENSEIGNEMENT</th>
            <th>NOTE/20</th>
            <th>CREDIT</th>
          </tr>
        </thead>
        <tbody>
          ${courseRows}
        </tbody>
        <tfoot>
          <tr class="summary-row">
            <td colspan="2">TOTAL</td>
            <td>${semesterAverage.toFixed(2)}</td>
            <td>${totalCredits}</td>
          </tr>
        </tfoot>
      </table>
      
      <table>
        <thead>
          <tr>
            <th>RELEVE NIVEAU</th>
            <th>SEMESTRE</th>
            <th>TOTAL CREDIT / 30</th>
            <th>MOYENNE SEMESTRIELLE / 20</th>
            <th>MGP</th>
            <th>GRADE</th>
            <th>DECISION DU JURY</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>1</td>
            <td>${totalCredits}</td>
            <td>${semesterAverage.toFixed(2)}</td>
            <td>${mgp.toFixed(1)}</td>
            <td>${grade}</td>
            <td>${decision}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="grade-scale">
        <table>
          <tr>
            <th>Grade</th>
            <th>Note/4</th>
            <th>Appréciation</th>
            <th>Moy /20</th>
          </tr>
          <tr><td>A+</td><td>4.0</td><td>Excellent</td><td>[18-20]</td></tr>
          <tr><td>A</td><td>3.7</td><td>Très Bien</td><td>[16-18[</td></tr>
          <tr><td>B+</td><td>3.3</td><td>Bien</td><td>[14-16[</td></tr>
          <tr><td>B</td><td>3</td><td>Assez Bien</td><td>[13-14[</td></tr>
          <tr><td>B-</td><td>2.7</td><td>Assez Bien</td><td>[12-13[</td></tr>
          <tr><td>C+</td><td>2.3</td><td>Passable</td><td>[11-12[</td></tr>
          <tr><td>C</td><td>2.0</td><td>Passable</td><td>[10-11[</td></tr>
          <tr><td>C-</td><td>1.7</td><td>Insuffisant</td><td>[09-10[</td></tr>
          <tr><td>D</td><td>1.3</td><td>Faible</td><td>[08-09[</td></tr>
          <tr><td>E</td><td>1.0</td><td>Très Faible</td><td>[06-08[</td></tr>
          <tr><td>F</td><td>0.0</td><td>Nul</td><td>[00-06[</td></tr>
        </table>
      </div>
      
      <div class="signature">
        <p>LE CHEF D'ETABLISSEMENT<br>
        <span class="student-info-label">The Dean of the Faculty</span></p>
        <p class="signature-date">Douala, le ____________</p>
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
      const pdfPath = path.join(tempDir, `transcript-${Date.now()}.pdf`);
      
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

// Existing grade calculation functions
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