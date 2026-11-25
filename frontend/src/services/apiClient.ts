import { env } from '../config/env.ts';

export const AUTH_TOKEN_STORAGE_KEY = 'wedding_planner_auth_token';

export interface AuthStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

let customStorage: AuthStorageLike | null = null;
let unauthorizedHandler: (() => void) | null = null;

function resolveStorage(): AuthStorageLike | null {
  if (customStorage) return customStorage;
  const g = globalThis as typeof globalThis & { localStorage?: AuthStorageLike };
  if (g.localStorage) {
    return g.localStorage;
  }
  return null;
}

export function setAuthStorage(storage: AuthStorageLike | null): void {
  customStorage = storage;
}

export function getAuthToken(): string | null {
  return resolveStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
}

export function setAuthToken(token: string): void {
  resolveStorage()?.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  resolveStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function extractErrorMessage(rawText: string, status: number): string {
  if (!rawText) return `HTTP ${status}`;
  try {
    const parsed = JSON.parse(rawText) as { detail?: unknown; message?: unknown };
    if (typeof parsed.detail === 'string' && parsed.detail) return parsed.detail;
    if (typeof parsed.message === 'string' && parsed.message) return parsed.message;
  } catch {
    // Non-JSON error body; fall back to raw text
  }
  return rawText;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const message = extractErrorMessage(errorText, response.status);
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      clearAuthToken();
      unauthorizedHandler?.();
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
