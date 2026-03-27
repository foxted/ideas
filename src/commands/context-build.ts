import fs from "node:fs/promises";

import type { IdeasConfig } from "../lib/config.js";
import { buildContextMarkdown } from "../lib/context-merge.js";

export interface ContextBuildOptions {
  source?: string;
  output?: string;
}

export async function runContextBuild(
  config: IdeasConfig,
  options: ContextBuildOptions,
): Promise<void> {
  const md = await buildContextMarkdown(config, { sourcePath: options.source });
  if (options.output) {
    await fs.writeFile(options.output, `${md}\n`, "utf8");
    console.log(`Wrote ${options.output}`);
  } else {
    process.stdout.write(`${md}\n`);
  }
}
