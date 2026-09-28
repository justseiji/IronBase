/**
 * Side-view movement models for the form guides.
 *
 * Each movement turns a single progress value p (0 → 1) into a pose. Poses
 * are built from fixed segment lengths with forward and two-bone inverse
 * kinematics, so limbs never stretch or bend unnaturally, and each lift's
 * technique constraints (bar over mid-foot, vertical bar path, J-curve) are
 * solved for rather than hand-placed. The figure faces right (+x); y points
 * down, and the floor is at y = GROUND.
 *
 * A movement's `phases` walk through its four instructional steps and end
 * where they began, so the loop is the natural return, not a jump.
 */

export const GROUND = 196;
export const PLATE_R = 21;

// Proportions of a ~175 cm lifter (1 unit ≈ 1 cm).
const ANKLE_H = 6;
const SHIN = 41;
const THIGH = 42;
const TORSO = 48;
const NECK = 6;
export const HEAD_R = 10;
const UPPER_ARM = 30;
const FOREARM = 36; // elbow to the centre of the grip
const ARM = UPPER_ARM + FOREARM;

const ANKLE = { x: 150, y: GROUND - ANKLE_H };
const MIDFOOT_X = ANKLE.x + 6;

// ─── Geometry helpers ───

const rad = deg => (deg * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (lo, hi, v) => {
  const t = clamp((v - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};
const add = (p, q) => ({ x: p.x + q.x, y: p.y + q.y });
const scale = (p, s) => ({ x: p.x * s, y: p.y * s });
const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
const len = p => Math.hypot(p.x, p.y);

/** A vector of length `l` at `deg` degrees from straight up, positive toward +x. */
const polar = (l, deg) => ({ x: l * Math.sin(rad(deg)), y: -l * Math.cos(rad(deg)) });

/**
 * Two-bone IK: the middle joint for bones l1, l2 from `root` toward `target`.
 * `side` (+1/−1) picks which side of the root→target line the joint bends to.
 * Returns the joint and the reachable end point.
 */
function twoBone(root, target, l1, l2, side) {
  const v = sub(target, root);
  const dist = len(v) || 0.001;
  const u = scale(v, 1 / dist);
  const d = clamp(dist, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const perp = { x: -u.y, y: u.x };
  return {
    joint: add(add(root, scale(u, a)), scale(perp, h * side)),
    end: add(root, scale(u, d)),
  };
}

/** Find x in [lo, hi] where the increasing function f crosses 0. */
function solve(f, lo, hi) {
  if (f(lo) >= 0) return lo;
  if (f(hi) <= 0) return hi;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function headFrom(shoulder, deg, forward = 0) {
  return add(add(shoulder, polar(NECK + HEAD_R, deg)), polar(forward, deg + 90));
}

function standingLegs(shinDeg, thighDeg) {
  const knee = add(ANKLE, polar(SHIN, shinDeg));
  const hip = add(knee, polar(THIGH, -thighDeg));
  return { knee, hip };
}

function footFrom(ankle) {
  return { heel: { x: ankle.x - 6, y: GROUND }, toe: { x: ankle.x + 21, y: GROUND } };
}

// ─── Movements ───

/** Back squat: knees and hips bend together; torso lean keeps the bar over mid-foot. */
function squatPose(p) {
  const { knee, hip } = standingLegs(lerp(4, 38, p), lerp(4, 102, p));
  const barFor = a => add(add(hip, polar(TORSO, a)), polar(6, a - 90));
  const lean = solve(a => barFor(a).x - MIDFOOT_X, 0, 70);
  const shoulder = add(hip, polar(TORSO, lean));
  const bar = barFor(lean);
  // A wide grip foreshortens the arms in side view.
  const arm = twoBone(shoulder, bar, 20, 18, -1);
  return {
    ankle: ANKLE, ...footFrom(ANKLE), knee, hip, shoulder,
    head: headFrom(shoulder, lean * 0.55, 2),
    elbow: arm.joint, hand: arm.end, bar,
  };
}

/** Conventional deadlift: bar travels straight up over mid-foot; knees extend first, then hips. */
function deadliftPose(p) {
  const top = standingLegs(0, 0);
  const lockoutY = top.hip.y - TORSO + ARM * 0.99;
  const bar = { x: MIDFOOT_X, y: lerp(GROUND - PLATE_R, lockoutY, p) };
  const knee = add(ANKLE, polar(SHIN, 20 * (1 - smooth(0, 0.55, p))));
  // Shoulders start slightly ahead of the bar and finish stacked over it.
  const shoulder = add(bar, polar(ARM * 0.99, lerp(10, 0, smooth(0.1, 1, p))));
  const hip = twoBone(knee, shoulder, THIGH, TORSO, -1).joint;
  const lean = Math.atan2(shoulder.x - hip.x, hip.y - shoulder.y) * (180 / Math.PI);
  const arm = twoBone(shoulder, bar, UPPER_ARM, FOREARM, -1);
  return {
    ankle: ANKLE, ...footFrom(ANKLE), knee, hip, shoulder,
    head: headFrom(shoulder, lean * 0.7, 1),
    elbow: arm.joint, hand: arm.end, bar,
  };
}

/** Bent-over row: fixed hip hinge with shoulders over the bar; the bar rows to the lower ribs. */
function rowPose(p) {
  const shin = 6;
  const torso = 45; // degrees forward from vertical
  const knee = add(ANKLE, polar(SHIN, shin));
  const hipFor = t => add(knee, polar(THIGH, -t));
  const thigh = solve(t => (MIDFOOT_X + 2) - (hipFor(t).x + TORSO * Math.sin(rad(torso))), 0, 90);
  const hip = hipFor(thigh);
  const shoulder = add(hip, polar(TORSO, torso));
  const hang = { x: shoulder.x, y: shoulder.y + ARM * 0.99 };
  const ribs = add(add(hip, polar(TORSO * 0.5, torso)), polar(10, torso + 90));
  const t = p;
  // Slight backward arc: the bar sweeps toward the hips as it rises.
  const bar = { x: lerp(hang.x, ribs.x, t) - 5 * Math.sin(Math.PI * t), y: lerp(hang.y, ribs.y, t) };
  const arm = twoBone(shoulder, bar, UPPER_ARM, FOREARM, 1);
  return {
    ankle: ANKLE, ...footFrom(ANKLE), knee, hip, shoulder,
    head: headFrom(shoulder, torso + 20, 0),
    elbow: arm.joint, hand: arm.end, bar,
  };
}

/** Standing overhead press: straight bar path; the head moves back to clear it, then through. */
function overheadPose(p) {
  const { knee, hip } = standingLegs(0, 0);
  const lean = -2;
  const shoulder = add(hip, polar(TORSO, lean));
  const rack = { x: shoulder.x + 14, y: shoulder.y - 3 };
  const lockout = { x: shoulder.x + 1, y: shoulder.y - ARM * 0.985 };
  const bar = {
    x: lerp(rack.x, lockout.x, smooth(0.3, 1, p)),
    y: lerp(rack.y, lockout.y, p),
  };
  const headShift = -7 * Math.sin(Math.PI * clamp(p / 0.62, 0, 1)) + 3 * smooth(0.7, 1, p);
  const arm = twoBone(shoulder, bar, UPPER_ARM, FOREARM, 1);
  return {
    ankle: ANKLE, ...footFrom(ANKLE), knee, hip, shoulder,
    head: add(headFrom(shoulder, lean, 1), { x: headShift, y: 0 }),
    elbow: arm.joint, hand: arm.end, bar,
  };
}

const BENCH = { top: 141, left: 64, right: 196 };

/** Bench press: lying, feet planted; the bar lowers in a slight J-curve to the lower chest. */
function benchPose(p) {
  const shoulder = { x: 104, y: BENCH.top - 9 };
  const hip = add(shoulder, polar(TORSO, 93));
  const ankle = { x: hip.x + 38, y: GROUND - ANKLE_H };
  const knee = twoBone(hip, ankle, THIGH, SHIN, -1).joint;
  const lockout = { x: shoulder.x + 1, y: shoulder.y - ARM * 0.985 };
  const along = scale(sub(hip, shoulder), 1 / TORSO);
  const chest = add(add(shoulder, scale(along, 15)), { x: 0, y: -10 });
  const bar = { x: lerp(lockout.x, chest.x, p * p), y: lerp(lockout.y, chest.y, p) };
  const arm = twoBone(shoulder, bar, UPPER_ARM, FOREARM, 1);
  return {
    ankle, heel: { x: ankle.x - 6, y: GROUND }, toe: { x: ankle.x + 21, y: GROUND },
    knee, hip, shoulder,
    head: add(shoulder, scale(along, -(NECK + HEAD_R))),
    elbow: arm.joint, hand: arm.end, bar, bench: BENCH,
  };
}

/**
 * Timelines. `from`/`to` are progress values; equal values are a hold.
 * Each phase is one instructional step, and the last returns to the first.
 */
export const MOVEMENTS = {
  squat: {
    pose: squatPose,
    phases: [
      { from: 0, to: 0, ms: 1100 },
      { from: 0, to: 1, ms: 2300 },
      { from: 1, to: 1, ms: 700 },
      { from: 1, to: 0, ms: 1900 },
    ],
  },
  deadlift: {
    pose: deadliftPose,
    phases: [
      { from: 0, to: 0, ms: 1100 },
      { from: 0, to: 1, ms: 2200 },
      { from: 1, to: 1, ms: 800 },
      { from: 1, to: 0, ms: 2000 },
    ],
  },
  row: {
    pose: rowPose,
    phases: [
      { from: 0, to: 0, ms: 1000 },
      { from: 0, to: 1, ms: 1500 },
      { from: 1, to: 1, ms: 700 },
      { from: 1, to: 0, ms: 1700 },
    ],
  },
  overhead: {
    pose: overheadPose,
    phases: [
      { from: 0, to: 0, ms: 1000 },
      { from: 0, to: 1, ms: 2000 },
      { from: 1, to: 1, ms: 800 },
      { from: 1, to: 0, ms: 1900 },
    ],
  },
  bench: {
    pose: benchPose,
    phases: [
      { from: 0, to: 0, ms: 1000 },
      { from: 0, to: 1, ms: 2100 },
      { from: 1, to: 1, ms: 600 },
      { from: 1, to: 0, ms: 1700 },
    ],
  },
};

/** Gentle ease so each movement accelerates and settles like a controlled rep. */
export const easeInOut = t => 0.5 - 0.5 * Math.cos(Math.PI * t);

/** Where in the timeline a phase starts, in ms. */
export function phaseStart(phases, index) {
  return phases.slice(0, index).reduce((sum, ph) => sum + ph.ms, 0);
}

/**
 * A 4:3 view box that fits a movement's whole range of motion (body and
 * plate) with a little margin, so every lift fills the frame the same way.
 */
// Every lift is shown at roughly the same scale, however compact its motion.
const MIN_FRAME_H = 205;

export function frameFor(pose) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity;
  const take = (x, y) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y);
  };
  for (let i = 0; i <= 20; i++) {
    const b = pose(i / 20);
    for (const key of ['heel', 'toe', 'ankle', 'knee', 'hip', 'shoulder', 'elbow', 'hand']) take(b[key].x, b[key].y);
    take(b.head.x - HEAD_R, b.head.y - HEAD_R);
    take(b.head.x + HEAD_R, b.head.y);
    take(b.bar.x - PLATE_R, b.bar.y - PLATE_R);
    take(b.bar.x + PLATE_R, b.bar.y);
    if (b.bench) { take(b.bench.left, b.bench.top); take(b.bench.right, b.bench.top); }
  }
  const pad = 14;
  let x = minX - pad;
  let y = minY - pad;
  let w = maxX - minX + pad * 2;
  let h = Math.max(GROUND + 8 - y, MIN_FRAME_H);
  y = GROUND + 8 - h;
  // Grow the shorter side to reach 4:3, keeping the floor at the bottom.
  if (w / h < 4 / 3) {
    const nw = (h * 4) / 3;
    x -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = (w * 3) / 4;
    y -= nh - h;
    h = nh;
  }
  return { x, y, w, h };
}
