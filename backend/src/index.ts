import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { withDb } from './db.ts';
import { authRoutes } from './routes/auth.ts';
import { categoryRoutes } from './routes/categories.ts';
import { expenseRoutes } from './routes/expenses.ts';
import { weddingRoutes } from './routes/wedding.ts';
import type { AppVariables } from './types.ts';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const path = new URL(c.req.url).pathname;
  console.log(
    JSON.stringify({
      message: 'request completed',
      method: c.req.method,
      path,
      status: c.res.status,
      durationMs: Date.now() - start,
    }),
  );
});

app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const allowed = (c.env.CORS_ORIGINS || '')
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean);
      if (!origin) return origin;
      return allowed.includes(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.onError((err, c) => {
  const path = new URL(c.req.url).pathname;
  console.error(
    JSON.stringify({
      message: 'unhandled error',
      path,
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  return c.json({ detail: 'Internal server error' }, 500);
});

app.get('/health', async (c) => {
  try {
    await withDb(c.env, async (db) => {
      await db.command({ ping: 1 });
    });
    return c.json({ status: 'ok', database: 'ok' }, 200);
  } catch (err) {
    console.error(
      JSON.stringify({
        message: 'health check failed',
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return c.json({ status: 'error', database: 'unavailable' }, 503);
  }
});

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/wedding', weddingRoutes);
app.route('/api/v1/categories', categoryRoutes);
app.route('/api/v1/expenses', expenseRoutes);

app.all('*', (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.json({ detail: 'Not found' }, 404);
});

export default app;
