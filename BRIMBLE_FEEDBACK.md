# Brimble Deploy Feedback

Use this file for the separate Brimble deployment requirement. Keep the feedback concrete, product-facing, and evidence-based.

The strongest version of this document reads like field notes from actually using the platform, not generic praise.

## Deployment

- Date: 2026-04-27
- App deployed: `nodejs-getting-started`
- Brimble deployment URL: Pending final successful deploy URL
- Repo or source used: `https://github.com/nwangasam/nodejs-getting-started`
- Approximate deployment duration: Multi-minute deploy attempt based on the deployment history screenshots
- Deployment type: `Git`

Note:

- The feedback below is based on actual product screenshots and operator observations.
- A few points are marked as inference where the UI suggested behavior but the screenshot alone did not prove the exact internal cause.

## What Went Smoothly

Focus on steps that were fast, clear, or confidence-inspiring.

- Connecting GitHub and selecting the repository appears straightforward. The repo picker and project creation entry point are easy to find.
- The project creation form exposes the major setup knobs in one place: branch, root directory, framework, build command, install command, output directory, and secrets.
- Deployment history is visually accessible from the project view, and there is at least a clear path to inspect historical attempts and open raw logs.

## Friction Points

Focus on moments where you had to slow down, retry, guess, or inspect extra information.

Useful prompts:

- Was any step slower than expected without enough feedback?
- Did any label, status, or button feel ambiguous?
- Did you have to infer what the platform was doing?

- The deploy setup mixed `Node.js` detection with static-site concepts like `Output directory: dist` and `Build command: npm run build`. For a server-style starter app, that immediately created uncertainty about whether the platform had classified the project correctly.
- I could not quickly tell whether the failure was caused by the project type, the build configuration, the runtime model, or missing environment configuration. The UI exposed many settings, but not enough guidance about which ones were actually required for this repo shape.
- The separation between deployment record, build phase, runtime phase, logs, and variables was not obvious. The interface felt more like one long deployment surface than a clearly staged pipeline.

## Bugs Or Confusing Behavior

Write these as specific observations.

Good format:

- "I did X, expected Y, but saw Z."
- "The deploy appeared healthy, but the route was not yet reachable."
- "The UI reported success before logs made that believable."

- I selected a public Node.js starter repository that works in my local control plane, expected a conventional Node deploy path, but the setup form still looked oriented toward a static-site deployment. That made the deploy type feel ambiguous before the deploy even started.
- I expected to be able to distinguish build failure from runtime failure quickly, but the deployment history and log views did not make that boundary clear enough. I had to infer too much from the combined log stream.
- I expected the active variables/secrets context for the deployment to be more visible while debugging. From the screenshots, it was not obvious which secrets applied to the failing deployment or whether the failure was related to config versus code.

## Missing Features Or Product Gaps

Focus on missing pieces that would have reduced uncertainty or manual debugging.

Examples:

- clearer build-progress visibility
- stronger error classification
- route/readiness verification feedback
- easier access to raw build logs
- deployment history and rollback hints

- A clearer distinction between project types up front: static site, Node server, container/image deploy, database, and so on.
- Stronger phase separation in the deploy UI: source import, build, release/deploy, runtime health, and logs should feel like different stages rather than one blended activity stream.
- Better deployment-context visibility: show the effective branch, root directory, build command, start/runtime model, and variables used for the currently selected deployment.
- A tighter failure summary near the top of the deployment view so the operator does not need to scroll raw logs first to understand what kind of failure occurred.

## What I Would Change

Prioritize the changes by impact.

Recommended format:

1. Highest-value product or DX improvement
2. What problem it solves
3. Why it matters for a first-time operator

- Add explicit deployment-mode guidance and validation before the first deploy.
  - Problem solved: It reduces the chance that a server app is configured with static-site assumptions or vice versa.
  - Why it matters: First-time operators need confidence that the platform understands the repo before they spend time debugging a bad default.

- Split the deployment experience into visible phases.
  - Problem solved: It becomes easier to answer “did build fail, did release fail, or did runtime fail?”
  - Why it matters: Debugging speed depends heavily on fast failure classification.

- Make deployment context and variables visible from the deployment record itself.
  - Problem solved: Operators can verify the exact config that produced a given failure without jumping between unrelated tabs.
  - Why it matters: In deployment products, most confusion comes from config drift and hidden assumptions, not only from app code.

## Overall Assessment

Keep this direct. The take-home explicitly rewards honest feedback more than polite generic praise.

Suggested framing:

- what felt strong
- what created uncertainty
- whether you would trust the current deploy experience for repeated use

The strongest part of the experience is that Brimble already looks and feels like a real platform rather than a toy deploy tool. The repo import and project setup flow are visually credible, and the deployment history view suggests the right product direction.

The main weakness is clarity. I did not feel confident about the system’s mental model when deploying a simple public Node.js starter. The interface exposed many controls, but it did not clearly explain whether I was configuring a static site, a server app, or some hybrid build path. That ambiguity made the failure harder to reason about than it should have been.

I would trust the platform direction, but not yet the deploy ergonomics for a first-time operator. The biggest opportunity is not more features. It is sharper separation of deployment type, deployment phase, and deployment configuration so the operator can form the right mental model quickly.
