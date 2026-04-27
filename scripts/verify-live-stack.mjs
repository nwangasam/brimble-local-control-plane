import { mkdtemp, readFile, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const BASE_URL = process.env.BRIMBLE_BASE_URL ?? "http://127.0.0.1:8080";
const GIT_URL =
  process.env.BRIMBLE_TEST_GIT_URL ??
  "https://github.com/heroku/node-js-getting-started";
const SAMPLE_APP_DIR = resolve(
  process.env.BRIMBLE_SAMPLE_APP_DIR ?? "sample-apps/hello-node"
);
const DEPLOY_TIMEOUT_MS = Number(process.env.BRIMBLE_DEPLOY_TIMEOUT_MS ?? 12 * 60_000);
const POLL_INTERVAL_MS = Number(process.env.BRIMBLE_POLL_INTERVAL_MS ?? 5_000);
const PRECHECK_TIMEOUT_MS = Number(process.env.BRIMBLE_PRECHECK_TIMEOUT_MS ?? 60_000);

async function main() {
  console.log(`Verifying live stack at ${BASE_URL}`);

  const health = await getJson("/api/health");
  if (!health?.ok) {
    throw new Error("Health check failed.");
  }
  console.log("Health check passed.");

  await waitForIdleQueue();

  const gitResult = await runGitDeploymentFlow();
  const uploadResult = await runUploadDeploymentFlow();

  console.log("");
  console.log("Verification summary");
  printSummary("git", gitResult);
  printSummary("upload", uploadResult);
}

async function runGitDeploymentFlow() {
  console.log("");
  console.log(`Starting git deployment test with ${GIT_URL}`);

  const payload = {
    sourceType: "git",
    gitUrl: GIT_URL
  };

  const response = await fetch(`${BASE_URL}/api/deployments`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  await assertResponse(response, 201, "create git deployment");
  const created = await response.json();
  const deployment = created.deployment;
  console.log(`Created git deployment ${deployment.id}`);

  return await verifyDeploymentLifecycle(deployment.id);
}

async function runUploadDeploymentFlow() {
  console.log("");
  console.log(`Starting upload deployment test with ${SAMPLE_APP_DIR}`);

  const archivePath = await createSampleZip(SAMPLE_APP_DIR);

  try {
    const form = new FormData();
    form.set("sourceType", "upload");
    form.set(
      "file",
      new File([await readFile(archivePath)], basename(archivePath), {
        type: "application/zip"
      })
    );

    const response = await fetch(`${BASE_URL}/api/deployments`, {
      method: "POST",
      body: form
    });

    await assertResponse(response, 201, "create upload deployment");
    const created = await response.json();
    const deployment = created.deployment;
    console.log(`Created upload deployment ${deployment.id}`);

    return await verifyDeploymentLifecycle(deployment.id);
  } finally {
    await rm(dirname(archivePath), { recursive: true, force: true });
  }
}

async function waitForIdleQueue() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < PRECHECK_TIMEOUT_MS) {
    const deployments = (await getJson("/api/deployments")).deployments;
    const active = deployments.filter((deployment) =>
      ["pending", "building", "deploying"].includes(deployment.status)
    );

    if (active.length === 0) {
      console.log("Queue precheck passed. No active deployments are blocking the verifier.");
      return;
    }

    console.log(
      `Waiting for queue to go idle before verification. Active: ${active.map((deployment) => `${deployment.id}:${deployment.status}`).join(", ")}`
    );
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    "Queue precheck timed out. There are still active deployments in progress, so verifier results would be ambiguous."
  );
}

async function verifyDeploymentLifecycle(deploymentId) {
  const sse = startSseCapture(deploymentId);
  const startedAt = Date.now();
  const seenStatuses = new Set();
  let deployment = null;
  let logs = [];

  try {
    while (Date.now() - startedAt < DEPLOY_TIMEOUT_MS) {
      deployment = (await getJson(`/api/deployments/${deploymentId}`)).deployment;
      logs = (await getJson(`/api/deployments/${deploymentId}/logs`)).logs;

      seenStatuses.add(deployment.status);
      printProgress(deployment, logs);

      if (deployment.status === "running") {
        await verifyRoute(deployment.routePath);
        break;
      }

      if (deployment.status === "failed") {
        throw new Error(
          `Deployment ${deploymentId} failed: ${deployment.failureReason ?? "Unknown failure"}`
        );
      }

      await sleep(POLL_INTERVAL_MS);
    }

    if (!deployment || deployment.status !== "running") {
      throw new Error(`Deployment ${deploymentId} timed out before reaching running.`);
    }

    const events = await sse.stop();
    const logEventCount = events.filter((event) => event.event === "log").length;
    const statusEventCount = events.filter((event) => event.event === "status").length;
    const readyEventCount = events.filter((event) => event.event === "ready").length;

    if (readyEventCount === 0) {
      throw new Error(`Deployment ${deploymentId} SSE stream never emitted a ready event.`);
    }

    if (logs.length === 0) {
      throw new Error(`Deployment ${deploymentId} completed without persisted logs.`);
    }

    return {
      deployment,
      logsCount: logs.length,
      seenStatuses: [...seenStatuses],
      sse: {
        readyEventCount,
        statusEventCount,
        logEventCount
      }
    };
  } catch (error) {
    const events = await sse.stop();
    console.error("");
    console.error(`SSE snapshot for ${deploymentId}: ${events.length} events captured.`);
    throw error;
  }
}

