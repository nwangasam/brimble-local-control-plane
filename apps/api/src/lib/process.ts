import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

type StreamLogger = (line: string) => Promise<void> | void;

type RunCommandOptions = {
  command: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  onStdout?: StreamLogger;
  onStderr?: StreamLogger;
  allowNonZeroExit?: boolean;
};

export async function runCommand(options: RunCommandOptions) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(options.command, options.args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    child.once("error", (error) => {
      reject(new Error(`Failed to start ${options.command}: ${error.message}`));
    });

    if (child.stdout && options.onStdout) {
      const stdout = createInterface({ input: child.stdout });
      stdout.on("line", (line) => {
        void options.onStdout?.(line);
      });
    }

    if (child.stderr && options.onStderr) {
      const stderr = createInterface({ input: child.stderr });
      stderr.on("line", (line) => {
        void options.onStderr?.(line);
      });
    }

    child.once("close", (code) => {
      const exitCode = code ?? 0;
      if (exitCode !== 0 && !options.allowNonZeroExit) {
        reject(
          new Error(
            `Command failed (${exitCode}): ${[options.command, ...options.args].join(" ")}`
          )
        );
        return;
      }

      resolve(exitCode);
    });
  });
}

