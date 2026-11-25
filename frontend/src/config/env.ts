const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

export const env = {
  useMockApi: metaEnv?.VITE_USE_MOCK_API !== 'false',
  apiBaseUrl: metaEnv?.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1',
} as const;
