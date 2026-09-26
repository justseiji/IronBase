/**
 * Estimated 1-Rep Max (e1RM) calculations.
 * Uses the Epley formula: weight × (1 + reps / 30)
 */

/**
 * Calculate estimated 1-rep max using the Epley formula.
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of repetitions
 * @returns {number} Estimated 1RM (rounded), or 0 for invalid inputs
 */
export function calcE1RM(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}
