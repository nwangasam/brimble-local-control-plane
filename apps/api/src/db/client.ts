import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "../lib/env.js";
import { ensureParentDir } from "../lib/fs.js";
import * as schema from "./schema.js";

ensureParentDir(env.databasePath);

const sqlite = createClient({
  url: `file:${env.databasePath}`
});

await sqlite.execute(`
  CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_value TEXT NOT NULL,
    status TEXT NOT NULL,
    image_tag TEXT,
    route_path TEXT,
    container_name TEXT,
    workspace_path TEXT,
    failure_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT
  )
`);

await sqlite.execute(`
  CREATE TABLE IF NOT EXISTS deployment_logs (
    id TEXT PRIMARY KEY,
    deployment_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    stream TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

await sqlite.execute(`
  CREATE INDEX IF NOT EXISTS deployment_logs_deployment_id_created_at_idx
  ON deployment_logs (deployment_id, created_at)
`);

export const db = drizzle(sqlite, { schema });
