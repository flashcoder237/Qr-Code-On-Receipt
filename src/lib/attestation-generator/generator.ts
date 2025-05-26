// src/lib/attestation-generator/generator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { StudentExcelRecord } from '../helpers/qrcode';
import { formatDate } from './utils';

interface SchoolSettings {
  establishmentType: string;
  nameFrench: string;
  nameEnglish: string;
  postalBox: string;
  postalBoxEn: string;
  email: string;
  logo?: string;
  universityLogo?: string;
  facultyLogo?: string;
}

interface GenerationOptions {
  qrCodeImage?: ArrayBuffer;
  qrCodePosition?: {
    x: number;
    y: number;
  };
}

/**
 * Génère un PDF d'attestation de réussite pour un étudiant
 */
export async function generateAttestationPDF(
  student: StudentExcelRecord,
  settings: SchoolSettings,
  options: GenerationOptions = {}
): Promise<Uint8Array> {
  // Création d'un nouveau document PDF
  const pdfDoc = await PDFDocument.create();
  
  // Ajout d'une page A4 (en portrait)
  const page = pdfDoc.addPage([595, 842]); // A4 en points
  
  // Chargement des polices
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  // Couleurs
  const black = rgb(0, 0, 0);
  const gray = rgb(0.5, 0.5, 0.5);
  
  // Marges et position initiale
  const margin = 50;
  const centerX = page.getWidth() / 2;
  let currentY = page.getHeight() - margin;
  
  // Logos
  if (settings.universityLogo || settings.facultyLogo || settings.logo) {
    try {
      // Espace pour les logos
      currentY -= 60;
      
      // Logo de l'université (à gauche)
      if (settings.universityLogo) {
        const uniLogoData = settings.universityLogo.split(',')[1];
        if (uniLogoData) {
          const uniLogo = await pdfDoc.embedPng(Buffer.from(uniLogoData, 'base64'));
          const logoDims = uniLogo.scale(0.5); // Réduire la taille si nécessaire
          page.drawImage(uniLogo, {
            x: margin,
            y: currentY - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      }
      
      // Logo de la faculté (au centre)
      if (settings.facultyLogo) {
        const facLogoData = settings.facultyLogo.split(',')[1];
        if (facLogoData) {
          const facLogo = await pdfDoc.embedPng(Buffer.from(facLogoData, 'base64'));
          const logoDims = facLogo.scale(0.4);
          page.drawImage(facLogo, {
            x: centerX - (logoDims.width / 2),
            y: currentY - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      }
      
      // Logo de l'établissement (à droite)
      if (settings.logo) {
        const logoData = settings.logo.split(',')[1];
        if (logoData) {
          const logo = await pdfDoc.embedPng(Buffer.from(logoData, 'base64'));
          const logoDims = logo.scale(0.4);
          page.drawImage(logo, {
            x: page.getWidth() - margin - logoDims.width,
            y: currentY - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      }
      
      currentY -= 30; // Espace après les logos
    } catch (error) {
      console.error("Erreur lors du chargement des logos:", error);
      // Continuer sans logos
    }
  }
  
  // En-tête - Partie gauche (français)
  const headerLeft = [
    "REPUBLIQUE DU CAMEROUN",
    "Paix – Travail – Patrie",
    "********************",
    "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR",
    "********************",
    "UNIVERSITE DE DOUALA",
    "********************",
    "FACULTE DE MEDECINE ET DES SCIENCES PHARMACEUTIQUES",
    "********************",
    `B.P ${settings.postalBox}`,
    `Email: ${settings.email}`,
    "********************",
    settings.nameFrench,
    "********************",
    `B.P. ${settings.postalBox}`,
    `E-mail: ${settings.email}`
  ];
  
  // En-tête - Partie droite (anglais)
  const headerRight = [
    "REPUBLIC OF CAMEROON",
    "Peace – Work – Fatherland",
    "********************",
    "MINISTRY OF HIGHER EDUCATION",
    "********************",
    "UNIVERSITY OF DOUALA",
    "********************",
    "FACULTY OF MEDICINE AND PHARMACEUTICAL SCIENCES",
    "********************",
    `P.O. Box ${settings.postalBoxEn}`,
    `Email: ${settings.email}`,
    "********************",
    settings.nameEnglish,
    "********************",
    `P.O. Box ${settings.postalBoxEn}`,
    `E-mail: ${settings.email}`
  ];
  
  // Fonction pour dessiner un texte centré
  const drawCenteredText = (text: string, y: number, font = timesRomanFont, size = 12, color = black) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: centerX - (textWidth / 2),
      y,
      font,
      size,
      color
    });
    return size + 5; // Retourne la hauteur utilisée (plus un espace)
  };
  
  // Fonction pour dessiner un texte aligné à gauche
  const drawLeftText = (text: string, x: number, y: number, font = timesRomanFont, size = 12, color = black) => {
    page.drawText(text, {
      x,
      y,
      font,
      size,
      color
    });
    return size + 5;
  };
  
  // Fonction pour dessiner un texte aligné à droite
  const drawRightText = (text: string, x: number, y: number, font = timesRomanFont, size = 12, color = black) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: x - textWidth,
      y,
      font,
      size,
      color
    });
    return size + 5;
  };
  
  // Dessiner l'en-tête des deux côtés
  let tempY = currentY;
  const fontSize = 10;
  const lineHeight = fontSize + 2;
  
  // En-tête gauche
  for (let i = 0; i < headerLeft.length; i++) {
    const text = headerLeft[i];
    
    // Utiliser l'italique pour "Paix - Travail - Patrie"
    const font = i === 1 ? timesItalicFont : 
                 i === 5 || i === 7 || i === 12 ? timesBoldFont : timesRomanFont;
    
    drawLeftText(text, margin, tempY, font, fontSize);
    tempY -= lineHeight;
  }
  
  // Réinitialiser Y pour l'en-tête droit
  tempY = currentY;
  
  // En-tête droite
  for (let i = 0; i < headerRight.length; i++) {
    const text = headerRight[i];
    
    // Utiliser l'italique pour "Peace - Work - Fatherland"
    const font = i === 1 ? timesItalicFont : 
                 i === 5 || i === 7 || i === 12 ? timesBoldFont : timesRomanFont;
    
    drawRightText(text, page.getWidth() - margin, tempY, font, fontSize);
    tempY -= lineHeight;
  }
  
  // Mettre à jour la position après les en-têtes
  currentY = tempY - 20;
  
  // Titre "ATTESTATION DE REUSSITE / ATTESTATION OF COMPLETION OF STUDIES"
  currentY -= drawCenteredText("ATTESTATION DE REUSSITE", currentY, timesBoldFont, 16);
  currentY -= drawCenteredText("ATTESTATION OF COMPLETION OF STUDIES", currentY, timesBoldFont, 14);
  
  // Référence
  currentY -= 30;
  const currentYear = new Date().getFullYear() % 100; // Obtient les 2 derniers chiffres de l'année
  const refText = `Ref N°……………/${currentYear}/UDo/FMSP/VDRC/IUB-SIGMEN`;
  currentY -= drawCenteredText(refText, currentY, timesRomanFont, 12);
  
  // Espace
  currentY -= 30;
  
  // Texte "Je soussigné"
  currentY -= drawLeftText("Je soussigné,", margin, currentY, timesRomanFont, 12);
  currentY -= drawLeftText("I, the undersigned,", margin, currentY, timesItalicFont, 12);
  
  // Date du jury
  const juryDate = "28/08/2024"; // Date à paramétrer si nécessaire
  currentY -= 20;
  currentY -= drawLeftText(`Vu le procès-verbal du jury N°0001 en date du ${juryDate} atteste que,`, margin, currentY, timesRomanFont, 12);
  currentY -= drawLeftText(`Considering the jury's decision N° 0001 dated ${juryDate} Certify that,`, margin, currentY, timesItalicFont, 12);
  
  // Nom de l'étudiant
  currentY -= 20;
  const studentFullName = `${student.NOM} ${student.PRENOM}`;
  currentY -= drawLeftText(`M./Mme/Mlle ${studentFullName}`, margin, currentY, timesBoldFont, 14);
  currentY -= drawLeftText("Mr/Mrs/Miss", margin, currentY, timesItalicFont, 12);
  
  // Date de naissance
  currentY -= 20;
  currentY -= drawLeftText(`Né(e) le : ${student["DATE DE NAISSANCE"]}`, margin, currentY, timesBoldFont, 12);
  currentY -= drawLeftText("Born on :", margin, currentY, timesItalicFont, 12);
  
  // Lieu de naissance
  currentY -= 5;
  currentY -= drawLeftText(`à ${student["LIEU DE NAISSANCE"]}`, margin + 80, currentY, timesBoldFont, 12);
  currentY -= drawLeftText("at :", margin, currentY, timesItalicFont, 12);
  
  // Matricule
  currentY -= 20;
  currentY -= drawLeftText(`Inscrit(e) à ${settings.nameFrench} sous le matricule : ${student.MATRICULE}`, margin, currentY, timesBoldFont, 12);
  currentY -= drawLeftText("Registered under the matricule number:", margin, currentY, timesItalicFont, 12);
  
  // Tableau avec les informations académiques
  currentY -= 30;
  
  // En-têtes du tableau
  const tableTop = currentY;
  const tableLeft = margin;
  const tableRight = page.getWidth() - margin;
  const tableWidth = tableRight - tableLeft;
  const col1Width = tableWidth * 0.25;
  const col2Width = tableWidth * 0.25;
  const col3Width = tableWidth * 0.25;
  const col4Width = tableWidth * 0.25;
  
  // Dessiner les lignes du tableau
  page.drawLine({
    start: { x: tableLeft, y: tableTop },
    end: { x: tableRight, y: tableTop },
    thickness: 1,
    color: black,
  });
  
  // Première ligne du tableau
  page.drawText("Domaine", { x: tableLeft + 10, y: tableTop - 15, font: timesBoldFont, size: 10 });
  page.drawText("Parcours", { x: tableLeft + col1Width + 10, y: tableTop - 15, font: timesBoldFont, size: 10 });
  page.drawText("Spécialité", { x: tableLeft + col1Width + col2Width + 10, y: tableTop - 15, font: timesBoldFont, size: 10 });
  page.drawText("Option", { x: tableLeft + col1Width + col2Width + col3Width + 10, y: tableTop - 15, font: timesBoldFont, size: 10 });
  
  // Sous-titres en anglais
  page.drawText("Domain of the study", { x: tableLeft + 10, y: tableTop - 30, font: timesItalicFont, size: 8 });
  page.drawText("Course", { x: tableLeft + col1Width + 10, y: tableTop - 30, font: timesItalicFont, size: 8 });
  page.drawText("Specialization", { x: tableLeft + col1Width + col2Width + 10, y: tableTop - 30, font: timesItalicFont, size: 8 });
  page.drawText("Learning option", { x: tableLeft + col1Width + col2Width + col3Width + 10, y: tableTop - 30, font: timesItalicFont, size: 8 });
  
  // Ligne horizontale après les en-têtes
  const headerBottom = tableTop - 35;
  page.drawLine({
    start: { x: tableLeft, y: headerBottom },
    end: { x: tableRight, y: headerBottom },
    thickness: 1,
    color: black,
  });
  
  // Données des domaines
  const domaineValue = "SCIENCES MEDICO-SANITAIRES";
  page.drawText(domaineValue, { x: tableLeft + 10, y: headerBottom - 15, font: timesBoldFont, size: 10 });
  
  const parcoursValue = student.PARCOURS || "SCIENCES INFIRMIERES";
  page.drawText(parcoursValue, { x: tableLeft + col1Width + 10, y: headerBottom - 15, font: timesBoldFont, size: 10 });
  
  const specialiteValue = student.SPECIALITE || "SCIENCES INFIRMIERES";
  page.drawText(specialiteValue, { x: tableLeft + col1Width + col2Width + 10, y: headerBottom - 15, font: timesBoldFont, size: 10 });
  
  const optionValue = student.OPTION || "SCIENCES INFIRMIERES";
  page.drawText(optionValue, { x: tableLeft + col1Width + col2Width + col3Width + 10, y: headerBottom - 15, font: timesBoldFont, size: 10 });
  
  // Ligne horizontale après les données
  const dataBottom = headerBottom - 25;
  page.drawLine({
    start: { x: tableLeft, y: dataBottom },
    end: { x: tableRight, y: dataBottom },
    thickness: 1,
    color: black,
  });
  
  // Lignes verticales du tableau
  page.drawLine({
    start: { x: tableLeft, y: tableTop },
    end: { x: tableLeft, y: dataBottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableLeft + col1Width, y: tableTop },
    end: { x: tableLeft + col1Width, y: dataBottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableLeft + col1Width + col2Width, y: tableTop },
    end: { x: tableLeft + col1Width + col2Width, y: dataBottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableLeft + col1Width + col2Width + col3Width, y: tableTop },
    end: { x: tableLeft + col1Width + col2Width + col3Width, y: dataBottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableRight, y: tableTop },
    end: { x: tableRight, y: dataBottom },
    thickness: 1,
    color: black,
  });
  
  // Deuxième tableau pour les crédits, moyenne, etc.
  const table2Top = dataBottom - 20;
  
  // Colonnes du deuxième tableau
  const col5Width = tableWidth * 0.2;
  const col6Width = tableWidth * 0.2;
  const col7Width = tableWidth * 0.2;
  const col8Width = tableWidth * 0.4;
  
  // Dessiner les lignes du deuxième tableau
  page.drawLine({
    start: { x: tableLeft, y: table2Top },
    end: { x: tableRight, y: table2Top },
    thickness: 1,
    color: black,
  });
  
  // En-têtes du deuxième tableau
  page.drawText("Total de credits", { x: tableLeft + 10, y: table2Top - 15, font: timesBoldFont, size: 10 });
  page.drawText("Moy", { x: tableLeft + col5Width + 10, y: table2Top - 15, font: timesBoldFont, size: 10 });
  page.drawText("Mention", { x: tableLeft + col5Width + col6Width + 10, y: table2Top - 15, font: timesBoldFont, size: 10 });
  page.drawText("Année académique", { x: tableLeft + col5Width + col6Width + col7Width + 10, y: table2Top - 15, font: timesBoldFont, size: 10 });
  
  // Sous-titres en anglais
  page.drawText("Credits earned", { x: tableLeft + 10, y: table2Top - 30, font: timesItalicFont, size: 8 });
  page.drawText("Average", { x: tableLeft + col5Width + 10, y: table2Top - 30, font: timesItalicFont, size: 8 });
  page.drawText("Grade", { x: tableLeft + col5Width + col6Width + 10, y: table2Top - 30, font: timesItalicFont, size: 8 });
  page.drawText("Academic year", { x: tableLeft + col5Width + col6Width + col7Width + 10, y: table2Top - 30, font: timesItalicFont, size: 8 });
  
  // Ligne horizontale après les en-têtes
  const header2Bottom = table2Top - 35;
  page.drawLine({
    start: { x: tableLeft, y: header2Bottom },
    end: { x: tableRight, y: header2Bottom },
    thickness: 1,
    color: black,
  });
  
  // Données de crédits et moyenne
  const credits = "60";
  page.drawText(credits, { x: tableLeft + 10, y: header2Bottom - 15, font: timesBoldFont, size: 10 });
  
  // Convertir la moyenne en chaîne si nécessaire
  const moyenneValue = typeof student.MOYENNE === 'number' 
    ? student.MOYENNE.toFixed(2) 
    : String(student.MOYENNE);
  page.drawText(moyenneValue, { x: tableLeft + col5Width + 10, y: header2Bottom - 15, font: timesBoldFont, size: 10 });
  
  // Mention et grade
  const gradeValue = student.GRADE || "";
  const mentionValue = student.MENTION || "Bien";
  page.drawText(`${mentionValue} ${gradeValue}`, { x: tableLeft + col5Width + col6Width + 10, y: header2Bottom - 15, font: timesBoldFont, size: 10 });
  
  // Année académique
  const yearValue = student["ANNEE ACADEMIQUE"] || "2023/2024";
  page.drawText(yearValue, { x: tableLeft + col5Width + col6Width + col7Width + 10, y: header2Bottom - 15, font: timesBoldFont, size: 10 });
  
  // Ligne horizontale après les données
  const data2Bottom = header2Bottom - 25;
  page.drawLine({
    start: { x: tableLeft, y: data2Bottom },
    end: { x: tableRight, y: data2Bottom },
    thickness: 1,
    color: black,
  });
  
  // Lignes verticales du deuxième tableau
  page.drawLine({
    start: { x: tableLeft, y: table2Top },
    end: { x: tableLeft, y: data2Bottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableLeft + col5Width, y: table2Top },
    end: { x: tableLeft + col5Width, y: data2Bottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableLeft + col5Width + col6Width, y: table2Top },
    end: { x: tableLeft + col5Width + col6Width, y: data2Bottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableLeft + col5Width + col6Width + col7Width, y: table2Top },
    end: { x: tableLeft + col5Width + col6Width + col7Width, y: data2Bottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableRight, y: table2Top },
    end: { x: tableRight, y: data2Bottom },
    thickness: 1,
    color: black,
  });
  
  // Troisième tableau pour "Finalité/Voie"
  const table3Top = data2Bottom - 20;
  
  // Dessiner les lignes du troisième tableau
  page.drawLine({
    start: { x: tableLeft, y: table3Top },
    end: { x: tableRight, y: table3Top },
    thickness: 1,
    color: black,
  });
  
  // En-têtes du troisième tableau
  page.drawText("Finalité/Voie", { x: tableLeft + 10, y: table3Top - 15, font: timesBoldFont, size: 10 });
  page.drawText("Finality/Vocation", { x: tableLeft + 10, y: table3Top - 30, font: timesItalicFont, size: 8 });
  
  // Ligne horizontale après les en-têtes
  const header3Bottom = table3Top - 35;
  page.drawLine({
    start: { x: tableLeft, y: header3Bottom },
    end: { x: tableRight, y: header3Bottom },
    thickness: 1,
    color: black,
  });
  
  // Données de finalité
  const finaliteValue = "LICENCE PROFESSIONNELLE";
  const finaliteX = centerX - (timesBoldFont.widthOfTextAtSize(finaliteValue, 12) / 2);
  page.drawText(finaliteValue, { x: finaliteX, y: header3Bottom - 15, font: timesBoldFont, size: 12 });
  
  // Ligne horizontale après les données
  const data3Bottom = header3Bottom - 25;
  page.drawLine({
    start: { x: tableLeft, y: data3Bottom },
    end: { x: tableRight, y: data3Bottom },
    thickness: 1,
    color: black,
  });
  
  // Lignes verticales du troisième tableau
  page.drawLine({
    start: { x: tableLeft, y: table3Top },
    end: { x: tableLeft, y: data3Bottom },
    thickness: 1,
    color: black,
  });
  
  page.drawLine({
    start: { x: tableRight, y: table3Top },
    end: { x: tableRight, y: data3Bottom },
    thickness: 1,
    color: black,
  });
  
  // Texte de déclaration
  currentY = data3Bottom - 30;
  currentY -= drawLeftText("En foi de quoi la présente Attestation est délivrée pour servir et valoir ce que de droit.", margin, currentY, timesRomanFont, 12);
  currentY -= drawLeftText("In witness where of the present testimonial is given with all the privileges there to pertaining.", margin, currentY, timesItalicFont, 12);
  
  // Douala, le...
  currentY -= 30;
  
  // Date
  const doualaDroite = page.getWidth() - margin - 150;
  currentY -= drawLeftText("Douala, le", doualaDroite, currentY, timesBoldFont, 12);
  currentY -= drawLeftText("Douala, the", doualaDroite, currentY, timesItalicFont, 12);
  
  // Espaces pour signatures
  currentY -= 40;
  
  // Directeur et Recteur
  const directeurX = margin;
  const recteurX = page.getWidth() - margin - 200;
  
  currentY -= drawLeftText("Le Directeur de L'Institut Universitaire Des Bâtisseurs-SIGMEN", directeurX, currentY, timesBoldFont, 12);
  currentY -= drawLeftText("The Director of the University Institute of Builders-SIGMEN", directeurX, currentY, timesItalicFont, 12);
  
  drawLeftText("Le Recteur de l'Université de Douala", recteurX, currentY + 17, timesBoldFont, 12);
  drawLeftText("The Rector of the University of Douala", recteurX, currentY, timesItalicFont, 12);
  
  // Note de bas de page
  currentY -= 120;
  currentY -= drawLeftText("Cette Attestation ne tient pas lieu de Diplôme et n'est délivrée qu'en un seul", margin, currentY, timesRomanFont, 10);
  currentY -= drawLeftText("exemplaire et d'une validité de (6) mois à partir de la date de signature. Le Diplôme", margin, currentY, timesRomanFont, 10);
  currentY -= drawLeftText("lui sera délivré ultérieurement", margin, currentY, timesRomanFont, 10);
  
  currentY -= 5;
  currentY -= drawLeftText("Only one copy of this Attestation shall be delivered and is not a certificate. This", margin, currentY, timesItalicFont, 10);
  currentY -= drawLeftText("Attestation is valid for (6) six months from the date of signature. The Certificate will", margin, currentY, timesItalicFont, 10);
  currentY -= drawLeftText("be issued at a later date.", margin, currentY, timesItalicFont, 10);
  
  // Ajout du QR Code si fourni
  if (options.qrCodeImage) {
    try {
      const qrCode = await pdfDoc.embedPng(new Uint8Array(options.qrCodeImage as ArrayBuffer));
      
      // Position par défaut si non spécifiée
      const qrPosition = options.qrCodePosition || { x: 470, y: 220 };
      
      page.drawImage(qrCode, {
        x: qrPosition.x,
        y: qrPosition.y,
        width: 100,
        height: 100,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout du QR code:", error);
    }
  }
  
  // Finalisation du PDF
  return await pdfDoc.save();
}