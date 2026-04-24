import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  fetchMe,
  restoreSession,
  registerAuthChangeCallback,
} from '../lib/api';
import type { AuthUser } from '../types/api';

// ============================================================
// Tipos
// ============================================================

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;    // login/logout em andamento
  isRestoring: boolean;  // verificação inicial de sessão ao montar
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true); // true enquanto verifica sessão
  const [error, setError] = useState<string | null>(null);

  // Restaura sessão ao montar — tenta renovar o access token via cookie httpOnly.
  // Mantém isRestoring=true até concluir para evitar flash de "não autenticado".
  useEffect(() => {
    let cancelled = false;
    restoreSession().then((restoredUser) => {
      if (!cancelled) {
        setUser(restoredUser);
        setIsRestoring(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Registra callback global — chamado quando o access token expira e o
  // refresh falha, forçando o logout silencioso.
  useEffect(() => {
    registerAuthChangeCallback((updated) => {
      setUser(updated);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Autentica e armazena o access token em memória
      await apiLogin(email, password);

      // 2. Busca perfil completo — fonte de verdade para full_name, photo_url, etc.
      const me = await fetchMe();

      // 3. Seta o user de forma direta e inequívoca
      setUser({
        sub: me.id,
        full_name: me.full_name,
        email: me.email,
        role: me.role,
        photo_url: me.photo_url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isRestoring, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// Hook de consumo
// ============================================================

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext deve ser usado dentro de <AuthProvider>');
  return ctx;
}
