import pkg from 'pg';
const { Pool } = pkg;

// Use environment variable or default to a local dev DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ironbase'
});

// An idle client error (e.g. the database restarting) must not crash the API.
pool.on('error', (err) => {
  console.error('[IronBase API] Idle database client error:', err.message);
});

/**
 * Initialize database schema for the cloud backend.
 * Every statement is idempotent so it is safe to run on each start.
 */
export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        date DATE NOT NULL,
        session_focus TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        synced_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS logged_sets (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL REFERENCES exercises(id),
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        rpe REAL,
        set_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        synced_at TIMESTAMPTZ
      );

      -- Accounts
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));
      CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON users (lower(username));

      -- Sessions (only a SHA-256 of the token is stored)
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

      -- Password reset links (single use; only a SHA-256 of the token is stored)
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts(user_id);
    `);

    // Seed default exercises if table is empty
    const res = await client.query('SELECT count(*) FROM exercises');
    if (parseInt(res.rows[0].count, 10) === 0) {
      const DEFAULT_EXERCISES = [
        { id: 'ex-1', name: 'Squat', muscleGroup: 'Legs' },
        { id: 'ex-2', name: 'Bench Press', muscleGroup: 'Chest' },
        { id: 'ex-3', name: 'Deadlift', muscleGroup: 'Back' },
        { id: 'ex-4', name: 'Overhead Press', muscleGroup: 'Shoulders' },
        { id: 'ex-5', name: 'Barbell Row', muscleGroup: 'Back' },
      ];
      for (const ex of DEFAULT_EXERCISES) {
        await client.query(
          `INSERT INTO exercises (id, name, muscle_group, is_default)
           VALUES ($1, $2, $3, true)`,
          [ex.id, ex.name, ex.muscleGroup]
        );
      }
    }

    await client.query('COMMIT');
    console.log('[IronBase API] Database initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[IronBase API] Database initialization failed', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
