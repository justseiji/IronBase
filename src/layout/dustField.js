/**
 * Dust suspended in the background haze, drawn on a single canvas.
 *
 * Motes live on three depth layers (far, mid, near): nearer ones are larger,
 * brighter, faster, and rarer. Each wanders on its own slowly-changing
 * heading, lives for a random span, fades in and out, and gently shimmers,
 * so no two move together and nothing loops. Motes gather loosely around a
 * few slowly drifting pockets rather than spreading evenly, and they catch
 * the light where the haze currently is.
 */

const FRAME_MS = 1000 / 30; // Dust moves a few px/s; 30fps is indistinguishable and halves the work.
const AREA_PER_MOTE = 15000; // px² of viewport per mote
const MIN_MOTES = 20;
const MAX_MOTES = 90;
const POCKETS = 4;

const TAU = Math.PI * 2;
const rand = (min, max) => min + Math.random() * (max - min);

// Each layer: share of motes, radius, peak alpha, speed (px/s).
const LAYERS = [
  { name: 'far', share: 0.68, radius: [0.5, 0.85], alpha: [0.16, 0.3], speed: [2, 5] },
  { name: 'mid', share: 0.28, radius: [0.85, 1.35], alpha: [0.3, 0.48], speed: [5, 9] },
  { name: 'near', share: 0.04, radius: [1.5, 2.3], alpha: [0.34, 0.48], speed: [8, 13] },
];

function moteCount(width, height) {
  let n = Math.round((width * height) / AREA_PER_MOTE);
  // Lighter on low-powered devices or when the user asked to save data.
  if ((navigator.hardwareConcurrency || 8) <= 4 || navigator.connection?.saveData) n = Math.round(n * 0.7);
  return Math.max(MIN_MOTES, Math.min(MAX_MOTES, n));
}

/**
 * How strongly the haze lights a point: dim in the dark, brightest on the
 * arc. `light` carries the arc's current drift (viewport fractions).
 */
function illumination(x, y, width, height, light) {
  const nx = x / width - light.x;
  const ny = y / height - light.y;
  const arcY = 0.16 + 1.3 * (nx - 0.5) * (nx - 0.5);
  const d = (ny - arcY) / 0.2;
  return 0.5 + 0.9 * Math.exp(-d * d);
}

function pickLayer() {
  let r = Math.random();
  for (const layer of LAYERS) {
    if (r < layer.share) return layer;
    r -= layer.share;
  }
  return LAYERS[0];
}

/** A few loose, slowly drifting pockets where dust gathers, mostly in the lit upper area. */
function makePockets() {
  return Array.from({ length: POCKETS }, () => ({
    x: rand(0.1, 0.9),
    y: rand(0.08, 0.65),
    spread: rand(0.1, 0.2),
    driftX: rand(0.04, 0.1), driftY: rand(0.03, 0.07),
    periodX: rand(60, 140), periodY: rand(60, 140),
    phase: rand(0, TAU),
  }));
}

function pocketCenter(p, clock) {
  return {
    x: p.x + p.driftX * Math.sin((TAU * clock) / p.periodX + p.phase),
    y: p.y + p.driftY * Math.sin((TAU * clock) / p.periodY + p.phase * 1.7),
  };
}

function gaussian() {
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(TAU * Math.random());
}

