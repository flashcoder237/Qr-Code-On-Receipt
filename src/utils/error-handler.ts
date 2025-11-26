// src/utils/error-handler.ts
// Utilitaires de gestion d'erreurs centralisée

/**
 * Types d'erreurs dans l'application
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  FILE_SYSTEM = 'FILE_SYSTEM',
  DATA_PROCESSING = 'DATA_PROCESSING',
  GENERATION = 'GENERATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Interface pour les erreurs applicatives
 */
export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  timestamp: Date;
  userMessage: string; // Message à afficher à l'utilisateur
}

/**
 * Créer une erreur applicative
 */
export function createAppError(
  type: ErrorType,
  message: string,
  userMessage?: string,
  details?: unknown
): AppError {
  return {
    type,
    message,
    userMessage: userMessage || getUserFriendlyMessage(type, message),
    details,
    timestamp: new Date(),
  };
}

/**
 * Obtenir un message utilisateur convivial basé sur le type d'erreur
 */
function getUserFriendlyMessage(type: ErrorType, technicalMessage: string): string {
  switch (type) {
    case ErrorType.VALIDATION:
      return 'Les données fournies ne sont pas valides. Veuillez vérifier vos entrées.';
    case ErrorType.NETWORK:
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    case ErrorType.FILE_SYSTEM:
      return 'Erreur lors de la lecture ou écriture de fichiers. Vérifiez les permissions.';
    case ErrorType.DATA_PROCESSING:
      return 'Erreur lors du traitement des données. Vérifiez le format de vos fichiers.';
    case ErrorType.GENERATION:
      return 'Erreur lors de la génération du document. Veuillez réessayer.';
    default:
      return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
  }
}

/**
 * Convertir une erreur native en AppError
 */
export function toAppError(error: unknown, defaultType: ErrorType = ErrorType.UNKNOWN): AppError {
  if (error instanceof Error) {
    return createAppError(
      defaultType,
      error.message,
      undefined,
      { stack: error.stack }
    );
  }

  if (typeof error === 'string') {
    return createAppError(defaultType, error);
  }

  return createAppError(
    defaultType,
    'Une erreur inconnue s\'est produite',
    undefined,
    error
  );
}

/**
 * Logger une erreur (peut être étendu pour envoyer à un service de logging)
 */
export function logError(error: AppError): void {
  console.error('[Error]', {
    type: error.type,
    message: error.message,
    userMessage: error.userMessage,
    timestamp: error.timestamp,
    details: error.details,
  });
}

/**
 * Wrapper pour les fonctions asynchrones avec gestion d'erreurs
 */
export async function handleAsync<T>(
  fn: () => Promise<T>,
  errorType: ErrorType = ErrorType.UNKNOWN
): Promise<[T | null, AppError | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const appError = toAppError(error, errorType);
    logError(appError);
    return [null, appError];
  }
}

/**
 * Wrapper pour les fonctions synchrones avec gestion d'erreurs
 */
export function handleSync<T>(
  fn: () => T,
  errorType: ErrorType = ErrorType.UNKNOWN
): [T | null, AppError | null] {
  try {
    const result = fn();
    return [result, null];
  } catch (error) {
    const appError = toAppError(error, errorType);
    logError(appError);
    return [null, appError];
  }
}

/**
 * Valider et retourner une erreur de validation si la condition échoue
 */
export function validateOrError(
  condition: boolean,
  message: string,
  userMessage?: string
): AppError | null {
  if (!condition) {
    return createAppError(ErrorType.VALIDATION, message, userMessage);
  }
  return null;
}

/**
 * Retry une fonction asynchrone avec backoff exponentiel
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  errorType: ErrorType = ErrorType.UNKNOWN
): Promise<[T | null, AppError | null]> {
  let lastError: AppError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const [result, error] = await handleAsync(fn, errorType);

    if (result !== null) {
      return [result, null];
    }

    lastError = error;

    // Ne pas attendre après le dernier essai
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt); // Backoff exponentiel
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return [null, lastError];
}
