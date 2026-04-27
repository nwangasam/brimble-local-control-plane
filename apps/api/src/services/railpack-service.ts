import { env } from "../lib/env.js";
import { runCommand } from "../lib/process.js";

type ServiceLogger = (stream: "stdout" | "stderr" | "system", message: string) => Promise<void>;

export class RailpackService {
  async buildImage(projectDir: string, imageTag: string, log: ServiceLogger) {
    await log("system", `Building image ${imageTag} with Railpack.`);
    await log(
      "system",
      "First-time Railpack builds can take a while because builder/runtime images must be pulled."
    );

    await runCommand({
      command: env.railpackBin,
      args: ["build", "--name", imageTag, "--progress", "plain", projectDir],
      env: {
        RAILPACK_VERBOSE: "1",
        MISE_HTTP_TIMEOUT: "5m",
        MISE_FETCH_REMOTE_VERSIONS_TIMEOUT: "2m",
        MISE_HTTP_RETRIES: "5"
      },
      onStdout: async (line) => log("stdout", line),
      onStderr: async (line) => log("stderr", line)
    });
  }
}
