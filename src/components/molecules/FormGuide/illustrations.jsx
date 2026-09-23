/**
 * Inline SVG illustrations for form guide stages.
 * Each illustration is a simplified silhouette figure showing
 * the body position and barbell for a specific movement phase.
 *
 * Style: minimal geometric silhouettes on transparent background,
 * warm muted tones compatible with IronBase dark theme.
 */

const BODY = 'rgba(238, 232, 223, 0.25)';
const BODY_OUTLINE = 'rgba(238, 232, 223, 0.35)';
const BAR = 'rgba(166, 139, 107, 0.7)';
const BAR_PLATE = 'rgba(166, 139, 107, 0.5)';
const BENCH_COLOR = 'rgba(238, 232, 223, 0.12)';
const FLOOR = 'rgba(238, 232, 223, 0.08)';

function SvgBase({ children, label }) {
  return (
    <svg
      viewBox="0 0 200 160"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Floor line */}
      <line x1="10" y1="148" x2="190" y2="148" stroke={FLOOR} strokeWidth="1" />
      {children}
    </svg>
  );
}

/* ─── SQUAT ─── */

function SquatSetup() {
  return (
    <SvgBase label="Squat setup: standing upright with barbell on upper back">
      {/* Body — standing upright */}
      <circle cx="100" cy="38" r="10" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso */}
      <line x1="100" y1="48" x2="100" y2="90" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Upper arms */}
      <line x1="100" y1="55" x2="82" y2="68" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="100" y1="55" x2="118" y2="68" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Forearms to bar */}
      <line x1="82" y1="68" x2="80" y2="50" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="118" y1="68" x2="120" y2="50" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      {/* Legs — straight */}
      <line x1="100" y1="90" x2="88" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="100" y1="90" x2="112" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Barbell across upper back */}
      <line x1="62" y1="48" x2="138" y2="48" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      {/* Plates */}
      <rect x="56" y="40" width="8" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="136" y="40" width="8" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function SquatDescent() {
  return (
    <SvgBase label="Squat descent: beginning the squat with hips moving back">
      <circle cx="96" cy="48" r="10" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso — slightly leaned forward */}
      <line x1="96" y1="58" x2="102" y2="96" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms */}
      <line x1="96" y1="64" x2="80" y2="74" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="96" y1="64" x2="112" y2="74" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="80" y1="74" x2="78" y2="58" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="112" y1="74" x2="114" y2="58" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      {/* Legs — partially bent */}
      <line x1="102" y1="96" x2="82" y2="120" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="102" y1="96" x2="120" y2="120" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Shins */}
      <line x1="82" y1="120" x2="86" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="120" y1="120" x2="114" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Barbell */}
      <line x1="58" y1="56" x2="134" y2="56" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="52" y="48" width="8" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="132" y="48" width="8" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function SquatDepth() {
  return (
    <SvgBase label="Squat at depth: thighs approximately parallel, maintaining neutral spine">
      <circle cx="90" cy="66" r="10" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso — more forward lean */}
      <line x1="90" y1="76" x2="104" y2="108" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms */}
      <line x1="90" y1="82" x2="76" y2="88" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="90" y1="82" x2="106" y2="88" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="76" y1="88" x2="74" y2="74" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="106" y1="88" x2="108" y2="74" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      {/* Thighs — parallel */}
      <line x1="104" y1="108" x2="78" y2="114" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="104" y1="108" x2="126" y2="114" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Shins — vertical */}
      <line x1="78" y1="114" x2="82" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="126" y1="114" x2="120" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Barbell */}
      <line x1="54" y1="72" x2="128" y2="72" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="48" y="64" width="8" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="126" y="64" width="8" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function SquatDrive() {
  return (
    <SvgBase label="Squat drive: pushing upward from the bottom position">
      <circle cx="94" cy="54" r="10" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso */}
      <line x1="94" y1="64" x2="102" y2="100" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms */}
      <line x1="94" y1="70" x2="78" y2="78" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="94" y1="70" x2="112" y2="78" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="78" y1="78" x2="76" y2="64" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="112" y1="78" x2="114" y2="64" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      {/* Legs — partially extended */}
      <line x1="102" y1="100" x2="84" y2="124" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="102" y1="100" x2="118" y2="124" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="84" y1="124" x2="88" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="118" y1="124" x2="114" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Barbell */}
      <line x1="56" y1="62" x2="134" y2="62" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="50" y="54" width="8" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="132" y="54" width="8" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

/* ─── BENCH PRESS ─── */

