import Label from '../Label/Label';
import styles from './Select.module.css';

export default function Select({ id, label, value, onChange, options = [], placeholder = 'Select...', className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value} onChange={onChange} className={styles.select}>
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
