# AI Usage

This project, IronBase, was built with the assistance of AI tools.

## Tools Used
- **Google Gemini 3.1 Pro (High):** Used as an agentic coding assistant to help build out React components, manage layout responsiveness, troubleshoot bugs, and generate documentation.
- **Claude Code (Anthropic):** Used as an agentic coding assistant to add accounts and multi-device sync, and to redesign the UI with a shared motion system.

## How AI was applied
- AI assisted in writing the boilerplate for React Vite configurations.
- Assisted in drafting the `README.md` and completing the `SECURITY-CHECKLIST.md`.
- Guided the implementation of the UI components, CSS modules, and layout systems.
- Built the accounts system end to end: the Express/PostgreSQL sign-up, sign-in, sign-out, and session endpoints in `server/auth.js` (scrypt password hashing, HttpOnly session cookies, rate limiting), and scoped every workout endpoint in `server/server.js` to the signed-in user.
- Gave each account its own local PGlite database per device, extended the background sync engine to push local changes and pull other devices' changes, and adopted any workout data that existed on a device before it had an account.
- Redesigned all five screens (the new `/auth` screen plus the existing four) with a shared motion system (`src/index.css`) — animated numbers, route transitions, set add/remove animations, sync status feedback — while keeping the existing visual identity.
- Found and fixed several pre-existing bugs while doing this: saved workouts silently failing to sync (missing set IDs in the queued payload), the sync retry counter penalizing dropped connections the same as real failures, the training heatmap and "today" defaults using UTC instead of local dates, and a race where a background sync could briefly undo a delete.
- Tested the accounts and ownership logic (one account cannot read, overwrite, or delete another's workout), and tested multi-device sync and offline behavior across separate browser origins standing in for separate devices.
- Drafted `docs/reports/week-02.md` and updated `README.md`, `SECURITY-CHECKLIST.md`, and this file to reflect the above; also found and fixed a gap in `.gitignore` where `.env` files were not excluded, and added `server/.env.example`.

*This document will be updated continuously as the project progresses towards the final submission.*
