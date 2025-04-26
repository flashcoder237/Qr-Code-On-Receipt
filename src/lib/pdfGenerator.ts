import { StudentRecord } from "../types/student";
import PDFDocument from 'pdfkit';
import blobStream from 'blob-stream';

/**
 * Generate a PDF transcript using PDFKit
 */
export async function generateTranscriptPDFWithPDFKit(student: StudentRecord): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        font: 'Helvetica',
        info: {
          Title: `Relevé de Notes - ${student.NOM} ${student.PRENOM}`,
          Author: 'Université de Douala',
        }
      });

      // Pipe its output to a blob stream
      const stream = doc.pipe(blobStream());

      // Add header content
      addHeader(doc, student);

      // Add student information
      addStudentInfo(doc, student);
      
      // Add courses table
      const { totalCredits, semesterAverage } = addCoursesTable(doc, student.COURSES || []);
      
      // Add grade scale and signature
      addGradeScaleAndSignature(doc, semesterAverage);

      // Finalize the PDF and end the stream
      doc.end();

      // Get the PDF as a blob
      stream.on('finish', () => {
        const blob = stream.toBlob('application/pdf');
        
        // Convert blob to Uint8Array
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(new Uint8Array(reader.result));
          } else {
            reject(new Error('Failed to convert blob to Uint8Array'));
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function addHeader(doc: PDFKit.PDFDocument, student: StudentRecord): void {
  // Left header text
  doc.fontSize(8)
     .text('REPUBLIQUE DU CAMEROUN', 50, 40)
     .text('Paix – Travail – Patrie', { italic: true })
     .text('********************')
     .text('MINISTERE DE L\'ENSEIGNEMENT SUPERIEUR')
     .text('********************')
     .text('UNIVERSITE DE DOUALA', { bold: true })
     .text('********************')
     .text('FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES', { bold: true })
     .text('********************')
     .text('B.P 2701, Douala, Cameroun')
     .text('Email: contact@fmsp-udo.cm')
     .text('********************')
     .text('INSTITUT UNIVERSITAIRE DE LA COTE', { bold: true })
     .text('********************')
     .text('B.P 999, Douala, Cameroun')
     .text('Email: contact@IUC.cm');

  // Right header text
  doc.fontSize(8)
     .text('REPUBLIC OF CAMEROON', 400, 40)
     .text('Peace – Work - Fatherland', { italic: true })
     .text('********************')
     .text('MINISTRY OF HIGHER EDUCATION')
     .text('********************')
     .text('THE UNIVERSITY OF DOUALA', { bold: true })
     .text('********************')
     .text('FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES', { bold: true })
     .text('********************')
     .text('PO box 2701, Douala, Cameroun')
     .text('Email: contact@fmsp-udo.cm')
     .text('********************')
     .text('INSTITUT UNIVERSITAIRE DE LA COTE', { bold: true })
     .text('********************')
     .text('PO box 999, Douala, Cameroun')
     .text('Email: contact@IUC.cm');

  // Center title
  doc.fontSize(14)
     .text('RELEVE DE NOTES / TRANSCRIPT', { align: 'center' }, 240)
     .fontSize(10)
     .text('Ref No  /24/UDo/FMSP/VDPSAA/VDSSE/VDRC/CDAASR/SSE', { align: 'center' });
}

function addStudentInfo(doc: PDFKit.PDFDocument, student: StudentRecord): void {
  doc.moveDown(2);
  
  // Student name and registration number
  doc.fontSize(10)
     .text(`NOM ET PRENOM: ${student.NOM} ${student.PRENOM}`, 50)
     .fontSize(8)
     .text('surname and name:', { italic: true })
     .moveUp()
     .fontSize(10)
     .text(`MATRICULE: ${student.MATRICULE}`, 350)
     .fontSize(8)
     .text('Registration N°:', { italic: true });

  doc.moveDown();
  
  // Birth information
  doc.fontSize(10)
     .text(`NÉ(E) LE: ${student["DATE DE NAISSANCE"]}`, 50)
     .fontSize(8)
     .text('Born on:', { italic: true })
     .moveUp()
     .fontSize(10)
     .text(`A: ${student["LIEU DE NAISSANCE"]}`, 200)
     .fontSize(8)
     .text('At:', { italic: true });

  doc.moveDown();
  
  // Academic information
  doc.fontSize(10)
     .text(`CYCLE: ${student.CYCLE || "Master"}`, 50)
     .fontSize(8)
     .text('Training cycle:', { italic: true })
     .moveUp()
     .fontSize(10)
     .text(`ANNÉE ACADÉMIQUE: ${student["ANNEE ACADÉMIQUE"] || "2023 - 2024"}`, 200)
     .fontSize(8)
     .text('Academic Year', { italic: true })
     .moveUp()
     .fontSize(10)
     .text(`FILIÈRE: ${student.FILIERE || "PHARMACIE"}`, 400)
     .fontSize(8)
     .text('Field of Study:', { italic: true });

  doc.moveDown();
  
  doc.fontSize(10)
     .text(`NIVEAU: ${student.NIVEAU || "V"}`, 50)
     .fontSize(8)
     .text('Level:', { italic: true })
     .moveUp()
     .fontSize(10)
     .text(`SEMESTRE: ${student.SEMESTRE || "III"}`, 200)
     .fontSize(8)
     .text('Semester:', { italic: true })
     .moveUp()
     .fontSize(10)
     .text(`OPTION: ${student.OPTION || "INDUSTRIE"}`, 400)
     .fontSize(8)
     .text('Option:', { italic: true });
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
  
  // Calculate averages for each UE
  ueMap.forEach(ue => {
    const grades = ue.ecs.map(ec => ec.NOTE);
    ue.average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    
    totalCredits += ue.credits;
    weightedSum += ue.average * ue.credits;
  });
  
  return { ueGroups: ueMap, totalCredits, weightedSum };
}

function addCoursesTable(doc: PDFKit.PDFDocument, courses: any[]): {
  totalCredits: number;
  semesterAverage: number;
} {
  const { ueGroups, totalCredits, weightedSum } = processCourseData(courses);
  const semesterAverage = weightedSum / totalCredits;

  doc.moveDown(2);
  
  // Define table layout
  const tableTop = doc.y;
  const colWidths = {
    code: 50,
    ue: 150,
    ec: 150,
    note: 50,
    average: 50,
    credit: 40
  };
  
  // Draw table headers
  doc.fontSize(9)
     .rect(50, tableTop, 500, 20)
     .fill('#f0f0f0')
     .stroke();
  
  doc.fontSize(9)
     .fillColor('black')
     .text('CODE', 55, tableTop + 5)
     .text('UNITE D\'ENSEIGNEMENT', 105, tableTop + 5)
     .text('ELEMENT CONSTITUTIF', 255, tableTop + 5)
     .text('NOTE/20', 405, tableTop + 5)
     .text('MOYENNE', 455, tableTop + 5)
     .text('CREDIT', 505, tableTop + 5);
  
  let rowY = tableTop + 20;
  
  // Draw rows for each UE and EC
  ueGroups.forEach((ue, ueCode) => {
    const startY = rowY;
    const rowHeight = 20;
    
    ue.ecs.forEach((ec, index) => {
      // Draw row background
      doc.rect(50, rowY, 500, rowHeight)
         .fillAndStroke('#ffffff', '#000000');
      
      // Draw cell content
      if (index === 0) {
        // First EC of the UE
        doc.fontSize(9)
           .text(ue.code, 55, rowY + 5, { width: colWidths.code })
           .text(ue.name, 105, rowY + 5, { width: colWidths.ue });
      }
      
      doc.fontSize(9)
         .text(ec.INTITULE, 255, rowY + 5, { width: colWidths.ec })
         .text(ec.NOTE.toFixed(2), 405, rowY + 5, { width: colWidths.note });
      
      if (index === 0) {
        // Show average and credits only on first row
        doc.fontSize(9)
           .text(ue.average.toFixed(2), 455, rowY + 5, { width: colWidths.average })
           .text(ue.credits.toString(), 505, rowY + 5, { width: colWidths.credit });
      }
      
      rowY += rowHeight;
    });
  });
  
  // Calculate MGP and grade
  const mgp = calculateMGP(semesterAverage);
  const grade = getGradeFromAverage(semesterAverage);
  const decision = semesterAverage >= 10 ? "SEMESTRE VALIDE" : "SEMESTRE NON VALIDE";
  
  // Draw summary row
  rowY += 10;
  doc.rect(50, rowY, 500, 20)
     .fill('#f0f0f0')
     .stroke();
  
  doc.fontSize(9)
     .fillColor('black')
     .text('RELEVE NIVEAU', 55, rowY + 5)
     .text('SEMESTRE', 105, rowY + 5)
     .text('TOTAL CREDIT / 30', 155, rowY + 5)
     .text('MOYENNE SEMESTRIELLE / 20', 255, rowY + 5)
     .text('MGP', 355, rowY + 5)
     .text('GRADE', 405, rowY + 5)
     .text('DECISION DU JURY', 455, rowY + 5);
  
  rowY += 20;
  doc.rect(50, rowY, 500, 20)
     .fillAndStroke('#ffffff', '#000000');
  
  doc.fontSize(9)
     .text('1', 55, rowY + 5)
     .text('1', 105, rowY + 5)
     .text(totalCredits.toString(), 155, rowY + 5)
     .text(semesterAverage.toFixed(2), 255, rowY + 5)
     .text(mgp.toFixed(1), 355, rowY + 5)
     .text(grade, 405, rowY + 5)
     .text(decision, 455, rowY + 5);
  
  return { totalCredits, semesterAverage };
}

function addGradeScaleAndSignature(doc: PDFKit.PDFDocument, semesterAverage: number): void {
  doc.moveDown(3);
  
  // Grade scale - left
  const scaleTop = doc.y;
  let scaleY = scaleTop;
  
  doc.fontSize(8)
     .text('Grade', 50, scaleY)
     .text('Note/4', 80, scaleY)
     .text('Appréciation', 110, scaleY)
     .text('Moy /20', 180, scaleY);
  
  scaleY += 15;
  
  const grades = [
    { grade: 'A+', note: '4.0', appreciation: 'Excellent', range: '[18-20]' },
    { grade: 'A', note: '3.7', appreciation: 'Très Bien', range: '[16-18[' },
    { grade: 'B+', note: '3.3', appreciation: 'Bien', range: '[14-16[' },
    { grade: 'B', note: '3', appreciation: 'Assez Bien', range: '[13-14[' },
    { grade: 'B-', note: '2.7', appreciation: 'Assez Bien', range: '[12-13[' },
    { grade: 'C+', note: '2.3', appreciation: 'Passable', range: '[11-12[' },
    { grade: 'C', note: '2.0', appreciation: 'Passable', range: '[10-11[' },
    { grade: 'C-', note: '1.7', appreciation: 'Insuffisant', range: '[09-10[' },
    { grade: 'D', note: '1.3', appreciation: 'Faible', range: '[08-09[' },
    { grade: 'E', note: '1.0', appreciation: 'Très Faible', range: '[06-08[' },
    { grade: 'F', note: '0.0', appreciation: 'Nul', range: '[00-06[' },
  ];
  
  grades.forEach(g => {
    doc.text(g.grade, 50, scaleY)
       .text(g.note, 80, scaleY)
       .text(g.appreciation, 110, scaleY)
       .text(g.range, 180, scaleY);
    scaleY += 15;
  });
  
  // Signature - right
  doc.fontSize(10)
     .text('LE CHEF D\'ETABLISSEMENT', 400, scaleTop)
     .text('The Dean of the Faculty', 400, scaleTop + 15)
     .text('Douala, le ____________', 400, scaleTop + 60);
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