function BenchSetup() {
  return (
    <SvgBase label="Bench press setup: lying on bench with feet planted and hands on bar">
      {/* Bench */}
      <rect x="50" y="98" width="90" height="8" rx="3" fill={BENCH_COLOR} />
      <rect x="60" y="106" width="6" height="42" rx="2" fill={BENCH_COLOR} />
      <rect x="124" y="106" width="6" height="42" rx="2" fill={BENCH_COLOR} />
      {/* Rack uprights */}
      <rect x="42" y="30" width="4" height="76" rx="1" fill={BENCH_COLOR} />
      {/* Body — lying on bench */}
      <circle cx="120" cy="88" r="9" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso on bench */}
      <line x1="112" y1="90" x2="72" y2="94" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms up to bar on rack */}
      <line x1="106" y1="88" x2="98" y2="68" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="84" y1="90" x2="76" y2="68" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Forearms */}
      <line x1="98" y1="68" x2="92" y2="56" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="76" y1="68" x2="70" y2="56" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      {/* Legs off bench */}
      <line x1="72" y1="96" x2="66" y2="128" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="66" y1="128" x2="58" y2="148" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Bar on rack */}
      <line x1="38" y1="54" x2="130" y2="54" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="30" y="46" width="8" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="130" y="46" width="8" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function BenchUnrack() {
  return (
    <SvgBase label="Bench press unrack: bar held at arms length over chest">
      {/* Bench */}
      <rect x="50" y="98" width="90" height="8" rx="3" fill={BENCH_COLOR} />
      <rect x="60" y="106" width="6" height="42" rx="2" fill={BENCH_COLOR} />
      <rect x="124" y="106" width="6" height="42" rx="2" fill={BENCH_COLOR} />
      {/* Rack */}
      <rect x="42" y="30" width="4" height="76" rx="1" fill={BENCH_COLOR} />
      {/* Body */}
      <circle cx="120" cy="88" r="9" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      <line x1="112" y1="90" x2="72" y2="94" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms — straight up holding bar */}
      <line x1="106" y1="88" x2="104" y2="58" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="84" y1="90" x2="82" y2="58" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Legs */}
      <line x1="72" y1="96" x2="66" y2="128" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="66" y1="128" x2="58" y2="148" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Bar — over chest, arms locked */}
      <line x1="54" y1="56" x2="138" y2="56" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="46" y="48" width="8" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="138" y="48" width="8" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function BenchDescent() {
  return (
    <SvgBase label="Bench press descent: bar lowering toward mid-chest with control">
      {/* Bench */}
      <rect x="50" y="98" width="90" height="8" rx="3" fill={BENCH_COLOR} />
      <rect x="60" y="106" width="6" height="42" rx="2" fill={BENCH_COLOR} />
      <rect x="124" y="106" width="6" height="42" rx="2" fill={BENCH_COLOR} />
      {/* Rack */}
      <rect x="42" y="30" width="4" height="76" rx="1" fill={BENCH_COLOR} />
      {/* Body */}
      <circle cx="120" cy="88" r="9" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      <line x1="112" y1="90" x2="72" y2="94" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms — bent, bar lower */}
      <line x1="106" y1="88" x2="110" y2="72" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="110" y1="72" x2="104" y2="74" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <line x1="84" y1="90" x2="80" y2="72" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="80" y1="72" x2="82" y2="74" stroke={BODY_OUTLINE} strokeWidth="3" strokeLinecap="round" />
      {/* Legs */}
      <line x1="72" y1="96" x2="66" y2="128" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="66" y1="128" x2="58" y2="148" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Bar — lower, closer to chest */}
      <line x1="54" y1="74" x2="138" y2="74" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="46" y="66" width="8" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="138" y="66" width="8" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function BenchPress() {
  return (
    <SvgBase label="Bench press: pressing bar upward from chest to lockout">
      {/* Bench */}
      <rect x="50" y="98" width="90" height="8" rx="3" fill={BENCH_COLOR} />
      <rect x="60" y="106" width="6" height="42" rx="2" fill={BENCH_COLOR} />
      <rect x="124" y="106" width="6" height="42" rx="2" fill={BENCH_COLOR} />
      {/* Rack */}
      <rect x="42" y="30" width="4" height="76" rx="1" fill={BENCH_COLOR} />
      {/* Body */}
      <circle cx="120" cy="88" r="9" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      <line x1="112" y1="90" x2="72" y2="94" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms — extending upward */}
      <line x1="106" y1="88" x2="106" y2="64" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="84" y1="90" x2="84" y2="64" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Legs */}
      <line x1="72" y1="96" x2="66" y2="128" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="66" y1="128" x2="58" y2="148" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Bar — mid-press */}
      <line x1="54" y1="62" x2="138" y2="62" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="46" y="54" width="8" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="138" y="54" width="8" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

