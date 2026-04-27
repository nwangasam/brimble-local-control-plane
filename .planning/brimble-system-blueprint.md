# Brimble System Blueprint

Based on:

- [brimble-fullstack-infra-engineer.md](./brimble-fullstack-infra-engineer.md)
- [brimble-application-strategy.md](./brimble-application-strategy.md)
- [brimble-readme-outline.md](./brimble-readme-outline.md)

## Goal Of This Blueprint

This document defines the exact implementation shape for the take-home submission.

It is intentionally biased toward:

- low operational risk
- strong evaluator ergonomics
- explicit lifecycle management
- easy walkthrough discussion

The standard to optimize for is not "most advanced system." It is "most credible end-to-end submission."

## Final Architecture Decision

Use a four-part local system:

- `web`
  - Vite + TanStack Router + TanStack Query
- `api`
  - TypeScript backend
  - owns deployments, logs, lifecycle orchestration, and runtime coordination
- `caddy`
  - single ingress for frontend, API, and deployed apps
- `sqlite`
  - embedded inside `api` container via a mounted volume, not a separate service

There should not be a separate worker service for this take-home unless a clear implementation constraint forces it.

### Why No Separate Worker

- fewer moving parts
- lower compose complexity
- easier local debugging
- easier interview explanation

Background jobs can run inside the API process with a simple in-process queue or task runner.

## Opinionated Technical Choices

These are the choices I recommend locking in.

### Language

- TypeScript everywhere possible

### Frontend

- Vite
- TanStack Router
- TanStack Query
- plain CSS or Tailwind if you already work fast with it

### Backend

- Node.js + TypeScript
- Fastify or Express

Preferred choice:

- Fastify

Reason:

- clean routing
- good SSE support with raw response handling
- low overhead

### Database

- SQLite

### ORM / DB Layer

- Drizzle or Prisma

Preferred choice:

- Drizzle

Reason:

- lighter footprint
- simpler for SQLite
- easier to keep the stack narrow

### Real-Time Transport

- SSE

### File Upload Handling

- uploaded project accepted as `.zip` or `.tar.gz`

Preferred first implementation:

- `.zip` only

Reason:

- narrower parsing surface
- simpler validation and extraction flow

If you support only `.zip`, say so clearly in the README.

### Runtime Coordination

- backend uses Docker CLI commands

Reason:

- simpler than integrating Docker SDK
- easier to inspect and debug during walkthrough
- easier to stream raw process output into logs

### Build Tool

- Railpack CLI

### Routing Strategy

- path-based routing

Recommended route format:

- frontend: `/`
- API: `/api/*`
- deployed apps: `/d/{deploymentId}/*`

This is simpler than per-host routing and fully adequate for the task.

## Repo Structure

Recommended repo layout:

```text
.
├── apps/
│   ├── api/
│   └── web/
├── infra/
│   ├── caddy/
│   │   ├── Caddyfile
│   │   └── generated/
│   └── scripts/
├── sample-apps/
│   └── hello-node/
├── docker-compose.yml
├── README.md
└── .env.example
```

### `apps/api`

Suggested internal structure:

```text
apps/api/src/
├── app.ts
├── server.ts
├── routes/
│   ├── deployments.ts
│   └── events.ts
├── db/
│   ├── client.ts
│   ├── schema.ts
│   └── migrations/
├── domain/
│   ├── deployments/
│   ├── logs/
│   └── routing/
├── services/
│   ├── pipeline-runner.ts
│   ├── docker-service.ts
│   ├── railpack-service.ts
│   ├── caddy-service.ts
│   ├── workspace-service.ts
│   └── event-bus.ts
├── lib/
│   ├── env.ts
│   ├── ids.ts
│   └── process.ts
└── types/
```

### `apps/web`

Suggested internal structure:

```text
apps/web/src/
├── main.tsx
├── routes/
├── components/
│   ├── deployment-form.tsx
│   ├── deployment-list.tsx
│   ├── deployment-detail.tsx
│   └── log-viewer.tsx
├── api/
├── hooks/
│   └── use-deployment-events.ts
├── lib/
└── styles/
```

### `infra/caddy`

Use:

- a stable base `Caddyfile`
- generated route snippets written by the API

This keeps routing dynamic without making the entire Caddy config opaque.

## Service Boundaries

Keep ownership clear.

### Web Service Owns

- deployment submission UI
- deployment list UI
- deployment detail view
- live log display
- polling or refetch after lifecycle changes

### API Service Owns

- validating submission requests
- storing deployment records
- storing logs
- background execution
- invoking Railpack
- invoking Docker
- generating route config
- reloading Caddy
- SSE subscriptions

### Caddy Owns

- ingress for the whole system
- reverse proxy to web and API
- reverse proxy to deployment containers

## Docker Compose Shape

Recommended services:

- `web`
- `api`
- `caddy`

That is enough if SQLite is embedded in `api`.

### Suggested Volumes

- `api-data`
  - SQLite database
- `api-workspaces`
  - checked out repos and extracted uploads
- `caddy-generated`
  - generated route config fragments
