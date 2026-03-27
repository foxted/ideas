import stripAnsi from "strip-ansi";
import { describe, expect, it } from "vitest";

import { formatListTable } from "./content.js";
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
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      }),
      doc({
        id: "xyz789012",
        title: "A".repeat(50),
        slug: "long",
        stage: "drafts",
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
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      }),
    ];
    expect(formatListTable(ideas)).not.toContain("\t");
  });
});
