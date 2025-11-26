// src/hooks/useErrorHandler.ts
// Hook React pour gérer les erreurs avec des notifications utilisateur

import { useCallback } from 'react';
import { useNotifications } from '@/components/ui/notification-system';
import { AppError, ErrorType, createAppError, toAppError, logError } from '@/utils/error-handler';

/**
 * Hook pour gérer les erreurs de manière cohérente dans les composants
 */
export function useErrorHandler() {
  const { notifyError, notifyWarning } = useNotifications();

  /**
   * Gérer une erreur et afficher une notification appropriée
   */
  const handleError = useCallback((error: unknown, defaultType: ErrorType = ErrorType.UNKNOWN) => {
    const appError = error instanceof Object && 'type' in error
      ? error as AppError
      : toAppError(error, defaultType);

    logError(appError);

    // Afficher une notification selon le type d'erreur
    if (appError.type === ErrorType.VALIDATION) {
      notifyWarning('Validation', appError.userMessage);
    } else {
      notifyError('Erreur', appError.userMessage);
    }

    return appError;
  }, [notifyError, notifyWarning]);

  /**
   * Wrapper pour exécuter une fonction asynchrone avec gestion d'erreurs
   */
  const withErrorHandling = useCallback(async <T,>(
    fn: () => Promise<T>,
    errorType: ErrorType = ErrorType.UNKNOWN,
    customMessage?: string
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error) {
      const appError = customMessage
        ? createAppError(errorType, String(error), customMessage)
        : toAppError(error, errorType);

      handleError(appError);
      return null;
    }
  }, [handleError]);

  /**
   * Créer une erreur de validation personnalisée
   */
  const createValidationError = useCallback((message: string, userMessage?: string): AppError => {
    return createAppError(ErrorType.VALIDATION, message, userMessage);
  }, []);

  return {
    handleError,
    withErrorHandling,
    createValidationError,
  };
}
