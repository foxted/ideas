import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "./cli.js";

describe("runCli", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints help and exits successfully when no command is provided", async () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await expect(runCli(["node", "ideas"])).resolves.toBeUndefined();

    const output = write.mock.calls.map((call) => String(call[0])).join("");
    expect(output).toContain("Usage: ideas [options] [command]");
    expect(output).toContain("Commands:");
  });
});
