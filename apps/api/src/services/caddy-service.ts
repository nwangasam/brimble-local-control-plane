import fs from "node:fs/promises";
import path from "node:path";

import { env } from "../lib/env.js";
import { ensureDir } from "../lib/fs.js";
import { runCommand } from "../lib/process.js";

type ServiceLogger = (stream: "stdout" | "stderr" | "system", message: string) => Promise<void>;

export function renderRouteSnippet(routePath: string, target: string) {
  return [
    `redir ${routePath} ${routePath}/ 308`,
    "",
    `handle_path ${routePath}/* {`,
    `  reverse_proxy ${target}`,
    `}`,
    ""
  ].join("\n");
}

export class CaddyService {
  async reconcileRoutes(
    routes: Array<{ deploymentId: string; routePath: string; containerName: string }>
  ) {
    ensureDir(env.caddyGeneratedDir);

    const entries = await fs.readdir(env.caddyGeneratedDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".caddy"))
        .map((entry) => fs.unlink(path.join(env.caddyGeneratedDir, entry.name)))
    );

    await Promise.all(
      routes.map((route) =>
        this.writeRouteSnippet(route.deploymentId, route.routePath, route.containerName)
      )
    );
  }

  async publishRoute(deploymentId: string, routePath: string, containerName: string) {
    ensureDir(env.caddyGeneratedDir);
    return this.writeRouteSnippet(deploymentId, routePath, containerName);
  }

  async removeRoute(deploymentId: string) {
    const snippetPath = path.join(env.caddyGeneratedDir, `${deploymentId}.caddy`);
    await fs.rm(snippetPath, { force: true });
  }

  async reload(log: ServiceLogger) {
    if (!env.caddyReloadCommand) {
      await log("system", "Caddy reload skipped because CADDY_RELOAD_COMMAND is not configured.");
      return;
    }

    const [command, ...args] = env.caddyReloadCommand.split(" ").filter(Boolean);
    if (!command) {
      return;
    }

    await log("system", "Reloading Caddy.");
    await runCommand({
      command,
      args,
      onStdout: async (line) => log("stdout", line),
      onStderr: async (line) => log("stderr", line)
    });
  }

  async verifyRoute(routePath: string, log: ServiceLogger) {
    const url = `${env.caddyPublicBaseUrl}${routePath}`;
    await log("system", `Verifying route ${url}`);

    const response = await fetch(url, { redirect: "manual" });
    if (response.status >= 400) {
      throw new Error(`Route verification failed with status ${response.status} for ${url}`);
    }
  }

  private async writeRouteSnippet(
    deploymentId: string,
    routePath: string,
    containerName: string
  ) {
    const snippetPath = path.join(env.caddyGeneratedDir, `${deploymentId}.caddy`);
    const target = `${containerName}:${env.deploymentTargetPort}`;
    const body = renderRouteSnippet(routePath, target);

    await fs.writeFile(snippetPath, body, "utf8");
    return snippetPath;
  }
}
