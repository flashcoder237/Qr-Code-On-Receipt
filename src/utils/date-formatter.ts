// src/utils/date-formatter.ts - Utilitaire de formatage de date en lettres
export interface DateFormatOptions {
  language: 'fr' | 'en';
  includeDay?: boolean;
  format?: 'long' | 'short';
}

// Mois en français
const MONTHS_FR: { [key: number]: string } = {
  1: 'Janvier',
  2: 'Février', 
  3: 'Mars',
  4: 'Avril',
  5: 'Mai',
  6: 'Juin',
  7: 'Juillet',
  8: 'Août',
  9: 'Septembre',
  10: 'Octobre',
  11: 'Novembre',
  12: 'Décembre'
};

// Mois en anglais
const MONTHS_EN: { [key: number]: string } = {
  1: 'January',
  2: 'February',
  3: 'March', 
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December'
};

// Jours de la semaine en français
const DAYS_FR: { [key: number]: string } = {
  0: 'Dimanche',
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi'
};

// Jours de la semaine en anglais
const DAYS_EN: { [key: number]: string } = {
  0: 'Sunday',
  1: 'Monday', 
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

/**
 * Parse une date depuis différents formats d'entrée
 */
function parseDate(dateInput: string | Date): Date | null {
  if (!dateInput) return null;
  
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  // Gestion des formats courants : DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const dateStr = String(dateInput).trim();
  
  // Format DD/MM/YYYY ou DD-MM-YYYY
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Format YYYY-MM-DD
  const yyyymmddMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Format ISO ou autres formats supportés par Date
  const parsedDate = new Date(dateStr);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * Formate une date en lettres selon la langue spécifiée
 * Exemples : 
 * - FR: "01 Janvier 2001", "Lundi 01 Janvier 2001"
 * - EN: "01 January 2001", "Monday 01 January 2001"
 */
export function formatDateInWords(
  dateInput: string | Date, 
  options: DateFormatOptions = { language: 'fr' }
): string {
  const date = parseDate(dateInput);
  
  if (!date) {
    console.warn('Date invalide fournie à formatDateInWords:', dateInput);
    return String(dateInput); // Retourner la valeur originale si parsing échoue
  }
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const dayOfWeek = date.getDay();
  
  const months = options.language === 'fr' ? MONTHS_FR : MONTHS_EN;
  const days = options.language === 'fr' ? DAYS_FR : DAYS_EN;
  
  let formattedDate = `${day} ${months[month]} ${year}`;
  
  if (options.includeDay) {
    formattedDate = `${days[dayOfWeek]} ${formattedDate}`;
  }
  
  return formattedDate;
}

/**
 * Détermine automatiquement la langue basée sur le type d'établissement
 */
export function getDateLanguageForEstablishment(establishmentType?: string): 'fr' | 'en' {
  if (!establishmentType) return 'fr';
  
  // Pour les établissements de type "faculty", utiliser l'anglais
  const lowerType = establishmentType.toLowerCase();
  if (lowerType.includes('faculty') || lowerType.includes('school') || lowerType.includes('college')) {
    return 'en';
  }
  
  return 'fr';
}

/**
 * Formate une date spécifiquement pour les attestations
 * Utilise la langue appropriée selon le type d'établissement
 */
export function formatDateForAttestation(
  dateInput: string | Date,
  establishmentType?: string,
  primaryLanguage?: 'french' | 'english'
): string {
  // Priorité : primaryLanguage > establishmentType > défaut français
  let language: 'fr' | 'en' = 'fr';
  
  if (primaryLanguage === 'english') {
    language = 'en';
  } else if (primaryLanguage === 'french') {
    language = 'fr';
  } else {
    language = getDateLanguageForEstablishment(establishmentType);
  }
  
  return formatDateInWords(dateInput, { language });
}

/**
 * Utilitaire pour valider qu'une date est au bon format
 */
export function isValidDateFormat(dateInput: string | Date): boolean {
  const date = parseDate(dateInput);
  return date !== null && !isNaN(date.getTime());
}

/**
 * Convertit une date Excel (nombre de jours depuis 1900) vers une Date JS
 */
export function parseExcelDate(excelDate: number | string): Date | null {
  if (typeof excelDate === 'string') {
    // Si c'est déjà une chaîne, essayer de la parser normalement
    return parseDate(excelDate);
  }
  
  if (typeof excelDate !== 'number') {
    return null;
  }
  
  // Excel compte les jours depuis le 1er janvier 1900
  // Mais il y a un bug dans Excel qui compte 1900 comme une année bissextile
  const excelEpoch = new Date(1900, 0, 1);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  
  // Ajustement pour le bug d'Excel (jour 60 = 29 février 1900 qui n'existe pas)
  let adjustedDays = excelDate;
  if (excelDate > 59) {
    adjustedDays = excelDate - 1;
  }
  
  const resultDate = new Date(excelEpoch.getTime() + (adjustedDays - 1) * millisecondsPerDay);
  return isNaN(resultDate.getTime()) ? null : resultDate;
}

// Export des constantes pour utilisation externe si nécessaire
export { MONTHS_FR, MONTHS_EN, DAYS_FR, DAYS_EN };