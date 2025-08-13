// src/lib/attestation-generator/utils.ts
/**
 * Formate une date dans le format JJ/MM/AAAA
 */
export function formatDate(date: Date | string | number | undefined): string {
  if (!date) return '';
  
  try {
    // Si c'est une date
    if (date instanceof Date) {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
    
    // Si c'est déjà une chaîne au format JJ/MM/AAAA
    if (typeof date === 'string') {
      // Vérifier si c'est déjà au format JJ/MM/AAAA
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return date;
      }
      
      // Essayer de convertir en Date
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return formatDate(dateObj);
      }
      
      // Retourner la chaîne si pas au bon format
      return date;
    }
    
    // Si c'est un timestamp ou un autre nombre
    if (typeof date === 'number') {
      const dateObj = new Date(date);
      return formatDate(dateObj);
    }
    
    return '';
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return String(date);
  }
}

/**
 * Détermine le grade (A+, B+, etc.) en fonction de la moyenne
 */
export function calculateGrade(average: number | string): string {
  const numAverage = typeof average === 'string' ? parseFloat(average) : average;
  
  if (numAverage >= 18) return "A+";
  if (numAverage >= 16) return "A";
  if (numAverage >= 14) return "B+";
  if (numAverage >= 13) return "B";
  if (numAverage >= 12) return "B-";
  if (numAverage >= 11) return "C+";
  if (numAverage >= 10) return "C";
  if (numAverage >= 9) return "C-";
  if (numAverage >= 8) return "D";
  if (numAverage >= 6) return "E";
  return "F";
}

/**
 * Détermine la mention en fonction de la moyenne - Système standard pour tous
 */
export function calculateMention(
  average: number | string, 
  parcours?: string, 
  niveau?: string | number,
  finalite?: string
): string {
  console.log(`🔍 calculateMention appelé avec:`, { average, parcours, niveau, finalite });
  
  const numAverage = typeof average === 'string' ? parseFloat(average) : average;
  
  let result: string;
  
  // Système standard pour tous les étudiants
  if (numAverage >= 18) result = "Excellent";           // [18-20]
  else if (numAverage >= 16) result = "Très Bien";      // [16-18[
  else if (numAverage >= 14) result = "Bien";           // [14-16[
  else if (numAverage >= 13) result = "Assez Bien";     // [13-14[
  else if (numAverage >= 12) result = "Assez Bien";     // [12-13[
  else if (numAverage >= 11) result = "Passable";       // [11-12[
  else if (numAverage >= 10) result = "Passable";       // [10-11[
  else if (numAverage >= 9) result = "Insuffisant";     // [09-10[
  else if (numAverage >= 8) result = "Faible";          // [08-09[
  else if (numAverage >= 6) result = "Très Faible";     // [06-08[
  else result = "Nul";                                   // [00-06[
  
  console.log(`📝 Mention standard: ${result}`);
  console.log(`🏆 Résultat final calculateMention: "${result}" (type: ${typeof result})`);
  return result;
}

/**
 * Obtient l'année académique courante au format AAAA/AAAA+1
 */
export function getCurrentAcademicYear(): string {
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth() + 1; // 0-indexed
  
  // Si nous sommes après août, l'année académique est année courante/année suivante
  // Sinon c'est l'année précédente/année courante
  if (month >= 9) {
    return `${currentYear}/${currentYear + 1}`;
  } else {
    return `${currentYear - 1}/${currentYear}`;
  }
}