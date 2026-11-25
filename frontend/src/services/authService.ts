import type { AuthUser, LoginPayload, LoginResponse } from '../types/auth.ts';
import { apiRequest, clearAuthToken, setAuthToken } from './apiClient.ts';

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const result = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(result.accessToken);
    return result;
  },

  me(): Promise<AuthUser> {
    return apiRequest<AuthUser>('/auth/me');
  },

  logout(): void {
    clearAuthToken();
  },
};
