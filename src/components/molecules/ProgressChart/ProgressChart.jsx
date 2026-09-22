import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import styles from './ProgressChart.module.css';

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{formatDateShort(label)}</div>
      <div className={styles.tooltipValue}>
        {payload[0].value} <span className={styles.tooltipUnit}>{unit}</span>
      </div>
    </div>
  );
}

export default function ProgressChart({ data, metricLabel, unit = 'lbs', accentColor = '#A68B6B' }) {
  const showDots = !data || data.length <= 20;
  
  // State 0: No data — show chart skeleton with baseline
  if (!data || data.length === 0) {
    return (
      <div className={styles.chart}>
        <div className={styles.emptyChart}>
          <p className={styles.emptyText}>Start logging to build your progression.</p>
        </div>
      </div>
    );
  }

  // State 1: Single data point — show dot on baseline
  if (data.length === 1) {
    return (
      <div className={styles.chart}>
        <div className={styles.singlePoint}>
          <span className={styles.singleValue}>{data[0].value} <span className={styles.singleUnit}>{unit}</span></span>
          <span className={styles.singleDate}>{formatDateShort(data[0].date)}</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,232,223,0.06)" vertical={false} />
            <ReferenceLine y={data[0].value} stroke="rgba(238,232,223,0.06)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: 'rgba(238,232,223,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(238,232,223,0.06)' }} tickLine={false} tickMargin={8} />
            <YAxis tick={{ fill: 'rgba(238,232,223,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={48} domain={[d => d * 0.9, d => d * 1.1]} />
            <Line type="monotone" dataKey="value" stroke={accentColor} strokeWidth={0} dot={{ r: 5, fill: accentColor, stroke: '#1A1D20', strokeWidth: 2 }} animationDuration={400} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // State 2+: Full line chart
  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,232,223,0.06)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: 'rgba(238,232,223,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(238,232,223,0.06)' }} tickLine={false} tickMargin={8} />
          <YAxis tick={{ fill: 'rgba(238,232,223,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={48} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: 'rgba(238,232,223,0.1)' }} />
          <Line type="monotone" dataKey="value" stroke={accentColor} strokeWidth={2} dot={showDots ? { r: 3, fill: accentColor, stroke: accentColor } : false} activeDot={{ r: 5, fill: accentColor, stroke: '#1A1D20', strokeWidth: 2 }} animationDuration={600} animationEasing="ease-out" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
