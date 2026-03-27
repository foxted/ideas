import { config } from "dotenv";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Loads env files before the rest of the CLI. Does not override variables
 * already present in `process.env` (e.g. from the shell).
 *
 * Order: cwd `.env.local`, cwd `.env`, `~/.ideas/.env`
 */
export function loadCliEnv(): void {
  const cwd = process.cwd();
  const paths = [
    resolve(cwd, ".env.local"),
    resolve(cwd, ".env"),
    join(homedir(), ".ideas", ".env"),
  ];
  for (const path of paths) {
    if (existsSync(path)) {
      config({ path, override: false, quiet: true });
    }
  }
}