function startSseCapture(deploymentId) {
  const controller = new AbortController();
  const events = [];
  const started = readSseStream(`${BASE_URL}/api/deployments/${deploymentId}/events`, {
    signal: controller.signal,
    onEvent(event) {
      if (event.event !== "ping") {
        events.push(event);
      }
    }
  }).catch((error) => {
    if (controller.signal.aborted) {
      return;
    }

    throw error;
  });

  return {
    async stop() {
      controller.abort();
      await started;
      return events;
    }
  };
}

async function readSseStream(url, { signal, onEvent }) {
  const response = await fetch(url, {
    headers: {
      accept: "text/event-stream"
    },
    signal
  });

  await assertResponse(response, 200, `open SSE stream ${url}`);

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });

    while (buffer.includes("\n\n")) {
      const boundary = buffer.indexOf("\n\n");
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const parsed = parseSseEvent(rawEvent);
      if (parsed) {
        onEvent(parsed);
      }
    }
  }
}

function parseSseEvent(rawEvent) {
  const lines = rawEvent.split("\n");
  let event = "message";
  const data = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      data.push(line.slice(5).trim());
    }
  }

  if (data.length === 0) {
    return null;
  }

  let parsedData = null;
  try {
    parsedData = JSON.parse(data.join("\n"));
  } catch {
    parsedData = data.join("\n");
  }

  return {
    event,
    data: parsedData
  };
}

async function verifyRoute(routePath) {
  if (!routePath) {
    throw new Error("Deployment has no routePath.");
  }

  const response = await fetch(`${BASE_URL}${routePath}`, {
    redirect: "manual"
  });

  if (response.status >= 400) {
    throw new Error(`Route verification failed for ${routePath} with status ${response.status}.`);
  }
}

async function createSampleZip(sampleAppDir) {
  const tempDir = await mkdtemp(join(tmpdir(), "brimble-upload-"));
  const archivePath = join(tempDir, "hello-node.zip");
  const parentDir = dirname(sampleAppDir);
  const folderName = basename(sampleAppDir);

  try {
    await execFileAsync("zip", ["-qr", archivePath, folderName], {
      cwd: parentDir
    });
  } catch (error) {
    throw new Error(
      `Failed to create upload archive with zip. Ensure the 'zip' command is available. ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return archivePath;
}

async function getJson(pathname) {
  const response = await fetch(`${BASE_URL}${pathname}`);
  await assertResponse(response, 200, `GET ${pathname}`);
  return await response.json();
}

async function assertResponse(response, expectedStatus, label) {
  if (response.status === expectedStatus) {
    return;
  }

  const body = await response.text();
  throw new Error(`${label} failed with status ${response.status}: ${body}`);
}

function printProgress(deployment, logs) {
  const lastLog = logs.at(-1);
  const lastLine = lastLog ? `${lastLog.phase}/${lastLog.stream}: ${truncate(lastLog.message, 120)}` : "no logs yet";
  console.log(
    `[${deployment.id}] status=${deployment.status} logs=${logs.length} last=${lastLine}`
  );
}

function printSummary(label, result) {
  console.log(`${label}: ${result.deployment.id}`);
  console.log(`  final status: ${result.deployment.status}`);
  console.log(`  route: ${result.deployment.routePath}`);
  console.log(`  image: ${result.deployment.imageTag}`);
  console.log(`  logs captured: ${result.logsCount}`);
  console.log(`  statuses seen: ${result.seenStatuses.join(" -> ")}`);
  console.log(
    `  sse events: ready=${result.sse.readyEventCount} status=${result.sse.statusEventCount} log=${result.sse.logEventCount}`
  );
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

main().catch((error) => {
  console.error("");
  console.error("Live stack verification failed.");
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
