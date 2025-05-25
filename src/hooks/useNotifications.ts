// src/hooks/useNotifications.ts
import { useState, useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('app-notifications', []);
  const [isOpen, setIsOpen] = useState(false);

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Garde les 50 dernières
    
    // Auto-remove après un délai selon le type
    const autoRemoveDelay = {
      success: 5000,
      info: 8000,
      warning: 10000,
      error: 15000,
    }[notification.type];

    setTimeout(() => {
      removeNotification(newNotification.id);
    }, autoRemoveDelay);

    return newNotification.id;
  }, [setNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [setNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, [setNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, [setNotifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, [setNotifications]);

  // Méthodes de convénience
  const notifySuccess = useCallback((title: string, message: string, action?: Notification['action']) => {
    return addNotification({ title, message, type: 'success', action });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string, action?: Notification['action']) => {
    return addNotification({ title, message, type: 'error', action });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message: string, action?: Notification['action']) => {
    return addNotification({ title, message, type: 'warning', action });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message: string, action?: Notification['action']) => {
    return addNotification({ title, message, type: 'info', action });
  }, [addNotification]);

  // Statistiques
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnread = unreadCount > 0;
  const recentNotifications = notifications.slice(0, 5);

  return {
    notifications,
    recentNotifications,
    unreadCount,
    hasUnread,
    isOpen,
    setIsOpen,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead,
    // Méthodes de convénience
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
};