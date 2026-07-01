import type { IdeasConfig } from "../lib/config.js";
import { findIdeaById, normalizeTags, updateIdeaTags } from "../lib/content.js";
import { buildContextMarkdown } from "../lib/context-merge.js";
import { runAiTask } from "../lib/ai.js";

export interface TagOptions {
  max?: number;
  replace?: boolean;
  write?: boolean;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseSuggestedTags(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (isStringArray(parsed)) {
      return normalizeTags(parsed);
    }
  } catch {
    // Fall back to parsing common plain-text model output below.
  }

  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(withoutFence) as unknown;
    if (isStringArray(parsed)) {
      return normalizeTags(parsed);
    }
  } catch {
    // Fall back to parsing common plain-text model output below.
  }

  return normalizeTags(
    withoutFence
      .split(/[\n,]/)
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean),
  );
}

function clampMaxTags(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) {
    return 5;
  }
  return Math.min(Math.max(Math.trunc(value), 1), 12);
}

export async function runTag(
  config: IdeasConfig,
  id: string,
  options: TagOptions,
): Promise<void> {
  const doc = await findIdeaById(config, id);
  if (!doc) {
    throw new Error(`No idea found with id: ${id}`);
  }

  const maxTags = clampMaxTags(options.max);
  const context = await buildContextMarkdown(config, {});
  const prompt = [
    "Suggest concise lowercase tags for this idea.",
    `Return only a JSON array of ${maxTags} or fewer strings.`,
    "Use short reusable labels, not full sentences.",
    "Avoid duplicating existing tags unless they are still relevant.",
    "",
    "Context:",
    context || "(none)",
    "",
    `Title: ${doc.frontmatter.title}`,
    `Existing tags: ${doc.frontmatter.tags.length > 0 ? doc.frontmatter.tags.join(", ") : "(none)"}`,
    "",
    "Idea body:",
    doc.body.trim() || "(empty)",
  ].join("\n");

  const text = await runAiTask(config, "tag", prompt);
  const tags = parseSuggestedTags(text).slice(0, maxTags);

  if (tags.length === 0) {
    throw new Error("AI did not return any usable tags.");
  }

  if (options.write) {
    const nextTags = await updateIdeaTags(doc, tags, { replace: options.replace });
    console.log(`Updated tags: ${nextTags.join(", ")}`);
    return;
  }

  process.stdout.write(`${tags.join("\n")}\n`);
}
