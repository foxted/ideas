import fs from "node:fs/promises";
import path from "node:path";

import type { IdeasConfig } from "./config.js";
import { contextDir } from "./paths.js";

const CONTEXT_FILES = [
  { heading: "Profile", file: "profile.md" },
  { heading: "Voice", file: "voice.md" },
  { heading: "Themes", file: "themes.md" },
  { heading: "Projects", file: "projects.md" },
  { heading: "Examples", file: "examples.md" },
] as const;

export interface BuildContextOptions {
  sourcePath?: string;
}

export async function buildContextMarkdown(
  config: IdeasConfig,
  options: BuildContextOptions = {},
): Promise<string> {
  const base = contextDir(config.rootDir);
  const parts: string[] = [];

  for (const { heading, file } of CONTEXT_FILES) {
    const p = path.join(base, file);
    try {
      const text = await fs.readFile(p, "utf8");
      if (text.trim()) {
        parts.push(`## ${heading}\n\n${text.trim()}\n`);
      }
    } catch {
      // missing file is fine
    }
  }

  if (options.sourcePath) {
    const text = await fs.readFile(options.sourcePath, "utf8");
    parts.push(`## Source\n\n${text.trim()}\n`);
  }

  return parts.join("\n");
}
