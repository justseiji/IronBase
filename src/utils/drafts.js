export const LEGACY_DRAFT_KEY = 'ironbase-workout-draft';

export function draftKeyFor(userId) {
  return `${LEGACY_DRAFT_KEY}:${userId}`;
}
