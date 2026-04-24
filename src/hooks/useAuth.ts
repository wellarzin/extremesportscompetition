import { useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, registerAuthChangeCallback } from '../lib/api';
import type { AuthUser } from '../types/api';

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recebe notificações do cliente API (ex: token expirado, refresh bem-sucedido)
  useEffect(() => {
    registerAuthChangeCallback((updatedUser) => {
      setUser(updatedUser);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: loggedUser } = await apiLogin(email, password);
      setUser(loggedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login.';
      setError(message);
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

  return { user, isLoading, error, login, logout, clearError };
}
