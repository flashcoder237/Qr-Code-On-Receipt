import { StudentRecord } from "../types/student";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * All your existing functions for calculations and HTML generation
 * (calculateMGP, getGradeFromAverage, processCourseData, etc.)
 */

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

function processCourseData(courses: any[]): {
  ueGroups: Map<string, { 
    code: string;
    name: string;
    ecs: any[];
    average: number;
    credits: number;
  }>;
  totalCredits: number;
  weightedSum: number;
} {
  const ueMap = new Map();
  
  let totalCredits = 0;
  let weightedSum = 0;
  
  courses.forEach(course => {
    if (!ueMap.has(course.CODE)) {
      ueMap.set(course.CODE, {
        code: course.CODE,
        name: course.INTITULE,
        ecs: [],
        average: 0,
        credits: course.CREDIT
      });
    }
    
    const ue = ueMap.get(course.CODE);
    ue.ecs.push(course);
  });
  
  // Calculer les moyennes pour chaque UE
  ueMap.forEach(ue => {
    const grades = ue.ecs.map(ec => ec.NOTE);
    ue.average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    
    totalCredits += ue.credits;
    weightedSum += ue.average * ue.credits;
  });
  
  return { ueGroups: ueMap, totalCredits, weightedSum };
}

function generateCoursesTable(courses: any[]): {
  tableHtml: string;
  totalCredits: number;
  semesterAverage: number;
} {
  const { ueGroups, totalCredits, weightedSum } = processCourseData(courses);
  
  const semesterAverage = weightedSum / totalCredits;
  
  let tableHtml = `
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
  `;
  
  ueGroups.forEach(ue => {
    const hasMultipleEcs = ue.ecs.length > 1;
    
    if (hasMultipleEcs) {
      // Première ligne pour l'UE
      tableHtml += `
        <tr>
          <td rowspan="${ue.ecs.length}" class="table-code"><strong>${ue.code}</strong></td>
          <td colspan="3" rowspan="${ue.ecs.length}" class="table-ue"><strong>${ue.name}</strong></td>
          <td colspan="3" class="table-ec">${ue.ecs[0].INTITULE}</td>
          <td colspan="2" class="table-note">${ue.ecs[0].NOTE.toFixed(2)}</td>
          <td rowspan="${ue.ecs.length}" class="table-average"><strong>${ue.average.toFixed(2)}</strong></td>
          <td rowspan="${ue.ecs.length}" class="table-credit">${ue.credits}</td>
        </tr>
      `;
      
      // Lignes pour les autres ECs
      for (let i = 1; i < ue.ecs.length; i++) {
        tableHtml += `
          <tr>
            <td colspan="3" class="table-ec">${ue.ecs[i].INTITULE}</td>
            <td colspan="2" class="table-note">${ue.ecs[i].NOTE.toFixed(2)}</td>
          </tr>
        `;
      }
    } else {
      // UE avec un seul EC
      tableHtml += `
        <tr>
          <td class="table-code"><strong>${ue.code}</strong></td>
          <td colspan="3" class="table-ue"><strong>${ue.name}</strong></td>
          <td colspan="3" class="table-ec">${ue.ecs[0].INTITULE}</td>
          <td colspan="2" class="table-note">${ue.ecs[0].NOTE.toFixed(2)}</td>
          <td class="table-average"><strong>${ue.average.toFixed(2)}</strong></td>
          <td class="table-credit">${ue.credits}</td>
        </tr>
      `;
    }
  });
  
  const mgp = calculateMGP(semesterAverage);
  const grade = getGradeFromAverage(semesterAverage);
  const decision = semesterAverage >= 10 ? "SEMESTRE VALIDE" : "SEMESTRE NON VALIDE";
  
  // Ajouter la ligne de résumé
  tableHtml += `
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
          <td class="summary-value"><strong>1</strong></td>
          <td class="summary-value"><strong>1</strong></td>
          <td class="summary-value"><strong>${totalCredits}</strong></td>
          <td colspan="2" class="summary-value"><strong>${semesterAverage.toFixed(2)}</strong></td>
          <td class="summary-value"><strong>${mgp.toFixed(1)}</strong></td>
          <td colspan="2" class="summary-value"><strong>${grade}</strong></td>
          <td colspan="3" class="summary-value"><strong>${decision}</strong></td>
        </tr>
      </tbody>
    </table>
  `;
  
  return { tableHtml, totalCredits, semesterAverage };
}

function generateGradeScaleTable(): string {
  return `
    <table style="table-layout: auto;">
      <tbody style="font-size: 2px;">
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
  `;
}

function generateTranscriptHtml(student: StudentRecord): string {
  const coursesData = generateCoursesTable(student.COURSES || []);
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relevé de Notes</title>
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
                border: 3px solid black;
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
                display: grid;
                grid-template-columns: 2fr 1fr 3fr;
                grid-template-rows: 100px 1fr;
                gap: 16px;
            }
        </style>
    </head>
    <body>
     <div class="container" id="transcript-container">
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
                 <div> <img src="./assets/logo-ud.png" alt="" height="70"></div>
                 <div> <img src="./assets/logo-fmsp.png" alt="" height="50" style="margin: 5px;"></div>
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
               <p><strong>NÉ(E) LE: ${student["DATE DE NAISSANCE"]}</strong></p>
               <div><em>Born on:</em></div>
             </div>
             <div>
               <p><strong>A:</strong> <strong>${student["LIEU DE NAISSANCE"]}</strong></p>
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
            ${coursesData.tableHtml}
         </div>
     
      <div class="grade-sign">
        <div class="grade-scale">
            ${generateGradeScaleTable()}
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
 * Génère un PDF à partir du HTML du relevé de notes
 * Compatible avec Vite et Electron
 */
export async function generateTranscriptPDF(student: StudentRecord): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary div to render the HTML
      const container = document.createElement('div');
      container.innerHTML = generateTranscriptHtml(student);
      document.body.appendChild(container);
      
      const element = container.firstElementChild as HTMLElement;
      
      // Use html2canvas to render the HTML to a canvas
      html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false
      }).then(canvas => {
        // Remove the temporary element
        document.body.removeChild(container);
        
        // Create a new PDF document with A4 size
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // A4 size: 210mm x 297mm
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add the canvas as an image to the PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Return the PDF as a Uint8Array
        const pdfData = pdf.output('arraybuffer');
        resolve(new Uint8Array(pdfData));
      }).catch(error => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Alternative implementation using DOMParser for better rendering in Electron
 */
export async function generateTranscriptPDFWithDOMParser(student: StudentRecord): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const htmlString = generateTranscriptHtml(student);
      
      // Use DOMParser to create a document from the HTML string
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      
      // Add the document to a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.appendChild(doc.documentElement);
      document.body.appendChild(container);
      
      // Get the rendered element
      const element = container.querySelector('body') as HTMLElement;
      
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      }).then(canvas => {
        // Clean up
        document.body.removeChild(container);
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        const pdfData = pdf.output('arraybuffer');
        resolve(new Uint8Array(pdfData));
      }).catch(error => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export { generateTranscriptHtml };