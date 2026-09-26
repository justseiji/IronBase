# Project Guidelines & Agent Rules

## Command Execution & Git Push Policy
- **Local Commands**: Execute routine local commands autonomously (builds, development server, linting, tests, local git status/diff/commit).
- **Remote Push Requirement**: **NEVER** run `git push` or push changes to `origin/main` (or any remote branch) without explicitly summarizing the changes and asking the user for confirmation first.
