import { Hono } from 'hono';
import { withDb } from '../db.ts';
import { getUserByUsername } from '../repositories/userRepo.ts';
import { loginSchema, parseBody } from '../schemas/validators.ts';
import { createAccessToken, requireAuth, timingSafeEqualStrings } from '../security.ts';
import type { AppVariables, UserPublic } from '../types.ts';

export const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

authRoutes.post('/login', async (c) => {
  const parsed = await parseBody(c, loginSchema);
  if (!parsed.ok) return parsed.response;

  const username = parsed.data.username.trim();
  const password = parsed.data.password;

  const userDoc = await withDb(c.env, (db) => getUserByUsername(db, username));
  if (!userDoc || !(await timingSafeEqualStrings(userDoc.password, password))) {
    return c.json({ detail: 'Invalid username or password' }, 401);
  }

  const user: UserPublic = { id: userDoc._id, username: userDoc.username };
  const accessToken = await createAccessToken(user.id, user.username, c.env);

  return c.json({
    accessToken,
    tokenType: 'bearer',
    user,
  });
});

authRoutes.get('/me', requireAuth, (c) => {
  return c.json(c.get('currentUser'));
});
