# Weekly Increment Report

## Week of: 2026-09-27

## What changed this week

- Added accounts: sign up (email, username, password) and sign in (email or username), on a single `/auth` screen with Sign In / Sign Up as two states of one screen, not separate routes.
- Added server-side sessions: HttpOnly cookie, scrypt password hashing, generic error messages, and a login rate limiter.
- Scoped every workout to the account that created it, and added an ownership check so one account can never read, overwrite, or delete another account's workout by guessing its ID.
- Gave each account its own local database per device (PGlite/IndexedDB), so signing out and a different account signing in on the same device can't see each other's data.
- Built the background sync engine further: local changes queue and push to the API, the app also pulls other accounts'/devices' changes automatically, and a sync status indicator (Synced / Syncing / Offline / Sync error) sits in the header.
- Added a "keep unsynced changes on this device" confirmation to sign-out, and adoption of any workouts that were saved on a device before it had an account.
- Redesigned all five screens (Auth, Dashboard, Workout Log, Exercise History, Workout History) with a shared motion system (route transitions, animated numbers, set add/remove animations, sliding nav indicators, a "Workout saved" toast), while keeping the existing dark/red/tan design language.
- Fixed a bug where saved workouts silently failed to sync to the server, because the queued payload was missing the set IDs the server required.
- Fixed the sync retry counter treating a dropped connection the same as a rejected request, which could give up on a change forever after enough offline attempts.
- Fixed the training heatmap and "today" defaults using UTC dates, which showed the wrong day for part of the day in UTC+ timezones.
- Fixed a race where deleting a workout could be briefly undone by a background sync that hadn't seen the delete yet.
- Rewrote `README.md` to match the course documentation templates, and it now documents the API endpoints and every environment variable with an example value.

## Why

Multi-device use only matters if data is actually tied to a person and not to a browser, so accounts and server-side ownership checks came first. The sync engine, per-account local databases, and the offline/undo bug fixes were all in service of the same goal: logging a set on one device should never be lost, delayed forever, or leak into someone else's account. The UI/motion pass was the other half of this week's brief — making the app feel alive and premium without turning it into a generic dashboard, and without adding a sixth screen.

## What broke or what I got stuck on

- I don't have PostgreSQL installed on this machine, so I could not test the API against real Postgres. I stood up a temporary Postgres-compatible database (PGlite running as a socket server) to run the account, ownership, and sync tests instead. The schema and queries are plain PostgreSQL, but this is worth re-verifying against a real Postgres instance before relying on it.
- The `/auth/me` check used to return a 401 for a signed-out visitor, which logged a red error on every normal page load. I changed it to return `{ user: null }` with a 200 instead, since "nobody is signed in" isn't actually an error.
- Splitting the `useAuth` hook out of `AuthContext.jsx` was needed to stop a React Fast-Refresh crash during development (a file that exports both a hook and a component can't hot-reload cleanly).
- None of this week's work is committed yet — it's still sitting as uncommitted changes in the working tree, so it isn't backed by commits I can point to here.

## What is left

- Commit and push this week's changes.
- Verify the schema and queries against a real PostgreSQL instance, not just the PGlite stand-in used for testing.
- Password reset by email.
- Conflict handling for the case where the same workout is edited on two devices while both are offline (currently last write to reach the server wins).
- Custom workout templates.
- Capture real screenshots for the README (still placeholder links).
