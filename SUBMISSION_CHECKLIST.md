# Submission Checklist

## Verified In This Repo

- [x] `docker compose` stack starts locally
- [x] API health endpoint responds through Caddy
- [x] Git deployment flow verified end-to-end
- [x] upload deployment flow verified end-to-end
- [x] live SSE events verified by `scripts/verify-live-stack.mjs`
- [x] persisted logs verified by `scripts/verify-live-stack.mjs`
- [x] root `README.md` added
- [x] root `.env.example` added
- [x] small targeted API test suite added

## Still To Finish Before Submission

- [ ] move this project into its own standalone git repository root
- [ ] confirm the new repo has no unrelated history or files
- [ ] run a final clean `docker compose up --build` check from that standalone repo
- [ ] deploy something on Brimble itself
- [ ] complete [BRIMBLE_FEEDBACK.md](/Users/mac/Desktop/dev/jobs/brimble-jobs/BRIMBLE_FEEDBACK.md:1) with concrete observations
- [ ] add the Brimble deployment URL to the submission
- [ ] optionally record a short Loom walkthrough

## Submission Gate

Do not submit until all of these are true:

- [ ] the standalone repo builds and starts with one command
- [ ] the verifier passes in the standalone repo
- [ ] API tests pass in the standalone repo
- [ ] README reflects the final shipped behavior
- [ ] Brimble feedback is specific, honest, and complete

## Recommended Final Commands

```bash
docker compose up --build
node scripts/verify-live-stack.mjs
pnpm test:api
```
