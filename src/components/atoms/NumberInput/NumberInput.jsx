import Label from '../Label/Label';
import styles from './NumberInput.module.css';

export default function NumberInput({ id, label, value, onChange, min, max, step, placeholder = '', className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
}
