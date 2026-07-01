import { describe, expect, it } from "vitest";

import { parseSuggestedTags } from "./tag.js";

describe("parseSuggestedTags", () => {
  it("parses JSON arrays", () => {
    expect(parseSuggestedTags('["AI", "Writing", "ai"]')).toEqual(["ai", "writing"]);
  });

  it("parses fenced JSON arrays", () => {
    expect(parseSuggestedTags('```json\n["local first", "OSS"]\n```')).toEqual([
      "local-first",
      "oss",
    ]);
  });

  it("parses plain text lists", () => {
    expect(parseSuggestedTags("- AI\n- CLI\n- writing tools")).toEqual([
      "ai",
      "cli",
      "writing-tools",
    ]);
  });
});
