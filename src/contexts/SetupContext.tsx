import React, { createContext, useContext, useEffect, useState } from 'react';
import { SETUP_WIZARD_FINALIZED_SESSION_KEY } from '@/lib/setupSessionFlags';

type SetupContextValue = {
  setupCompleted: boolean;
  markCompleted: () => void;
  /** Après nettoyage DB / reset local — permet de rouvrir le wizard sans recharger la page. */
  markIncomplete: () => void;
};

const SetupContext = createContext<SetupContextValue | undefined>(undefined);

export const SetupProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [setupCompleted, setSetupCompleted] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('setupCompleted');
      return v === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('setupCompleted', setupCompleted ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [setupCompleted]);

  const markCompleted = () => setSetupCompleted(true);
  const markIncomplete = () => {
    setSetupCompleted(false);
    try {
      sessionStorage.removeItem(SETUP_WIZARD_FINALIZED_SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <SetupContext.Provider value={{ setupCompleted, markCompleted, markIncomplete }}>
      {children}
    </SetupContext.Provider>
  );
};

export function useSetup() {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error('useSetup must be used within SetupProvider');
  return ctx;
}

export default useSetup;
