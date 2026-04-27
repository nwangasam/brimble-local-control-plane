import path from "node:path";

const rootDir = process.cwd();
const dataDir = process.env.DATA_DIR ?? path.join(rootDir, "data");

export const env = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 3001),
  pipelineMode: process.env.PIPELINE_MODE ?? "stub",
  databasePath: process.env.DATABASE_PATH ?? path.join(dataDir, "sqlite", "app.db"),
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(dataDir, "uploads"),
  workspacesDir: process.env.WORKSPACES_DIR ?? path.join(dataDir, "workspaces"),
  caddyGeneratedDir: process.env.CADDY_GENERATED_DIR ?? path.join(dataDir, "caddy", "generated"),
  caddyPublicBaseUrl: process.env.CADDY_PUBLIC_BASE_URL ?? "http://127.0.0.1:8080",
  caddyReloadCommand: process.env.CADDY_RELOAD_COMMAND ?? "",
  deploymentTargetPort: Number(process.env.DEPLOYMENT_TARGET_PORT ?? 3000),
  gitBin: process.env.GIT_BIN ?? "git",
  unzipBin: process.env.UNZIP_BIN ?? "unzip",
  railpackBin: process.env.RAILPACK_BIN ?? "railpack",
  dockerBin: process.env.DOCKER_BIN ?? "docker",
  dockerNetwork: process.env.DOCKER_NETWORK ?? "brimble",
  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};
