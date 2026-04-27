import type { DeploymentLogRow, DeploymentRow } from "../db/schema.js";

type DeploymentEvent =
  | { type: "log"; data: DeploymentLogRow }
  | { type: "status"; data: DeploymentRow };

type Listener = (event: DeploymentEvent) => void;

export class DeploymentEventBus {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(deploymentId: string, listener: Listener) {
    const existing = this.listeners.get(deploymentId) ?? new Set<Listener>();
    existing.add(listener);
    this.listeners.set(deploymentId, existing);

    return () => {
      const current = this.listeners.get(deploymentId);
      if (!current) {
        return;
      }

      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(deploymentId);
      }
    };
  }

  publish(event: DeploymentEvent) {
    const deploymentId =
      event.type === "log" ? event.data.deploymentId : event.data.id;

    const listeners = this.listeners.get(deploymentId);
    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(event);
    }
  }
}

