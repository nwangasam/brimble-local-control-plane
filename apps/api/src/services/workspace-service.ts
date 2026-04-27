import fs from "node:fs/promises";
import path from "node:path";

import type { DeploymentRow } from "../db/schema.js";
import { env } from "../lib/env.js";
import { ensureDir } from "../lib/fs.js";
import { runCommand } from "../lib/process.js";

type WorkspaceLogger = (stream: "stdout" | "stderr" | "system", message: string) => Promise<void>;

export class WorkspaceService {
  createWorkspacePath(deploymentId: string) {
    return path.join(env.workspacesDir, deploymentId);
  }

  async prepareWorkspace(deployment: DeploymentRow, log: WorkspaceLogger) {
    const workspacePath = deployment.workspacePath ?? this.createWorkspacePath(deployment.id);
    const sourceDir = path.join(workspacePath, "source");

    await fs.rm(workspacePath, { recursive: true, force: true });
    ensureDir(sourceDir);

    if (deployment.sourceType === "git") {
      await log("system", `Cloning ${deployment.sourceValue}`);
      await runCommand({
        command: env.gitBin,
        args: ["clone", "--depth", "1", deployment.sourceValue, sourceDir],
        onStdout: async (line) => log("stdout", line),
        onStderr: async (line) => log("stderr", line)
      });
    } else {
      await this.extractUpload(deployment.sourceValue, sourceDir, log);
    }

    const appPath = await this.resolveAppPath(sourceDir);
    await log("system", `Workspace prepared at ${appPath}`);
    return { workspacePath, appPath };
  }

  private async extractUpload(
    archivePath: string,
    sourceDir: string,
    log: WorkspaceLogger
  ) {
    const lower = archivePath.toLowerCase();
    if (!lower.endsWith(".zip")) {
      throw new Error("Only .zip uploads are supported in the current implementation.");
    }

    await log("system", `Extracting upload ${path.basename(archivePath)}`);
    await runCommand({
      command: env.unzipBin,
      args: ["-q", archivePath, "-d", sourceDir],
      onStdout: async (line) => log("stdout", line),
      onStderr: async (line) => log("stderr", line)
    });
  }

  private async resolveAppPath(sourceDir: string) {
    let currentPath = sourceDir;

    while (true) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      const visibleEntries = entries.filter((entry) => entry.name !== "__MACOSX");

      const containsAppManifest = visibleEntries.some(
        (entry) =>
          entry.isFile() &&
          ["package.json", "Dockerfile", "Procfile"].includes(entry.name)
      );

      if (containsAppManifest) {
        return currentPath;
      }

      if (
        visibleEntries.length === 1 &&
        visibleEntries[0] &&
        visibleEntries[0].isDirectory()
      ) {
        currentPath = path.join(currentPath, visibleEntries[0].name);
        continue;
      }

      return currentPath;
    }
  }
}
