/**
 * Shared date formatting utilities for IronBase.
 * All functions accepting dateStr expect "YYYY-MM-DD" format.
 */

/**
 * "YYYY-MM-DD" for a Date in the device's local timezone.
 * (toISOString() would give the UTC date, which is a different day for much of the world.)
 */
export function toLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Relative format: "Today", "Yesterday", or "Mon DD".
 * Used in Dashboard recent workouts.
 */
export function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * "Mon DD, YYYY" format.
 * Used in Exercise History session dates.
 */
export function formatDateWithYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * "Day, Mon DD, YYYY" format with weekday.
 * Used in Workout History cards.
 */
export function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * "Mon DD" short format.
 * Used in chart axes and tooltips.
 */
export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Time-of-day greeting string.
 */
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
