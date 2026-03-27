import { loadCliEnv } from "../lib/load-env.js";

loadCliEnv();

const { runCli } = await import("../cli.js");

await runCli(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
