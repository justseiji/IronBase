import styles from './IconButton.module.css';

export default function IconButton({ children, onClick, ariaLabel, className = '', title }) {
  return (
    <button
      type="button"
      className={`${styles.iconButton} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}
