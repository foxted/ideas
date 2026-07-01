import fs from "node:fs/promises";
import path from "node:path";

import chalk from "chalk";
import Table from "cli-table3";
import matter from "gray-matter";

import type { IdeasConfig } from "./config.js";
import type { IdeaDocument, IdeaFrontmatter } from "./idea.js";
import { ideaFrontmatterSchema } from "./idea.js";
import { newId } from "./ids.js";
import { ensureDir, stageDir } from "./paths.js";
import { slugify } from "./slug.js";

const stages = ["inbox", "drafts", "posts"] as const;
export type Stage = (typeof stages)[number];

export const validStages: readonly Stage[] = stages;

export interface AddIdeaOptions {
  tags?: string[];
}

export interface SearchIdeasOptions {
  query?: string;
  stage?: Stage;
  tags?: string[];
}

export interface UpdateIdeaTagsOptions {
  replace?: boolean;
}

function parseFrontmatter(data: unknown): IdeaFrontmatter {
  return ideaFrontmatterSchema.parse(data);
}

function ideaFileName(id: string, slug: string): string {
  return `${id}-${slug}.md`;
}

export function normalizeTags(tags: readonly string[] = []): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const tag of tags) {
    const clean = tag
      .trim()
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/\s+/g, "-");
    if (!clean || seen.has(clean)) {
      continue;
    }
    seen.add(clean);
    normalized.push(clean);
  }
  return normalized;
}

export async function addIdea(
  config: IdeasConfig,
  title: string,
  body: string,
  options: AddIdeaOptions = {},
): Promise<string> {
  const inbox = stageDir(config.rootDir, "inbox");
  await ensureDir(inbox);

  const id = newId();
  const slug = slugify(title);
  const now = new Date().toISOString();
  const fm: IdeaFrontmatter = {
    id,
    title: title.trim() || "Untitled",
    slug,
    stage: "inbox",
    tags: normalizeTags(options.tags),
    createdAt: now,
    updatedAt: now,
  };

  const filePath = path.join(inbox, ideaFileName(id, slug));
  const fileContent = matter.stringify(body.trimEnd() ? `${body.trimEnd()}\n` : "\n", fm);
  await fs.writeFile(filePath, fileContent, "utf8");
  return id;
}

export async function listIdeas(config: IdeasConfig): Promise<IdeaDocument[]> {
  const out: IdeaDocument[] = [];
  for (const stage of stages) {
    const dir = stageDir(config.rootDir, stage);
    let names: string[] = [];
    try {
      names = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(".md")) continue;
      const filePath = path.join(dir, name);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      let fm: IdeaFrontmatter;
      try {
        fm = parseFrontmatter(parsed.data);
      } catch {
        continue;
      }
      if (fm.stage !== stage) {
        fm = { ...fm, stage };
      }
      out.push({
        frontmatter: fm,
        body: parsed.content,
        filePath,
      });
    }
  }
  out.sort((a, b) => b.frontmatter.updatedAt.localeCompare(a.frontmatter.updatedAt));
  return out;
}

export async function findIdeaById(config: IdeasConfig, id: string): Promise<IdeaDocument | null> {
  const ideas = await listIdeas(config);
  const found = ideas.find((i) => i.frontmatter.id === id);
  return found ?? null;
}

export async function searchIdeas(
  config: IdeasConfig,
  options: SearchIdeasOptions,
): Promise<IdeaDocument[]> {
  const ideas = await listIdeas(config);
  const query = options.query?.trim().toLowerCase();
  const tags = normalizeTags(options.tags);

  return ideas.filter((idea) => {
    if (options.stage && idea.frontmatter.stage !== options.stage) {
      return false;
    }

    if (tags.length > 0) {
      const ideaTags = new Set(idea.frontmatter.tags);
      if (!tags.every((tag) => ideaTags.has(tag))) {
        return false;
      }
    }

    if (!query) {
      return true;
    }

    const searchable = [
      idea.frontmatter.id,
      idea.frontmatter.title,
      idea.frontmatter.slug,
      idea.frontmatter.stage,
      idea.frontmatter.tags.join(" "),
      idea.body,
    ]
      .join("\n")
      .toLowerCase();

    return searchable.includes(query);
  });
}

const nextStage: Record<Stage, Stage | null> = {
  inbox: "drafts",
  drafts: "posts",
  posts: null,
};

export async function promoteIdea(config: IdeasConfig, id: string): Promise<IdeaDocument> {
  const current = await findIdeaById(config, id);
  if (!current) {
    throw new Error(`No idea found with id: ${id}`);
  }
  const from: Stage = current.frontmatter.stage;
  const to = nextStage[from];
  if (!to) {
    throw new Error(`Idea ${id} is already published (posts).`);
  }

  const now = new Date().toISOString();
  const nextFm: IdeaFrontmatter = {
    ...current.frontmatter,
    stage: to,
    updatedAt: now,
  };

  const destDir = stageDir(config.rootDir, to);
  await ensureDir(destDir);
  const destName = ideaFileName(nextFm.id, nextFm.slug);
  const destPath = path.join(destDir, destName);

  const fileContent = matter.stringify(
    current.body.trimEnd() ? `${current.body.trimEnd()}\n` : "\n",
    nextFm,
  );

  await fs.writeFile(destPath, fileContent, "utf8");
  await fs.unlink(current.filePath);

  return {
    frontmatter: nextFm,
    body: current.body,
    filePath: destPath,
  };
}

function formatStageLabel(stage: Stage): string {
  switch (stage) {
    case "inbox":
      return chalk.cyan(stage);
    case "drafts":
      return chalk.yellow(stage);
    case "posts":
      return chalk.green(stage);
    default:
      return stage;
  }
}

export function formatListTable(ideas: IdeaDocument[]): string {
  if (ideas.length === 0) {
    return chalk.dim("(no ideas yet)");
  }
  const table = new Table({
    head: [
      chalk.bold.cyan("id"),
      chalk.bold.cyan("stage"),
      chalk.bold.cyan("title"),
      chalk.bold.cyan("tags"),
    ],
    wordWrap: false,
    style: {
      border: ["grey"],
      head: [],
    },
  });
  for (const i of ideas) {
    const { id, title, stage, tags } = i.frontmatter;
    const t = title.length > 48 ? `${title.slice(0, 45)}...` : title;
    table.push([
      chalk.bold.white(id),
      formatStageLabel(stage),
      chalk.dim(t),
      chalk.dim(tags.join(", ")),
    ]);
  }
  return table.toString();
}

export async function updateIdeaBody(doc: IdeaDocument, newBody: string): Promise<void> {
  const now = new Date().toISOString();
  const fm: IdeaFrontmatter = { ...doc.frontmatter, updatedAt: now };
  const fileContent = matter.stringify(newBody.trimEnd() ? `${newBody.trimEnd()}\n` : "\n", fm);
  await fs.writeFile(doc.filePath, fileContent, "utf8");
}

export async function updateIdeaTags(
  doc: IdeaDocument,
  tags: readonly string[],
  options: UpdateIdeaTagsOptions = {},
): Promise<string[]> {
  const normalizedTags = normalizeTags(tags);
  const nextTags = options.replace
    ? normalizedTags
    : normalizeTags([...doc.frontmatter.tags, ...normalizedTags]);
  const now = new Date().toISOString();
  const fm: IdeaFrontmatter = { ...doc.frontmatter, tags: nextTags, updatedAt: now };
  const fileContent = matter.stringify(doc.body.trimEnd() ? `${doc.body.trimEnd()}\n` : "\n", fm);
  await fs.writeFile(doc.filePath, fileContent, "utf8");
  return nextTags;
}
