import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { Router } from 'express';
import pool from './db.js';

const scrypt = promisify(crypto.scrypt);

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

const SESSION_COOKIE = 'ib_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_REFRESH_MS = 24 * 60 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,24}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

// ─── Password hashing (scrypt, Node built-in) ───

async function derive(password, salt, N, r, p) {
  return scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { N, r, p, maxmem: 64 * 1024 * 1024 });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password, stored) {
  const parts = typeof stored === 'string' ? stored.split('$') : [];
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await derive(password, Buffer.from(saltB64, 'base64'), Number(N), Number(r), Number(p));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Verified against when the account doesn't exist, so response timing doesn't reveal which identifiers are registered.
const DUMMY_HASH_PROMISE = hashPassword(crypto.randomBytes(16).toString('hex'));

// ─── Sessions ───

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true' || req.secure,
    path: '/api',
  };
}

async function createSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashToken(token), userId, expiresAt]
  );
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(req), maxAge: SESSION_TTL_MS });
}

function publicUser(row) {
  return { id: row.id, email: row.email, username: row.username };
}

/**
 * Resolve the session cookie to a user (sliding the expiry forward when due).
 * Returns null when there is no valid session.
 */
async function resolveSession(req, res) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const result = await pool.query(
    `SELECT u.id, u.email, u.username, s.last_seen_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash]
  );
  if (result.rows.length === 0) {
    res.clearCookie(SESSION_COOKIE, cookieOptions(req));
    return null;
  }

  const row = result.rows[0];
  if (Date.now() - new Date(row.last_seen_at).getTime() > SESSION_REFRESH_MS) {
    await pool.query(
      'UPDATE sessions SET last_seen_at = NOW(), expires_at = $2 WHERE token_hash = $1',
      [tokenHash, new Date(Date.now() + SESSION_TTL_MS)]
    );
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions(req), maxAge: SESSION_TTL_MS });
  }
  return publicUser(row);
}

/**
 * Attaches the signed-in user as req.user, or rejects with 401.
 */
export async function requireAuth(req, res, next) {
  try {
    const user = await resolveSession(req, res);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// ─── Rate limiting (in-memory, per IP) ───

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const attempts = new Map();

// Only failed attempts count, so normal sign-ins never lock anyone out.
function rateLimit(req, res, next) {
  const key = req.ip;
  const entry = attempts.get(key);
  if (entry && entry.resetAt > Date.now() && entry.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }
  res.on('finish', () => {
    if (res.statusCode < 400 || res.statusCode >= 500) return;
    const now = Date.now();
    const current = attempts.get(key);
    if (!current || current.resetAt < now) attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    else current.count++;
  });
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.resetAt < now) attempts.delete(key);
}, ATTEMPT_WINDOW_MS).unref();

// ─── Routes ───

function requireJson(req, res, next) {
  // Rejects cross-site form posts, which can't send application/json without a CORS preflight.
  if (!req.is('application/json')) return res.status(415).json({ error: 'Expected JSON' });
  next();
}

export const authRouter = Router();

authRouter.post('/signup', requireJson, rateLimit, async (req, res, next) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Enter a valid email address.', field: 'email' });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Use 3–24 letters, numbers, periods, or underscores.', field: 'username' });
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN} characters.`, field: 'password' });
  }

  try {
    const existing = await pool.query(
      'SELECT lower(email) = $1 AS email_taken FROM users WHERE lower(email) = $1 OR lower(username) = lower($2)',
      [email, username]
    );
    if (existing.rows.some(r => r.email_taken)) {
      return res.status(409).json({ error: 'Email is already registered.', field: 'email' });
    }
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username is already taken.', field: 'username' });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    await pool.query(
      'INSERT INTO users (id, email, username, password_hash) VALUES ($1, $2, $3, $4)',
      [id, email, username, passwordHash]
    );
    await createSession(req, res, id);
    res.status(201).json({ user: { id, email, username } });
  } catch (err) {
    if (err.code === '23505') {
      const field = String(err.constraint || '').includes('email') ? 'email' : 'username';
      const error = field === 'email' ? 'Email is already registered.' : 'Username is already taken.';
      return res.status(409).json({ error, field });
    }
    next(err);
  }
});

authRouter.post('/signin', requireJson, rateLimit, async (req, res, next) => {
  const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Enter your email or username and password.' });
  }

  try {
    const column = identifier.includes('@') ? 'email' : 'username';
    const result = await pool.query(
      `SELECT id, email, username, password_hash FROM users WHERE lower(${column}) = lower($1)`,
      [identifier]
    );
    const row = result.rows[0];
    const valid = row
      ? await verifyPassword(password, row.password_hash)
      : (await verifyPassword(password, await DUMMY_HASH_PROMISE), false);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email, username, or password.' });
    }

    await createSession(req, res, row.id);
    res.json({ user: publicUser(row) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/signout', async (req, res, next) => {
  const token = readCookie(req, SESSION_COOKIE);
  try {
    if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
    res.clearCookie(SESSION_COOKIE, cookieOptions(req));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Answers "who am I?" without treating "nobody" as an error.
authRouter.get('/me', async (req, res, next) => {
  try {
    res.json({ user: await resolveSession(req, res) });
  } catch (err) {
    next(err);
  }
});
