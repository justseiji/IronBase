import styles from './Sparkline.module.css';

export default function Sparkline({ values, width = 72, height = 24 }) {
  if (!values || values.length < 2) return <span className={styles.placeholder} style={{ width, height }} aria-hidden="true" />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 3;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y];
  });
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg className={styles.spark} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline className={styles.line} pathLength="1" points={points.map(p => p.join(',')).join(' ')} />
      <circle className={styles.end} cx={lastX} cy={lastY} r="2.5" />
    </svg>
  );
}
