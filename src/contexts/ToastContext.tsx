import React, { createContext, useContext } from 'react';
import { useToast as useToastHook } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';

interface ToastContextType {
  toast: ReturnType<typeof useToastHook>['toast'];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, toast, removeToast } = useToastHook();

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
