/**
 * Slow, continuous drift for the atmosphere's haze layers.
 *
 * Every channel (position, stretch, tilt, intensity) follows the sum of two
 * slow sine waves whose periods are picked at random on each load, so the
 * motion is smooth, never stops at a keyframe, and never visibly repeats.
 * Only transform and opacity change, which the compositor handles cheaply.
 */

const FRAME_MS = 1000 / 30;

// Amplitudes are in vw/vh (x/y), fractions (sx/sy), degrees (rot); op is [min, max] opacity.
const MOTION = {
  glow: { x: 8, y: 4.5, sx: 0.08, sy: 0.06, rot: 0, baseRot: 0, op: [0.72, 1], period: [22, 44] },
  arc: { x: 8, y: 4.5, sx: 0.08, sy: 0.06, rot: 1.6, baseRot: -2, op: [0.78, 1], period: [18, 36] },
  veil: { x: 11, y: 6, sx: 0.1, sy: 0.08, rot: 2, baseRot: 1.5, op: [0.45, 1], period: [15, 30] },
  warmth: { x: 7, y: 6, sx: 0.1, sy: 0.08, rot: 0, baseRot: 0, op: [0.65, 1], period: [28, 56] },
};

const TAU = Math.PI * 2;
const rand = (min, max) => min + Math.random() * (max - min);

/** A smooth value in [-1, 1] built from two incommensurate slow waves. */
function makeWave([minPeriod, maxPeriod]) {
  const p1 = rand(minPeriod, maxPeriod);
  const p2 = rand(minPeriod, maxPeriod) * 1.618;
  const a = rand(0, TAU);
  const b = rand(0, TAU);
  return t => 0.62 * Math.sin((TAU * t) / p1 + a) + 0.38 * Math.sin((TAU * t) / p2 + b);
}

function makeChannels(config) {
  return {
    x: makeWave(config.period),
    y: makeWave(config.period),
    sx: makeWave(config.period),
    sy: makeWave(config.period),
    rot: makeWave(config.period),
    op: makeWave(config.period),
  };
}

/**
 * Drift the given haze elements, keyed by name ('glow' | 'arc' | 'veil' | 'warmth').
 * `light` is updated each frame with the arc's offset (in viewport fractions)
 * so the dust can brighten where the light currently is.
 * Returns a function that stops and restores the static layout.
 */
export function startHazeDrift(elements, light) {
  const layers = Object.entries(elements)
    .filter(([name, el]) => el && MOTION[name])
    .map(([name, el]) => ({ name, el, config: MOTION[name], wave: makeChannels(MOTION[name]) }));

  // Start at a random point in the motion so every visit looks slightly different.
  const offset = rand(0, 600);
  let frame = 0;
  let last = 0;

  function apply(t) {
    for (const { name, el, config, wave } of layers) {
      const x = config.x * wave.x(t);
      const y = config.y * wave.y(t);
      const sx = 1 + config.sx * wave.sx(t);
      const sy = 1 + config.sy * wave.sy(t);
      const rot = config.baseRot + config.rot * wave.rot(t);
      const [lo, hi] = config.op;
      const opacity = lo + (hi - lo) * (0.5 + 0.5 * wave.op(t));

      el.style.transform = `translate3d(${x.toFixed(3)}vw, ${y.toFixed(3)}vh, 0) rotate(${rot.toFixed(3)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      el.style.opacity = opacity.toFixed(3);

      if (name === 'arc' && light) {
        light.x = x / 100;
        light.y = y / 100;
      }
    }
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (now - last < FRAME_MS) return;
    last = now;
    apply(offset + now / 1000);
  }

  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    for (const { el } of layers) {
      el.style.transform = '';
      el.style.opacity = '';
    }
    if (light) {
      light.x = 0;
      light.y = 0;
    }
  };
}