/* ─── DEADLIFT ─── */

function DeadliftSetup() {
  return (
    <SvgBase label="Deadlift setup: hinged at hips, hands gripping bar over mid-foot">
      {/* Head */}
      <circle cx="80" cy="52" r="9" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso — angled forward ~45° */}
      <line x1="82" y1="60" x2="105" y2="96" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms — hanging down to bar */}
      <line x1="88" y1="70" x2="92" y2="130" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="96" y1="78" x2="102" y2="130" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Legs — bent at hips/knees */}
      <line x1="105" y1="96" x2="88" y2="124" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="105" y1="96" x2="118" y2="124" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="88" y1="124" x2="86" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="118" y1="124" x2="116" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Barbell on ground */}
      <line x1="56" y1="134" x2="144" y2="134" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="48" y="126" width="10" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="142" y="126" width="10" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function DeadliftPull() {
  return (
    <SvgBase label="Deadlift pull: bar rising off the floor, hips and shoulders rising together">
      <circle cx="86" cy="48" r="9" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso — less forward lean */}
      <line x1="88" y1="56" x2="106" y2="92" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms — bar at shin height */}
      <line x1="92" y1="66" x2="94" y2="116" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="98" y1="74" x2="102" y2="116" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Legs */}
      <line x1="106" y1="92" x2="90" y2="120" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="106" y1="92" x2="118" y2="120" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="90" y1="120" x2="88" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="118" y1="120" x2="116" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Barbell — off the ground */}
      <line x1="58" y1="118" x2="142" y2="118" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="50" y="110" width="10" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="140" y="110" width="10" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function DeadliftLockout() {
  return (
    <SvgBase label="Deadlift lockout: standing tall with hips and knees fully extended">
      <circle cx="100" cy="34" r="9" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso — upright */}
      <line x1="100" y1="44" x2="100" y2="86" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms — straight down, holding bar at hips */}
      <line x1="100" y1="54" x2="88" y2="92" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="100" y1="54" x2="112" y2="92" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Legs — straight */}
      <line x1="100" y1="86" x2="90" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="100" y1="86" x2="110" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Barbell — at hip level */}
      <line x1="56" y1="92" x2="144" y2="92" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="48" y="84" width="10" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="142" y="84" width="10" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

function DeadliftReset() {
  return (
    <SvgBase label="Deadlift reset: controlled return of bar to the floor">
      <circle cx="88" cy="46" r="9" fill={BODY} stroke={BODY_OUTLINE} strokeWidth="1.5" />
      {/* Torso — hinging forward */}
      <line x1="90" y1="54" x2="106" y2="90" stroke={BODY_OUTLINE} strokeWidth="6" strokeLinecap="round" />
      {/* Arms */}
      <line x1="94" y1="64" x2="96" y2="120" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      <line x1="100" y1="72" x2="104" y2="120" stroke={BODY_OUTLINE} strokeWidth="4" strokeLinecap="round" />
      {/* Legs */}
      <line x1="106" y1="90" x2="92" y2="120" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="106" y1="90" x2="118" y2="120" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="92" y1="120" x2="88" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      <line x1="118" y1="120" x2="116" y2="148" stroke={BODY_OUTLINE} strokeWidth="5" strokeLinecap="round" />
      {/* Barbell — lowering */}
      <line x1="58" y1="122" x2="142" y2="122" stroke={BAR} strokeWidth="3" strokeLinecap="round" />
      <rect x="50" y="114" width="10" height="16" rx="2" fill={BAR_PLATE} />
      <rect x="140" y="114" width="10" height="16" rx="2" fill={BAR_PLATE} />
    </SvgBase>
  );
}

/* ─── LOOKUP ─── */

const illustrations = {
  'ex-1': [SquatSetup, SquatDescent, SquatDepth, SquatDrive],
  'ex-2': [BenchSetup, BenchUnrack, BenchDescent, BenchPress],
  'ex-3': [DeadliftSetup, DeadliftPull, DeadliftLockout, DeadliftReset],
};

/**
 * Returns the illustration component for a given exercise and stage index.
 * @param {string} exerciseId - e.g. 'ex-1'
 * @param {number} stageIndex - 0–3
 * @returns {Function|null} React component or null
 */
export function getIllustration(exerciseId, stageIndex) {
  const exerciseIllustrations = illustrations[exerciseId];
  if (!exerciseIllustrations) return null;
  const Component = exerciseIllustrations[stageIndex];
  return Component || null;
}
