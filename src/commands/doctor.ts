import fs from "node:fs/promises";
import path from "node:path";

import chalk from "chalk";

import { loadConfig } from "../lib/config.js";
import { bootstrapIdeasRootDir, configPath, expandHomeDir, stageDir } from "../lib/paths.js";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
  required: boolean;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function commandExists(command: string): Promise<boolean> {
  const executable = command.trim().split(/\s+/)[0];
  if (!executable) {
    return false;
  }

  if (executable.includes(path.sep)) {
    return exists(expandHomeDir(executable));
  }

  const pathEntries = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    if (await exists(path.join(entry, executable))) {
      return true;
    }
  }
  return false;
}

function formatCheck(result: CheckResult): string {
  const marker = result.ok ? chalk.green("ok") : result.required ? chalk.red("fail") : chalk.yellow("warn");
  return `${marker} ${result.name}: ${result.detail}`;
}

export async function runDoctor(): Promise<boolean> {
  const configuredRoot = bootstrapIdeasRootDir();
  const expandedRoot = expandHomeDir(configuredRoot);
  const checks: CheckResult[] = [];

  checks.push({
    name: "IDEAS_HOME",
    ok: true,
    detail: `${configuredRoot} (${expandedRoot})`,
    required: false,
  });

  const cfgPath = configPath(configuredRoot);
  const hasConfig = await exists(cfgPath);
  checks.push({
    name: "config",
    ok: hasConfig,
    detail: hasConfig ? cfgPath : `missing at ${cfgPath}; run \`ideas init\``,
    required: true,
  });

  if (!hasConfig) {
    for (const check of checks) {
      console.log(formatCheck(check));
    }
    return false;
  }

  try {
    const config = await loadConfig();
    const requiredDirs = ["inbox", "drafts", "posts", "context", "scratch", "templates"] as const;
    for (const dir of requiredDirs) {
      const dirPath =
        dir === "inbox" || dir === "drafts" || dir === "posts"
          ? stageDir(config.rootDir, dir)
          : path.join(expandHomeDir(config.rootDir), dir);
      const ok = await exists(dirPath);
      checks.push({
        name: `${dir}/`,
        ok,
        detail: ok ? dirPath : `missing at ${dirPath}; run \`ideas init\``,
        required: true,
      });
    }

    const editorOk = await commandExists(config.editor);
    checks.push({
      name: "editor",
      ok: editorOk,
      detail: editorOk ? config.editor : `not found on PATH: ${config.editor}`,
      required: false,
    });

    const hasAiKey = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());
    checks.push({
      name: "AI_GATEWAY_API_KEY",
      ok: hasAiKey,
      detail: hasAiKey ? "set" : "not set; AI commands will fail until configured",
      required: false,
    });
  } catch (error) {
    checks.push({
      name: "config parse",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      required: true,
    });
  }

  for (const check of checks) {
    console.log(formatCheck(check));
  }

  return checks.every((check) => check.ok || !check.required);
}
