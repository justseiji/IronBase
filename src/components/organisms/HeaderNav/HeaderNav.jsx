import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NavItem from '../../molecules/NavItem/NavItem';
import SyncStatusIndicator from '../../molecules/SyncStatusIndicator/SyncStatusIndicator';
import AccountMenu from '../AccountMenu/AccountMenu';
import { ROUTES, routeIndex } from '../../../layout/navigation';
import styles from './HeaderNav.module.css';

export default function HeaderNav() {
  const { pathname } = useLocation();
  const itemRefs = useRef([]);
  const [indicator, setIndicator] = useState(null);
  const activeIndex = routeIndex(pathname);

  useLayoutEffect(() => {
    function measure() {
      const el = itemRefs.current[activeIndex];
      setIndicator(prev => (el && el.offsetParent
        ? { left: el.offsetLeft, width: el.offsetWidth, animate: prev !== null }
        : null));
    }
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeIndex]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="IronBase home">
          <span className={styles.mark} aria-hidden="true" />
          <span>IronBase</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {indicator && (
            <span
              className={`${styles.indicator} ${indicator.animate ? styles.animated : ''}`}
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
              aria-hidden="true"
            />
          )}
          {ROUTES.map((route, i) => (
            <NavItem key={route.to} to={route.to} label={route.label} ref={el => { itemRefs.current[i] = el; }} />
          ))}
        </nav>

        <div className={styles.status}>
          <SyncStatusIndicator />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
