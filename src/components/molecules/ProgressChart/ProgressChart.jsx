import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
  if (!data || data.length < 2) {
    return (
      <div className={styles.empty}>
        <p>Not enough data yet</p>
        <p className={styles.emptyHint}>Keep logging to see your trend.</p>
      </div>
    );
  }

  const showDots = data.length <= 20;

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(238,232,223,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fill: 'rgba(238,232,223,0.4)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(238,232,223,0.06)' }}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fill: 'rgba(238,232,223,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: 'rgba(238,232,223,0.1)' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={accentColor}
            strokeWidth={2}
            dot={showDots ? { r: 3, fill: accentColor, stroke: accentColor } : false}
            activeDot={{ r: 5, fill: accentColor, stroke: '#1A1D20', strokeWidth: 2 }}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
