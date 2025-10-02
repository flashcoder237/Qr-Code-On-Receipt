import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  action?: React.ReactNode;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((options: Omit<ToastMessage, 'id'>) => {
    return addToast(options);
  }, [addToast]);

  // Convenience methods
  toast.success = (title: string, description?: string) =>
    addToast({ title, description, variant: 'success' });

  toast.error = (title: string, description?: string) =>
    addToast({ title, description, variant: 'error' });

  toast.warning = (title: string, description?: string) =>
    addToast({ title, description, variant: 'warning' });

  toast.info = (title: string, description?: string) =>
    addToast({ title, description, variant: 'info' });

  return { toasts, toast, removeToast };
};
