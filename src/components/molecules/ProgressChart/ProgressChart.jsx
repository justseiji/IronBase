import { useId, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cleanNumber } from '../../../utils/numbers';
import { formatDateShort } from '../../../utils/dateFormatters';
import useReducedMotion from '../../../hooks/useReducedMotion';
import styles from './ProgressChart.module.css';

const AXIS_TICK = { fill: 'rgba(238,232,223,0.42)', fontSize: 11 };

/** Clean any floating-point tick value that Recharts auto-generates */
function formatTickValue(value) {
  return cleanNumber(value).toLocaleString('en-US');
}

function paddedDomain(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = max === min ? Math.max(1, max * 0.1) : (max - min) * 0.18;
  return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{formatDateShort(label)}</div>
      <div className={styles.tooltipValue}>
        {cleanNumber(payload[0].value).toLocaleString('en-US')} <span className={styles.tooltipUnit}>{unit}</span>
      </div>
    </div>
  );
}

export default function ProgressChart({ data: rawData, unit = 'lbs', accentColor = '#A68B6B', height = 220 }) {
  const gradientId = useId().replace(/:/g, '');
  const reducedMotion = useReducedMotion();

  // Pre-clean ALL data values before they ever reach Recharts
  const data = useMemo(
    () => (rawData ? rawData.map(d => ({ ...d, value: cleanNumber(d.value) })) : []),
    [rawData]
  );
  const domain = useMemo(() => (data.length > 0 ? paddedDomain(data.map(d => d.value)) : [0, 1]), [data]);

  if (data.length === 0) {
    return (
      <div className={`${styles.chart} ${styles.empty}`} style={{ height }}>
        <svg className={styles.ghost} viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,85 50,78 100,80 150,62 200,55 250,40 300,30" />
        </svg>
        <p className={styles.emptyText}>Start logging to build your progression.</p>
      </div>
    );
  }

  if (data.length === 1) {
    const point = data[0];
    return (
      <div className={`${styles.chart} ${styles.single}`} style={{ height }}>
        <div className={styles.baseline} aria-hidden="true" />
        <span className={styles.singleDot} aria-hidden="true" />
        <div className={styles.singleCaption}>
          <span className={styles.singleDate}>
            {formatDateShort(point.date)} · first session
            <span className="visually-hidden">: {point.value.toLocaleString('en-US')} {unit}</span>
          </span>
          <span className={styles.singleHint}>Log another session to draw your trend.</span>
        </div>
      </div>
    );
  }

  const showDots = data.length <= 20;

  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity={0.28} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(238,232,223,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={formatTickValue}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={48}
            domain={domain}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: 'rgba(238,232,223,0.14)', strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={accentColor}
            strokeWidth={2.25}
            fill={`url(#${gradientId})`}
            dot={showDots ? { r: 3, fill: '#0F1113', stroke: accentColor, strokeWidth: 2 } : false}
            activeDot={{ r: 5.5, fill: accentColor, stroke: '#0F1113', strokeWidth: 2.5 }}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
