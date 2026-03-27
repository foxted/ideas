import { spawn } from "node:child_process";

import type { IdeasConfig } from "../lib/config.js";
import { findIdeaById } from "../lib/content.js";

export async function runOpen(config: IdeasConfig, id: string): Promise<void> {
  const idea = await findIdeaById(config, id);
  if (!idea) {
    throw new Error(`No idea found with id: ${id}`);
  }
  const child = spawn(config.editor, [idea.filePath], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
