/**
 * Personal record detection and session comparison logic.
 */

import { cleanNumber } from '../utils/numbers';

/**
 * Compute top personal records across all exercises.
 * Returns the top `limit` heaviest sets with exercise names and "isNew" flags.
 *
 * @param {Array} workoutHistory - Full workout history
 * @param {Array} exercises - Exercise definitions
 * @param {string|null} mostRecentWorkoutId - ID of the most recent workout (for NEW badge)
 * @param {number} limit - Maximum records to return
 * @returns {Array} PR objects with { exerciseId, weight, reps, workoutId, name, isNew }
 */
export function computePersonalRecords(workoutHistory, exercises, mostRecentWorkoutId, limit = 5) {
  const prMap = {};
  workoutHistory.forEach(w => {
    w.sets.forEach(s => {
      const wt = cleanNumber(s.weight);
      if (!prMap[s.exerciseId] || wt > prMap[s.exerciseId].weight) {
        prMap[s.exerciseId] = { exerciseId: s.exerciseId, weight: wt, reps: Number(s.reps), workoutId: w.id };
      }
    });
  });
  return Object.values(prMap)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map(pr => ({
      ...pr,
      name: exercises.find(e => e.id === pr.exerciseId)?.name || 'Unknown',
      isNew: pr.workoutId === mostRecentWorkoutId,
    }));
}

/**
 * Compute the current PR (heaviest weight) for a specific exercise,
 * considering both workout history and any additional sets (e.g., current session).
 *
 * @param {Array} workoutHistory - Full workout history
 * @param {string} exerciseId - Exercise to check
 * @param {Array} additionalSets - Extra sets to consider (e.g., current logged sets)
 * @returns {number} Maximum weight for this exercise, or 0
 */
export function computeExercisePR(workoutHistory, exerciseId, additionalSets = []) {
  if (!exerciseId) return 0;
  let max = 0;
  workoutHistory.forEach(w => {
    w.sets.forEach(s => {
      const wt = cleanNumber(s.weight);
      if (s.exerciseId === exerciseId && wt > max) {
        max = wt;
      }
    });
  });
  additionalSets.forEach(s => {
    const wt = cleanNumber(s.weight);
    if (s.exerciseId === exerciseId && wt > max) {
      max = wt;
    }
  });
  return max;
}

/**
 * Find the best (heaviest) set from the most recent session for a specific exercise.
 *
 * @param {Array} workoutHistory - Full workout history
 * @param {string} exerciseId - Exercise to look up
 * @returns {Object|null} Best set from the last session, or null
 */
export function findPreviousSet(workoutHistory, exerciseId) {
  if (!exerciseId) return null;
  const sessions = {};
  workoutHistory.forEach(w => {
    w.sets.forEach(s => {
      if (s.exerciseId === exerciseId) {
        if (!sessions[w.date]) sessions[w.date] = [];
        sessions[w.date].push(s);
      }
    });
  });
  const dates = Object.keys(sessions).sort();
  if (dates.length === 0) return null;
  const lastDate = dates[dates.length - 1];
  const lastSets = sessions[lastDate];
  return lastSets.reduce((best, s) => {
    if (!best || cleanNumber(s.weight) > cleanNumber(best.weight)) return s;
    return best;
  }, null);
}

/**
 * Compute comparison text between current input and the previous session's best set.
 *
 * @param {Object|null} previousSet - Previous session's best set
 * @param {string|number} weight - Current weight input
 * @param {string|number} reps - Current reps input
 * @returns {string|null} Comparison text or null
 */
export function computeSetComparison(previousSet, weight, reps) {
  if (!previousSet || !weight) return null;
  const w = cleanNumber(weight);
  const r = Number(reps) || 0;
  const prevW = cleanNumber(previousSet.weight);
  const prevR = Number(previousSet.reps);
  if (w <= 0) return null;

  const parts = [];
  const diff = cleanNumber(w - prevW);
  if (diff > 0) parts.push(`+${diff} lbs from previous`);
  else if (diff < 0) parts.push(`${diff} lbs from previous`);
  else parts.push('Same weight');

  if (r > 0 && prevR > 0) {
    if (r > prevR) parts.push(`+${r - prevR} rep${r - prevR !== 1 ? 's' : ''}`);
    else if (r < prevR) parts.push(`${r - prevR} rep${Math.abs(r - prevR) !== 1 ? 's' : ''}`);
  }

  return parts.join(' · ');
}
