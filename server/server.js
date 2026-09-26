import express from 'express';
import cors from 'cors';
import pool, { initDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Validation middleware
function validateWorkout(req, res, next) {
  const { id, date, sessionFocus, sets } = req.body;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid or missing id' });
  if (!date || isNaN(Date.parse(date))) return res.status(400).json({ error: 'Invalid or missing date' });
  if (!sessionFocus || typeof sessionFocus !== 'string') return res.status(400).json({ error: 'Invalid or missing sessionFocus' });
  if (!Array.isArray(sets)) return res.status(400).json({ error: 'Sets must be an array' });
  
  for (const set of sets) {
    if (!set.id || !set.exerciseId || set.weight == null || set.reps == null) {
      return res.status(400).json({ error: 'Invalid set object in array' });
    }
  }
  
  next();
}

// GET all active exercises
app.get('/api/exercises', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM exercises WHERE deleted_at IS NULL ORDER BY name ASC');
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      muscleGroup: row.muscle_group,
      isDefault: row.is_default
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all active workouts with sets
app.get('/api/workouts', async (req, res) => {
  try {
    const workoutsRes = await pool.query(`
      SELECT id, date, session_focus 
      FROM workouts 
      WHERE deleted_at IS NULL 
      ORDER BY date DESC, created_at DESC
    `);
    
    const setsRes = await pool.query(`
      SELECT ls.id, ls.workout_id, ls.exercise_id, ls.weight, ls.reps, ls.rpe, e.name as exercise_name
      FROM logged_sets ls
      JOIN exercises e ON ls.exercise_id = e.id
      WHERE ls.deleted_at IS NULL 
        AND ls.workout_id IN (SELECT id FROM workouts WHERE deleted_at IS NULL)
      ORDER BY ls.set_order ASC, ls.created_at ASC
    `);

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

    const workouts = workoutsRes.rows.map(row => {
      let formattedDate = row.date;
      if (row.date instanceof Date) {
        formattedDate = row.date.toISOString().split('T')[0];
      }
      return {
        id: row.id,
        date: formattedDate,
        sessionFocus: row.session_focus,
        sets: setsByWorkout[row.id] || []
      };
    });

    res.json(workouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST or PUT workout (Upsert)
app.post('/api/workouts', validateWorkout, async (req, res) => {
  const { id, date, sessionFocus, sets } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Upsert workout
    await client.query(
      `INSERT INTO workouts (id, date, session_focus)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET 
         date = EXCLUDED.date, 
         session_focus = EXCLUDED.session_focus,
         updated_at = NOW(),
         deleted_at = NULL`,
      [id, date, sessionFocus]
    );

    // Delete existing sets for this workout (simple approach for sync/replace)
    await client.query('DELETE FROM logged_sets WHERE workout_id = $1', [id]);

    // Insert new sets
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE workout (Soft delete)
app.delete('/api/workouts/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE workouts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    );
    await client.query(
      'UPDATE logged_sets SET deleted_at = NOW(), updated_at = NOW() WHERE workout_id = $1',
      [id]
    );
    await client.query('COMMIT');
    res.json({ success: true, id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
async function start() {
  try {
    // Only attempt DB init if we can connect (fails gracefully if no PG server running locally)
    await initDb();
  } catch (err) {
    console.warn('[IronBase API] Could not initialize DB (is PostgreSQL running?). Server will start anyway, but endpoints may fail.');
  }
  
  app.listen(PORT, () => {
    console.log(`[IronBase API] Server listening on port ${PORT}`);
  });
}

start();
