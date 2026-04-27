import assert from "node:assert/strict";
import test from "node:test";

import { DeploymentEventBus } from "./event-bus.js";

test("DeploymentEventBus publishes only to listeners for the matching deployment", () => {
  const eventBus = new DeploymentEventBus();
  const received: string[] = [];

  eventBus.subscribe("dep_a", (event) => {
    received.push(`${event.type}:${event.type === "log" ? event.data.deploymentId : event.data.id}`);
  });

  eventBus.subscribe("dep_b", (event) => {
    received.push(`other:${event.type === "log" ? event.data.deploymentId : event.data.id}`);
  });

  eventBus.publish({
    type: "status",
    data: {
      id: "dep_a",
      sourceType: "git",
      sourceValue: "https://example.com/repo.git",
      status: "building",
      imageTag: null,
      routePath: "/d/dep_a",
      containerName: null,
      workspacePath: "/tmp/dep_a",
      failureReason: null,
      createdAt: "2026-04-27T00:00:00.000Z",
      updatedAt: "2026-04-27T00:00:00.000Z",
      startedAt: null,
      finishedAt: null
    }
  });

  assert.deepEqual(received, ["status:dep_a"]);
});

test("DeploymentEventBus unsubscribe removes the listener", () => {
  const eventBus = new DeploymentEventBus();
  let calls = 0;

  const unsubscribe = eventBus.subscribe("dep_a", () => {
    calls += 1;
  });

  unsubscribe();

  eventBus.publish({
    type: "log",
    data: {
      id: "log_1",
      deploymentId: "dep_a",
      phase: "build",
      stream: "stdout",
      message: "hello",
      createdAt: "2026-04-27T00:00:00.000Z"
    }
  });

  assert.equal(calls, 0);
});
