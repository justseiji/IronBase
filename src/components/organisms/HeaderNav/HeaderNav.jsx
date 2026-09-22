import NavItem from '../../molecules/NavItem/NavItem';
import styles from './HeaderNav.module.css';

export default function HeaderNav() {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>IronBase</span>
      <nav className={styles.nav}>
        <NavItem to="/" label="Dashboard" />
        <NavItem to="/log" label="Workout Log" />
        <NavItem to="/exercise-history" label="Exercise History" />
        <NavItem to="/workout-history" label="Workout History" />
      </nav>
    </header>
  );
}
