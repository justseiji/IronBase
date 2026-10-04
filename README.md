[![Made with Claude](https://img.shields.io/badge/Made_with-Claude-D97757?logo=anthropic&logoColor=white)](AI-USAGE.md)
[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)
# IronBase

## 1. Overview
IronBase is a mobile-first progressive overload tracker for weightlifting and strength training. It solves the problem of workout data being trapped on one device by giving lifters accounts that sync their sets, PRs, and history across every device they use, wrapped in a clean, Apple-inspired interface.

## 2. Setup and installation
To get the project running locally from scratch:

1. **Prerequisites:** [Node.js](https://nodejs.org/) v18 or higher, and a running [PostgreSQL](https://www.postgresql.org/) instance (any recent version).
2. **Clone the repository:**
   ```bash
   git clone https://github.com/justseiji/IronBase.git
   cd IronBase
   ```
3. **Install dependencies** (web app and API are separate packages):
   ```bash
   npm install
   cd server && npm install && cd ..
   ```
4. **Environment and configuration.** The web app needs no environment variables in development. The API reads these (all optional — sensible defaults are used if omitted). Create `server/.env` or export them in your shell; never commit real values:

   | Variable | Example value | Purpose |
   | --- | --- | --- |
   | `DATABASE_URL` | `postgres://example_user:example_password@localhost:5432/ironbase` | PostgreSQL connection string |
   | `PORT` | `3001` | Port the API listens on |
   | `COOKIE_SECURE` | `true` | Mark the session cookie `Secure` (set this when serving over HTTPS) |
   | `TRUST_PROXY` | `1` | Express `trust proxy` setting, only needed behind a reverse proxy |
   | `CORS_ORIGIN` | `https://app.example.com` | Comma-separated allowed origins, only needed if the web app is served from a different origin than the API |
   | `IRONBASE_API_URL` | `http://localhost:3001` | Where the Vite dev server proxies `/api` requests to |
   | `VITE_API_BASE_URL` | `/api` | Base URL the built web app calls (default: same origin) |
   | `APP_URL` | `https://app.example.com` | Public address of the web app, used to build password reset links |
   | `GMAIL_USER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | see `server/.env.example` | Send password reset emails through the Gmail API (run `npm run gmail-auth` in `server/` to get the refresh token). If unset, reset links are printed to the API console instead |

5. **Database setup and seeding:** No manual schema work is required — the API creates every table it needs the first time it starts, against whatever database `DATABASE_URL` points to (default `postgres://postgres:postgres@localhost:5432/ironbase`). A default library of five exercises (Squat, Bench Press, Deadlift, Overhead Press, Barbell Row) is seeded automatically the first time the `exercises` table is empty. Each browser also keeps its own offline copy of the signed-in account's data locally (PGlite, via IndexedDB) — nothing to install for that either.

## 3. How to run it
Start the API and the web app in two separate terminals:
```bash
cd server && npm run dev
```
```bash
npm run dev
```
Open `http://localhost:5173`. You should see the IronBase sign-in/sign-up screen; create an account and you'll land on the Dashboard, empty and ready for your first workout.

**Using it on more than one device** (e.g. iPhone + PC): run `npm run dev -- --host`, open the printed network URL on the other device, and sign in with the same account. Each device syncs through the API; devices never exchange data directly with each other.

## 4. Features and usage
- **Sign up / Sign in** (`/auth`): create an account with email, username, and password, or sign in with either identifier. Passwords are hashed server-side and never stored or returned in plain text. Signing out deletes that device's local copy of your data once everything has synced.
- **Dashboard:** A high-level overview — a training heatmap, headline stats (workouts this week/month, volume), a progress chart per exercise, and recent PRs and workouts.
- **Workout Log:** Log sets (weight, reps, RPE) for an exercise. It flags new PRs as you log them and compares each set with your last session.
- **Exercise History:** Full history for one exercise — progression chart, latest-vs-previous comparison, personal records, and every past session.
- **Workout History:** Every saved workout, grouped by month, expandable for per-exercise set detail, deletable with a confirmation step.
- **Multi-device sync:** Workouts save locally first (so logging works offline), queue for sync, and push to the server when it's reachable; the app also pulls other devices' changes automatically. A sync indicator in the header shows Synced / Syncing / Offline / Sync error.

**Main API endpoints** (all under `/api`, JSON in and out; the four workout-related endpoints require a signed-in session cookie):

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/auth/signup` | Create an account (email, username, password) and start a session |
| POST | `/auth/signin` | Sign in with email-or-username + password, start a session |
| POST | `/auth/signout` | End the current session |
| POST | `/auth/forgot` | Email a password reset link (always responds the same, whether or not the email has an account) |
| POST | `/auth/reset` | Set a new password using a reset link's token |
| GET | `/auth/me` | Return the signed-in user, or `null` |
| GET | `/exercises` | List the shared exercise library |
| GET | `/workouts` | List the signed-in user's workouts (including sets) |
| POST | `/workouts` | Create or update one of the signed-in user's workouts |
| DELETE | `/workouts/:id` | Soft-delete one of the signed-in user's workouts |

## 5. Project structure
- `src/components/`: Reusable UI elements structured atomically (`atoms`, `molecules`, `organisms`).
- `src/pages/`: The routed screens (`AuthPage`, `DashboardPage`, `WorkoutLogPage`, `ExerciseHistoryPage`, `WorkoutHistoryPage`).
- `src/layout/`: Global layout wrappers — `AppShell`, route transitions, the loading skeleton.
- `src/auth/`: Client-side session state (`AuthProvider`, `useAuth`).
- `src/database/`: The per-account local PGlite database, its migrations, and adoption of any pre-account local data found on a device.
- `src/repositories/`: The only code that reads and writes local workout/exercise data.
- `src/services/`: The API client, auth calls, the background sync engine, and analytics/PR/e1RM calculations.
- `src/index.css`: Design tokens, including the shared motion system (`--motion-*`, `--ease-*`, `motion-*` classes).
- `docs/`: Course deliverables — the project proposal, wireframes, design system, weekly increment reports, and reflection journal.
- `server/`: The Express + PostgreSQL API — `auth.js` (accounts, sessions, password hashing, password reset), `mailer.js` (reset emails via the Gmail API) and `server.js` (exercises/workouts, ownership checks).

## 6. Known issues and next steps
**Known issues:**
- A brand-new device needs a network connection for its first sign-in and initial sync; after that, it works offline using its local copy.
- If the same workout is edited on two offline devices before either has synced, the last one to reach the server wins — there's no merge.
- Some complex charts may experience minor layout clipping on extremely narrow screens (under 320px width).

**Next steps:**
- Let users create, save, and share custom workout templates.
- Conflict resolution for the two-offline-devices case above, rather than last-write-wins.

## Credits & AI Usage
This project utilized AI assistance for development. Please see [AI-USAGE.md](./AI-USAGE.md) for full details on how AI tools were employed.
