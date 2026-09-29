/**
 * Resolves a form guide's media reference to its image paths.
 *
 * All form-guide media comes from one source, free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db, public domain), and is
 * self-hosted under /media/exercises/<source id>/ exactly as the dataset lays
 * it out: 0.jpg is the start position and 1.jpg the end position. This is the
 * only place that knows that layout.
 */
const MEDIA_ROOT = '/media/exercises';

export function resolveFormGuideMedia(sourceId) {
  if (!sourceId) return null;
  const base = `${MEDIA_ROOT}/${encodeURIComponent(sourceId)}`;
  return { start: `${base}/0.jpg`, end: `${base}/1.jpg` };
}
