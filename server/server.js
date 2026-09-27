import express from 'express';
import cors from 'cors';
import pool, { initDb } from './db.js';
import { authRouter, requireAuth } from './auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

// The web client reaches the API through a same-origin proxy, so CORS is only
// needed when an explicit cross-origin client is configured.
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins, credentials: true }));
}

app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRouter);

// TEMPORARY: reports how the caller's address arrives through the proxies, to
// set TRUST_PROXY correctly. Remove once that's done.
app.get('/api/debug/ip', (req, res) => {
  res.json({
    ip: req.ip,
    ips: req.ips,
    socket: req.socket.remoteAddress,
    trustProxy: app.get('trust proxy'),
    forwardedFor: req.headers['x-forwarded-for'] ?? null,
    realIp: req.headers['x-real-ip'] ?? null,
    vercelForwardedFor: req.headers['x-vercel-forwarded-for'] ?? null,
  });
});

// Validation middleware
function validateWorkout(req, res, next) {
  const { id, date, sessionFocus, sets } = req.body;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid or missing id' });
  if (!date || isNaN(Date.parse(date))) return res.status(400).json({ error: 'Invalid or missing date' });
  if (!sessionFocus || typeof sessionFocus !== 'string') return res.status(400).json({ error: 'Invalid or missing sessionFocus' });
  if (!Array.isArray(sets)) return res.status(400).json({ error: 'Sets must be an array' });

  for (const set of sets) {
    if (!set.id || typeof set.id !== 'string' || !set.exerciseId || set.weight == null || set.reps == null) {
      return res.status(400).json({ error: 'Invalid set object in array' });
    }
  }

  next();
}

function formatDate(value) {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return typeof value === 'string' ? value.split('T')[0] : value;
}

// GET all active exercises (shared library)
app.get('/api/exercises', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM exercises WHERE deleted_at IS NULL ORDER BY name ASC');
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      muscleGroup: row.muscle_group,
      isDefault: row.is_default
    })));
  } catch (err) {
    next(err);
  }
});

// GET the signed-in user's workouts with sets. Deleted workouts are returned
// as tombstones so other devices can apply the deletion locally.
app.get('/api/workouts', requireAuth, async (req, res, next) => {
  try {
    const workoutsRes = await pool.query(`
      SELECT id, date, session_focus, deleted_at
      FROM workouts
      WHERE user_id = $1
      ORDER BY date DESC, created_at DESC
    `, [req.user.id]);

    const setsRes = await pool.query(`
      SELECT ls.id, ls.workout_id, ls.exercise_id, ls.weight, ls.reps, ls.rpe, e.name as exercise_name
      FROM logged_sets ls
      JOIN exercises e ON ls.exercise_id = e.id
      JOIN workouts w ON w.id = ls.workout_id
      WHERE w.user_id = $1
        AND w.deleted_at IS NULL
        AND ls.deleted_at IS NULL
      ORDER BY ls.set_order ASC, ls.created_at ASC
    `, [req.user.id]);

    const setsByWorkout = {};
    for (const row of setsRes.rows) {
      if (!setsByWorkout[row.workout_id]) setsByWorkout[row.workout_id] = [];
      setsByWorkout[row.workout_id].push({
        id: row.id,
        exerciseId: row.exercise_id,
        exerciseName: row.exercise_name,
        weight: row.weight,
        reps: row.reps,
        rpe: row.rpe
      });
    }

    res.json(workoutsRes.rows.map(row => ({
      id: row.id,
      date: formatDate(row.date),
      sessionFocus: row.session_focus,
      deleted: row.deleted_at !== null,
      sets: setsByWorkout[row.id] || []
    })));
  } catch (err) {
    next(err);
  }
});

// POST or PUT workout (Upsert). A workout id owned by another user is
// reported as not found so ownership can't be probed.
app.post('/api/workouts', requireAuth, validateWorkout, async (req, res, next) => {
  const { id, date, sessionFocus, sets } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const upsert = await client.query(
      `INSERT INTO workouts (id, user_id, date, session_focus)
       VALUES ($1, $4, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         date = EXCLUDED.date,
         session_focus = EXCLUDED.session_focus,
         updated_at = NOW(),
         deleted_at = NULL
       WHERE workouts.user_id = $4
       RETURNING id`,
      [id, date, sessionFocus, req.user.id]
    );
    if (upsert.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Replace the workout's sets
    await client.query('DELETE FROM logged_sets WHERE workout_id = $1', [id]);

    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      await client.query(
        `INSERT INTO logged_sets (id, workout_id, exercise_id, weight, reps, rpe, set_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [set.id, id, set.exerciseId, set.weight, set.reps, set.rpe || null, i]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, id });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') return res.status(400).json({ error: 'Unknown exercise' });
    if (err.code === '23505') return res.status(409).json({ error: 'Set id conflict' });
    next(err);
  } finally {
    client.release();
  }
});

// DELETE workout (Soft delete, owner only)
app.delete('/api/workouts/:id', requireAuth, async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE workouts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Workout not found' });
    }
    await client.query(
      'UPDATE logged_sets SET deleted_at = NOW(), updated_at = NOW() WHERE workout_id = $1',
      [id]
    );
    await client.query('COMMIT');
    res.json({ success: true, id });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// Error handling middleware — never leaks internals to the client
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[IronBase API]', err.message);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : 'Bad request' });
});

// Start server
async function start() {
  try {
    await initDb();
  } catch {
    console.warn('[IronBase API] Could not initialize DB (is PostgreSQL running?). Server will start anyway, but endpoints may fail.');
  }

  app.listen(PORT, () => {
    console.log(`[IronBase API] Server listening on port ${PORT}`);
  });
}

start();
