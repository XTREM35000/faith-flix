import React, { createContext, useContext, useState, useCallback } from 'react';
import EventDetailModal from '@/components/EventDetailModal';

interface EventModalContextValue {
  open: (slugOrId: string) => void;
  close: () => void;
  isOpen: boolean;
  slugOrId: string | null;
}

const EventModalContext = createContext<EventModalContextValue | undefined>(undefined);

export const EventModalProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [slugOrId, setSlugOrId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((s: string) => {
    if (!s || (typeof s === 'string' && s.trim() === '')) {
      console.warn('EventModalProvider.open called with empty slugOrId', { provided: s });
      return;
    }
    setSlugOrId(s);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSlugOrId(null);
  }, []);

  return (
    <EventModalContext.Provider value={{ open, close, isOpen, slugOrId }}>
      {children}
      <EventDetailModal slugOrId={slugOrId} open={isOpen} onClose={close} />
    </EventModalContext.Provider>
  );
};

export const useEventModal = () => {
  const ctx = useContext(EventModalContext);
  if (!ctx) throw new Error('useEventModal must be used within EventModalProvider');
  return ctx;
};