function spawn(width, height, pockets, clock, fresh) {
  let x;
  let y;
  // Most motes start near a pocket; the rest anywhere, so no area is ever strictly empty.
  if (Math.random() < 0.6) {
    const p = pockets[Math.floor(Math.random() * pockets.length)];
    const c = pocketCenter(p, clock);
    const spread = p.spread * Math.min(width, height);
    x = c.x * width + gaussian() * spread * 1.4;
    y = c.y * height + gaussian() * spread;
  } else {
    x = rand(0, width);
    y = rand(0, height);
  }

  const layer = pickLayer();
  const life = rand(14, 40);
  return {
    x: Math.min(Math.max(x, 0), width),
    y: Math.min(Math.max(y, 0), height),
    near: layer.name === 'near',
    radius: rand(...layer.radius),
    alpha: rand(...layer.alpha),
    speed: rand(...layer.speed),
    heading: rand(0, TAU),
    wanderA: rand(0.4, 1.2), wanderFreqA: rand(0.02, 0.07), wanderPhaseA: rand(0, TAU),
    wanderB: rand(0.2, 0.6), wanderFreqB: rand(0.08, 0.17), wanderPhaseB: rand(0, TAU),
    // A slow shimmer, as if the mote turns in the light.
    shimmerFreq: rand(0.05, 0.22), shimmerPhase: rand(0, TAU), shimmerDepth: rand(0.15, 0.45),
    life,
    // Start existing motes partway through their lives so they don't all fade in together.
    age: fresh ? 0 : rand(0, life),
  };
}

function readDustColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim();
  const match = /^#?([0-9a-f]{6})$/i.exec(value);
  if (!match) return '238, 232, 223';
  const int = parseInt(match[1], 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}

/**
 * Start drawing dust into `canvas`. With `animate: false`, draws a single
 * still frame (reduced motion) and never schedules another. `light` is the
 * haze's current offset, shared with the haze drift.
 * Returns a function that stops and cleans up.
 */
export function startDustField(canvas, { animate = true, light = { x: 0, y: 0 } } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const rgb = readDustColor();
  const pockets = makePockets();
  let width = 0;
  let height = 0;
  let motes = [];
  let frame = 0;
  let last = 0;
  let clock = rand(0, 1000);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;

    // Keep existing motes where they were, proportionally.
    if (width && height) {
      for (const m of motes) {
        m.x *= nextWidth / width;
        m.y *= nextHeight / height;
      }
    }
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = moteCount(width, height);
    while (motes.length < target) motes.push(spawn(width, height, pockets, clock, false));
    if (motes.length > target) motes.length = target;
  }

  function step(dt) {
    clock += dt;
    const margin = 20;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.age += dt;
      if (m.age >= m.life) {
        motes[i] = spawn(width, height, pockets, clock, true);
        continue;
      }
      const heading = m.heading
        + m.wanderA * Math.sin(clock * m.wanderFreqA + m.wanderPhaseA)
        + m.wanderB * Math.sin(clock * m.wanderFreqB + m.wanderPhaseB);
      m.x += Math.cos(heading) * m.speed * dt;
      m.y += Math.sin(heading) * m.speed * dt;

      if (m.x < -margin) m.x = width + margin;
      else if (m.x > width + margin) m.x = -margin;
      if (m.y < -margin) m.y = height + margin;
      else if (m.y > height + margin) m.y = -margin;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const m of motes) {
      // Smooth fade in over the first fifth of life and out over the last quarter.
      const t = m.age / m.life;
      const fade = t < 0.2 ? t / 0.2 : t > 0.75 ? (1 - t) / 0.25 : 1;
      const eased = fade * fade * (3 - 2 * fade);
      const shimmer = 1 - m.shimmerDepth * (0.5 + 0.5 * Math.sin(TAU * m.shimmerFreq * clock + m.shimmerPhase));
      const a = Math.min(0.65, m.alpha * eased * shimmer * illumination(m.x, m.y, width, height, light));
      if (a < 0.004) continue;

      // Near motes are slightly out of focus: a faint halo around a soft core.
      if (m.near) {
        ctx.fillStyle = `rgba(${rgb}, ${(a * 0.2).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius * 2.4, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${rgb}, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, TAU);
      ctx.fill();
    }
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (now - last < FRAME_MS) return;
    // Cap the step so returning to a background tab doesn't teleport every mote.
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    step(dt);
    draw();
  }

  let resizeFrame = 0;
  function onResize() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resize();
      if (!animate) draw();
    });
  }

  resize();
  window.addEventListener('resize', onResize);
  if (animate) frame = requestAnimationFrame(tick);
  else draw();

  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(resizeFrame);
    window.removeEventListener('resize', onResize);
  };
}
