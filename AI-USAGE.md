# AI Usage

This project, IronBase, was built with the assistance of AI tools.

## Tools Used
- **Google Gemini 3.1 Pro (High):** Used as an agentic coding assistant to help build out React components, manage layout responsiveness, troubleshoot bugs, and generate documentation.
- **Claude Code (Anthropic):** Used as an agentic coding assistant to add accounts and multi-device sync, and to redesign the UI with a shared motion system.

## What I wrote myself
These are the parts of IronBase that are mine. AI helped build on top of them, but the decisions and the code below came from me.

### 1. The frontend design system
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
| Before any code | Me | Wireframes and design system (M6A2, M6A3): palette, type scale, spacing rule, component plan, responsive and accessibility rules | in `092904e` (`docs/`) |
| 2026-09-23 | Me (Gemini helped write some component code) | First build from that design: the `:root` tokens, the atoms/molecules/organisms structure, CSS Modules, desktop header that becomes a phone bottom nav | `092904e` |
| 2026-09-23 | Me (with Gemini) | Week 1 polish: charts, e1RM and PRs, Apple-like spacing, reduced-motion support, mobile header fix; added the positive/negative colours and larger spacing steps | `97361a5`, `a9ec27e`, `275f9b6` |
| 2026-09-27 | Claude Code | Enhanced the UI: a motion system (`--motion-*`, `--ease-*`, `--stagger-step`, `--press-scale`), extra shades (`--color-surface-raised`, `--color-accent-soft`, hairlines, `--color-text-faint`), animated numbers, route transitions, the new sign-in screen, and a refresh of all screens | `5d11f68` |
| 2026-09-28 | Claude Code | Atmospheric haze and floating dust behind every screen | `bdbf0b7`, `9f7772c` |

Claude's enhancements kept my design base intact. Compare `src/index.css` in `092904e` with today: my core colours (`--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, `--color-accent`), the 8px spacing scale, the font and the corner radii still have the same values. Every new screen Claude made, including the sign-in page, uses my tokens and component structure. So the look you see is still my design, with motion and atmosphere layered on top.

To be clear about what isn't mine: the motion system, the extra shades listed above, the animations and the haze/dust background were added by Claude Code.

### 2. The estimated 1-rep max (e1RM) calculation
[`src/services/e1rmService.js`](src/services/e1rmService.js):

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

## How AI was applied
- AI assisted in writing the boilerplate for React Vite configurations.
- Assisted in drafting the `README.md` and completing the `SECURITY-CHECKLIST.md`.
- Helped implement the UI components, CSS Modules and layouts from my wireframes and design system (above).
- Built the accounts system end to end: the Express/PostgreSQL sign-up, sign-in, sign-out, and session endpoints in `server/auth.js` (scrypt password hashing, HttpOnly session cookies, rate limiting), and scoped every workout endpoint in `server/server.js` to the signed-in user.
- Gave each account its own local PGlite database per device, extended the background sync engine to push local changes and pull other devices' changes, and adopted any workout data that existed on a device before it had an account.
- Redesigned all five screens (the new `/auth` screen plus the existing four) with a shared motion system (`src/index.css`) — animated numbers, route transitions, set add/remove animations, sync status feedback — while keeping the existing visual identity.
- Found and fixed several pre-existing bugs while doing this: saved workouts silently failing to sync (missing set IDs in the queued payload), the sync retry counter penalizing dropped connections the same as real failures, the training heatmap and "today" defaults using UTC instead of local dates, and a race where a background sync could briefly undo a delete.
- Tested the accounts and ownership logic (one account cannot read, overwrite, or delete another's workout), and tested multi-device sync and offline behavior across separate browser origins standing in for separate devices.
- Drafted `docs/reports/week-02.md` and updated `README.md`, `SECURITY-CHECKLIST.md`, and this file to reflect the above; also found and fixed a gap in `.gitignore` where `.env` files were not excluded, and added `server/.env.example`.

*This document will be updated continuously as the project progresses towards the final submission.*
