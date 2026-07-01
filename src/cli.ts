import { createRequire } from "node:module";

import { Command } from "commander";

import { runConfigure } from "./commands/configure.js";
import { runContextBuild } from "./commands/context-build.js";
import { runDoctor } from "./commands/doctor.js";
import { runExpand } from "./commands/expand.js";
import { runInit } from "./commands/init.js";
import { runOpen } from "./commands/open.js";
import { runRewrite } from "./commands/rewrite.js";
import {
  addIdea,
  formatListTable,
  listIdeas,
  promoteIdea,
  searchIdeas,
  validStages,
} from "./lib/content.js";
import { loadConfig } from "./lib/config.js";
import { resolveIdeaId } from "./lib/select-idea.js";
import type { Stage } from "./lib/content.js";

const requirePackageJson = createRequire(import.meta.url);

function packageVersion(): string {
  const packageJson = requirePackageJson("../package.json") as unknown;
  if (
    packageJson &&
    typeof packageJson === "object" &&
    "version" in packageJson &&
    typeof packageJson.version === "string"
  ) {
    return packageJson.version;
  }
  return "0.0.0";
}

function collectValues(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function parseStage(value: string): Stage {
  if (validStages.includes(value as Stage)) {
    return value as Stage;
  }
  throw new Error(`Invalid stage "${value}". Expected one of: ${validStages.join(", ")}`);
}

async function requireConfig() {
  try {
    return await loadConfig();
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String((e as NodeJS.ErrnoException).code) : "";
    if (code === "ENOENT") {
      throw new Error("Config not found. Run `ideas init` first.");
    }
    throw e;
  }
}

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();
  program.name("ideas").description("Local-first ideas CLI").version(packageVersion());

  program
    .command("init")
    .description("Create ~/.ideas layout and default config")
    .action(async () => {
      await runInit();
    });

  program
    .command("configure")
    .description("Update editor and AI model IDs")
    .option("--editor <command>", "Editor command (e.g. code, vim)")
    .option("--model-expand <id>", "Model id for expand (AI Gateway)")
    .option("--model-rewrite <id>", "Model id for rewrite (AI Gateway)")
    .action(async (opts: { editor?: string; modelExpand?: string; modelRewrite?: string }) => {
      if (!opts.editor && !opts.modelExpand && !opts.modelRewrite) {
        throw new Error("Provide at least one of --editor, --model-expand, --model-rewrite");
      }
      const config = await requireConfig();
      await runConfigure(config, opts);
    });

  program
    .command("add")
    .description("Add an idea to the inbox")
    .argument("<title>", "Idea title")
    .option("--body <text>", "Markdown body")
    .option("--tag <tag>", "Tag to add (repeatable)", collectValues, [])
    .action(async (title: string, opts: { body?: string; tag: string[] }) => {
      const config = await requireConfig();
      const id = await addIdea(config, title, opts.body ?? "", { tags: opts.tag });
      console.log(id);
    });

  program
    .command("list")
    .description("List ideas across inbox, drafts, and posts")
    .action(async () => {
      const config = await requireConfig();
      const ideas = await listIdeas(config);
      console.log(formatListTable(ideas));
    });

  program
    .command("search")
    .description("Search ideas by text, stage, and tags")
    .argument("[query]", "Text to search in title, body, id, slug, stage, and tags")
    .option("--stage <stage>", "Filter by stage: inbox, drafts, or posts")
    .option("--tag <tag>", "Filter by tag (repeatable)", collectValues, [])
    .action(async (query: string | undefined, opts: { stage?: string; tag: string[] }) => {
      const config = await requireConfig();
      const ideas = await searchIdeas(config, {
        query,
        stage: opts.stage ? parseStage(opts.stage) : undefined,
        tags: opts.tag,
      });
      console.log(formatListTable(ideas));
    });

  program
    .command("promote")
    .description("Move an idea to the next stage (inbox → drafts → posts)")
    .argument("[id]", "Idea id (interactive picker if omitted)")
    .action(async (id: string | undefined) => {
      const config = await requireConfig();
      const resolved = await resolveIdeaId(config, id);
      const doc = await promoteIdea(config, resolved);
      console.log(`Promoted to ${doc.frontmatter.stage}: ${doc.filePath}`);
    });

  program
    .command("open")
    .description("Open an idea in the configured editor")
    .argument("[id]", "Idea id (interactive picker if omitted)")
    .action(async (id: string | undefined) => {
      const config = await requireConfig();
      const resolved = await resolveIdeaId(config, id);
      await runOpen(config, resolved);
    });

  program
    .command("expand")
    .description("Expand an idea with AI (stdout unless --write)")
    .argument("[id]", "Idea id (interactive picker if omitted)")
    .option("--write", "Replace idea body with the model output")
    .action(async (id: string | undefined, opts: { write?: boolean }) => {
      const config = await requireConfig();
      const resolved = await resolveIdeaId(config, id);
      await runExpand(config, resolved, { write: opts.write });
    });

  program
    .command("rewrite")
    .description("Rewrite an idea with AI (stdout unless --write)")
    .argument("[id]", "Idea id (interactive picker if omitted)")
    .option("--write", "Replace idea body with the model output")
    .action(async (id: string | undefined, opts: { write?: boolean }) => {
      const config = await requireConfig();
      const resolved = await resolveIdeaId(config, id);
      await runRewrite(config, resolved, { write: opts.write });
    });

  const context = program.command("context").description("Context helpers");

  context
    .command("build")
    .description("Merge profile, voice, themes, projects, examples, and optional source")
    .option("--source <path>", "Append this file as the Source section")
    .option("-o, --output <file>", "Write to file instead of stdout")
    .action(async (opts: { source?: string; output?: string }) => {
      const config = await requireConfig();
      await runContextBuild(config, { source: opts.source, output: opts.output });
    });

  program
    .command("doctor")
    .description("Check config, folders, editor, and optional AI setup")
    .action(async () => {
      const ok = await runDoctor();
      if (!ok) {
        process.exitCode = 1;
      }
    });

  await program.parseAsync(argv);
}
