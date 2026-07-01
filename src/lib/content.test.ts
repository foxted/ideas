import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import stripAnsi from "strip-ansi";
import { describe, expect, it } from "vitest";

import {
  addIdea,
  findIdeaById,
  formatListTable,
  listIdeas,
  normalizeTags,
  searchIdeas,
  updateIdeaTags,
} from "./content.js";
import type { IdeasConfig } from "./config.js";
import type { IdeaDocument } from "./idea.js";

const baseDoc = {
  body: "",
  filePath: "/tmp/idea.md",
};

function doc(frontmatter: IdeaDocument["frontmatter"]): IdeaDocument {
  return { ...baseDoc, frontmatter };
}

describe("formatListTable", () => {
  it("returns a message when there are no ideas", () => {
    expect(stripAnsi(formatListTable([]))).toBe("(no ideas yet)");
  });

  it("renders aligned columns with borders", () => {
    const ideas: IdeaDocument[] = [
      doc({
        id: "abc12",
        title: "Short",
        slug: "short",
        stage: "inbox",
        tags: [],
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      }),
      doc({
        id: "xyz789012",
        title: "A".repeat(50),
        slug: "long",
        stage: "drafts",
        tags: ["ai", "writing"],
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-03T00:00:00.000Z",
      }),
    ];
    expect(stripAnsi(formatListTable(ideas))).toMatchSnapshot();
  });

  it("does not use tab characters between columns", () => {
    const ideas: IdeaDocument[] = [
      doc({
        id: "id1",
        title: "T",
        slug: "t",
        stage: "posts",
        tags: [],
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      }),
    ];
    expect(formatListTable(ideas)).not.toContain("\t");
  });
});

describe("normalizeTags", () => {
  it("trims, lowercases, de-duplicates, and removes leading hashes", () => {
    expect(normalizeTags([" AI ", "#Writing", "ai", "two words"])).toEqual([
      "ai",
      "writing",
      "two-words",
    ]);
  });
});

describe("ideas storage and search", () => {
  async function tempConfig(): Promise<IdeasConfig> {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ideas-cli-test-"));
    return {
      rootDir,
      editor: "code",
      ai: { models: {} },
    };
  }

  it("stores tags in frontmatter when adding an idea", async () => {
    const config = await tempConfig();
    const id = await addIdea(config, "Build a tiny CLI", "Use markdown files.", {
      tags: ["OSS", "CLI"],
    });

    const ideas = await listIdeas(config);
    expect(ideas).toHaveLength(1);
    expect(ideas[0]?.frontmatter.id).toBe(id);
    expect(ideas[0]?.frontmatter.tags).toEqual(["oss", "cli"]);
  });

  it("searches by body text, stage, and tags", async () => {
    const config = await tempConfig();
    await addIdea(config, "Portfolio demo", "Record a concise terminal demo.", {
      tags: ["oss", "demo"],
    });
    await addIdea(config, "Private scratch", "Something unrelated.", {
      tags: ["scratch"],
    });

    const textMatches = await searchIdeas(config, { query: "terminal" });
    expect(textMatches.map((idea) => idea.frontmatter.title)).toEqual(["Portfolio demo"]);

    const tagMatches = await searchIdeas(config, { tags: ["demo"], stage: "inbox" });
    expect(tagMatches.map((idea) => idea.frontmatter.title)).toEqual(["Portfolio demo"]);
  });

  it("updates tags by merging or replacing frontmatter", async () => {
    const config = await tempConfig();
    const id = await addIdea(config, "Taggable idea", "Keep this body.", {
      tags: ["existing"],
    });
    const doc = await findIdeaById(config, id);
    expect(doc).not.toBeNull();
    if (!doc) {
      return;
    }

    const merged = await updateIdeaTags(doc, ["AI", "existing"]);
    expect(merged).toEqual(["existing", "ai"]);

    const updated = await findIdeaById(config, id);
    expect(updated?.frontmatter.tags).toEqual(["existing", "ai"]);
    expect(updated?.body.trim()).toBe("Keep this body.");

    if (!updated) {
      return;
    }
    const replaced = await updateIdeaTags(updated, ["writing"], { replace: true });
    expect(replaced).toEqual(["writing"]);
    expect((await findIdeaById(config, id))?.frontmatter.tags).toEqual(["writing"]);
  });
});
