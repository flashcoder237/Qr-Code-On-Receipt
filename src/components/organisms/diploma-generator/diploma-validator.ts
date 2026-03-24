// src/components/organisms/diploma-generator/diploma-validator.ts
// Logique de validation des diplômes avec critères de génération

import { DiplomaStudentRecord } from '@/lib/diploma-generator/types';

export interface ValidationIssue {
  field: string;
  issue: string;
}

export interface DiplomaValidationResult {
  isValid: boolean;
  student: DiplomaStudentRecord;
  issues: ValidationIssue[];
  canGenerate: boolean; // true si peut générer le diplôme
  reason?: string; // raison si ne peut pas générer
}

/**
 * Champs obligatoires pour un diplôme
 */
const REQUIRED_FIELDS: Array<keyof DiplomaStudentRecord> = [
  'NOM',
  'MATRICULE',
  'DATE DE NAISSANCE',
  'LIEU DE NAISSANCE',
  'TITRE DIPLOME FR',
  'TITRE DIPLOME EN',
  'MENTION',
  'ANNEE OBTENTION',
  'DATE JURY ADMISSION',
  'DATE JURY DELIBERATION',
  'PARCOURS',
  'SPECIALITE',
  'MOYENNE',
  'GRADE'
];

/**
 * Vérifie si une valeur est vide ou N/D
 */
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed === 'N/D';
  }
  if (typeof value === 'number' && value === 0) return false; // 0 est une valeur valide pour la moyenne
  return false;
}

const DEFAULT_MIN_MOYENNE = 10;

/**
 * Lit le seuil minimum de moyenne depuis localStorage (configurable par l'utilisateur)
 */
export function getMinMoyenneThreshold(): number {
  try {
    const stored = localStorage.getItem('diploma-min-moyenne');
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 20) return parsed;
    }
  } catch {}
  return DEFAULT_MIN_MOYENNE;
}

/**
 * Sauvegarde le seuil minimum de moyenne dans localStorage
 */
export function setMinMoyenneThreshold(value: number) {
  localStorage.setItem('diploma-min-moyenne', String(value));
}

/**
 * Valide un diplôme et détermine s'il peut être généré
 *
 * Critères de génération :
 * 1. Tous les champs obligatoires doivent être remplis
 * 2. La moyenne doit être >= minMoyenne (défaut: 10, configurable)
 */
export function validateDiploma(
  student: DiplomaStudentRecord,
  minMoyenne?: number
): DiplomaValidationResult {
  const threshold = minMoyenne ?? getMinMoyenneThreshold();
  const issues: ValidationIssue[] = [];

  // Vérifier les champs obligatoires
  for (const field of REQUIRED_FIELDS) {
    const value = student[field];
    if (isEmpty(value)) {
      issues.push({
        field: field as string,
        issue: 'Champ obligatoire manquant'
      });
    }
  }

  // Vérifier la moyenne
  const moyenne = typeof student.MOYENNE === 'number'
    ? student.MOYENNE
    : parseFloat(String(student.MOYENNE || '0'));

  let canGenerate = true;
  let reason: string | undefined;

  // Déterminer si le diplôme peut être généré
  if (issues.length > 0) {
    canGenerate = false;
    reason = `Données incomplètes: ${issues.length} champ(s) manquant(s)`;
  } else if (isNaN(moyenne) || moyenne < threshold) {
    canGenerate = false;
    reason = `Moyenne insuffisante: ${moyenne.toFixed(2)} (minimum requis: ${threshold.toFixed(2)})`;
  }

  return {
    isValid: issues.length === 0,
    student,
    issues,
    canGenerate,
    reason
  };
}

/**
 * Valide une liste de diplômes et les sépare en deux groupes
 */
export function validateDiplomaList(students: DiplomaStudentRecord[]): {
  valid: DiplomaValidationResult[];
  invalid: DiplomaValidationResult[];
  stats: {
    total: number;
    canGenerate: number;
    missingData: number;
    insufficientAverage: number;
  };
} {
  const valid: DiplomaValidationResult[] = [];
  const invalid: DiplomaValidationResult[] = [];

  let missingData = 0;
  let insufficientAverage = 0;

  students.forEach(student => {
    const result = validateDiploma(student);

    if (result.canGenerate) {
      valid.push(result);
    } else {
      invalid.push(result);

      // Compter les raisons
      if (result.issues.length > 0) {
        missingData++;
      } else {
        insufficientAverage++;
      }
    }
  });

  return {
    valid,
    invalid,
    stats: {
      total: students.length,
      canGenerate: valid.length,
      missingData,
      insufficientAverage
    }
  };
}

/**
 * Obtient un nom de champ lisible
 */
export function getFieldDisplayName(fieldKey: string): string {
  const displayNames: Record<string, string> = {
    'NOM': 'Nom de famille',
    'PRENOM': 'Prénom',
    'MATRICULE': 'Matricule',
    'DATE DE NAISSANCE': 'Date de naissance',
    'LIEU DE NAISSANCE': 'Lieu de naissance',
    'TITRE DIPLOME FR': 'Titre du diplôme (FR)',
    'TITRE DIPLOME EN': 'Titre du diplôme (EN)',
    'MENTION': 'Mention',
    'ANNEE OBTENTION': 'Année d\'obtention',
    'DATE JURY ADMISSION': 'Date jury d\'admission',
    'DATE JURY DELIBERATION': 'Date jury de délibération',
    'PARCOURS': 'Parcours',
    'SPECIALITE': 'Spécialité',
    'MOYENNE': 'Moyenne',
    'GRADE': 'Grade',
    'OPTION': 'Option (FR)',
    'OPTION_EN': 'Option (EN)',
    'MENTION_EN': 'Mention (EN)'
  };

  return displayNames[fieldKey] || fieldKey;
}
