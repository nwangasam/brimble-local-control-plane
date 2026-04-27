# Brimble Application Strategy

Based on: [brimble-fullstack-infra-engineer.md](./brimble-fullstack-infra-engineer.md)

## Objective

The target is not just "submit something." The target is to produce a take-home that:

- clears all hard requirements with zero ambiguity
- looks like it was designed by someone who understands infra systems, not just frontend scaffolding
- is small enough to be trustworthy
- is structured well enough to support a strong founder walkthrough

The immediate goal is interview stage. That means the submission must be easy to run, easy to reason about, and easy to discuss under pressure.

## What Brimble Is Actually Testing

The JD makes this clear even if they do not say it directly:

1. Can you design a clean deployment lifecycle?
2. Can you make multiple moving parts work together end-to-end on a local machine?
3. Can you expose internal system state clearly through UI and logs?
4. Can you avoid overengineering?
5. Can you explain tradeoffs like an engineer they would trust in production?

This is a systems judgment exercise disguised as a coding task.

## Submission Philosophy

The strongest submission is likely:

- deliberately small
- boring in the right places
- explicit about tradeoffs
- highly observable
- reliable on first run

You do not want "impressive complexity." You want "credible platform thinking."

## Recommended Architecture

Use TypeScript across frontend and backend. That aligns with their stated preference and keeps the submission easier to explain.

### Core Components

- `frontend`
  - Vite + TanStack Router + TanStack Query
  - Single page for submission form, deployment list, deployment detail/log panel
- `api`
  - TypeScript service
  - Owns deployment creation, status transitions, log fanout, persistence, and runtime coordination
- `sqlite`
  - Prefer SQLite over Postgres unless there is a strong reason not to
  - Better fit for `docker compose up` simplicity
- `caddy`
  - Public ingress for:
    - frontend
    - API
    - deployed sample apps
- `runner` responsibilities inside the API service
  - clone or unpack source
  - call Railpack build
  - tag resulting image
  - run container
  - update Caddy routing config
  - stream logs and state transitions

### Why This Architecture Fits

- fewer services means lower failure rate on evaluator laptops
- one backend service is easier to reason about during walkthrough
- SQLite reduces setup cost and still satisfies the JD
- Caddy remains the visible ingress point, which maps directly to their requirement

## Strong Scope Boundary

Build only what the rubric rewards.

### Must Have

- create deployment from Git URL
- create deployment from uploaded project
- persistent deployment records
- visible state transitions
- live log streaming during build and deploy
- image tag shown per deployment
- deployed app reachable through Caddy
- single-command local startup

### Should Have

- restart-safe logs stored in DB or append-only files plus index
- clear error handling for failed builds
- deterministic naming for deployments, images, and routes
- small number of meaningful tests

### Do Not Spend Time On

- auth
- teams
- multi-tenancy
- advanced design system work
- Kubernetes
- distributed scheduling
- fancy CI
- bonus features before the core is airtight

## Recommended Resource Model

Keep the model clean and interview-friendly.

### Deployment

Suggested fields:

- `id`
- `sourceType` (`git` | `upload`)
- `sourceValue`
- `status`
- `imageTag`
- `routePath` or `hostname`
- `containerName`
- `createdAt`
- `updatedAt`
- `startedAt`
- `finishedAt`
- `failureReason`

### Log Event

Suggested fields:

- `id`
- `deploymentId`
- `phase` (`build` | `deploy` | `runtime`)
- `stream` (`stdout` | `stderr` | `system`)
- `message`
- `createdAt`

### Status Model

Use the exact lifecycle from the JD:

- `pending`
- `building`
- `deploying`
- `running`
- `failed`

This matters. Do not invent a more complex state machine unless you can defend it cleanly.

## API Surface

Keep the API small and resource-oriented.

### Suggested Endpoints

- `POST /deployments`
  - create a deployment from Git URL or uploaded archive
- `GET /deployments`
  - list deployments with current status, route, and image tag
- `GET /deployments/:id`
  - fetch one deployment with full metadata
- `GET /deployments/:id/logs`
  - historical logs
- `GET /deployments/:id/events`
  - SSE stream for logs and status updates

### Why SSE Is Preferred

SSE is likely the right choice here over WebSocket because:

- the flow is mostly server-to-client
- it is easier to implement and debug
- it keeps the architecture narrow
- it is easier to explain during review

Choose WebSocket only if there is a concrete reason.

## Pipeline Design

This is one of the highest-scoring sections of the rubric, so it must feel intentional.

### Proposed Flow

1. User submits Git URL or archive.
2. API creates a deployment row with `pending`.
3. API starts a background job for that deployment.
4. Job emits logs and moves status to `building`.
5. Job stages the source in a temp workspace.
6. Job runs Railpack to build an image.
7. Job records the image tag.
8. Job moves status to `deploying`.
9. Job starts the built container with a deterministic container name.
10. Job updates Caddy config or routing target.
11. Job reloads Caddy.
12. Job verifies the route.
13. Job marks deployment `running`.
14. On any failure, job emits error logs and marks deployment `failed`.

### Critical Design Principle

