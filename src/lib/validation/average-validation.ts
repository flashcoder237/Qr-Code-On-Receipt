// src/lib/validation/average-validation.ts - Validation des moyennes pour attestations
export interface StudentValidationResult {
  isEligible: boolean;
  reason?: string;
  average?: number;
}

/**
 * Valide qu'un étudiant est éligible pour une attestation (moyenne >= 10)
 */
export function validateStudentForAttestation(student: any): StudentValidationResult {
  // Extraire la moyenne de l'étudiant
  let average: number = 0;
  
  if (typeof student.MOYENNE === 'number') {
    average = student.MOYENNE;
  } else if (typeof student.MOYENNE === 'string') {
    average = parseFloat(student.MOYENNE);
  } else {
    return {
      isEligible: false,
      reason: "Moyenne non définie ou invalide",
      average: 0
    };
  }

  // Vérifier que la moyenne est un nombre valide
  if (isNaN(average)) {
    return {
      isEligible: false,
      reason: "Moyenne invalide",
      average: 0
    };
  }

  // Vérifier que la moyenne est >= 10
  if (average < 10) {
    return {
      isEligible: false,
      reason: `Moyenne insuffisante (${average.toFixed(2)}/20). Une moyenne d'au moins 10/20 est requise pour générer une attestation.`,
      average
    };
  }

  return {
    isEligible: true,
    average
  };
}

/**
 * Filtre une liste d'étudiants pour ne garder que ceux éligibles aux attestations
 */
export function filterEligibleStudents(students: any[]): {
  eligible: any[];
  ineligible: any[];
  eligibleCount: number;
  ineligibleCount: number;
} {
  const eligible: any[] = [];
  const ineligible: any[] = [];

  students.forEach(student => {
    const validation = validateStudentForAttestation(student);
    if (validation.isEligible) {
      eligible.push(student);
    } else {
      ineligible.push({
        ...student,
        validationError: validation.reason,
        average: validation.average
      });
    }
  });

  return {
    eligible,
    ineligible,
    eligibleCount: eligible.length,
    ineligibleCount: ineligible.length
  };
}

/**
 * Vérifie si tous les étudiants sélectionnés sont éligibles
 */
export function validateSelectedStudents(students: any[], selectedMatricules: string[]): {
  isValid: boolean;
  ineligibleStudents: Array<{
    student: any;
    reason: string;
  }>;
} {
  const selectedStudents = students.filter(s => selectedMatricules.includes(s.MATRICULE));
  const ineligibleStudents: Array<{ student: any; reason: string }> = [];

  selectedStudents.forEach(student => {
    const validation = validateStudentForAttestation(student);
    if (!validation.isEligible) {
      ineligibleStudents.push({
        student,
        reason: validation.reason || "Moyenne insuffisante"
      });
    }
  });

  return {
    isValid: ineligibleStudents.length === 0,
    ineligibleStudents
  };
}

/**
 * Calcule les statistiques de moyennes pour un groupe d'étudiants
 */
export function calculateAverageStatistics(students: any[]): {
  total: number;
  eligible: number;
  ineligible: number;
  averageGeneral: number;
  averageEligible: number;
  percentageEligible: number;
} {
  const validStudents = students.filter(s => {
    const avg = typeof s.MOYENNE === 'number' ? s.MOYENNE : parseFloat(s.MOYENNE);
    return !isNaN(avg);
  });

  const eligible = validStudents.filter(s => {
    const avg = typeof s.MOYENNE === 'number' ? s.MOYENNE : parseFloat(s.MOYENNE);
    return avg >= 10;
  });

  const ineligible = validStudents.filter(s => {
    const avg = typeof s.MOYENNE === 'number' ? s.MOYENNE : parseFloat(s.MOYENNE);
    return avg < 10;
  });

  const averageGeneral = validStudents.length > 0 
    ? validStudents.reduce((sum, s) => {
        const avg = typeof s.MOYENNE === 'number' ? s.MOYENNE : parseFloat(s.MOYENNE);
        return sum + avg;
      }, 0) / validStudents.length
    : 0;

  const averageEligible = eligible.length > 0
    ? eligible.reduce((sum, s) => {
        const avg = typeof s.MOYENNE === 'number' ? s.MOYENNE : parseFloat(s.MOYENNE);
        return sum + avg;
      }, 0) / eligible.length
    : 0;

  const percentageEligible = validStudents.length > 0 
    ? (eligible.length / validStudents.length) * 100 
    : 0;

  return {
    total: validStudents.length,
    eligible: eligible.length,
    ineligible: ineligible.length,
    averageGeneral,
    averageEligible,
    percentageEligible
  };
}