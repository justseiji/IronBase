export const ROUTES = [
  { to: '/', label: 'Dashboard', shortLabel: 'Home' },
  { to: '/log', label: 'Workout Log', shortLabel: 'Log' },
  { to: '/exercise-history', label: 'Exercise History', shortLabel: 'History' },
  { to: '/workout-history', label: 'Workout History', shortLabel: 'Workouts' },
];

export function routeIndex(pathname) {
  return ROUTES.findIndex(r => r.to === pathname);
}