The pipeline should be resumable enough in spirit, but you do not need real distributed job recovery. What matters is that status transitions are explicit and logs explain what happened.

## Caddy Strategy

Keep Caddy routing simple and demonstrable.

### Best Option

Use path-based routing:

- main app at `/`
- API at `/api`
- deployments at `/deployments/{id}` or `/apps/{slug}`

Why path-based routing is safer here:

- easier to run locally
- avoids local DNS or wildcard host setup
- simpler evaluator experience
- still satisfies the ingress requirement

If you choose hostname-based routing, you will need a very clear explanation of local setup.

## Persistence Strategy

SQLite is likely the best choice unless your implementation truly benefits from Postgres.

Recommended persistence split:

- SQLite for deployments and logs
- temp workspace on disk for checked-out or uploaded source
- Docker as runtime state

This is acceptable because the task is local, single-machine, and evaluator-focused.

## UI Strategy

The UI should feel operational, not decorative.

### One-Page Layout

- top section: create deployment form
- left or top-middle: deployment list
- right or bottom: selected deployment details and live logs

### The UI Should Make These Things Obvious

- what was submitted
- what stage it is in
- whether it succeeded or failed
- what image got built
- where it is reachable
- what the system is doing right now

### Small UX Details That Matter

- auto-select the newest deployment after creation
- color-code statuses conservatively
- keep logs scrollable and append live
- preserve log history when reconnecting
- show failure reason without requiring log spelunking

## README Strategy

The README is part of the score and part of the interview setup. Treat it as a product document.

### Recommended README Structure

1. What this project is
2. Architecture at a glance
3. Why I chose this design
4. Local run instructions
5. How a deployment flows through the system
6. API and data model overview
7. Tradeoffs and known limitations
8. What I would do with another weekend
9. What I intentionally did not build
10. Brimble deploy feedback

### Tone of the README

- direct
- technically honest
- specific
- free of marketing language

Brimble is explicitly rewarding reasoning. The README should prove there was reasoning.

## Testing Strategy

Do not chase coverage. Add a few tests that prove engineering judgment.

### Good Test Targets

- deployment state transition logic
- parsing and storing streamed log events
- route generation or routing config rendering
- failure handling in the pipeline coordinator

### Weak Test Targets

- shallow component snapshots
- trivial DTO validation only
- thin wrapper functions with no logic

## Likely Failure Modes To Prevent

If the project fails in any of these ways, it will look weak fast:

- evaluator cannot run it with one command
- logs only appear after build completion
- built image tag is missing or unclear
- deployment is marked `running` before route actually works
- upload flow works but Git URL flow is broken, or vice versa
- Caddy is present in compose but not truly acting as ingress
- README hides important prerequisites

## Time Allocation Strategy

If you have one focused weekend, use something close to this split:

- 20% architecture and scaffolding
- 35% pipeline and runtime integration
- 20% live log streaming and persistence
- 10% UI clarity
- 10% README and submission polish
- 5% tests

Do not invert this and spend too much time on frontend polish.

## How To Stand Out Without Overbuilding

The best way to stand out is not extra complexity. It is precision.

Examples:

- clear lifecycle transitions with timestamps
- logs that are actually useful, not noisy
- deterministic image/container naming
- clean failure messages
- route verification before marking success
- an honest README section titled `Tradeoffs`

## Brimble Feedback Strategy

This is small in the rubric but can differentiate you because many candidates will do it poorly.

### Good Feedback Is

- concrete
- reproducible
- balanced but honest
- tied to actual workflow pain

### Weak Feedback Looks Like

- "the platform is good"
- "nice UI"
- "deploy was smooth"

That reads like avoidance, not signal.

### Better Feedback Pattern

- what you tried to deploy
- what worked immediately
- what confused you
- what slowed you down
- what error messaging or UX was missing
- one or two specific product improvements

## Founder Walkthrough Optimization

Your codebase and README should be arranged so you can explain:

- why you chose SSE
- why you chose SQLite
- how your deployment lifecycle works
- how Caddy routing is updated
- how you ensure logs are visible in real time
- how failures propagate to both UI and persistence
- what you would change in a production version

If your implementation is hard to narrate, it is too complicated.

## Recommended Build Order

1. Create repo skeleton and compose stack.
2. Prove Caddy fronts frontend and API.
3. Add deployment persistence and list API.
4. Implement Git URL submission path.
5. Implement background pipeline coordinator.
6. Stream logs to UI using SSE.
7. Add upload flow.
8. Persist historical logs.
9. Tighten failure handling.
10. Write README.
11. Run a clean-machine verification pass.
12. Do Brimble deploy and write honest feedback.

## Non-Negotiable Quality Bar Before Submission

Do not submit until all of the following are true:

- `docker compose up` works from scratch
- a deployment can be created from Git URL
- a deployment can be created from upload
- logs stream live while build is happening
- built image tag is visible in the UI
- deployed app is actually reachable through Caddy
- failure states are visible and intelligible
- README explains tradeoffs clearly

## Next Deliverables For This Workspace

The next documents worth producing are:

1. a system design blueprint for the implementation
2. a README draft skeleton we can fill while building
3. a founder interview question pack
