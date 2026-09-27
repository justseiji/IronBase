import styles from './MetricToggle.module.css';

export default function MetricToggle({ options, activeValue, onChange, label = 'Metric' }) {
  const activeIndex = Math.max(0, options.findIndex(o => o.value === activeValue));

  function handleKeyDown(e) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = options[(activeIndex + delta + options.length) % options.length];
    onChange(next.value);
    e.currentTarget.parentElement.querySelector(`[data-value="${next.value}"]`)?.focus();
  }

  return (
    <div className={styles.toggle} role="radiogroup" aria-label={label} style={{ '--count': options.length }}>
      <span className={styles.thumb} style={{ transform: `translateX(${activeIndex * 100}%)` }} aria-hidden="true" />
      {options.map(opt => {
        const active = activeValue === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-value={opt.value}
            className={`${styles.option} ${active ? styles.active : ''}`}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
