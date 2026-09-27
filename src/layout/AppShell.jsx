import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import HeaderNav from '../components/organisms/HeaderNav/HeaderNav';
import MobileBottomNav from '../components/organisms/MobileBottomNav/MobileBottomNav';
import Footer from '../components/organisms/Footer/Footer';
import { routeIndex } from './navigation';
import styles from './AppShell.module.css';

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const [prevPath, setPrevPath] = useState(pathname);
  const [direction, setDirection] = useState(0);

  // Direction of travel through the nav order drives a subtle horizontal drift.
  if (pathname !== prevPath) {
    setDirection(Math.sign(routeIndex(pathname) - routeIndex(prevPath)));
    setPrevPath(pathname);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>Skip to content</a>
      <HeaderNav />
      <main id="main" className={styles.main}>
        <div key={pathname} className={styles.page} style={{ '--dir': direction }}>
          {children}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
