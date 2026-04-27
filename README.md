# Brimble Jobs Take-Home

This project is a small local deployment control plane for the Brimble Fullstack / Infra Engineer take-home.

It lets an operator:

- create a deployment from a Git URL
- create a deployment from an uploaded `.zip`
- watch deployment state and logs in a single UI
- build apps into container images with Railpack
- run the built containers with Docker
- reach deployed apps behind Caddy as the single ingress

The system is intentionally narrow. The goal was not to build a full platform. The goal was to build a clear, local-first, evaluator-friendly slice of one.

## Why This Design

The submission is optimized for:

- one-command local startup with `docker compose up`
- minimal moving parts
- explicit deployment lifecycle
- live observability through SSE logs
- easy walkthrough discussion during review

I kept the architecture small on purpose:

- `apps/web` is a one-page operator UI
- `apps/api` owns deployment persistence, orchestration, and SSE fanout
- SQLite is embedded inside the API container through a mounted data volume
- Caddy fronts the web app, API, and deployed apps
- Docker is the runtime for launched deployments

## Architecture

### Services

- `web`
  - Vite + React + TanStack Router + TanStack Query
  - creates deployments, lists deployments, shows detail, and tails logs
- `api`
  - Fastify + TypeScript
  - validates requests, persists deployments/logs, runs the deployment queue, invokes Railpack, invokes Docker, updates Caddy snippets, and streams SSE events
- `caddy`
  - single ingress point
  - routes `/api/*` to the API
  - routes `/d/{deploymentId}/*` to deployed app containers
  - routes `/` to the web UI
- `buildkit`
  - remote BuildKit daemon used by Railpack builds

### Persistence And Runtime State

- SQLite stores deployments and logs
- uploaded archives and checked-out repos live under `/data`
- Docker stores built images and running containers
- generated Caddy snippets are written to a mounted directory and imported into the base `Caddyfile`

## Deployment Lifecycle

The intended lifecycle is:

- `pending`
- `building`
- `deploying`
- `running`
- `failed`

The API persists deployments first, then runs work through an in-process queue.

High-level flow:

1. `POST /api/deployments` creates a deployment record.
2. The pipeline runner prepares an isolated workspace.
3. Railpack builds a container image and the image tag is recorded.
4. Docker starts the built container with a deterministic name.
5. Caddy route config is generated and reloaded.
6. The route is verified through the ingress.
7. The deployment is marked `running`, or `failed` if any stage errors.

## Log Streaming Design

Logs are treated as a first-class primitive:

- every pipeline log line is persisted to SQLite
- the same log event is fanned out to active SSE subscribers
- the UI loads historical logs first, then appends live events

This keeps refreshes and reconnects simple while still satisfying the real-time streaming requirement.

SSE was chosen instead of WebSocket because the flow is almost entirely server-to-client, and SSE is easier to implement and debug for this shape of product.

## Caddy Routing

This project uses path-based routing:

- `/` for the web app
- `/api/*` for the API
- `/d/{deploymentId}/*` for deployed apps

This was chosen over host-based routing because it is easier to evaluate locally and avoids wildcard DNS or host file setup.

## Local Development

### Prerequisites

- Docker Desktop or a Docker Engine installation with Compose support
- outbound internet access for:
  - dependency installation during image build
  - Railpack builder/runtime image pulls
  - cloning Git deployments

### Start The Stack

```bash
docker compose up
```

Then open:

- app: `http://127.0.0.1:8080`
- API health: `http://127.0.0.1:8080/api/health`

### Verify The Full Stack

This repo includes an end-to-end verifier that exercises both submission paths:

```bash
node scripts/verify-live-stack.mjs
```

The verifier:

- checks API health
- waits for the queue to be idle
- creates one Git deployment
- creates one upload deployment from `sample-apps/hello-node`
- polls status and logs
- validates SSE activity
- confirms the Caddy route is reachable

### Useful Commands

```bash
pnpm --filter @brimble/api build
pnpm --filter web build
docker compose logs -f api
docker compose logs -f caddy
```

## API Overview

- `POST /api/deployments`
  - create a deployment from either a Git URL or multipart upload
- `GET /api/deployments`
  - list all deployments
- `GET /api/deployments/:id`
  - fetch one deployment
- `GET /api/deployments/:id/logs`
  - fetch historical logs
- `GET /api/deployments/:id/events`
  - open SSE stream for `ready`, `status`, `log`, and `ping`

## Environment Variables

The stack has sensible defaults for local use. See [.env.example](/Users/mac/Desktop/dev/jobs/brimble-jobs/.env.example:1) for the documented knobs.

The most important ones are:

- `PORT`
- `DATA_DIR`
- `PIPELINE_MODE`
- `CADDY_PUBLIC_BASE_URL`
- `CADDY_RELOAD_COMMAND`
- `BUILDKIT_HOST`
- `DOCKER_NETWORK`
- `DEPLOYMENT_TARGET_PORT`

## Tradeoffs

This is intentionally not production-grade. The main deliberate simplifications are:

- single-host assumptions
- in-process queue rather than an external worker system
- Docker socket mounted into the API container
- no sandboxing for untrusted user code
- path-based routing rather than multi-host routing
- lightweight local persistence with SQLite
- no auth, multi-tenancy, or secrets management layer

These were acceptable for a take-home whose scoring is biased toward clarity, end-to-end behavior, and strong tradeoff reasoning.

## Tests

The strongest built-in validation today is the end-to-end verifier:

```bash
node scripts/verify-live-stack.mjs
```

It verifies:

- Git deployment flow
- upload deployment flow
- persisted logs
- SSE readiness and log/status events
- final route reachability through Caddy

The next highest-value automated tests to keep expanding are:

- route snippet generation
- deployment state transition behavior
- log merge / dedupe behavior in the UI

## What I Would Improve Next

- retain and expose intermediate deployment lifecycle transitions more explicitly in tests
- add targeted unit tests around routing, queue transitions, and log handling
- improve cleanup for old workspaces, uploads, containers, and route snippets
- add retry strategy and stronger failure classification around build and deploy phases
- add health checks and richer runtime verification beyond HTTP status
- add image reuse / rollback support
- tighten isolation for untrusted application code

## What I Would Keep Simple

- no Kubernetes or external scheduler for this scope
- no auth
- no multi-tenancy
- no advanced design system work
- no production-grade control plane concerns before the local pipeline is airtight

## Notes

- first-time Railpack builds can be slow because builder/runtime images must be fetched
- this repo currently lives inside a larger parent git workspace on this machine; before submission it should be moved into its own standalone git repository root
