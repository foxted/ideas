import fs from "node:fs/promises";

import { z } from "zod";

import {
  bootstrapIdeasRootDir,
  configDir,
  configPath,
  ensureDir,
  expandHomeDir,
  modelsPath,
} from "./paths.js";

const defaultModels = {
  brainstorm: "openai/gpt-5.4",
  expand: "anthropic/claude-sonnet-4.6",
  rewrite: "openai/gpt-5.4",
} as const;

export const configSchema = z.object({
  rootDir: z.string().default("~/.ideas"),
  editor: z.string().default("code"),
  ai: z
    .object({
      models: z
        .object({
          brainstorm: z.string().optional(),
          expand: z.string().optional(),
          rewrite: z.string().optional(),
        })
        .default({}),
    })
    .default({ models: {} }),
});

export type IdeasConfig = z.infer<typeof configSchema>;

export const modelsRegistrySchema = z.record(z.string(), z.string());

export type ModelsRegistry = z.infer<typeof modelsRegistrySchema>;

export function defaultConfig(): IdeasConfig {
  return configSchema.parse({
    rootDir: "~/.ideas",
    editor: "code",
    ai: {
      models: { ...defaultModels },
    },
  });
}

export function getModelForTask(
  config: IdeasConfig,
  task: keyof typeof defaultModels,
): string {
  const fromConfig = config.ai.models[task];
  if (fromConfig) return fromConfig;
  return defaultModels[task];
}

export async function loadConfig(): Promise<IdeasConfig> {
  const path = configPath(bootstrapIdeasRootDir());
  const raw = await fs.readFile(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return configSchema.parse(parsed);
}

export async function saveConfig(config: IdeasConfig): Promise<void> {
  const root = expandHomeDir(config.rootDir);
  await ensureDir(`${root}/config`);
  const path = configPath(config.rootDir);
  const body = `${JSON.stringify(config, null, 2)}\n`;
  await fs.writeFile(path, body, "utf8");
}

export async function saveModelsRegistry(rootDir: string, registry: ModelsRegistry): Promise<void> {
  await ensureDir(configDir(rootDir));
  const path = modelsPath(rootDir);
  const body = `${JSON.stringify(registry, null, 2)}\n`;
  await fs.writeFile(path, body, "utf8");
}
