// src/lib/pdfGenerator.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { StudentRecord } from "../types/student";

export async function generateTranscriptPDF(student: StudentRecord) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points (portrait)
  const { width, height } = page.getSize();

  // Polices
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Tailles de police
  const fontSizeHeader = 9;
  const fontSizeTitle = 14;
  const fontSizeNormal = 10;
  const fontSizeSmall = 8;

  // Marges
  const marginTop = 40;
  const marginLeft = 40;
  const marginRight = 40;

  // En-tête - Partie gauche
  let y = height - marginTop;
  let x = marginLeft;

  // République du Cameroun - Partie gauche
  page.drawText("REPUBLIQUE DU CAMEROUN", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("Paix – Travail – Patrie", {
    x,
    y,
    size: fontSizeHeader,
    font: fontItalic,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("UNIVERSITE DE DOUALA", {
    x,
    y,
    size: fontSizeHeader,
    font: fontBold,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES", {
    x,
    y,
    size: fontSizeHeader,
    font: fontBold,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("B.P 2701, Douala, Cameroun", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("Email: contact@fmsp-udo.cm", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("INSTITUT UNIVERSITAIRE DE LA COTE", {
    x,
    y,
    size: fontSizeHeader,
    font: fontBold,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("B.P 999, Douala, Cameroun", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("Email: contact@IUC.cm", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });

  // En-tête - Partie droite (en anglais)
  y = height - marginTop;
  x = width - marginRight - 150; // Aligné à droite

  page.drawText("REPUBLIC OF CAMEROON", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("Peace – Work – Fatherland", {
    x,
    y,
    size: fontSizeHeader,
    font: fontItalic,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("MINISTRY OF HIGHER EDUCATION", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("THE UNIVERSITY OF DOUALA", {
    x,
    y,
    size: fontSizeHeader,
    font: fontBold,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES", {
    x,
    y,
    size: fontSizeHeader,
    font: fontBold,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("PO box 2701, Douala, Cameroon", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("Email: contact@fmsp-udo.cm", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("INSTITUT UNIVERSITAIRE DE LA COTE", {
    x,
    y,
    size: fontSizeHeader,
    font: fontBold,
  });
  y -= 12;

  page.drawText("********************", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("PO box 999, Douala, Cameroon", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });
  y -= 12;

  page.drawText("Email: contact@IUC.cm", {
    x,
    y,
    size: fontSizeHeader,
    font: fontRegular,
  });

  // Titre central
  y = height - 240;
  page.drawText("RELEVE DE NOTES / TRANSCRIPT", {
    x: width / 2 - 110,
    y,
    size: fontSizeTitle,
    font: fontBold,
  });

  y -= 20;
  page.drawText("Ref No  /24/UDo/FMSP/VDPSAA/VDSSE/VDRC/CDAASR/SSE", {
    x: width / 2 - 150,
    y,
    size: fontSizeNormal,
    font: fontRegular,
  });

  // Informations de l'étudiant - première ligne
  y -= 30;
  x = marginLeft + 20;
  page.drawText("NOM ET PRENOM:", {
    x,
    y,
    size: fontSizeNormal,
    font: fontRegular,
  });
  page.drawText(`${student.NOM} ${student.PRENOM}`, {
    x: x + 120,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });

  x = width - marginRight - 150;
  page.drawText("MATRICULE:", {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  page.drawText(`${student.MATRICULE}`, {
    x: x + 80,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });

  // Légende en dessous
  y -= 10;
  x = marginLeft + 20;
  page.drawText("surname and name:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });

  x = width - marginRight - 150;
  page.drawText("Registration N°:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });

  // Seconde ligne d'informations
  y -= 20;
  
  // Première colonne
  x = marginLeft + 20;
  page.drawText(`NÉ(E) LE: ${student["DATE DE NAISSANCE"]}`, {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  
  y -= 10;
  page.drawText("Born on:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });
  
  // Deuxième colonne
  x = marginLeft + 200;
  y += 10;
  page.drawText(`A: ${student["LIEU DE NAISSANCE"]}`, {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  
  y -= 10;
  page.drawText("At:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });
  
  // Nouvelle ligne
  y -= 10;
  
  // Première colonne
  x = marginLeft + 20;
  page.drawText(`CYCLE: ${student.CYCLE || "Master"}`, {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  
  y -= 10;
  page.drawText("Training cycle:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });
  
  // Deuxième colonne
  x = marginLeft + 200;
  y += 10;
  page.drawText(`ANNÉE ACADÉMIQUE: ${student["ANNEE ACADÉMIQUE"] || "2023 - 2024"}`, {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  
  y -= 10;
  page.drawText("Academic Year:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });
  
  // Troisième colonne
  x = marginLeft + 400;
  y += 10;
  page.drawText(`FILIÈRE: ${student.FILIERE || "PHARMACIE"}`, {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  
  y -= 10;
  page.drawText("Field of Study:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });
  
  // Nouvelle ligne
  y -= 10;
  
  // Première colonne
  x = marginLeft + 20;
  page.drawText(`NIVEAU: ${student.NIVEAU || "V"}`, {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  
  y -= 10;
  page.drawText("Level:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });
  
  // Deuxième colonne
  x = marginLeft + 200;
  y += 10;
  page.drawText(`SEMESTRE: ${student.SEMESTRE || "III"}`, {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  
  y -= 10;
  page.drawText("Semester:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });
  
  // Troisième colonne
  x = marginLeft + 400;
  y += 10;
  page.drawText(`OPTION: ${student.OPTION || "INDUSTRIE"}`, {
    x,
    y,
    size: fontSizeNormal,
    font: fontBold,
  });
  
  y -= 10;
  page.drawText("Option:", {
    x,
    y,
    size: fontSizeSmall,
    font: fontItalic,
  });

  // Tableau des notes - en-tête
  y -= 40;
  drawTable(page, marginLeft, y, width - marginLeft - marginRight, student.COURSES || [], fontRegular, fontBold);

  // Ajouter le tableau des notes et grille de notation
  y -= 220; // Espace pour le tableau
  drawGradeScale(page, marginLeft + 30, y, fontRegular, fontBold);

  // Signatures
  y -= 70;
  page.drawText("LE CHEF D'ETABLISSEMENT", {
    x: width - marginRight - 160,
    y,
    size: fontSizeNormal,
    font: fontRegular,
  });

  y -= 20;
  page.drawText("The Dean of the Faculty", {
    x: width - marginRight - 160,
    y,
    size: fontSizeNormal,
    font: fontRegular,
  });

  y -= 20;
  page.drawText("Douala, le ____________", {
    x: width - marginRight - 160,
    y,
    size: fontSizeNormal,
    font: fontRegular,
  });

  return pdfDoc.save();
}

function drawTable(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  courses: any[],
  fontRegular: PDFFont,
  fontBold: PDFFont
) {
  const fontSize = 10;
  const lineHeight = 20;
  const columnWidths = [70, 220, 70, 70, 70]; // Ajustez selon vos besoins
  
  // Variables pour stocker les crédits totaux et la moyenne
  let totalCredits = 0;
  let weightedSum = 0;
  
  // En-tête du tableau
  drawTableRow(
    page, 
    x, 
    y, 
    ["CODE", "UNITE D'ENSEIGNEMENT", "NOTE/20", "MOYENNE", "CREDIT"], 
    columnWidths, 
    fontSize, 
    fontBold,
    true
  );
  
  y -= lineHeight;
  
  // Grouper les cours par UE
  const ueMap = new Map();
  
  courses.forEach(course => {
    if (!ueMap.has(course.CODE)) {
      ueMap.set(course.CODE, {
        code: course.CODE,
        name: course.INTITULE,
        ecs: [],
        credits: course.CREDIT,
        grades: []
      });
    }
    
    const ue = ueMap.get(course.CODE);
    ue.ecs.push(course);
    ue.grades.push(course.NOTE);
  });
  
  // Dessiner les lignes pour chaque UE
  ueMap.forEach(ue => {
    const ueAverage = ue.grades.reduce((sum: number, grade: number) => sum + grade, 0) / ue.grades.length;
    
    // Pour les UE avec un seul EC
    if (ue.ecs.length === 1) {
      const ec = ue.ecs[0];
      drawTableRow(
        page,
        x,
        y,
        [ue.code, ue.name, ec.NOTE.toFixed(2), ueAverage.toFixed(2), ue.credits.toString()],
        columnWidths,
        fontSize,
        fontRegular,
        false,
        [0, 2]  // Mettre en gras la colonne du code et de la moyenne
      );
      y -= lineHeight;
    } 
    // Pour les UE avec plusieurs ECs
    else {
      // Première ligne pour l'UE
      drawTableRow(
        page,
        x,
        y,
        [ue.code, ue.name, "", "", ""],
        columnWidths,
        fontSize,
        fontRegular,
        false,
        [0, 1]  // Mettre en gras les colonnes du code et du nom
      );
      y -= lineHeight;
      
      // Lignes pour chaque EC
      ue.ecs.forEach((ec: any, index: number) => {
        if (index === ue.ecs.length - 1) {
          // Dernier EC, afficher aussi la moyenne de l'UE
          drawTableRow(
            page,
            x,
            y,
            ["", ec.INTITULE, ec.NOTE.toFixed(2), ueAverage.toFixed(2), ue.credits.toString()],
            columnWidths,
            fontSize,
            fontRegular,
            false,
            [3, 4]  // Mettre en gras les colonnes de la moyenne et des crédits
          );
        } else {
          drawTableRow(
            page,
            x,
            y,
            ["", ec.INTITULE, ec.NOTE.toFixed(2), "", ""],
            columnWidths,
            fontSize,
            fontRegular
          );
        }
        y -= lineHeight;
      });
    }
    
    // Calculer les statistiques
    totalCredits += ue.credits;
    weightedSum += ueAverage * ue.credits;
  });
  
  // Calcul de la moyenne semestrielle
  const semesterAverage = weightedSum / totalCredits;
  const mgp = calculateMGP(semesterAverage);
  const grade = getGradeFromAverage(semesterAverage);
  const decision = semesterAverage >= 10 ? "SEMESTRE VALIDE" : "SEMESTRE NON VALIDE";
  
  // Ligne vide
  y -= lineHeight;
  
  // Ligne récapitulative
  drawTableRow(
    page,
    x,
    y,
    ["RELEVE NIVEAU", "SEMESTRE", "TOTAL CREDIT / 30", "MOYENNE SEMESTRIELLE / 20", "MGP", "GRADE", "DECISION DU JURY"],
    [70, 70, 70, 100, 50, 70, 120],
    fontSize,
    fontBold
  );
  
  y -= lineHeight;
  
  // Valeurs récapitulatives
  drawTableRow(
    page,
    x,
    y,
    ["1", "1", totalCredits.toString(), semesterAverage.toFixed(2), mgp.toFixed(1), grade, decision],
    [70, 70, 70, 100, 50, 70, 120],
    fontSize,
    fontBold
  );
  
  return y; // Retourne la position Y actuelle pour continuer le dessin
}

function drawTableRow(
  page: PDFPage,
  x: number,
  y: number,
  cells: string[],
  columnWidths: number[],
  fontSize: number,
  font: PDFFont,
  isHeader: boolean = false,
  boldIndices: number[] = []
) {
  // Dessiner le fond pour l'en-tête
  if (isHeader) {
    page.drawRectangle({
      x,
      y: y - fontSize,
      width: columnWidths.reduce((a, b) => a + b, 0),
      height: fontSize * 2,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
  } else {
    // Dessiner les bordures pour les lignes normales
    page.drawRectangle({
      x,
      y: y - fontSize,
      width: columnWidths.reduce((a, b) => a + b, 0),
      height: fontSize * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
  }

  // Dessiner le texte des cellules
  let currentX = x;
  for (let i = 0; i < cells.length; i++) {
    const cellFont = boldIndices.includes(i) ? fontBold : font;
    
    page.drawText(cells[i], {
      x: currentX + 5, // Petit padding à gauche
      y: y - fontSize + 5,
      size: fontSize,
      font: cellFont,
    });
    
    // Dessiner la ligne de séparation de colonne (sauf pour la dernière colonne)
    if (i < cells.length - 1) {
      page.drawLine({
        start: { x: currentX + columnWidths[i], y: y + fontSize },
        end: { x: currentX + columnWidths[i], y: y - fontSize },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
    
    currentX += columnWidths[i];
  }
}

function drawGradeScale(
  page: PDFPage,
  x: number,
  y: number,
  fontRegular: PDFFont,
  fontBold: PDFFont
) {
  const fontSize = 8;
  const lineHeight = 14;
  
  // En-tête du tableau
  page.drawText("Grade", { x, y, size: fontSize, font: fontBold });
  page.drawText("Note/4", { x: x + 40, y, size: fontSize, font: fontBold });
  page.drawText("Appréciation", { x: x + 80, y, size: fontSize, font: fontBold });
  page.drawText("Moy /20", { x: x + 160, y, size: fontSize, font: fontBold });
  
  y -= lineHeight;
  
  // Lignes du tableau
  const gradeRows = [
    ["A+", "4.0", "Excellent", "[18-20]"],
    ["A", "3.7", "Très Bien", "[16-18["],
    ["B+", "3.3", "Bien", "[14-16["],
    ["B", "3", "Assez Bien", "[13-14["],
    ["B-", "2.7", "Assez Bien", "[12-13["],
    ["C+", "2.3", "Passable", "[11-12["],
    ["C", "2.0", "Passable", "[10-11["],
    ["C-", "1.7", "Insuffisant", "[09-10["],
    ["D", "1.3", "Faible", "[08-09["],
    ["E", "1.0", "Très Faible", "[06-08["],
    ["F", "0.0", "Nul", "[00-06["]
  ];
  
  gradeRows.forEach(row => {
    page.drawText(row[0], { x, y, size: fontSize, font: fontBold });
    page.drawText(row[1], { x: x + 40, y, size: fontSize, font: fontBold });
    page.drawText(row[2], { x: x + 80, y, size: fontSize, font: fontBold });
    page.drawText(row[3], { x: x + 160, y, size: fontSize, font: fontBold });
    y -= lineHeight;
  });
}

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