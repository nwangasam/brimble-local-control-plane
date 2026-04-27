# Brimble Interview Prep

Based on:

- [brimble-fullstack-infra-engineer.md](./brimble-fullstack-infra-engineer.md)
- [brimble-application-strategy.md](./brimble-application-strategy.md)

## Interview Reality

If you reach the founder walkthrough, they are not just reviewing code quality. They are testing whether you can reason through systems behavior live.

Expect pressure around:

- infra fundamentals
- failure handling
- reverse proxy behavior
- runtime tradeoffs
- why you chose one design over another

The strongest posture is calm, explicit, and concrete. Do not bluff. If something is a deliberate simplification for the take-home, say so directly and explain why.

## Your Core Story

You need one clean narrative for the whole submission:

"I optimized for a local-first, evaluator-friendly deployment system with a minimal number of moving parts. I kept the architecture small, made deployment state explicit, treated live logs as a first-class part of the product, and ensured everything runs end-to-end behind a single Caddy ingress with one `docker compose up`."

Everything in the interview should reduce back to this.

## Questions They Are Likely To Ask

### Why TypeScript instead of Go?

Strong answer:

- it aligns with the preferred stack in the JD
- it let me move faster across frontend and backend with one language
- it reduced mental overhead for a time-boxed system
- the tradeoff is runtime efficiency, but that was not the bottleneck for this exercise

### Why SQLite instead of Postgres?

Strong answer:

- evaluator simplicity mattered more than multi-user concurrency
- SQLite reduced operational overhead for `docker compose up`
- persistence needs here are modest and local
- in production I would likely revisit this if write concurrency, retention, or operational scale changed

### Why SSE instead of WebSocket?

Strong answer:

- the log flow is primarily one-way from server to client
- SSE is simpler to implement, debug, and reconnect
- it keeps the transport model narrow and appropriate to the problem
- if I needed client-to-server interactive control events later, I would reconsider WebSocket

### Why path-based routing instead of host-based routing?

Strong answer:

- local evaluator ergonomics
- avoids DNS and wildcard host complexity
- still demonstrates reverse proxy routing clearly
- I chose the simpler local path unless the task explicitly rewarded host routing

### Why not add Kubernetes or a fuller scheduler?

Strong answer:

- the JD explicitly said not to use Kubernetes
- this task rewards clarity of pipeline reasoning, not orchestration breadth
- adding a scheduler would increase complexity without improving the scoring criteria

### How does your deployment lifecycle work?

Be ready to explain:

1. request accepted
2. deployment persisted as `pending`
3. background worker begins build
4. logs emitted in real time
5. image tag captured
6. status moves to `deploying`
7. container started
8. Caddy route updated
9. health or route check performed
10. final state set to `running` or `failed`

### How do you handle failures?

Good answer should include:

- catch failures at each stage
- emit a system log entry with context
- persist failure reason
- update deployment state to `failed`
- keep historical logs available for diagnosis
- avoid leaving state ambiguous

### How do logs persist and stream at the same time?

Good answer:

- pipeline output is normalized into log events
- each event is both persisted and pushed to active SSE subscribers
- the UI loads historical logs first, then appends live events
- this avoids losing context on refresh or reconnection

### How does Caddy fit into your architecture?

Good answer:

- it is the single ingress point
- it fronts frontend and API traffic
- it also routes traffic to deployed app containers
- keeping ingress centralized mirrors the JD's architecture concern

### What would you change in production?

Be ready with specific upgrades:

- stronger container isolation
- better cleanup and garbage collection
- more robust job queueing and retries
- health checks and rollout strategy
- secrets handling
- persistent artifact/build cache
- better route reconciliation
- richer observability and metrics

## Questions They May Use To Probe Depth

### What happens if two deployments are triggered at once?

Good answer depends on implementation, but should mention:

- unique workspace, image, and container names
- serialized or bounded concurrency if needed
- avoiding shared mutable state collisions
- why your current choice fits the take-home scope

### How do you avoid marking a deployment as running too early?

Strong answer:

- only set `running` after container start and route verification succeed
- if route verification fails, mark the deployment `failed` or keep it in `deploying` until timeout

### How would you support rollback?

Good answer:

- retain built image tags by deployment
- switch route target back to a previous healthy container
- preserve deployment history and current active route mapping

### What are the weakest parts of your implementation?

This is a high-value question. Answer honestly.

Good candidates for a deliberate admission:

- no hardened sandboxing around user-submitted apps
- local single-node assumptions
- lightweight persistence choice
- limited retry logic
- simplified route update coordination

This answer becomes strong if it shows awareness instead of defensiveness.

## Live Debugging Readiness

Assume they may ask you to inspect something during the walkthrough.

Be ready to quickly locate:

- where deployment status changes are managed
- where logs are emitted and persisted
- where SSE subscriptions are handled
- where Railpack is invoked
- where Caddy routing is generated or reloaded
- where error transitions happen

If you have to hunt through the codebase for these, the structure is too loose.

## Technical Topics To Refresh Before Interview

Study these enough to speak clearly, not academically:

- reverse proxy basics
- path-based versus host-based routing
- SSE lifecycle and reconnect behavior
- container image tagging
- container runtime basics
- build pipeline failure handling
- idempotency in orchestration flows
- health checks
- Nomad, Consul, and Vault at a conceptual level

## Brimble-Specific Bonus Angle

Because they mention Nomad, Consul, and Vault, have a short informed answer ready even if you did not use them.

Example angle:

- Nomad would be a better long-term scheduler once deployments need placement, rescheduling, and service lifecycle management beyond a local single-host runtime
- Consul would help with service discovery and potentially dynamic routing integration
- Vault would be the right direction once deployments require real secret injection rather than local defaults

That is enough. Do not pretend deep hands-on experience if you do not have it.

## What Good Interview Answers Sound Like

Good answers are:

- short
- concrete
- tradeoff-aware
- grounded in the actual submission

Weak answers are:

- generic
- overconfident
- full of buzzwords
- detached from your code

## Questions You Should Ask Them

If you get the chance, ask sharp questions that show product and systems awareness.

Examples:

- "What failure modes do you see most often in your real deployment pipeline?"
- "How much of the platform complexity today comes from orchestration versus networking versus build reliability?"
- "When you evaluate infra engineers, what differentiates someone who can debug effectively in your environment?"
- "How much of your current developer experience roadmap is constrained by infra primitives versus product decisions?"

These are better than generic questions about company culture.

## Founder Walkthrough Checklist

Before interview, make sure you can demo in this order without confusion:

1. architecture overview
2. create deployment flow
3. live logs during build
4. image tag visibility
5. Caddy-routed app running
6. failure path
7. code structure for lifecycle and logs
8. tradeoffs and next steps

## Final Interview Rule

Never oversell the submission. A compact system with clear boundaries is stronger than a noisy one with fragile extras.
