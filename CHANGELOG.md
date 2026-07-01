# ideas-cli

## Unreleased

### Minor Changes

- Add tags to idea frontmatter, `ideas search`, and `ideas doctor`.
- Add a copy-paste demo workflow to the README.
- Add a `typecheck` script for strict TypeScript validation.

## 0.1.3

### Patch Changes

- 18ef798: Silence dotenv v17 `[dotenv@…] injecting env` messages by passing `quiet: true` in `loadCliEnv()`.

## 0.1.2

### Patch Changes

- be7718e: Run `npm run build` in `prepublishOnly` so published packages include `dist` and the `ideas` bin works after install. Document installing from npm as `ideas-cli` (the `ideas` name is used by another package on npm).

## 0.1.1

### Patch Changes

- afd62ec: Initial public release: local-first markdown ideas under `~/.ideas`, AI helpers (`expand`, `rewrite`), and `ideas configure` for editor and models.
