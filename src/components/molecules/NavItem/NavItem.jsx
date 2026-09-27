import { NavLink } from 'react-router-dom';
import styles from './NavItem.module.css';

export default function NavItem({ to, icon, label, ref }) {
  return (
    <NavLink
      ref={ref}
      to={to}
      end={to === '/'}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{label}</span>
    </NavLink>
  );
}
