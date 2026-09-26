import NavItem from '../../molecules/NavItem/NavItem';
import SyncStatusIndicator from '../../molecules/SyncStatusIndicator/SyncStatusIndicator';
import styles from './HeaderNav.module.css';

export default function HeaderNav() {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
        <span className={styles.brand}>IronBase</span>
        <SyncStatusIndicator />
      </div>
      <nav className={styles.nav}>
        <NavItem to="/" label="Dashboard" />
        <NavItem to="/log" label="Workout Log" />
        <NavItem to="/exercise-history" label="Exercise History" />
        <NavItem to="/workout-history" label="Workout History" />
      </nav>
    </header>
  );
}
