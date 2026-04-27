# Brimble - Fullstack / Infra Engineer

Source: https://www.brimble.io/careers/fullstack-infra-engineer  
Retrieved: 2026-04-25  
Role page states applications close on: 2026-04-27

## Role Snapshot

- Title: Fullstack / Infra Engineer
- Location: Remote (Nigeria)
- Employment: Contract
- Compensation: N1.6M/month
- Application deadline: 27 April 2026

## High-Level Summary

Brimble wants candidates to build a simplified version of the kind of deployment pipeline they run internally.

The submission is a take-home project: a one-page app that lets a user create deployments, see deployment status, inspect built image tags, and watch build/deploy logs in real time. The pipeline must build container images with Railpack, run them with Docker, and expose them through Caddy as the single ingress point.

They care more about clear reasoning, end-to-end system design, and maintainable structure than visual polish.

## What Brimble Says They Do

Brimble operates a PaaS on bare metal across Hetzner and DigitalOcean. Their production setup uses:

- Nomad for orchestration
- Consul for service discovery
- Vault for secrets

The job post explicitly says Nomad is not required for the take-home, but hands-on experience with Nomad, Consul, or Vault is a meaningful bonus during interviews.

## Required Stack for the Take-Home

- TypeScript preferred, Go acceptable
- Vite + TanStack (Router + Query)
- Caddy
- Railpack

Deliverable format:

- Public Git repository
- Short README explaining decisions

## What You Need To Build

### 1. Frontend

Build a one-page UI with Vite + TanStack that allows a user to:

- Create a deployment from either:
  - a Git URL, or
  - an uploaded project
- View a list of deployments
- See deployment status transitions:
  - pending
  - building
  - deploying
  - running
  - failed
- See the built image tag for each deployment
- Stream build/deploy logs live in the UI using SSE or WebSocket

Important frontend note from the JD: one page is enough, no auth is required, and visual polish is not the priority.

### 2. Backend API

Build the API yourself and choose the resource model. Brimble specifically wants to see how you think about:

- resources
- deployment lifecycle/state
- live log streaming

State can be stored in either:

- SQLite, or
- Postgres

### 3. Deployment Pipeline

The pipeline must:

- Build the app into a container image using Railpack
- Avoid handwritten Dockerfiles
- Run the built container locally with Docker
- Configure Caddy to reverse proxy either a path or hostname to the running container

Caddy must act as the single ingress point for all deployments.

## Hard Requirements

The JD says submissions that skip any of these will not be evaluated.

### 1. End-to-end with `docker compose up`

The entire system must start on a clean machine with one command:

```bash
docker compose up
```

This includes frontend, backend, Caddy, and any other required service.

Your README must document:

- environment variables
- prerequisites
- sensible defaults

They do not want external accounts required just to test the project.

### 2. Real-time log streaming

Build and deploy logs must stream in real time using:

- SSE, or
- WebSocket

Polling does not count. Logs must be visible during execution, not only afterward, and old logs must remain available so the user can scroll back.

### 3. Brimble deploy plus honest feedback

Separate from the main take-home, you must deploy something on Brimble itself. It can be simple. What they care about is the quality and honesty of your feedback about the deploy experience.

You need to submit:

- a link to what you deployed on Brimble
- a short write-up describing:
  - bugs
  - friction points
  - confusing UX
  - missing features
  - what you would change

The JD is explicit that shallow feedback loses points.

## What They Are Looking For

- A system that works end-to-end with a single `docker compose up`
- Live streaming logs, not delayed or post-hoc logs
- Railpack builds that result in runnable images
- Brimble deploy plus useful feedback
- Code structure that would still be maintainable in six months
- A README that explains:
  - your choices
  - what you would do with more time
  - what you would remove or simplify

## What They Are Not Looking For

- Production-grade auth
- Multi-tenancy
- Billing
- Kubernetes
- A polished or fancy UI
- Excessive testing coverage over trivial logic

Their bias is toward a small number of meaningful tests rather than large low-value coverage numbers.

## Bonus Items

These are optional and should only come after the core submission is solid:

- Rollback or redeploy of a previous image tag
- Build cache reuse across deploys
- Graceful shutdown and zero-downtime redeploys

## Interview Process

The role page lists this process:

- Submission review
- Founder walkthrough

The founder walkthrough is expected to cover:

- live debugging
- system design
- walkthrough of your submission

The JD also says reverse proxies, container orchestration, and infrastructure-as-code are likely to come up in interview discussion.

## Submission Checklist

- Public GitHub repo
- `docker-compose.yml` that brings up the full stack on a clean machine
- README with:
  - setup instructions
  - architecture notes
  - optional but strongly preferred 5-10 minute Loom walkthrough
- Sample container app included in the repo or linked
- Rough time spent
- What you would change with another weekend
- Brimble deploy link plus written feedback

## Scoring Rubric

- Hard requirements met (`docker compose`, streaming logs, Brimble feedback): 30%
- End-to-end working system: 20%
- Pipeline design (Railpack build, container runtime, Caddy routing): 20%
- Code quality and project structure: 15%
- Frontend UX and API design: 5%
- Brimble feedback quality: 5%
- README and reasoning: 5%

## Practical Reading Of The JD

If the goal is to maximize your chance of reaching interview, the priorities are clear:

1. Make the submission run cleanly with one command on a fresh machine.
2. Make live log streaming unquestionably real-time.
3. Keep the architecture small, explainable, and stable.
4. Demonstrate good judgment in the README.
5. Give concrete, credible feedback about using Brimble itself.

This is not a design challenge. It is not a Kubernetes challenge. It is not a "build a huge platform" challenge. It is a judgment, systems-thinking, and execution challenge.

## Suggested Application Strategy

To optimize for interview stage, your submission should likely emphasize:

- very small but clear architecture
- strong developer experience
- obvious observability during pipeline execution
- conservative scope control
- crisp README with explicit tradeoffs

A good framing for the repo is:

- "single host, single ingress, single control plane"
- "clear lifecycle model for deployments"
- "real-time logs as a first-class primitive"
- "minimal moving parts, easy local reproduction"

## Next Steps For Us

After this file, the most useful follow-up work is:

1. Turn this JD into an execution plan for the take-home.
2. Design the submission architecture before writing code.
3. Draft the README structure in advance so the implementation matches the story.
4. Prepare likely interview questions from the stack and the scoring rubric.
