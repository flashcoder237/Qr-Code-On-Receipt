// src/lib/validators/excel-columns.ts - Version corrigée
export interface ColumnRequirement {
  key: string;
  displayName: string;
  required: boolean;
  alternatives?: string[]; // Noms alternatifs acceptés
  description?: string;
}

export interface ValidationResult {
  isValid: boolean;
  missingRequired: ColumnRequirement[];
  missingOptional: ColumnRequirement[];
  availableColumns: string[];
  suggestions: { [key: string]: string[] }; // Suggestions de correspondance
  mappedColumns: { [key: string]: string }; // Colonnes trouvées automatiquement
}

// Colonnes requises pour les relevés
export const RELEVE_REQUIRED_COLUMNS: ColumnRequirement[] = [
  {
    key: 'NOM',
    displayName: 'Nom de famille',
    required: true,
    alternatives: ['nom', 'surname', 'last_name', 'family_name', 'last name', 'nom de famille']
  },
  {
    key: 'PRENOM',
    displayName: 'Prénom',
    required: true,
    alternatives: ['prenom', 'firstname', 'first_name', 'given_name', 'first name', 'prénom']
  },
  {
    key: 'MATRICULE',
    displayName: 'Matricule',
    required: true,
    alternatives: ['matricule', 'mat', 'student_id', 'registration_number', 'registration number', 'numero matricule']
  },
  {
    key: 'DATE DE NAISSANCE',
    displayName: 'Date de naissance',
    required: true,
    alternatives: ['date_naissance', 'birth_date', 'birthdate', 'date_of_birth', 'birth date', 'date de naissance', 'naissance']
  },
  {
    key: 'LIEU DE NAISSANCE',
    displayName: 'Lieu de naissance',
    required: true,
    alternatives: ['lieu_naissance', 'birth_place', 'birthplace', 'place_of_birth', 'birth place', 'lieu de naissance', 'ville naissance']
  }
];

export const RELEVE_OPTIONAL_COLUMNS: ColumnRequirement[] = [
  {
    key: 'NIVEAU',
    displayName: 'Niveau',
    required: false,
    alternatives: ['niveau', 'level', 'grade_level', 'class level', 'classe']
  },
  {
    key: 'SEMESTRE',
    displayName: 'Semestre',
    required: false,
    alternatives: ['semestre', 'semester', 'term', 'periode']
  },
  {
    key: 'CYCLE',
    displayName: 'Cycle',
    required: false,
    alternatives: ['cycle', 'program_cycle', 'formation cycle']
  },
  {
    key: 'FILIERE',
    displayName: 'Filière',
    required: false,
    alternatives: ['filiere', 'field', 'major', 'program', 'filière', 'domaine']
  },
  {
    key: 'ANNEE ACADEMIQUE',
    displayName: 'Année académique',
    required: false,
    alternatives: ['annee_academique', 'academic_year', 'year', 'academic year', 'année académique', 'session']
  },
  {
    key: 'SEXE',
    displayName: 'Sexe/Genre',
    required: false,
    alternatives: ['sexe', 'genre', 'gender', 'sex', 'male/female']
  },
  {
    key: 'EMAIL',
    displayName: 'Email',
    required: false,
    alternatives: ['email', 'e-mail', 'mail', 'adresse email', 'courriel']
  }
];

// Colonnes requises pour les attestations
export const ATTESTATION_REQUIRED_COLUMNS: ColumnRequirement[] = [
  ...RELEVE_REQUIRED_COLUMNS,
  {
    key: 'MOYENNE',
    displayName: 'Moyenne',
    required: true,
    alternatives: ['moyenne', 'average', 'gpa', 'mean_grade', 'note moyenne', 'score']
  },
  {
    key: 'PARCOURS',
    displayName: 'Parcours',
    required: true,
    alternatives: ['parcours', 'course', 'program', 'pathway', 'programme', 'formation']
  },
  {
    key: 'SPECIALITE',
    displayName: 'Spécialité',
    required: true,
    alternatives: ['specialite', 'specialty', 'specialization', 'major', 'spécialité', 'option']
  }
];

