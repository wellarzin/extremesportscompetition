import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import { AuthModal } from '../components/AuthModal';

interface AuthModalContextValue {
  openAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  openAuthModal: () => {},
});

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { login, isLoading, error, clearError } = useAuthContext();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    // O Hero fecha o modal via useEffect quando user muda.
    // Aqui fechamos também para o caso de abrir de outros contextos.
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider value={{ openAuthModal: () => setIsOpen(true) }}>
      {children}
      <AuthModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onLogin={handleLogin}
        isLoading={isLoading}
        loginError={error}
        clearError={clearError}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  return useContext(AuthModalContext);
}
