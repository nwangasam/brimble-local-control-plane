import { env } from "../lib/env.js";
import { runCommand } from "../lib/process.js";

type ServiceLogger = (stream: "stdout" | "stderr" | "system", message: string) => Promise<void>;

export class DockerService {
  async replaceContainer(imageTag: string, containerName: string, log: ServiceLogger) {
    await this.removeContainer(containerName, log);

    await log("system", `Starting container ${containerName} from ${imageTag}.`);
    await runCommand({
      command: env.dockerBin,
      args: [
        "run",
        "-d",
        "--name",
        containerName,
        "--network",
        env.dockerNetwork,
        "-e",
        `PORT=${env.deploymentTargetPort}`,
        imageTag
      ],
      onStdout: async (line) => log("stdout", line),
      onStderr: async (line) => log("stderr", line)
    });
  }

  private async removeContainer(containerName: string, log: ServiceLogger) {
    const exitCode = await runCommand({
      command: env.dockerBin,
      args: ["rm", "-f", containerName],
      allowNonZeroExit: true,
      onStdout: async (line) => log("stdout", line),
      onStderr: async () => {}
    });

    if (exitCode === 0) {
      await log("system", `Removed existing container ${containerName}.`);
    }
  }
}
