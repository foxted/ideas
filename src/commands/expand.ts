import type { IdeasConfig } from "../lib/config.js";
import { findIdeaById, updateIdeaBody } from "../lib/content.js";
import { buildContextMarkdown } from "../lib/context-merge.js";
import { runAiTask } from "../lib/ai.js";

export interface ExpandOptions {
  write?: boolean;
}

export async function runExpand(
  config: IdeasConfig,
  id: string,
  options: ExpandOptions,
): Promise<void> {
  const doc = await findIdeaById(config, id);
  if (!doc) {
    throw new Error(`No idea found with id: ${id}`);
  }

  const context = await buildContextMarkdown(config, {});
  const prompt = [
    "You expand rough ideas into a structured outline with clear sections.",
    "Keep the author's intent. Be concrete and actionable.",
    "",
    "Context:",
    context || "(none)",
    "",
    `Title: ${doc.frontmatter.title}`,
    "",
    "Idea body:",
    doc.body.trim() || "(empty)",
  ].join("\n");

  const text = await runAiTask(config, "expand", prompt);

  if (options.write) {
    await updateIdeaBody(doc, text);
    console.log(`Updated ${doc.filePath}`);
  } else {
    process.stdout.write(`${text}\n`);
  }
}
