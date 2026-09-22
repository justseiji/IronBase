/**
 * Cleans floating point artifacts from numbers.
 * Converts to a maximum of 2 decimal places and removes trailing zeros.
 * e.g. 220.00000000000003 -> 220
 * e.g. 220.50000000000001 -> 220.5
 */
export function cleanNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return 0;
  return parseFloat(Number(num).toFixed(2));
}