- `docker.sock`
  - mounted into `api` if you run Docker CLI inside it

### Important Tradeoff

Mounting the Docker socket is a deliberate simplification for the take-home. It is acceptable here, but it should be called out as a production limitation in the README.

## Data Model

Keep the schema compact.

### Table: `deployments`

Recommended columns:

- `id` text primary key
- `source_type` text not null
- `source_value` text not null
- `status` text not null
- `image_tag` text
- `route_path` text
- `container_name` text
- `workspace_path` text
- `failure_reason` text
- `created_at` datetime not null
- `updated_at` datetime not null
- `started_at` datetime
- `finished_at` datetime

### Table: `deployment_logs`

Recommended columns:

- `id` text primary key
- `deployment_id` text not null
- `phase` text not null
- `stream` text not null
- `message` text not null
- `created_at` datetime not null

### Optional Table: `deployment_events`

This can be skipped if logs plus deployment snapshots are enough.

Recommended decision:

- skip separate `deployment_events`

Reason:

- status transitions can be represented in deployment updates and system log entries
- fewer tables
- easier mental model

## Source Input Model

Support exactly two input types.

### Git URL Submission

Request shape:

```json
{
  "sourceType": "git",
  "gitUrl": "https://github.com/example/repo"
}
```

### Upload Submission

Use multipart form data with:

- `sourceType=upload`
- `file=<archive>`

### Validation Rules

- reject empty or malformed Git URLs
- reject unsupported archive types
- reject oversized uploads with a clear message

Do not add complicated VCS provider support. Narrow is better.

## API Contract

Keep it small and stable.

### `POST /api/deployments`

Creates a deployment and immediately starts the pipeline.

Response:

```json
{
  "deployment": {
    "id": "dep_123",
    "status": "pending",
    "sourceType": "git",
    "sourceValue": "https://github.com/example/repo",
    "routePath": "/d/dep_123",
    "imageTag": null,
    "failureReason": null,
    "createdAt": "2026-04-25T12:00:00.000Z",
    "updatedAt": "2026-04-25T12:00:00.000Z"
  }
}
```

### `GET /api/deployments`

Returns all deployments ordered by newest first.

### `GET /api/deployments/:id`

Returns one deployment.

### `GET /api/deployments/:id/logs`

Returns historical logs.

Suggested response:

```json
{
  "logs": [
    {
      "id": "log_1",
      "phase": "build",
      "stream": "stdout",
      "message": "Running railpack build...",
      "createdAt": "2026-04-25T12:00:03.000Z"
    }
  ]
}
```

### `GET /api/deployments/:id/events`

SSE endpoint.

Event types:

- `log`
- `status`

Suggested event payloads:

```json
{
  "type": "log",
  "data": {
    "id": "log_1",
    "deploymentId": "dep_123",
    "phase": "build",
    "stream": "stdout",
    "message": "Running railpack build...",
    "createdAt": "2026-04-25T12:00:03.000Z"
  }
}
```

```json
{
  "type": "status",
  "data": {
    "deploymentId": "dep_123",
    "status": "deploying",
    "imageTag": "brimble-demo:dep_123",
    "updatedAt": "2026-04-25T12:00:08.000Z"
  }
}
```

## Deployment Lifecycle

Use exactly this lifecycle:

1. `pending`
2. `building`
3. `deploying`
4. `running`
5. `failed`

### Transition Rules

- `pending -> building`
  - once background execution begins
- `building -> deploying`
  - after Railpack build succeeds and image tag is recorded
- `deploying -> running`
  - after container startup, route registration, Caddy reload, and route verification succeed
- `building -> failed`
  - if source prep or build fails
- `deploying -> failed`
  - if container start, route update, reload, or verification fails

Do not allow `running -> deploying` for the first version. No redeploy feature is needed yet.

## Pipeline Runner Design

This is the heart of the system.

### `pipeline-runner` Responsibilities

- enqueue deployment work
- avoid duplicate execution for the same deployment
- emit status transitions
- emit logs
- coordinate source prep, build, runtime, and routing
- finalize success or failure

### Recommended Execution Model

- single-process in-memory queue
- one deployment at a time for the first version

Reason:

- easier correctness
- easier log sequencing
- easier to explain

If you later allow concurrency, make it a controlled change with deterministic names and isolated workspaces.

## Workspace Strategy

Each deployment should get its own isolated workspace directory:

- `/data/workspaces/{deploymentId}`

### For Git URLs

- clone into workspace

### For Uploads

- store archive temporarily
- extract into workspace

### Cleanup

For the first version:

- keep workspaces after completion

Reason:

- helps debugging
- simpler implementation

Call this out in README as a cleanup tradeoff.

## Railpack Integration

Invoke Railpack via child process.

### Inputs

- workspace path
- desired image tag

### Output To Capture

- stdout
- stderr
- exit code

Every line emitted by Railpack should be:

- persisted to `deployment_logs`
- sent to active SSE subscribers

### Image Tag Convention

Use a deterministic tag format:

- `brimble-submission:{deploymentId}`

