import fs from "node:fs/promises";
import path from "node:path";

import { defaultConfig, saveConfig, saveModelsRegistry } from "../lib/config.js";
import { bootstrapIdeasRootDir, configPath, ensureDir, expandHomeDir } from "../lib/paths.js";

export async function runInit(): Promise<void> {
  const root = expandHomeDir(bootstrapIdeasRootDir());
  const subdirs = [
    "config",
    "inbox",
    "drafts",
    "posts",
    "context",
    "scratch",
    "templates",
  ];
  for (const d of subdirs) {
    await ensureDir(path.join(root, d));
  }

  const cfgFile = configPath(bootstrapIdeasRootDir());
  try {
    await fs.access(cfgFile);
    console.log("Already initialized. Ensured folders exist.");
    return;
  } catch {
    // create config
  }

  const config = defaultConfig();
  config.rootDir = bootstrapIdeasRootDir();
  await saveConfig(config);

  await saveModelsRegistry(config.rootDir, {
    brainstorm: "openai/gpt-5.4",
    expand: "anthropic/claude-sonnet-4.6",
    rewrite: "openai/gpt-5.4",
  });

  console.log(`Initialized ideas at ${root}`);
}
