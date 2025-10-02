// Système de toast global simple
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastType;
}

// Remplacement temporaire des alerts par des console.log
// jusqu'à ce que le ToastProvider soit ajouté au root de l'app
export const toast = {
  success: (title: string, description?: string) => {
    console.log(`✅ ${title}${description ? ': ' + description : ''}`);
    // TODO: Utiliser le vrai système de toast une fois ToastProvider ajouté
  },

  error: (title: string, description?: string) => {
    console.error(`❌ ${title}${description ? ': ' + description : ''}`);
    // TODO: Utiliser le vrai système de toast une fois ToastProvider ajouté
  },

  warning: (title: string, description?: string) => {
    console.warn(`⚠️ ${title}${description ? ': ' + description : ''}`);
    // TODO: Utiliser le vrai système de toast une fois ToastProvider ajouté
  },

  info: (title: string, description?: string) => {
    console.info(`ℹ️ ${title}${description ? ': ' + description : ''}`);
    // TODO: Utiliser le vrai système de toast une fois ToastProvider ajouté
  }
};
