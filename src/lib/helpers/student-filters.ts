// src/lib/helpers/student-filters.ts
// Fonctions utilitaires pour filtrer les étudiants selon leurs moyennes

/**
 * Vérifie si un étudiant est éligible pour générer une attestation
 * (moyenne >= 10)
 */
export function isStudentEligibleForAttestation(student: any): boolean {
  if (!student) return false;
  
  let average = 0;
  
  // Récupérer la moyenne selon différents formats possibles
  if (typeof student.MOYENNE === 'number') {
    average = student.MOYENNE;
  } else if (typeof student.MOYENNE === 'string') {
    average = parseFloat(student.MOYENNE) || 0;
  } else if (student.average) {
    average = typeof student.average === 'number' ? student.average : parseFloat(student.average) || 0;
  }
  
  return average >= 10;
}

/**
 * Filtre une liste d'étudiants pour ne garder que ceux éligibles aux attestations
 */
export function filterEligibleStudents(students: any[]): any[] {
  return students.filter(isStudentEligibleForAttestation);
}

/**
 * Sépare les étudiants en éligibles et non-éligibles
 */
export function separateStudentsByEligibility(students: any[]): {
  eligible: any[];
  notEligible: any[];
} {
  const eligible: any[] = [];
  const notEligible: any[] = [];
  
  students.forEach(student => {
    if (isStudentEligibleForAttestation(student)) {
      eligible.push(student);
    } else {
      notEligible.push(student);
    }
  });
  
  return { eligible, notEligible };
}

/**
 * Obtient la moyenne d'un étudiant dans un format standardisé
 */
export function getStudentAverage(student: any): number {
  if (!student) return 0;
  
  if (typeof student.MOYENNE === 'number') {
    return student.MOYENNE;
  } else if (typeof student.MOYENNE === 'string') {
    return parseFloat(student.MOYENNE) || 0;
  } else if (student.average) {
    return typeof student.average === 'number' ? student.average : parseFloat(student.average) || 0;
  }
  
  return 0;
}

/**
 * Génère un message d'information sur l'éligibilité
 */
export function getEligibilityMessage(totalStudents: number, eligibleCount: number): string {
  const notEligibleCount = totalStudents - eligibleCount;
  
  if (notEligibleCount === 0) {
    return `Tous les ${totalStudents} étudiants sont éligibles pour les attestations (moyenne ≥ 10).`;
  } else if (eligibleCount === 0) {
    return `Aucun étudiant n'est éligible pour les attestations. ${notEligibleCount} étudiant(s) ont une moyenne < 10.`;
  } else {
    return `${eligibleCount} étudiant(s) éligible(s) sur ${totalStudents}. ${notEligibleCount} étudiant(s) non éligible(s) (moyenne < 10).`;
  }
}

/**
 * Valide qu'au moins un étudiant est éligible dans une sélection
 */
export function validateEligibleSelection(students: any[], selectedMatricules: string[]): {
  isValid: boolean;
  eligibleCount: number;
  totalSelected: number;
  message: string;
} {
  const selectedStudents = students.filter(s => selectedMatricules.includes(s.MATRICULE));
  const eligibleSelected = filterEligibleStudents(selectedStudents);
  
  const totalSelected = selectedStudents.length;
  const eligibleCount = eligibleSelected.length;
  const notEligibleCount = totalSelected - eligibleCount;
  
  let message = '';
  let isValid = true;
  
  if (totalSelected === 0) {
    message = 'Aucun étudiant sélectionné.';
    isValid = false;
  } else if (eligibleCount === 0) {
    message = `Les ${totalSelected} étudiant(s) sélectionné(s) ne sont pas éligibles (moyenne < 10).`;
    isValid = false;
  } else if (notEligibleCount > 0) {
    message = `${eligibleCount} étudiant(s) éligible(s) sélectionné(s). ${notEligibleCount} non éligible(s) seront ignorés.`;
    isValid = true;
  } else {
    message = `${eligibleCount} étudiant(s) éligible(s) sélectionné(s).`;
    isValid = true;
  }
  
  return {
    isValid,
    eligibleCount,
    totalSelected,
    message
  };
}