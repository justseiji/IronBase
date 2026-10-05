# AI Usage

IronBase was built with AI assistance. This file is my account of how: what I asked for, what I kept, where the AI got it wrong, and which parts are my own.

**Tools used**
- **Google Gemini 3.1 Pro (High)**, as an agentic coding assistant in week 1 and the start of week 2: React components, layouts, charts, bug fixes, the PGlite + Express/PostgreSQL rebuild, and some documentation.
- **Claude Code (Anthropic)**, as an agentic coding assistant from week 2 on: accounts and multi-device sync, deployment, password reset, the UI/motion redesign, form guides and documentation.

**Roughly how much:** most of the code was written by AI working from my designs and instructions. The parts that are mine are listed in section 3.

---

## 1. How I used AI

### Entry 1: Initial build from my design
- **Date / tool:** 2026-09-23, Gemini 3.1 Pro
- **What I asked for:** Build the first version of IronBase from my wireframes and design system: React + Vite, CSS Modules, an atoms/molecules/organisms component structure, and the four screens (Dashboard, Workout Log, Exercise History, Workout History).
- **What it gave back:** A working Vite app with the four screens, `localStorage` storage with seeded exercises, and a header nav that becomes a bottom nav on phones.
- **What I kept / changed and why:** I kept the structure because it matched my component plan. I set the `:root` design tokens myself (section 3.1) so every component uses my palette and 8px spacing instead of the values the AI chose.
- **Commit:** [`092904e`](https://github.com/justseiji/IronBase/commit/092904e)

### Entry 2: Charts, e1RM and PRs
- **Date / tool:** 2026-09-23, Gemini 3.1 Pro
- **What I asked for:** Progress charts with Recharts, estimated 1RM, personal-record detection, tighter Apple-like spacing and a reduced-motion setting. Then a mobile header fix, a dashboard heatmap with training insights, and better Exercise History empty states.
- **What it gave back:** The chart components, PR detection, the heatmap and the layout fixes.
- **What I kept / changed and why:** I kept the chart and PR code. I wrote the e1RM formula myself (section 3.2) so a single rep returns the weight as-is instead of being inflated by Epley.
- **Commits:** [`97361a5`](https://github.com/justseiji/IronBase/commit/97361a5), [`a9ec27e`](https://github.com/justseiji/IronBase/commit/a9ec27e), [`05f5107`](https://github.com/justseiji/IronBase/commit/05f5107), [`275f9b6`](https://github.com/justseiji/IronBase/commit/275f9b6)

### Entry 3: Floating-point weights
- **Date / tool:** 2026-09-23, Gemini 3.1 Pro
- **What I asked for:** Fix weights showing up as numbers like `220.00000000000003`.
- **What it gave back:** A shared `cleanNumber()` helper in `src/utils/numbers.js`, used in each component that shows a weight.
- **What I kept / changed and why:** I kept the helper, but the first fix didn't cover every place, so it took three commits (see section 2, mistake 1).
- **Commits:** [`e412bb6`](https://github.com/justseiji/IronBase/commit/e412bb6), [`6bad709`](https://github.com/justseiji/IronBase/commit/6bad709), [`2a84d6d`](https://github.com/justseiji/IronBase/commit/2a84d6d)

### Entry 4: Exercise form guide
- **Date / tool:** 2026-09-24, Gemini 3.1 Pro
- **What I asked for:** A form guide for the main lifts: a bottom sheet on phones and a modal on desktop.
- **What it gave back:** At first, inline SVG illustrations of each stage of the lift.
- **What I kept / changed and why:** I swapped the illustrations for real photos with short cues, because photos show correct form more clearly, then add Overhead Press and Barbell Row with matching photos.
- **Commits:** [`cf3d936`](https://github.com/justseiji/IronBase/commit/cf3d936), [`b1f4a7f`](https://github.com/justseiji/IronBase/commit/b1f4a7f), [`b732729`](https://github.com/justseiji/IronBase/commit/b732729)

### Entry 5: Real database, API and sync engine
- **Date / tool:** 2026-09-27, Gemini 3.1 Pro
- **What I asked for:** Move off `localStorage` in planned phases: shared services first, then a PGlite local database with migrations, a repository layer, an Express + PostgreSQL REST API, and a sync queue with retries.
- **What it gave back:** Ten phase commits, one for each step of the plan.
- **What I kept / changed and why:** I had it work one phase per commit so I could check each step before moving on. I kept the architecture (local-first, then sync to Postgres). Phase 10 removed the old `localStorage` code once nothing used it.
- **Commits:** [`1b404b9`](https://github.com/justseiji/IronBase/commit/1b404b9), [`9309be7`](https://github.com/justseiji/IronBase/commit/9309be7), [`540c151`](https://github.com/justseiji/IronBase/commit/540c151), [`e8bf358`](https://github.com/justseiji/IronBase/commit/e8bf358), [`23613ed`](https://github.com/justseiji/IronBase/commit/23613ed), [`f299b28`](https://github.com/justseiji/IronBase/commit/f299b28), [`07dfde4`](https://github.com/justseiji/IronBase/commit/07dfde4), [`860e1f6`](https://github.com/justseiji/IronBase/commit/860e1f6), [`618998e`](https://github.com/justseiji/IronBase/commit/618998e)

### Entry 6: Accounts, multi-device sync and the UI redesign
- **Date / tool:** 2026-09-27, Claude Code
- **What I asked for:** Real accounts (email, username, password) on a single `/auth` screen, every workout tied to its owner, sync between devices, and a motion pass over every screen that keeps my visual identity.
- **What it gave back:** `server/auth.js` (scrypt hashing, HttpOnly session cookies, rate limiting), ownership checks on every workout query, one local PGlite database per account, and a shared motion system. It also found and fixed sync bugs in the earlier code, and noticed that `.env` files weren't in `.gitignore`.
- **What I kept / changed and why:** I kept all of it. I asked for sign-in and sign-up to be two states of one screen instead of new routes, so the app still has my screen map. The redesign had to keep my core tokens, and it did (section 3.1).
- **Commit:** [`5d11f68`](https://github.com/justseiji/IronBase/commit/5d11f68)

### Entry 7: Deployment and password reset
- **Date / tool:** 2026-09-28, Claude Code
- **What I asked for:** Deploy the app (frontend on Vercel, API on Render) and add password reset by email.
- **What it gave back:** A Vercel rewrite so `/api` stays on the same origin (the session cookie has to be first-party for iOS Safari), and reset links that are single-use, expire after 30 minutes and are stored only as a hash.
- **What I kept / changed and why:** I kept the design, but two parts broke in production and had to be redone (section 2, mistakes 2 and 3).
- **Commits:** [`f1de9c5`](https://github.com/justseiji/IronBase/commit/f1de9c5), [`673def6`](https://github.com/justseiji/IronBase/commit/673def6), [`a5693ec`](https://github.com/justseiji/IronBase/commit/a5693ec), [`1be1333`](https://github.com/justseiji/IronBase/commit/1be1333), [`8190cb9`](https://github.com/justseiji/IronBase/commit/8190cb9)

### Entry 8: Background haze and dust
- **Date / tool:** 2026-09-28, Claude Code
- **What I asked for:** An atmospheric background behind every screen, using my existing colours.
- **What it gave back:** A haze and a canvas of dust particles built from `--color-text` and `--color-accent` at low opacity, frozen when reduced motion is on.
- **What I kept / changed and why:** The first version moved so slowly it looked static, so I asked for visible drift and easier-to-see dust.
- **Commits:** [`bdbf0b7`](https://github.com/justseiji/IronBase/commit/bdbf0b7), [`9f7772c`](https://github.com/justseiji/IronBase/commit/9f7772c)

### Entry 9: Animated form guides
- **Date / tool:** 2026-09-28 to 2026-09-29, Claude Code
- **What I asked for:** Form guides that show how a lift moves, not one still photo.
- **What it gave back:** Animations built with hand-written inverse kinematics for each lift.
- **What I kept / changed and why:** I replaced them the next day. Every new exercise would have needed its own pose maths, so the guides now load start and end frames from the public-domain free-exercise-db dataset, and adding an exercise takes two images and one data entry.
- **Commits:** [`0ed47a9`](https://github.com/justseiji/IronBase/commit/0ed47a9), [`08a26fc`](https://github.com/justseiji/IronBase/commit/08a26fc), [`5bd69ef`](https://github.com/justseiji/IronBase/commit/5bd69ef)

### Entry 10: Documentation and repository tidy-up
- **Date / tool:** 2026-10-04, Claude Code
- **What I asked for:** Move course documents into `docs/`, fix the favicon, update the README and add screenshots of every screen.
- **What it gave back:** The `docs/` folder, the favicon, the README update and 32 screenshots.
- **What I kept / changed and why:** I kept it, and wrote up my own design and e1RM code in this file (section 3).
- **Commits:** [`556928b`](https://github.com/justseiji/IronBase/commit/556928b), [`1861cd4`](https://github.com/justseiji/IronBase/commit/1861cd4), [`0c1bbb9`](https://github.com/justseiji/IronBase/commit/0c1bbb9)

---

## 2. Where the AI got it wrong

### Mistake 1: Patching floating-point symptoms instead of the cause
- **What it gave me:** Gemini's first fix wrapped weights in `cleanNumber()` wherever they were displayed, one component at a time.
- **What was wrong:** It treated the symptom, so I kept finding missed spots. Even after a second round, the progress chart still showed long decimals on its axis because Recharts generates its own Y-axis ticks and domain from the raw data, which the AI's fix never touched.
- **What I did instead:** I pushed it to find the root cause. The fix cleans the chart data before it reaches Recharts and adds a `tickFormatter` and a cleaned domain to the Y axis.
- **Commits:** wrong: [`e412bb6`](https://github.com/justseiji/IronBase/commit/e412bb6), [`6bad709`](https://github.com/justseiji/IronBase/commit/6bad709); fixed: [`2a84d6d`](https://github.com/justseiji/IronBase/commit/2a84d6d)

### Mistake 2: Sending email over SMTP on a host that blocks it
- **What it gave me:** Password reset emails sent with nodemailer over SMTP to `smtp.gmail.com`.
- **What was wrong:** It worked locally but timed out in production, because Render's free tier blocks outbound SMTP ports. The AI didn't check that against where the API was deployed.
- **What I did instead:** I switched to the Gmail API over HTTPS with a send-only OAuth token and plain `fetch`, and removed nodemailer completely.
- **Commits:** wrong: [`673def6`](https://github.com/justseiji/IronBase/commit/673def6); fixed: [`8190cb9`](https://github.com/justseiji/IronBase/commit/8190cb9)

### Mistake 3: `TRUST_PROXY=1` trusted no proxies
- **What it gave me:** `app.set('trust proxy', process.env.TRUST_PROXY)`.
- **What was wrong:** Environment variables are always strings, and Express treats a string as a list of trusted IP addresses, not a hop count. So `"1"` trusted nothing, every visitor looked like Render's internal `::1`, and everyone shared one login rate-limit bucket. One person failing to log in could lock everyone else out.
- **What I did instead:** I added a temporary endpoint to see the real forwarded IPs, found the request passes through four proxies (Vercel, then Cloudflare, then Render), and changed the code to pass digit-only values as a number. Then I removed the debug endpoint so it couldn't leak IP information.
- **Commits:** debug: [`a5693ec`](https://github.com/justseiji/IronBase/commit/a5693ec); fixed: [`1be1333`](https://github.com/justseiji/IronBase/commit/1be1333)

---

## 3. Who wrote what

These are the parts of IronBase that are mine. AI built on top of them, but the decisions and the code below came from me.

### 3.1 Mine: the frontend design system
I designed IronBase's look before any screens were built, in two course documents:
- [`docs/wireframes.md`](docs/wireframes.md): the screen map (Dashboard as home base, Workout Log, Exercise History, Workout History), one box sketch per screen for desktop and phone, and the navigation rule. The header nav becomes a bottom nav on phones, and it always has the same four destinations.
- [`docs/design-system.pdf`](docs/design-system.pdf): the colour tokens, type scale, 8px spacing rule, reusable components (atoms, molecules, organisms), responsive plan and accessibility checks.

In code, the design system lives as CSS custom properties in `:root` of [`src/index.css`](src/index.css). Every CSS Module uses these through `var(--…)` instead of hard-coding values:

```css
:root {
  --color-bg: #0F1113;       /* soft-black background */
  --color-surface: #1A1D20;  /* charcoal panels */
  --color-text: #EEE8DF;     /* warm off-white text */
  --color-primary: #7F1D1D;  /* deep red: the main workout action */
  --color-accent: #A68B6B;   /* muted earthy detail */

  --space-1: 8px;            /* everything is a multiple of 8px */
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;

  --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --radius: 10px;
  --radius-sm: 6px;
}
```

Why I made these choices:
- **Dark, warm palette.** Gyms are often dim, and people check the app between sets. A soft-black background with warm off-white text is easy on the eyes. I avoided pure black and white so it doesn't feel harsh.
- **One strong colour for one job.** Deep red (`--color-primary`) is only for the main action, such as **Log Workout**, so you can always find it at a glance. The earthy accent is for small details and labels.
- **Contrast checked, not guessed.** I measured the colour pairs in the design system: text on surface is 13.90:1, text on red is 8.23:1, and the accent on the background is 5.88:1. All of them pass the 4.5:1 minimum.
- **8px spacing scale.** Gaps, margins and padding all come from one 8px scale, so every screen lines up the same way.
- **Mobile first.** Below 768px everything stacks into one column and navigation moves to the bottom bar. Touch targets are at least 44px so they're easy to hit with a sweaty thumb. At 768px and above the horizontal header returns and the Dashboard and Exercise History use two columns. At 375px nothing scrolls sideways.
- **Atomic components.** I planned the UI as atoms (Button, form inputs), molecules (ExerciseSelector, LoggedSetRow) and organisms (HeaderNav, MobileBottomNav), so each piece is built once and reused. That is how `src/components/` is organised.

#### How the design grew: my base first, then Claude built on it
I made the design base. Claude Code came in later and took it further, but it built *on* my foundation instead of replacing it. You can check every step in the git history:

| When | Who | What | Commit |
| --- | --- | --- | --- |
| Before any code | Me | Wireframes and design system (M6A2, M6A3): palette, type scale, spacing rule, component plan, responsive and accessibility rules | in [`092904e`](https://github.com/justseiji/IronBase/commit/092904e) (`docs/`) |
| 2026-09-23 | Me (Gemini helped write some component code) | First build from that design: the `:root` tokens, the atoms/molecules/organisms structure, CSS Modules, desktop header that becomes a phone bottom nav | [`092904e`](https://github.com/justseiji/IronBase/commit/092904e) |
| 2026-09-23 | Me (with Gemini) | Week 1 polish: charts, e1RM and PRs, Apple-like spacing, reduced-motion support, mobile header fix; added the positive/negative colours and larger spacing steps | [`97361a5`](https://github.com/justseiji/IronBase/commit/97361a5), [`a9ec27e`](https://github.com/justseiji/IronBase/commit/a9ec27e), [`275f9b6`](https://github.com/justseiji/IronBase/commit/275f9b6) |
| 2026-09-27 | Claude Code | Enhanced the UI: a motion system (`--motion-*`, `--ease-*`, `--stagger-step`, `--press-scale`), extra shades (`--color-surface-raised`, `--color-accent-soft`, hairlines, `--color-text-faint`), animated numbers, route transitions, the new sign-in screen, and a refresh of all screens | [`5d11f68`](https://github.com/justseiji/IronBase/commit/5d11f68) |
| 2026-09-28 | Claude Code | Atmospheric haze and floating dust behind every screen | [`bdbf0b7`](https://github.com/justseiji/IronBase/commit/bdbf0b7), [`9f7772c`](https://github.com/justseiji/IronBase/commit/9f7772c) |

Claude's enhancements kept my design base intact. Compare `src/index.css` in [`092904e`](https://github.com/justseiji/IronBase/commit/092904e) with today: my core colours (`--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, `--color-accent`), the 8px spacing scale, the font and the corner radii still have the same values. Every new screen Claude made, including the sign-in page, uses my tokens and component structure. So the look you see is still my design, with motion and atmosphere layered on top.

To be clear about what isn't mine: the motion system, the extra shades listed above, the animations and the haze/dust background were added by Claude Code.

### 3.2 Mine: the estimated 1-rep max (e1RM) calculation
[`src/services/e1rmService.js`](src/services/e1rmService.js). First written in [`97361a5`](https://github.com/justseiji/IronBase/commit/97361a5), moved into its own service file in [`1b404b9`](https://github.com/justseiji/IronBase/commit/1b404b9).

```js
export function calcE1RM(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}
```

How it works, line by line:
- **The idea.** Lifters rarely test a true one-rep max, but a heavy set of several reps tells you roughly what you could lift once. I used the **Epley formula**, `weight × (1 + reps / 30)`. It is simple, widely used and accurate enough for sets of up to about 10 reps.
- **Line 1, guard against bad input.** Zero or negative reps or weight can't produce a meaningful estimate, so it returns `0` instead of a misleading number. An empty set doesn't show up as a fake PR.
- **Line 2, a single rep is the real thing.** If you did 1 rep, that *is* your one-rep max, so it returns the weight unchanged. Without this line, Epley would add about 3% (225 lbs × 1.033 ≈ 232 lbs), which would overstate it.
- **Line 3, the formula.** For example, 225 lbs × 5 reps = 225 × (1 + 5/30) = 262.5, rounded to **263 lbs**. I round to a whole number because that's how lifters talk about maxes, and it avoids long floating-point decimals on screen.

Where it's used:
- `computeSessionMetrics` in `src/services/analyticsService.js` takes the best e1RM of each session. It powers the **Est. 1RM** view of the progress chart on the Dashboard and Exercise History, and the e1RM change between your latest and previous session.
- `src/pages/ExerciseHistoryPage/ExerciseHistoryPage.jsx` shows your best estimated 1RM for an exercise in its personal records.

Having one function means both places always agree on the number.

### 3.3 The AI-written code I understand best: password hashing in `server/auth.js`
Claude Code wrote this in [`5d11f68`](https://github.com/justseiji/IronBase/commit/5d11f68). I kept it as written because each line protects against a specific attack.

```js
async function derive(password, salt, N, r, p) {
  return scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { N, r, p, maxmem: 64 * 1024 * 1024 });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password, stored) {
  const parts = typeof stored === 'string' ? stored.split('$') : [];
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await derive(password, Buffer.from(saltB64, 'base64'), Number(N), Number(r), Number(p));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
```

What it does and why:
- **scrypt, not a fast hash.** SHA-256 can be computed billions of times a second, so a leaked database could be cracked quickly. scrypt is deliberately slow and memory-hungry, which makes every guess expensive. It is built into Node, so there is no extra dependency.
- **`normalize('NFKC')`.** The same password can be typed as different Unicode byte sequences (for example an accented letter as one character or as two). Normalizing first means the same password always gives the same hash.
- **A random 16-byte salt for every password.** Two users with the same password get different hashes, so one precomputed table can't crack every account at once.
- **The parameters are stored inside the hash** (`scrypt$N$r$p$salt$key`). `verifyPassword` reads N, r and p from the stored string, not from the current constants, so I can raise the cost later and old passwords still verify.
- **`timingSafeEqual`.** A normal `===` stops at the first byte that differs, so response time leaks how much of the hash matched. This comparison always takes the same time. The length check comes first because `timingSafeEqual` throws if the lengths differ.
- **Fails closed.** A missing or badly formatted stored value returns `false` instead of throwing or letting someone in.
- **The dummy hash.** At sign-in, if the account doesn't exist, the code still runs `verifyPassword` against `DUMMY_HASH_PROMISE` and then returns `false`. Without this, unknown accounts would answer much faster than real ones, and an attacker could time the responses to work out which emails are registered.
