# Security checklist

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | N/A | The project currently has no `.env` file as it uses local browser storage. |
| 2 | A `.env.example` with placeholder values only is committed | N/A | No environment variables are required. |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | Searched `src/` for "key", "password", "token" and found no hardcoded credentials. |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | Yes | `git log -p` search returned no results for secrets or credentials. |
| 5 | Any credential that was ever committed has been rotated | N/A | No credentials have ever been used or committed in this repository. |
| 6 | Production credentials live only in my hosting provider's environment settings | N/A | Not yet deployed to production, and no backend exists yet. |

## GitHub Actions

No workflows currently exist for this project.

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | N/A | Project has no workflows. |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | N/A | Project has no workflows. |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | N/A | Project has no workflows. |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | N/A | Project has no workflows. |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | N/A | Project has no workflows. |
| 12 | Secret scanning and push protection are enabled on the repository | Yes | GitHub's default secret scanning is enabled on the repository settings. |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | N/A | App uses `localStorage`, not SQL queries. |
| 14 | The database is not open to the whole internet, or is reachable only by the app | N/A | No external database exists. |
| 15 | The database user the app connects as has only the permissions it needs | N/A | No external database exists. |
| 16 | Seed and sample data is invented, not real people's data | Yes | Mock workout data seeded in the app is entirely invented. |
| 17 | Debug, seed and reset routes are removed before going public | N/A | No backend routes exist. |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | N/A | This is currently a local-only frontend prototype; no remote access layer yet. |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | N/A | Neither Supabase nor Firebase are used. |
| 20 | If Zero Trust: tjakoen.s@gmail.com is on the access policy. If an app password: the credentials are in my private workspace `project/README.md` | N/A | Not applicable. |
| 21 | The gate covers every route, including the ones that only change data | N/A | Not applicable. |
| 22 | The credentials for the gate are environment variables, not in source | N/A | Not applicable. |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | N/A | No server exists; data stays locally in the browser. |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | React automatically escapes string values when rendering in JSX, preventing XSS. |
| 25 | Error responses do not expose stack traces, file paths or connection details | N/A | No server to return error responses. |
| 26 | CORS is not a wildcard on routes that change data | N/A | No server or backend routes exist. |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | Yes | Reviewed repository contents and git history; no personal data found. |
| 28 | No classmate's personal data in the repository | Yes | Reviewed repository; no classmate data found. |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | Verified `node_modules` is in `.gitignore` and `package.json` only uses standard npm packages. |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | No external proprietary assets are used in the repo. |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | Checked the GitHub repository settings page to confirm visibility. |

## Anything I found and fixed

I found that because the app currently runs entirely locally without a backend, many of the security concerns (like SQL injection, CORS, and secret management) are not yet applicable. However, going through this checklist served as a good reminder to ensure React's built-in XSS protection handles user input safely, and that I need to be careful with security rules and `.env` when I eventually add a database like Supabase in future updates.
