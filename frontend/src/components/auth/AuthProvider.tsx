import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../hooks/useAuth.ts';
import { getAuthToken, setUnauthorizedHandler } from '../../services/apiClient.ts';
import { authService } from '../../services/authService.ts';
import type { AuthUser, LoginPayload } from '../../types/auth.ts';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getAuthToken()));

  const logout = useCallback(() => {
    authService.logout();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  useEffect(() => {
    if (!getAuthToken()) {
      return;
    }

    let cancelled = false;
    authService
      .me()
      .then((verifiedUser) => {
        if (!cancelled) setUser(verifiedUser);
      })
      .catch(() => {
        authService.logout();
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthUser> => {
      const response = await authService.login(payload);
      queryClient.clear();
      setUser(response.user);
      return response.user;
    },
    [queryClient],
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
