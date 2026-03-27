import { describe, expect, it } from "vitest";

import { slugify } from "./slug.js";

describe("slugify", () => {
  it("normalizes text", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("falls back for empty input", () => {
    expect(slugify("!!!")).toBe("idea");
  });
});
