import type { Context, Next } from 'hono';
import { SignJWT, jwtVerify } from 'jose';
import { withDb } from './db.ts';
import { getUserById } from './repositories/userRepo.ts';
import type { AppVariables, UserPublic } from './types.ts';

const textEncoder = new TextEncoder();

export async function timingSafeEqualStrings(a: string, b: string): Promise<boolean> {
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', textEncoder.encode(a)),
    crypto.subtle.digest('SHA-256', textEncoder.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(hashA, hashB);
}

export async function createAccessToken(
  userId: string,
  username: string,
  env: Env,
): Promise<string> {
  const secret = textEncoder.encode(env.JWT_SECRET);
  const expireMinutes = Number.parseInt(env.JWT_EXPIRE_MINUTES || '10080', 10) || 10080;

  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${expireMinutes}m`)
    .sign(secret);
}

export async function verifyAccessToken(token: string, env: Env): Promise<{ sub: string }> {
  const secret = textEncoder.encode(env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Invalid token subject');
  }
  return { sub: payload.sub };
}

function unauthorized(c: Context, detail = 'Not authenticated'): Response {
  return c.json(
    { detail },
    401,
    { 'WWW-Authenticate': 'Bearer' },
  );
}

export async function requireAuth(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return unauthorized(c);
  }
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match?.[1]) {
    return unauthorized(c);
  }

  let userId: string;
  try {
    const verified = await verifyAccessToken(match[1], c.env);
    userId = verified.sub;
  } catch {
    return unauthorized(c, 'Invalid or expired token');
  }

  const user = await withDb(c.env, (db) => getUserById(db, userId));
  if (!user) {
    return unauthorized(c, 'User no longer exists');
  }

  const currentUser: UserPublic = { id: user._id, username: user.username };
  c.set('currentUser', currentUser);
  await next();
}
