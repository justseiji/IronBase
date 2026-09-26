import { getDb } from '../database/db.js';

/**
 * Retrieve all active exercises from the database.
 * 
 * @returns {Promise<Array>} Array of exercise objects
 */
export async function getExercises() {
  const db = await getDb();
  const res = await db.query('SELECT * FROM exercises WHERE deleted_at IS NULL ORDER BY name ASC');
  
  return res.rows.map(row => ({
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    isDefault: row.is_default
  }));
}

/**
 * Retrieve a single exercise by ID.
 * 
 * @param {string} id - The exercise ID
 * @returns {Promise<Object|null>} The exercise object, or null if not found
 */
export async function getExercise(id) {
  const db = await getDb();
  const res = await db.query('SELECT * FROM exercises WHERE id = $1 AND deleted_at IS NULL', [id]);
  
  if (res.rows.length === 0) return null;
  
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    isDefault: row.is_default
  };
}