export const ATTESTATION_OPTIONAL_COLUMNS: ColumnRequirement[] = [
  {
    key: 'OPTION',
    displayName: 'Option',
    required: false,
    alternatives: ['option', 'minor', 'track', 'voie']
  },
  {
    key: 'GRADE',
    displayName: 'Grade',
    required: false,
    alternatives: ['grade', 'letter_grade', 'note lettre']
  },
  {
    key: 'MENTION',
    displayName: 'Mention',
    required: false,
    alternatives: ['mention', 'distinction', 'honor', 'appreciation']
  },
  {
    key: 'FINALITE',
    displayName: 'Finalité',
    required: false,
    alternatives: ['finalite', 'degree_type', 'qualification', 'finalité', 'type diplome']
  },
  {
    key: 'TOTAL CREDIT',
    displayName: 'Total crédits',
    required: false,
    alternatives: ['total_credit', 'credits', 'credit_hours', 'total credit', 'credit total']
  },
  {
    key: 'DOMAINE',
    displayName: 'Domaine',
    required: false,
    alternatives: ['domaine', 'domain', 'field_of_study', 'field of study', 'secteur']
  },
  {
    key: 'DATE JURY',
    displayName: 'Date du jury',
    required: false,
    alternatives: ['date_jury', 'jury_date', 'examination_date', 'jury date', 'date examen']
  },
  {
    key: 'ANNEE ACADEMIQUE',
    displayName: 'Année académique',
    required: false,
    alternatives: ['annee_academique', 'academic_year', 'year', 'academic year', 'année académique', 'session']
  },
  {
    key: 'SEXE',
    displayName: 'Sexe/Genre',
    required: false,
    alternatives: ['sexe', 'genre', 'gender', 'sex', 'male/female']
  },
  {
    key: 'EMAIL',
    displayName: 'Email',
    required: false,
    alternatives: ['email', 'e-mail', 'mail', 'adresse email', 'courriel']
  }
];

/**
 * Normalise un nom de colonne pour la comparaison
 */
