import type { IdeasConfig } from "../lib/config.js";
import { saveConfig } from "../lib/config.js";

export interface ConfigureOptions {
  editor?: string;
  modelExpand?: string;
  modelRewrite?: string;
}

export async function runConfigure(config: IdeasConfig, options: ConfigureOptions): Promise<void> {
  if (options.editor) {
    config.editor = options.editor;
  }
  if (options.modelExpand) {
    config.ai.models.expand = options.modelExpand;
  }
  if (options.modelRewrite) {
    config.ai.models.rewrite = options.modelRewrite;
  }
  await saveConfig(config);
  console.log("Saved configuration.");
}

