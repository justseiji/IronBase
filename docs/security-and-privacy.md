# Security and privacy checklist

The course's security and privacy checklist, worked through for IronBase. A checked box is verified in this repository; an unchecked box is either an open item or something that can only be confirmed outside the code (the Render dashboard, the production database, the demo video). The longer evidence table is in [`SECURITY-CHECKLIST.md`](../SECURITY-CHECKLIST.md).

## Before the first push

- [x] `.gitignore` includes `.env`, and `git check-ignore -v .env` confirms it — matched by `.gitignore:16` for both `.env` and `server/.env`
- [x] `git ls-files | grep -iE '\.env$|\.pem$|id_rsa'` prints nothing — and no such file appears anywhere in the git history
- [x] `.env.example` is committed, with placeholder values only — `server/.env.example`
- [x] No connection string, key or password anywhere in the repository — the only literal connection string is the local-dev fallback in `server/db.js` (the default Postgres superuser on a developer's own machine)
- [ ] No connection string, key or password in a screenshot — *to confirm by looking through `docs/screenshots/`*
- [x] No `student.json`, and no student number or email of mine or anyone else's — the only addresses are fictional `.test` test accounts

## The application

- [x] Every SQL query is parameterised — every query in `server/db.js`, `server/auth.js` and `server/server.js` uses `$1`, `$2`, … placeholders
- [x] Input is validated on the server, not only in React — sign-up and password reset check email, username and password on the server; `validateWorkout` checks every workout and set
- [ ] Length limits on every text field — email (254), username (3–24) and password (8–128) are limited; workout text such as session focus is type-checked but has no maximum length yet
- [x] `cors({ origin: allowedOrigins })` names my origins — CORS is off unless `CORS_ORIGIN` lists origins, and it is never a bare `cors()`
- [ ] `NODE_ENV=production` on the host — *to confirm in the Render dashboard*
- [x] No stack trace in any response body — the error handler returns only `Internal server error` or `Bad request`
- [ ] `helmet` installed — not yet
- [x] Anything that costs money or accepts a password is rate limited — sign-up, sign-in, password reset and forgot-password (which sends an email)
- [x] Passwords are hashed and never logged — hashed with **scrypt** (Node's built-in, at least as strong as bcrypt) rather than bcrypt; switching now would lock out every existing account
- [x] Every route that touches somebody's data has the ownership check in the query — `WHERE user_id = $1` / `AND user_id = $2`, not an `if` above it
- [x] `npm audit` run once, and the easy fixes taken — `npm audit fix` updated `source-map-js` (a build-time dependency of Vite, never shipped to the browser) from 1.2.1 to 1.2.2 for a high-severity advisory; both the web app and `server/` now report 0 vulnerabilities

## Privacy

- [x] No real classmates' names, numbers, emails or photos anywhere — none in the code or seed data; the only email shown in the demo video is my own
- [x] Seed data is invented — the only seed data is the default exercise list (exercise names and muscle groups)
- [x] If real people tested the app, their data is deleted before submitting — nobody else tested it; the only accounts are my own and fictional `.test` test accounts
- [x] The app says what it collects — the sign-up screen and the account menu both say IronBase stores an email, a username, a hashed password and workout logs, and nothing else
- [x] Users can delete their own data — **Delete account** in the account menu asks for the password again, then removes the account, its workouts and sets, its sessions and reset links from the server, and the account's local database from that device
- [x] Any face in a screenshot is stock, generated, or mine — the form-guide photos come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain), credited in `public/media/exercises/README.md`

## Tradeoffs I knowingly accepted

- **scrypt instead of bcrypt.** It meets the same goal, and changing the hash format now would break every existing login.
- **No `helmet` yet.** The API only returns JSON and the pages are served by Vercel, so its headers add less here than on a server that renders HTML.
- **No maximum length on workout text.** A limit added this late could reject workouts the app already saves; the request body is still capped at 1 MB.
- **Deleting an account clears only the device it's done on.** Another device signed in to the same account is signed out the next time it syncs, but its local copy stays until someone signs out there.
- **Local development connects as the `postgres` superuser.** Production should use a least-privilege database user.
