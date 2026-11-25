import { env } from '../config/env.ts';
import type { AuthUser, LoginPayload, LoginResponse } from '../types/auth.ts';
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from './apiClient.ts';

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    if (env.useMockApi) {
      const username = payload.username.trim();
      if (!username || !payload.password) {
        throw new Error('Username and password are required');
      }
      const mockResponse: LoginResponse = {
        accessToken: 'mock-session-token',
        tokenType: 'bearer',
        user: { id: 'usr-mock', username },
      };
      setAuthToken(mockResponse.accessToken);
      return mockResponse;
    }

    const result = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(result.accessToken);
    return result;
  },

  async me(): Promise<AuthUser> {
    if (env.useMockApi) {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');
      return { id: 'usr-mock', username: 'mock-user' };
    }
    return apiRequest<AuthUser>('/auth/me');
  },

  logout(): void {
    clearAuthToken();
  },
};
