import fs from "node:fs";
import path from "node:path";

export function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function ensureParentDir(filePath: string) {
  ensureDir(path.dirname(filePath));
}

