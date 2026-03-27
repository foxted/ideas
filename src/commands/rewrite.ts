import type { IdeasConfig } from "../lib/config.js";
import { findIdeaById, updateIdeaBody } from "../lib/content.js";
import { buildContextMarkdown } from "../lib/context-merge.js";
import { runAiTask } from "../lib/ai.js";

export interface RewriteOptions {
  write?: boolean;
}

export async function runRewrite(
  config: IdeasConfig,
  id: string,
  options: RewriteOptions,
): Promise<void> {
  const doc = await findIdeaById(config, id);
  if (!doc) {
    throw new Error(`No idea found with id: ${id}`);
  }

  const context = await buildContextMarkdown(config, {});
  const prompt = [
    "Rewrite the following idea for clarity and flow. Preserve meaning.",
    "Match the voice implied by the context when possible.",
    "",
    "Context:",
    context || "(none)",
    "",
    `Title: ${doc.frontmatter.title}`,
    "",
    "Idea body:",
    doc.body.trim() || "(empty)",
  ].join("\n");

  const text = await runAiTask(config, "rewrite", prompt);

  if (options.write) {
    await updateIdeaBody(doc, text);
    console.log(`Updated ${doc.filePath}`);
  } else {
    process.stdout.write(`${text}\n`);
  }
}
