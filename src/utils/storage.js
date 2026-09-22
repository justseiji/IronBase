const STORAGE_KEY = 'ironbase-data';

export function loadIronBaseData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic shape validation
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.exercises) || !Array.isArray(parsed.workoutHistory)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveIronBaseData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('IronBase: Failed to save data', e);
  }
}
