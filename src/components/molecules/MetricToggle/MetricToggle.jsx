import styles from './MetricToggle.module.css';

export default function MetricToggle({ options, activeValue, onChange }) {
  return (
    <div className={styles.toggle} role="tablist">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={activeValue === opt.value}
          className={`${styles.option} ${activeValue === opt.value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
