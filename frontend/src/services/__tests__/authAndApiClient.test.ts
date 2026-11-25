import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiRequest,
  clearAuthToken,
  getAuthToken,
  setAuthStorage,
  setAuthToken,
  setUnauthorizedHandler,
} from '../apiClient.ts';
import { weddingService } from '../weddingService.ts';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe('apiClient Bearer auth and 401 handling', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setAuthStorage(createMemoryStorage());
    clearAuthToken();
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setUnauthorizedHandler(null);
  });

  it('attaches Authorization Bearer header when token is stored', async () => {
    let capturedAuthHeader: string | null = null;
    setAuthToken('token-abc');

    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      capturedAuthHeader = headers.get('Authorization');
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const result = await apiRequest<{ ok: boolean }>('/wedding');
    assert.deepEqual(result, { ok: true });
    assert.equal(capturedAuthHeader, 'Bearer token-abc');
  });

  it('clears token and triggers unauthorized handler on 401 for protected routes', async () => {
    let unauthorizedCalls = 0;
    setAuthToken('expired-token');
    setUnauthorizedHandler(() => {
      unauthorizedCalls += 1;
    });

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ detail: 'Invalid or expired token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;

    await assert.rejects(
      () => apiRequest('/wedding'),
      (err: Error) => err.message === 'Invalid or expired token',
    );
    assert.equal(getAuthToken(), null);
    assert.equal(unauthorizedCalls, 1);
  });

  it('does not trigger unauthorized handler when /auth/login returns 401', async () => {
    let unauthorizedCalls = 0;
    setUnauthorizedHandler(() => {
      unauthorizedCalls += 1;
    });

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ detail: 'Invalid username or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;

    await assert.rejects(
      () => apiRequest('/auth/login', { method: 'POST', body: '{}' }),
      (err: Error) => err.message === 'Invalid username or password',
    );
    assert.equal(unauthorizedCalls, 0);
  });

  it('weddingService.resetAll posts to /wedding/reset with Bearer token', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedAuth = '';
    setAuthToken('jwt-reset');

    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? 'GET';
      capturedAuth = new Headers(init?.headers).get('Authorization') ?? '';
      return new Response(JSON.stringify({ id: 'wed-1', isOnboarded: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const result = await weddingService.resetAll();
    assert.equal(capturedUrl.endsWith('/wedding/reset'), true);
    assert.equal(capturedMethod, 'POST');
    assert.equal(capturedAuth, 'Bearer jwt-reset');
    assert.equal(result.isOnboarded, false);
  });
});
