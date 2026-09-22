import HeaderNav from '../components/organisms/HeaderNav/HeaderNav';
import MobileBottomNav from '../components/organisms/MobileBottomNav/MobileBottomNav';
import Footer from '../components/organisms/Footer/Footer';
import styles from './AppShell.module.css';

export default function AppShell({ children }) {
  return (
    <div className={styles.shell}>
      <HeaderNav />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
