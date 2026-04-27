# Brimble Deploy Feedback

## Deployment

- Date: 2026-04-27
- App deployed: `nodejs-getting-started`
- Brimble deploy URL: `https://nodejs-getting-started.brimble.app/`
- Repo used: `https://github.com/nwangasam/nodejs-getting-started`
- Deployment type used: Git-based deploy

## What Went Smoothly

- Connecting GitHub and selecting the repository was straightforward.
- The project creation flow looked credible and product-like from the start.
- Deployment history and logs were accessible from the project view.
- I was able to get a public Brimble-hosted URL for the app.

## Friction Points

- The biggest source of confusion was deploy type classification. I was deploying a simple Node.js starter app, but the setup flow still looked oriented toward a static-site model.
- The form exposed fields like output directory and frontend-style build assumptions at the same time that the framework was detected as `Node.js`, which reduced confidence in whether the platform had classified the project correctly.
- I could not quickly tell whether a problem was caused by deploy type, build configuration, runtime configuration, or missing environment setup.
- The separation between deployment history, build logs, runtime behavior, and variables was not clear enough for a first-time operator.

## Bugs Or Confusing Behavior

- I deployed a public Node.js starter repository that works in my own local control plane, but Brimble’s setup flow still made it feel like I was configuring a static site unless I upgraded access to change the site type.
- I expected to distinguish build failure from runtime failure quickly, but the deployment history and log views did not make that boundary obvious enough.
- I expected variables and deploy configuration to be more visible from the active deployment context while debugging.

## Missing Features Or Product Gaps

- A clearer distinction between deployment types up front: static site, Node.js web service, container/image deploy, database, and so on.
- Stronger phase separation in the deployment experience: source import, build, release, runtime health, and logs should feel like distinct stages.
- Better visibility into the effective deployment context: branch, root directory, build command, runtime model, and variables for the selected deployment.
- A tighter failure summary near the top of the deployment view so the operator does not have to read the full raw log stream first.

## What I Would Change

1. Add explicit deployment-mode guidance and validation before the first deploy.
   - This would reduce the chance that a server app is configured with static-site assumptions or vice versa.
   - For a first-time operator, the biggest trust signal is whether the platform clearly understands the repo shape before the deploy starts.

2. Split build, deploy, and runtime into more visible phases.
   - This would make it easier to answer “what stage failed?” immediately.
   - Faster failure classification would make the platform much easier to debug and trust.

3. Surface deployment context and variables from the deployment record itself.
   - Operators should not need to jump between multiple tabs to confirm the config that produced a failure.
   - A deployment product becomes much easier to reason about when config, logs, and deploy status are connected in one place.

## Overall Assessment

Brimble already feels like a real platform rather than a toy deploy tool. The repo import and project setup flow are visually credible, and the deployment history view suggests the right product direction.

The main weakness I ran into was clarity. I did not feel fully confident about the system’s mental model when deploying a simple public Node.js starter app. The interface exposed useful controls, but it did not clearly explain whether I was configuring a static site, a server app, or some hybrid build path. That ambiguity made the failure harder to reason about than it should have been.

I trust the direction of the product, but I think first-time deploy ergonomics and deploy-type clarity are the biggest opportunities to improve.
