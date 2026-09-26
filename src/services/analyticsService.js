/**
 * Shared analytics and workout-data aggregation logic.
 * Single source of truth for session metric computation,
 * chart data mapping, and progress insight generation.
 */

import { cleanNumber } from '../utils/numbers';
import { calcE1RM } from './e1rmService';

/**
 * Extract all sets for a specific exercise from workout history,
 * each enriched with the workout date.
 *
 * @param {Array} workoutHistory - Full workout history array
 * @param {string} exerciseId - Exercise to filter by
 * @returns {Array} Sets with { ...set, date } for the specified exercise
 */
export function getSetsForExercise(workoutHistory, exerciseId) {
  const sets = [];
  workoutHistory.forEach(w => {
    w.sets.forEach(s => {
      if (s.exerciseId === exerciseId) {
        sets.push({ ...s, date: w.date });
      }
    });
  });
  return sets;
}

/**
 * Group an array of sets (each having a `date` property) by date,
 * computing per-session metrics: maxWeight, totalVolume, maxE1RM.
 * Returns sessions sorted chronologically.
 *
 * @param {Array} setsWithDates - Sets array, each with a `date` property
 * @returns {Array} Session objects sorted by date
 */
export function computeSessionMetrics(setsWithDates) {
  const grouped = {};
  setsWithDates.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });

  return Object.entries(grouped)
    .map(([date, sets]) => {
      const maxWeight = cleanNumber(Math.max(...sets.map(s => cleanNumber(s.weight))));
      const totalVolume = cleanNumber(sets.reduce((sum, s) => sum + cleanNumber(s.weight) * Number(s.reps), 0));
      const maxE1RM = cleanNumber(Math.max(...sets.map(s => calcE1RM(cleanNumber(s.weight), Number(s.reps)))));
      return { date, maxWeight, totalVolume, maxE1RM, sets };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Map session metrics to chart-ready { date, value } based on the active metric.
 *
 * @param {Array} sessionData - Array from computeSessionMetrics
 * @param {string} activeMetric - 'weight' | 'volume' | 'e1rm'
 * @returns {Array} Chart data points
 */
export function computeChartData(sessionData, activeMetric) {
  return sessionData.map(s => ({
    date: s.date,
    value: activeMetric === 'weight' ? s.maxWeight
         : activeMetric === 'volume' ? s.totalVolume
         : s.maxE1RM,
  }));
}

/**
 * Generate a natural-language progress insight for a given exercise.
 *
 * @param {Array} sessionData - Array from computeSessionMetrics
 * @param {string} exerciseName - Display name of the exercise
 * @param {Object} options
 * @param {string} options.emptyMessage - Message when no sessions exist
 * @param {string} options.singleSuffix - Extra text appended to single-session message
 * @returns {string} Insight string
 */
export function generateProgressInsight(sessionData, exerciseName, options = {}) {
  const {
    emptyMessage = 'Start logging to build your progression history.',
    singleSuffix = '',
  } = options;

  const name = exerciseName || 'exercise';

  if (sessionData.length === 0) return emptyMessage;
  if (sessionData.length === 1) {
    return `You've logged your first ${name} session.${singleSuffix}`;
  }

  const first = sessionData[0].maxWeight;
  const last = sessionData[sessionData.length - 1].maxWeight;
  const diff = cleanNumber(last - first);

  if (last >= Math.max(...sessionData.map(s => s.maxWeight))) {
    return `Your latest ${name} session is your strongest.`;
  }
  if (diff > 0) {
    return `Your ${name} is up ${diff} lbs since your first session.`;
  }
  return `You've logged ${sessionData.length} ${name} sessions.`;
}
