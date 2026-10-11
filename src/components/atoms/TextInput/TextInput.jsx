import Label from '../Label/Label';
import styles from './TextInput.module.css';

export default function TextInput({ id, label, value, onChange, type = 'text', placeholder = '', className = '', autoComplete, maxLength }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={styles.input}
      />
    </div>
  );
}
