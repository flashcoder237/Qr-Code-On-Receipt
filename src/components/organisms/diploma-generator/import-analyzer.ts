// src/components/organisms/diploma-generator/import-analyzer.ts
// Utilitaires pour analyser les données importées et générer des statistiques

import { DiplomaStudentRecord } from '@/lib/diploma-generator/types';
import { ImportStats, FieldStatus } from './ImportReport';

/**
 * Liste des champs avec leurs informations
 */
const FIELD_DEFINITIONS: Array<{
  key: keyof DiplomaStudentRecord;
  displayName: string;
  required: boolean;
}> = [
  // Champs obligatoires
  { key: 'NOM', displayName: 'Nom de famille', required: true },
  { key: 'MATRICULE', displayName: 'Matricule', required: true },
  { key: 'DATE DE NAISSANCE', displayName: 'Date de naissance', required: true },
  { key: 'LIEU DE NAISSANCE', displayName: 'Lieu de naissance', required: true },
  { key: 'TITRE DIPLOME FR', displayName: 'Titre du diplôme (FR)', required: true },
  { key: 'TITRE DIPLOME EN', displayName: 'Titre du diplôme (EN)', required: true },
  { key: 'MENTION', displayName: 'Mention', required: true },
  { key: 'ANNEE OBTENTION', displayName: 'Année d\'obtention', required: true },
  { key: 'DATE JURY ADMISSION', displayName: 'Date jury d\'admission', required: true },
  { key: 'DATE JURY DELIBERATION', displayName: 'Date jury de délibération', required: true },
  { key: 'PARCOURS', displayName: 'Parcours', required: true },
  { key: 'SPECIALITE', displayName: 'Spécialité', required: true },
  { key: 'MOYENNE', displayName: 'Moyenne', required: true },
  { key: 'GRADE', displayName: 'Grade', required: true },

  // Champs optionnels
  { key: 'PRENOM', displayName: 'Prénom', required: false },
  { key: 'OPTION', displayName: 'Option (FR)', required: false },
  { key: 'OPTION_EN', displayName: 'Option (EN)', required: false },
  { key: 'MENTION_EN', displayName: 'Mention (EN)', required: false },
];

/**
 * Vérifie si un champ est vide ou contient une valeur par défaut
 */
function isFieldEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed === 'N/D';
  }
  if (typeof value === 'number' && value === 0) return true;
  return false;
}

/**
 * Vérifie si un enregistrement est complet (tous les champs obligatoires remplis)
 */
function isRecordComplete(record: DiplomaStudentRecord): boolean {
  return FIELD_DEFINITIONS
    .filter(field => field.required)
    .every(field => !isFieldEmpty(record[field.key]));
}

/**
 * Analyse les données importées et génère des statistiques détaillées
 */
export function analyzeImportedData(data: DiplomaStudentRecord[]): ImportStats {
  const totalRecords = data.length;

  // Compter les enregistrements complets
  let completeRecords = 0;
  data.forEach(record => {
    if (isRecordComplete(record)) {
      completeRecords++;
    }
  });

  const incompleteRecords = totalRecords - completeRecords;

  // Analyser chaque champ
  const fieldsStatus: FieldStatus[] = FIELD_DEFINITIONS.map(fieldDef => {
    let filledCount = 0;
    let missingCount = 0;

    data.forEach(record => {
      const value = record[fieldDef.key];
      if (isFieldEmpty(value)) {
        missingCount++;
      } else {
        filledCount++;
      }
    });

    const percentage = totalRecords > 0 ? (filledCount / totalRecords) * 100 : 0;

    return {
      fieldName: fieldDef.key,
      displayName: fieldDef.displayName,
      required: fieldDef.required,
      missingCount,
      filledCount,
      percentage,
    };
  });

  return {
    totalRecords,
    completeRecords,
    incompleteRecords,
    fieldsStatus,
  };
}
