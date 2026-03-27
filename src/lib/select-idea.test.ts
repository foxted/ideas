import { describe, expect, it } from "vitest";

import type { IdeasConfig } from "./config.js";
import { resolveIdeaId } from "./select-idea.js";

const mockConfig = {
  rootDir: "/nonexistent-ideas-root",
  editor: "code",
  ai: { models: {} },
} as IdeasConfig;

function patchIsTTY(
  stream: NodeJS.ReadStream | NodeJS.WriteStream,
  value: boolean,
): () => void {
  const prev = Object.getOwnPropertyDescriptor(stream, "isTTY");
  Object.defineProperty(stream, "isTTY", {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });
  return () => {
    if (prev) {
      Object.defineProperty(stream, "isTTY", prev);
    } else {
      delete (stream as { isTTY?: boolean }).isTTY;
    }
  };
}

describe("resolveIdeaId", () => {
  it("returns trimmed id when provided", async () => {
    await expect(resolveIdeaId(mockConfig, "  abc12  ")).resolves.toBe("abc12");
  });

  it("throws when id omitted and stdin is not a TTY", async () => {
    const restoreIn = patchIsTTY(process.stdin, false);
    const restoreOut = patchIsTTY(process.stdout, true);
    try {
      await expect(resolveIdeaId(mockConfig, undefined)).rejects.toThrow(
        /Idea id is required in non-interactive mode/,
      );
    } finally {
      restoreIn();
      restoreOut();
    }
  });

  it("throws when id omitted and stdout is not a TTY", async () => {
    const restoreIn = patchIsTTY(process.stdin, true);
    const restoreOut = patchIsTTY(process.stdout, false);
    try {
      await expect(resolveIdeaId(mockConfig, undefined)).rejects.toThrow(
        /Idea id is required in non-interactive mode/,
      );
    } finally {
      restoreIn();
      restoreOut();
    }
  });
});
