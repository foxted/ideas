import { generateText } from "ai";

import type { IdeasConfig } from "./config.js";
import { getModelForTask } from "./config.js";

export type AiTask = "expand" | "rewrite";

function requireGatewayKey(): string {
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not set. Export it in this shell, or add it to .env.local / .env in the current directory, or ~/.ideas/.env (IDE and GUI launches often do not load your shell profile).",
    );
  }
  return key;
}

export async function runAiTask(
  config: IdeasConfig,
  task: AiTask,
  prompt: string,
): Promise<string> {
  requireGatewayKey();
  const modelId = getModelForTask(config, task);
  const { text } = await generateText({
    model: modelId,
    prompt,
  });
  return text;
}
