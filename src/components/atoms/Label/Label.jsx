import styles from './Label.module.css';

export default function Label({ children, htmlFor, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`${styles.label} ${className}`}>
      {children}
    </label>
  );
}