This makes inspection and interview discussion easier.

## Docker Runtime Strategy

Run deployed apps as Docker containers with deterministic names.

### Container Name Convention

- `deployment-{deploymentId}`

### Port Strategy

Use one internal app port convention if possible.

Recommended assumption:

- sample app exposes port `3000`

But because candidate-submitted apps may vary, you need one of these approaches:

### Safer Approach

Require the sample app to expose a known default port and document the expectation.

Why this is acceptable:

- the JD lets you design the system
- you are judged on clarity and reasoning
- dynamic port discovery adds unnecessary complexity

Document this constraint clearly:

- "apps are expected to serve HTTP on port 3000"

This is a deliberate narrowing decision and a good one.

## Caddy Integration

Caddy must be visibly real, not decorative.

### Base Routing

- `/` -> `web:5173` or the production web server port
- `/api/*` -> `api:3001`

### Deployment Routing

Each successful deployment gets:

- `/d/{deploymentId}/*` -> active container

### Recommended Mechanism

- API writes a generated config fragment per deployment
- API triggers `caddy reload`

### Important Simplification

Do not build a complex dynamic config engine. Generate a small predictable snippet per deployment.

## Route Verification

Before marking a deployment `running`, verify the route.

### Verification Sequence

1. container started successfully
2. route config written
3. Caddy reload succeeds
4. HTTP check against proxied path returns success or expected response

If verification fails, do not claim the deployment is healthy.

This single decision improves the credibility of the whole system.

## Log Streaming Design

Implement logs as both persistence and live fanout.

### Flow

1. pipeline emits a log line
2. backend normalizes it into a log record
3. backend saves it to SQLite
4. backend publishes it through in-memory event bus
5. SSE subscribers receive it
6. UI appends it to visible logs

### UI Strategy

When a deployment is selected:

1. fetch historical logs
2. open SSE stream
3. append new logs and status updates live

This avoids lost context during refresh.

## Frontend Screen Blueprint

Keep the interface one page and operational.

### Section 1: Submission Form

Controls:

- toggle between Git URL and Upload
- Git URL input
- file input
- submit button

Show immediate validation errors inline.

### Section 2: Deployment List

Each row should show:

- deployment id
- source summary
- status
- image tag if available
- route path if running
- updated time

### Section 3: Deployment Detail

Show:

- current status
- source type
- source value
- image tag
- route link
- failure reason if any

### Section 4: Log Viewer

Requirements:

- monospaced
- scrollable
- grouped by time order
- phase and stream visually distinguishable
- appends live

Do not overdesign this. Make it readable.

## Error Model

Give failures names and visibility.

### Good Failure Categories

- invalid source input
- source fetch failure
- archive extraction failure
- Railpack build failure
- container start failure
- Caddy config generation failure
- Caddy reload failure
- route verification failure

### Display Strategy

- store concise `failure_reason` on deployment
- keep full detail in logs

This gives both summary and depth.

## Minimal Test Plan

You do not need many tests, but the ones you include should matter.

### Priority Tests

- deployment lifecycle transition guard logic
- route path generation
- log normalization and persistence
- failure mapping from pipeline errors to deployment status

### Optional Integration Test

- create a deployment and verify SSE receives status and log events

Only do this if it stays cheap.

## Implementation Sequence

Build in this order.

### Phase 1: Skeleton

1. create repo structure
2. wire `docker-compose.yml`
3. stand up web, api, and caddy with static passthrough
4. prove ingress works from Caddy

### Phase 2: Persistence And Basic API

1. add SQLite
2. create schema
3. implement `POST /deployments`
4. implement `GET /deployments`
5. render deployments in UI

### Phase 3: Pipeline Core

1. build workspace preparation
2. implement Railpack invocation
3. persist logs
4. transition statuses properly

### Phase 4: Runtime And Routing

1. run built image as container
2. generate Caddy route fragment
3. reload Caddy
4. verify route
5. expose route in UI

### Phase 5: Live Streaming

1. build SSE endpoint
2. publish log and status events
3. connect UI to SSE
4. merge historical and live logs

### Phase 6: Upload Support

1. add archive upload handling
2. validate extraction flow
3. test parity with Git flow

### Phase 7: Submission Hardening

1. meaningful tests
2. README
3. clean-machine run verification
4. Loom walkthrough if time allows
5. Brimble deploy feedback

## Build Constraints To State Explicitly

These constraints are acceptable if documented cleanly:

- apps are expected to serve HTTP on port `3000`
- uploads must be `.zip`
- single-node local execution only
- one deployment processed at a time in v1
- no hardened sandboxing for untrusted workloads

These are not weaknesses if they are intentional and well explained.

## What To Avoid

Avoid these choices unless forced:

- Postgres by default
- WebSocket unless SSE becomes limiting
- hostname-based routing
- separate worker service
- Docker SDK complexity
- support for many app port conventions
- bonus features before core stability

## Final Recommendation

If you follow this blueprint, the submission should read as:

"small, deliberate, infra-aware, and honest"

That is the strongest signal you can send for this JD.
