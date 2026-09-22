import Label from '../Label/Label';
import styles from './TextInput.module.css';

export default function TextInput({ id, label, value, onChange, type = 'text', placeholder = '', className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
}
