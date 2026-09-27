# Security checklist

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | Yes | `server/.env` is where real config would live. It was **not** in `.gitignore` before this pass — fixed by adding `.env` / `.env.*` (with `!.env.example` excepted) to `.gitignore`. `git log --all --diff-filter=A -- "*.env"` and `git ls-files \| grep .env` both return nothing: no `.env` file has ever been committed. |
| 2 | A `.env.example` with placeholder values only is committed | Yes | Added `server/.env.example` with placeholder values only (`example_user:example_password`, etc.) for every variable the API reads. |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | The only literal connection string in source is the local-dev fallback in `server/db.js` (`postgres://postgres:postgres@localhost:5432/ironbase`), used only when `DATABASE_URL` is unset — the default Postgres superuser on a developer's own machine, not a real credential. Searched `src/` and `server/` for hardcoded keys/tokens/passwords beyond that: none found. |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | Yes | Ran `git log --all -p \| grep -iE "password\|secret\|api[_-]?key\|postgres://"`. The only real hits are the same local-dev fallback string above and the checklist's own past evidence text — no committed secrets. |
| 5 | Any credential that was ever committed has been rotated | N/A | No credentials have ever been committed (see #4). |
| 6 | Production credentials live only in my hosting provider's environment settings | N/A | Not deployed to production yet. When it is, `DATABASE_URL` and `COOKIE_SECURE` must be set in the host's environment settings, never committed. |

## GitHub Actions

No workflows currently exist for this project.

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | N/A | Project has no workflows. |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | N/A | Project has no workflows. |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | N/A | Project has no workflows. |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | N/A | Project has no workflows. |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | N/A | Project has no workflows. |
| 12 | Secret scanning and push protection are enabled on the repository | Unverified | This can only be confirmed from the GitHub repository's own Settings → Code security page, which isn't visible from this checkout — recheck there before relying on this. |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | Every query in `server/db.js`, `server/auth.js`, and `server/server.js` uses `pg` parameter placeholders (`$1`, `$2`, ...); none build SQL by string concatenation of user input. |
| 14 | The database is not open to the whole internet, or is reachable only by the app | N/A | Not deployed yet; local development connects to a Postgres instance on the developer's own machine, not reachable externally. Re-verify this once a production database is provisioned. |
| 15 | The database user the app connects as has only the permissions it needs | No | Local development connects as the default `postgres` superuser (see the fallback connection string in `server/db.js`). This should be a scoped, least-privilege user before going to production. |
| 16 | Seed and sample data is invented, not real people's data | Yes | The only server-seeded data is a fixed library of five generic exercise names (Squat, Bench Press, Deadlift, Overhead Press, Barbell Row) — nothing resembling real personal data. |
| 17 | Debug, seed and reset routes are removed before going public | Yes | `server/server.js` exposes only `GET /exercises`, `GET/POST /workouts`, and `DELETE /workouts/:id`, plus the auth routes in `server/auth.js`. Seeding runs once automatically inside `initDb()` on start-up; there is no exposed HTTP route that reseeds, resets, or dumps data. |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | Real per-user login: email/username + password, hashed server-side with scrypt, verified in `server/auth.js`, backed by an HttpOnly session cookie. |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | N/A | Neither Supabase nor Firebase are used; ownership is enforced in the Express API itself (see #21). |
| 20 | If Zero Trust: the reviewer's email is on the access policy. If an app password: the credentials are in my private workspace `project/README.md` | N/A | Not applicable — this app uses individual user accounts, not a shared Zero Trust policy or a single app-wide password. |
| 21 | The gate covers every route, including the ones that only change data | Yes | `GET /workouts`, `POST /workouts`, and `DELETE /workouts/:id` all run through `requireAuth` and additionally filter/verify by `req.user.id`, confirmed by a test where a second account got `404 Not Found` trying to read, overwrite, or delete the first account's workout by its exact ID. `GET /exercises` is intentionally open — it's a shared, non-personal exercise library, not user data. |
| 22 | The credentials for the gate are environment variables, not in source | N/A | Not applicable in this form — there is no shared app password or Zero Trust credential. Each user's own password is hashed and stored in the database, never in source; server config (`DATABASE_URL`, `COOKIE_SECURE`, etc.) is read from environment variables (#1, #2). |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | Yes | `server/auth.js` validates email format, username pattern/length, and password length server-side before creating an account; `server/server.js`'s `validateWorkout` middleware validates workout/set shape server-side regardless of what the browser sent. |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | React escapes string values when rendering in JSX; the codebase has no use of `dangerouslySetInnerHTML` anywhere. |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | `server/server.js`'s error-handling middleware returns only `{ error: 'Internal server error' }` (5xx) or `{ error: 'Bad request' }` (4xx) to the client; the real error is only `console.error`-logged server-side, never sent in the response body. |
| 26 | CORS is not a wildcard on routes that change data | Yes | CORS middleware is only added at all when `CORS_ORIGIN` is explicitly set, and then to that exact comma-separated origin list with `credentials: true` — never `origin: '*'`. With no `CORS_ORIGIN` set (the default), cross-origin requests aren't allowed at all. |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | Yes | Reviewed repository contents and git history; no personal data found. The test accounts used during development (`device-a@ironbase.test`, etc.) are fictional `.test`-domain addresses, not real people's data. |
| 28 | No classmate's personal data in the repository | Yes | Reviewed repository; no classmate data found. |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | Verified `node_modules` is in `.gitignore` (both the root and `server/` packages) and `package.json`/`server/package.json` only reference standard npm packages. |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | Exercise photos in `public/images/exercises/` and the Inter font (loaded from Google Fonts) are the only external-style assets; no other proprietary assets are used. |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Unverified | This has to be checked on GitHub's repository Settings page after the next push, which isn't visible from this checkout — recheck there, don't assume this still holds. |

## Anything I found and fixed

Going through this checklist for the first time since the app got a real backend, I found `.env` was **not** gitignored — a mistake to catch before anyone runs `server/.env` locally and forgets that. Fixed by adding `.env` / `.env.*` (with `.env.example` excepted) to `.gitignore`, and added `server/.env.example` with placeholder values so nobody needs a real connection string to see what's expected. I also found the API's local-dev database connection defaults to the `postgres` superuser rather than a scoped, least-privilege user (#15) — left as a known gap for before production, called out honestly above rather than marked "Yes." Two items (#12, #31) can only be confirmed from GitHub's own repository settings, which I can't see from this checkout, so I marked them "Unverified" rather than guessing.
