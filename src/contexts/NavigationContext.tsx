import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type AppPage = 'landing' | 'events' | 'professionals';

interface NavigationContextValue {
  page: AppPage;
  navigate: (page: AppPage) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<AppPage>('landing');

  const navigate = useCallback((target: AppPage) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setPage(target);
  }, []);

  return (
    <NavigationContext.Provider value={{ page, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation deve ser usado dentro de <NavigationProvider>');
  return ctx;
}
