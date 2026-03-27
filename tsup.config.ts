import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin/ideas.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
