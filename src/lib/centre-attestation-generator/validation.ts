// src/lib/centre-attestation-generator/validation.ts
// Validation des données pour les attestations de centres

import {
  CentreAttestationStudentRecord,
  CentreAttestationValidationResult,
  CentreAttestationValidationStats,
  REQUIRED_FIELDS,
} from './types';

/**
 * Valide un étudiant pour la génération d'attestation
 */
export function validateCentreAttestationStudent(
  student: Partial<CentreAttestationStudentRecord>
): CentreAttestationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vérifier les champs requis
  REQUIRED_FIELDS.forEach((field) => {
    const value = student[field as keyof typeof student];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`Le champ "${field}" est requis`);
    }
  });

  // Validations spécifiques
  if (student.NOM && typeof student.NOM === 'string') {
    if (student.NOM.length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
  }

  if (student.PRENOM && typeof student.PRENOM === 'string') {
    if (student.PRENOM.length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    }
  }

  if (student.MATRICULE && typeof student.MATRICULE === 'string') {
    if (student.MATRICULE.length < 3) {
      errors.push('Le matricule doit contenir au moins 3 caractères');
    }
  }

  // Validation de la date de naissance
  if (student["DATE DE NAISSANCE"]) {
    const dateStr = student["DATE DE NAISSANCE"].toString();
    if (!isValidDate(dateStr)) {
      errors.push('La date de naissance est invalide. Format attendu: JJ/MM/AAAA');
    }
  }

  // Validation de la moyenne
  if (student.MOYENNE !== undefined && student.MOYENNE !== null) {
    const moyenne = typeof student.MOYENNE === 'string'
      ? parseFloat(student.MOYENNE.replace(',', '.'))
      : student.MOYENNE;

    if (isNaN(moyenne)) {
      errors.push('La moyenne doit être un nombre valide');
    } else if (moyenne < 0 || moyenne > 20) {
      warnings.push('La moyenne est hors de la plage normale (0-20)');
    }
  }

  // Validation de la spécialité
  if (student.SPECIALITE && typeof student.SPECIALITE === 'string') {
    if (student.SPECIALITE.length < 3) {
      errors.push('La spécialité doit contenir au moins 3 caractères');
    }
  }

  // Validation de la session d'examen
  if (student.SESSION_EXAMEN && typeof student.SESSION_EXAMEN === 'string') {
    if (student.SESSION_EXAMEN.length < 3) {
      errors.push('La session d\'examen est invalide');
    }
  }

  // Validation du lieu de délivrance
  if (student.LIEU_DELIVRANCE && typeof student.LIEU_DELIVRANCE === 'string') {
    if (student.LIEU_DELIVRANCE.length < 2) {
      errors.push('Le lieu de délivrance doit contenir au moins 2 caractères');
    }
  }

  // Warnings pour les champs optionnels manquants
  if (!student.SPECIALITE_EN) {
    warnings.push('La spécialité en anglais n\'est pas renseignée');
  }

  if (!student.NUMERO_ORDRE) {
    warnings.push('Le numéro d\'ordre n\'est pas renseigné');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    student: student as CentreAttestationStudentRecord,
    errors,
    warnings,
  };
}

/**
 * Valide une liste d'étudiants
 */
export function validateCentreAttestationStudents(
  students: Partial<CentreAttestationStudentRecord>[]
): CentreAttestationValidationStats {
  const validStudents: CentreAttestationStudentRecord[] = [];
  const invalidStudents: Array<{
    student: Partial<CentreAttestationStudentRecord>;
    errors: string[];
  }> = [];

  students.forEach((student) => {
    const result = validateCentreAttestationStudent(student);
    if (result.isValid) {
      validStudents.push(result.student);
    } else {
      invalidStudents.push({
        student,
        errors: result.errors,
      });
    }
  });

  return {
    total: students.length,
    valid: validStudents.length,
    invalid: invalidStudents.length,
    validStudents,
    invalidStudents,
  };
}

/**
 * Vérifie si une chaîne est une date valide au format JJ/MM/AAAA
 */
function isValidDate(dateStr: string): boolean {
  // Formats acceptés: JJ/MM/AAAA, JJ-MM-AAAA, JJ.MM.AAAA
  const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
  const match = dateStr.match(dateRegex);

  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  // Vérifier les limites
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;

  // Vérifier les jours par mois
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;

  return true;
}

/**
 * Formate la date au format JJ/MM/AAAA
 */
export function formatDate(date: string | Date): string {
  if (date instanceof Date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Si c'est déjà une chaîne, vérifier qu'elle est au bon format
  const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
  const match = date.match(dateRegex);

  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${day}/${month}/${year}`;
  }

  return date;
}

/**
 * Génère un nom de fichier sécurisé à partir du nom de l'étudiant
 */
export function generateSafeFileName(student: CentreAttestationStudentRecord): string {
  const cleanName = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Retirer les caractères spéciaux
      .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
      .toUpperCase();

  const nom = cleanName(student.NOM);
  const prenom = cleanName(student.PRENOM);
  const matricule = cleanName(student.MATRICULE);

  return `Attestation_${nom}_${prenom}_${matricule}.pdf`;
}

/**
 * Statistiques de validation pour affichage
 */
export function getValidationSummary(stats: CentreAttestationValidationStats): string {
  const lines: string[] = [];

  lines.push(`Total d'étudiants: ${stats.total}`);
  lines.push(`✓ Valides: ${stats.valid} (${((stats.valid / stats.total) * 100).toFixed(1)}%)`);

  if (stats.invalid > 0) {
    lines.push(`✗ Invalides: ${stats.invalid} (${((stats.invalid / stats.total) * 100).toFixed(1)}%)`);
  }

  return lines.join('\n');
}

/**
 * Récupère les erreurs d'un étudiant invalide
 */
export function getStudentErrors(
  student: Partial<CentreAttestationStudentRecord>,
  stats: CentreAttestationValidationStats
): string[] {
  const invalidStudent = stats.invalidStudents.find(
    (inv) => inv.student.MATRICULE === student.MATRICULE
  );

  return invalidStudent?.errors || [];
}

export default {
  validateCentreAttestationStudent,
  validateCentreAttestationStudents,
  formatDate,
  generateSafeFileName,
  getValidationSummary,
  getStudentErrors,
};
