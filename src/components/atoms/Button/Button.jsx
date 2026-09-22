import styles from './Button.module.css';

export default function Button({ children, onClick, variant = 'secondary', type = 'button', disabled = false, className = '', fullWidth = false }) {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