function normalizeColumnName(name: string): string {
  return name.toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Trouve les suggestions de correspondance pour une colonne manquante
 */
function findSuggestions(requirement: ColumnRequirement, availableColumns: string[]): string[] {
  const suggestions: { column: string; score: number }[] = [];
  const alternatives = [requirement.key, ...(requirement.alternatives || [])];

  availableColumns.forEach(column => {
    const normalizedColumn = normalizeColumnName(column);
    
    // Recherche exacte (insensible à la casse et aux caractères spéciaux)
    const exactMatch = alternatives.find(alt => normalizeColumnName(alt) === normalizedColumn);
    if (exactMatch) {
      suggestions.push({ column, score: 0 });
      return;
    }
    
    // Recherche de similarité
    alternatives.forEach(alt => {
      const normalizedAlt = normalizeColumnName(alt);
      const distance = levenshteinDistance(normalizedAlt, normalizedColumn);
      const maxLength = Math.max(normalizedAlt.length, normalizedColumn.length);
      const similarity = 1 - (distance / maxLength);
      
      if (similarity > 0.5) { // Seuil de similarité abaissé
        suggestions.push({ column, score: distance });
      }
    });
    
    // Recherche de sous-chaînes
    const substringMatch = alternatives.some(alt => {
      const normalizedAlt = normalizeColumnName(alt);
      return normalizedColumn.includes(normalizedAlt) || normalizedAlt.includes(normalizedColumn);
    });
    
    if (substringMatch) {
      suggestions.push({ column, score: 2 });
    }
  });

  // Trier par score (meilleur score = distance plus petite) et éliminer les doublons
  const uniqueSuggestions = suggestions.reduce((acc, curr) => {
    const existing = acc.find(item => item.column === curr.column);
    if (!existing || existing.score > curr.score) {
      return [...acc.filter(item => item.column !== curr.column), curr];
    }
    return acc;
  }, [] as { column: string; score: number }[]);

  return uniqueSuggestions
    .sort((a, b) => a.score - b.score)
    .slice(0, 3) // Maximum 3 suggestions
    .map(s => s.column);
}

/**
 * Trouve une correspondance automatique pour une colonne
 */
function findExactMatch(requirement: ColumnRequirement, availableColumns: string[]): string | null {
  const alternatives = [requirement.key, ...(requirement.alternatives || [])];
  
  for (const column of availableColumns) {
    const normalizedColumn = normalizeColumnName(column);
    for (const alt of alternatives) {
      const normalizedAlt = normalizeColumnName(alt);
      if (normalizedAlt === normalizedColumn) {
        return column;
      }
    }
  }
  
  return null;
}

/**
 * Valide les colonnes Excel pour un type de document donné
 */
export function validateExcelColumns(
  availableColumns: string[],
  documentType: 'releve' | 'attestation'
): ValidationResult {
  console.log(`🔍 Validation des colonnes Excel pour ${documentType}`);
  console.log(`📋 Colonnes disponibles:`, availableColumns);
  
  const requiredColumns = documentType === 'releve' ? RELEVE_REQUIRED_COLUMNS : ATTESTATION_REQUIRED_COLUMNS;
  const optionalColumns = documentType === 'releve' ? RELEVE_OPTIONAL_COLUMNS : ATTESTATION_OPTIONAL_COLUMNS;
  
  const missingRequired: ColumnRequirement[] = [];
  const missingOptional: ColumnRequirement[] = [];
  const suggestions: { [key: string]: string[] } = {};
  const mappedColumns: { [key: string]: string } = {};

  console.log(`📝 Colonnes requises pour ${documentType}:`, requiredColumns.map(r => r.key));

  // Vérifier les colonnes requises
  requiredColumns.forEach(requirement => {
    const exactMatch = findExactMatch(requirement, availableColumns);
    
    if (exactMatch) {
      console.log(`✅ Colonne requise trouvée: ${requirement.key} -> ${exactMatch}`);
      mappedColumns[requirement.key] = exactMatch;
    } else {
      console.log(`❌ Colonne requise manquante: ${requirement.key}`);
      missingRequired.push(requirement);
      suggestions[requirement.key] = findSuggestions(requirement, availableColumns);
      console.log(`💡 Suggestions pour ${requirement.key}:`, suggestions[requirement.key]);
    }
  });

  // Vérifier les colonnes optionnelles
  optionalColumns.forEach(requirement => {
    const exactMatch = findExactMatch(requirement, availableColumns);
    
    if (exactMatch) {
      console.log(`✅ Colonne optionnelle trouvée: ${requirement.key} -> ${exactMatch}`);
      mappedColumns[requirement.key] = exactMatch;
    } else {
      console.log(`⚠️ Colonne optionnelle manquante: ${requirement.key}`);
      missingOptional.push(requirement);
      suggestions[requirement.key] = findSuggestions(requirement, availableColumns);
    }
  });

  const isValid = missingRequired.length === 0;
  
  console.log(`📊 Résultat de validation:`);
  console.log(`   - Valide: ${isValid}`);
  console.log(`   - Colonnes requises manquantes: ${missingRequired.length}`);
  console.log(`   - Colonnes optionnelles manquantes: ${missingOptional.length}`);
  console.log(`   - Correspondances automatiques:`, mappedColumns);

  return {
    isValid,
    missingRequired,
    missingOptional,
    availableColumns,
    suggestions,
    mappedColumns
  };
}

/**
 * Génère un mapping automatique des colonnes Excel
 */
export function generateColumnMapping(
  availableColumns: string[],
  documentType: 'releve' | 'attestation'
): { [key: string]: string } {
  const requiredColumns = documentType === 'releve' ? RELEVE_REQUIRED_COLUMNS : ATTESTATION_REQUIRED_COLUMNS;
  const optionalColumns = documentType === 'releve' ? RELEVE_OPTIONAL_COLUMNS : ATTESTATION_OPTIONAL_COLUMNS;
  const allColumns = [...requiredColumns, ...optionalColumns];
  
  const mapping: { [key: string]: string } = {};

  allColumns.forEach(requirement => {
    const exactMatch = findExactMatch(requirement, availableColumns);
    if (exactMatch) {
      mapping[requirement.key] = exactMatch;
    } else {
      // Si pas de correspondance exacte, chercher la meilleure suggestion
      const suggestions = findSuggestions(requirement, availableColumns);
      if (suggestions.length > 0) {
        mapping[requirement.key] = suggestions[0];
      }
    }
  });

  return mapping;
}

/**
 * Formate un message d'erreur pour les colonnes manquantes
 */
export function formatValidationErrorMessage(validation: ValidationResult): string {
  let message = '';

  if (validation.missingRequired.length > 0) {
    message += '❌ COLONNES OBLIGATOIRES MANQUANTES :\n\n';
    validation.missingRequired.forEach(req => {
      message += `• ${req.displayName} (attendu: "${req.key}")\n`;
      if (validation.suggestions[req.key]?.length > 0) {
        message += `  💡 Suggestions: ${validation.suggestions[req.key].join(', ')}\n`;
      }
      if (req.alternatives && req.alternatives.length > 0) {
        message += `  🔄 Noms acceptés: ${req.alternatives.join(', ')}\n`;
      }
      message += '\n';
    });
  }

  if (validation.missingOptional.length > 0) {
    if (message) message += '\n';
    message += '⚠️ COLONNES OPTIONNELLES MANQUANTES :\n\n';
    validation.missingOptional.forEach(req => {
      message += `• ${req.displayName} (attendu: "${req.key}")\n`;
      if (validation.suggestions[req.key]?.length > 0) {
        message += `  💡 Suggestions: ${validation.suggestions[req.key].join(', ')}\n`;
      }
      message += '\n';
    });
  }

  if (Object.keys(validation.mappedColumns).length > 0) {
    message += '\n✅ CORRESPONDANCES AUTOMATIQUES TROUVÉES :\n\n';
    Object.entries(validation.mappedColumns).forEach(([key, col]) => {
      message += `• ${key} ← "${col}"\n`;
    });
    message += '\n';
  }

  message += '\n📋 COLONNES DISPONIBLES DANS VOTRE FICHIER :\n';
  message += validation.availableColumns.map(col => `"${col}"`).join(', ');

  return message;
}

/**
 * Analyse spécifique du fichier template pour déboguer
 */
export function analyzeTemplateFile(columns: string[]): void {
  console.log('\n🔍 ANALYSE DU FICHIER TEMPLATE :');
  console.log('Colonnes détectées:', columns);
  
  // Test spécifique pour chaque colonne du template
  const templateMapping = {
    'First Name': 'PRENOM',
    'Last Name': 'NOM', 
    'Registration Number': 'MATRICULE',
    'Birth Date': 'DATE DE NAISSANCE',
    'Birth Place': 'LIEU DE NAISSANCE',
    'Email': 'EMAIL',
    'Gender': 'SEXE'
  };
  
  console.log('\n🎯 Correspondances attendues pour le template:');
  Object.entries(templateMapping).forEach(([template, expected]) => {
    const found = columns.includes(template);
    console.log(`${found ? '✅' : '❌'} "${template}" -> ${expected}`);
  });
  
  // Test de validation
  const validation = validateExcelColumns(columns, 'releve');
  console.log('\n📊 Résultat de validation du template:');
  console.log('- Valide:', validation.isValid);
  console.log('- Colonnes requises manquantes:', validation.missingRequired.map(r => r.key));
  console.log('- Correspondances trouvées:', validation.mappedColumns);
}