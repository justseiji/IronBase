/**
 * Sparse dust suspended in the background haze, drawn on a single canvas.
 *
 * Each mote wanders on its own slowly-changing heading, lives for a random
 * span, and fades in and out, so no two move together and nothing loops.
 * Motes are brighter where the haze is (the upper arc) and dimmer elsewhere.
 */

const FRAME_MS = 1000 / 30; // Dust moves a few px/s; 30fps is indistinguishable and halves the work.
const AREA_PER_MOTE = 26000; // px² of viewport per mote
const MIN_MOTES = 12;
const MAX_MOTES = 56;

const rand = (min, max) => min + Math.random() * (max - min);

function moteCount(width, height) {
  let n = Math.round((width * height) / AREA_PER_MOTE);
  // Lighter on low-powered devices or when the user asked to save data.
  if ((navigator.hardwareConcurrency || 8) <= 4 || navigator.connection?.saveData) n = Math.round(n * 0.7);
  return Math.max(MIN_MOTES, Math.min(MAX_MOTES, n));
}

/** How strongly the haze lights a point (0.35 in the dark, up to 1 on the arc). */
function illumination(x, y, width, height) {
  const nx = x / width;
  const ny = y / height;
  const arcY = 0.16 + 1.3 * (nx - 0.5) * (nx - 0.5);
  const d = (ny - arcY) / 0.2;
  return 0.35 + 0.65 * Math.exp(-d * d);
}

function spawn(width, height, fresh) {
  // Most motes are tiny and faint; a rare few are "nearer", larger and softer.
  const depth = Math.pow(Math.random(), 2.4);
  const life = rand(18, 55);
  return {
    x: rand(0, width),
    y: rand(0, height),
    depth,
    radius: 0.35 + depth * 1.15,
    alpha: 0.05 + Math.pow(Math.random(), 2) * 0.3 + depth * 0.08,
    speed: 1.5 + depth * 5 + Math.random() * 2, // px per second
    heading: rand(0, Math.PI * 2),
    wanderA: rand(0.4, 1.2), wanderFreqA: rand(0.02, 0.07), wanderPhaseA: rand(0, Math.PI * 2),
    wanderB: rand(0.2, 0.6), wanderFreqB: rand(0.08, 0.17), wanderPhaseB: rand(0, Math.PI * 2),
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
 * still frame (reduced motion) and never schedules another.
 * Returns a function that stops and cleans up.
 */
export function startDustField(canvas, { animate = true } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const rgb = readDustColor();
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
    while (motes.length < target) motes.push(spawn(width, height, false));
    if (motes.length > target) motes.length = target;
  }

  function step(dt) {
    clock += dt;
    const margin = 20;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.age += dt;
      if (m.age >= m.life) {
        motes[i] = spawn(width, height, true);
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
      const a = m.alpha * eased * illumination(m.x, m.y, width, height);
      if (a < 0.004) continue;

      // Nearer motes are slightly out of focus: a faint halo around a soft core.
      if (m.depth > 0.45) {
        ctx.fillStyle = `rgba(${rgb}, ${(a * 0.22).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${rgb}, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
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
