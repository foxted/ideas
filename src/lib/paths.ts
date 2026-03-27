import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function bootstrapIdeasRootDir(): string {
  return process.env.IDEAS_HOME ?? "~/.ideas";
}

export function expandHomeDir(input: string): string {
  if (input === "~" || input.startsWith("~/")) {
    const rest = input === "~" ? "" : input.slice(2);
    return path.join(os.homedir(), rest);
  }
  return path.resolve(input);
}

export function ideasRootFromConfig(rootDir: string): string {
  return expandHomeDir(rootDir);
}

export function configDir(rootDir: string): string {
  return path.join(ideasRootFromConfig(rootDir), "config");
}

export function configPath(rootDir: string): string {
  return path.join(configDir(rootDir), "config.json");
}

export function modelsPath(rootDir: string): string {
  return path.join(configDir(rootDir), "models.json");
}

export function stageDir(rootDir: string, stage: "inbox" | "drafts" | "posts"): string {
  return path.join(ideasRootFromConfig(rootDir), stage);
}

export function contextDir(rootDir: string): string {
  return path.join(ideasRootFromConfig(rootDir), "context");
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}
