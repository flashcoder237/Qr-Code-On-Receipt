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
