import React, { createContext, useContext, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
  notify: (title: string, message?: string, type?: NotificationType) => void;
  notifySuccess: (title: string, message?: string) => void;
  notifyError: (title: string, message?: string) => void;
  notifyInfo: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notify = useCallback((title: string, message = '', type: NotificationType = 'info') => {
    switch (type) {
      case 'success':
        toast.success(title, { description: message });
        break;
      case 'error':
        toast.error(title, { description: message });
        break;
      case 'warning':
        toast.warning(title, { description: message });
        break;
      default:
        toast(title, { description: message });
    }
  }, []);

  const notifySuccess = useCallback((title: string, message?: string) => notify(title, message, 'success'), [notify]);
  const notifyError = useCallback((title: string, message?: string) => notify(title, message, 'error'), [notify]);
  const notifyInfo = useCallback((title: string, message?: string) => notify(title, message, 'info'), [notify]);

  return (
    <NotificationContext.Provider value={{ notify, notifySuccess, notifyError, notifyInfo }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export default NotificationProvider;
