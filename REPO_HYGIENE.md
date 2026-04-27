# Repo Hygiene Notes

This project is currently not its own standalone git repository root.

On this machine:

- project path: `/Users/mac/Desktop/dev/jobs/brimble-jobs`
- current git toplevel: `/Users/mac`

That means:

- `git status` includes unrelated files outside this project
- commit history is mixed with unrelated work
- submission packaging is riskier than it should be

## Recommended Fix Before Submission

Create a clean standalone repository containing only this project.

Suggested flow:

1. Copy this directory to a clean submission location.
2. Initialize a new git repository there.
3. Commit only the Brimble project files.
4. Re-run the final validation commands from that clean repo.
5. Push that standalone repo to GitHub as the submission artifact.

## Final Validation Commands

Run these from the standalone repo root:

```bash
docker compose up --build
node scripts/verify-live-stack.mjs
pnpm test:api
```

## What To Double-Check

- `git status` only shows Brimble project files
- root `README.md` is present
- root `.env.example` is present
- `BRIMBLE_FEEDBACK.md` is filled out
- the Brimble deployment URL is included in your final submission
