import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES, routeIndex } from '../../../layout/navigation';
import styles from './MobileBottomNav.module.css';

const ICONS = {
  '/': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  '/log': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  '/exercise-history': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-5 4 3 5-7" />
    </svg>
  ),
  '/workout-history': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
};

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const activeIndex = routeIndex(pathname);

  return (
    <nav className={styles.bottomNav} aria-label="Primary" style={{ '--count': ROUTES.length }}>
      <div className={styles.track}>
        {activeIndex >= 0 && (
          <span className={styles.indicator} style={{ transform: `translateX(${activeIndex * 100}%)` }} aria-hidden="true">
            <span className={styles.indicatorBar} />
          </span>
        )}
        {ROUTES.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.icon}>{ICONS[item.to]}</span>
            <span className={styles.label}>{item.shortLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
