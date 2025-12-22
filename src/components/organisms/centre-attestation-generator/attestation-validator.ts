// src/components/organisms/centre-attestation-generator/attestation-validator.ts
// Validation des attestations de centre avant génération

import { CentreAttestationStudentRecord } from '@/lib/centre-attestation-generator/types';
import { validateCentreAttestationStudent } from '@/lib/centre-attestation-generator/validation';

export interface CentreAttestationValidationResult {
  student: CentreAttestationStudentRecord;
  isValid: boolean;
  canGenerate: boolean;
  reason?: string;
  warnings: string[];
}

export interface CentreAttestationValidationStats {
  total: number;
  canGenerate: number;
  missingData: number;
  hasWarnings: number;
}

export interface CentreAttestationValidation {
  valid: CentreAttestationValidationResult[];
  invalid: CentreAttestationValidationResult[];
  stats: CentreAttestationValidationStats;
}

/**
 * Valide une liste d'attestations avant génération
 */
export function validateCentreAttestationList(
  students: CentreAttestationStudentRecord[]
): CentreAttestationValidation {
  const results: CentreAttestationValidationResult[] = [];

  students.forEach((student) => {
    const validation = validateCentreAttestationStudent(student);
    const canGenerate = validation.isValid;
    const reason = validation.errors.length > 0
      ? validation.errors.join(', ')
      : undefined;

    results.push({
      student,
      isValid: validation.isValid,
      canGenerate,
      reason,
      warnings: validation.warnings,
    });
  });

  const valid = results.filter(r => r.canGenerate);
  const invalid = results.filter(r => !r.canGenerate);
  const hasWarnings = results.filter(r => r.warnings.length > 0);

  const stats: CentreAttestationValidationStats = {
    total: students.length,
    canGenerate: valid.length,
    missingData: invalid.length,
    hasWarnings: hasWarnings.length,
  };

  return {
    valid,
    invalid,
    stats,
  };
}
