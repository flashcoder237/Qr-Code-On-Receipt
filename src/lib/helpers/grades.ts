export const getGradeFromAverage = (average: number): string => {
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
};

// Fonction pour convertir une note d'une base à une autre
export const convertNoteBase = (note: number, fromBase: number, toBase: number): number => {
  if (fromBase === toBase) return note;
  return (note * toBase) / fromBase;
};

// Fonction pour calculer la moyenne pondérée d'une UE
export const calculateUEAverage = (
  ecs: Array<{
    note: number;
    weight?: number;
    noteBase?: number;
    displayBase?: number;
  }>
): { average: number; displayAverage: number } => {
  if (ecs.length === 0) return { average: 0, displayAverage: 0 };

  let totalWeightedPoints = 0;
  let totalWeights = 0;

  ecs.forEach(ec => {
    const weight = ec.weight || 1;
    const noteBase = ec.noteBase || 20;
    const displayBase = ec.displayBase || 20;
    
    // Convertir la note vers la base 20 pour le calcul
    const normalizedNote = convertNoteBase(ec.note, noteBase, 20);
    
    totalWeightedPoints += normalizedNote * weight;
    totalWeights += weight;
  });

  const average = totalWeights > 0 ? totalWeightedPoints / totalWeights : 0;
  
  // Convertir la moyenne vers la base d'affichage de l'UE (par défaut 20)
  const ueDisplayBase = ecs[0]?.displayBase || 20; // Utiliser la base d'affichage du premier EC comme référence UE
  const displayAverage = convertNoteBase(average, 20, ueDisplayBase);
  
  return { average, displayAverage };
};

export const calculateMGP = (grade: string): number => {
  const gradePoints: { [key: string]: number } = {
    "A+": 4.0,
    A: 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    D: 1.3,
    E: 1.0,
    F: 0.0,
  };
  return gradePoints[grade] || 0;
};

export const calculateStatistics = (
  teachingUnits: { credits: number; grade: number }[]
) => {
  const totalCredits = teachingUnits.reduce(
    (sum, unit) => sum + unit.credits,
    0
  );

  const totalPoints = teachingUnits.reduce(
    (sum, unit) => sum + unit.credits * unit.grade,
    0
  );

  const average = totalCredits > 0 ? totalPoints / totalCredits : 0;
  const mgp = average / 2; //TODO: replace
  const grade = average >= 10 ? "Pass" : "Fail";

  return { totalCredits, average, mgp, grade };
};

// Fonction pour calculer les statistiques d'un semestre avec les nouvelles configurations
export const calculateSemesterStatistics = (
  ues: Array<{
    credits: number;
    average: number;
    displayBase?: number;
  }>,
  creditsRequired: number = 30,
  ignoreCredits: boolean = false
) => {
  const totalCredits = ues.reduce((sum, ue) => sum + ue.credits, 0);

  // Calcul de la moyenne selon l'option choisie
  let average: number;
  if (ignoreCredits) {
    // Moyenne arithmétique simple : toutes les UEs ont le même poids
    average = ues.length > 0 ? ues.reduce((sum, ue) => sum + ue.average, 0) / ues.length : 0;
  } else {
    // Moyenne pondérée par les crédits (comportement par défaut)
    const totalPoints = ues.reduce((sum, ue) => sum + ue.credits * ue.average, 0);
    average = totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  const isValidated = totalCredits >= creditsRequired && average >= 10;
  const grade = getGradeFromAverage(average);
  const mgp = calculateMGP(grade);

  return {
    totalCredits,
    creditsRequired,
    average,
    mgp,
    grade,
    isValidated,
    creditsObtained: isValidated ? totalCredits : 0
  };
};

// Fonction pour calculer les statistiques de semestres fusionnés
export const calculateMergedSemesterStatistics = (
  semesters: Array<{
    ues: Array<{
      credits: number;
      average: number;
      displayBase?: number;
    }>;
  }>,
  creditsRequired: number = 60,
  ignoreCredits: boolean = false
) => {
  // Combiner toutes les UE de tous les semestres
  const allUes = semesters.flatMap(semester => semester.ues);

  return calculateSemesterStatistics(allUes, creditsRequired, ignoreCredits);
};
