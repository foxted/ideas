# ideas-cli

**ideas** is a local-first command-line tool for capturing ideas as Markdown on disk—no server, no database. Optional helpers call models through the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) (via the [`ai`](https://sdk.vercel.ai/docs) SDK) to expand or rewrite note bodies using your own context files.

## What it does

- **Stores ideas** under a configurable home directory (default `~/.ideas`) as `.md` files with YAML frontmatter (`id`, `title`, `slug`, `stage`, timestamps).
- **Stages workflow**: each idea lives in **inbox** → **drafts** → **posts** (`promote` moves files between folders and updates frontmatter).
- **Lists and opens** ideas in a table; you can pass an id or use an interactive picker when stdin/stdout are a TTY.
- **AI (optional)**: `expand` turns a rough note into a structured outline; `rewrite` improves clarity while preserving meaning. Both merge optional Markdown from `context/` into the prompt. `context build` prints or writes that merged context for inspection or reuse.

## How it works

1. **Initialization** — `ideas init` creates `config/`, `inbox/`, `drafts/`, `posts/`, `context/`, `scratch/`, `templates/`, writes `config/config.json` (defaults for editor and AI model ids), and `config/models.json` (registry snapshot; reserved for future use).

2. **Files** — New ideas are saved as `{id}-{slug}.md` in `inbox/`. The `id` is a 16-byte hex string. Bodies are Markdown after the frontmatter (parsed with [gray-matter](https://github.com/jonschlinkert/gray-matter)).

3. **Config** — `config.json` is validated with Zod. Paths like `~/.ideas` are expanded from the home directory. Override the root with `IDEAS_HOME` (used when resolving `config.json` location at bootstrap).

4. **Environment** — Before commands run, the CLI loads env files in order without overriding existing variables: `./.env.local`, `./.env`, then `~/.ideas/.env`. This helps GUI apps and editors that do not load your shell profile.

5. **AI** — `expand` / `rewrite` call `generateText` from the `ai` package with a model id string (e.g. `anthropic/claude-sonnet-4.6`). The gateway expects `AI_GATEWAY_API_KEY`. Model ids per task come from `config.ai.models.expand` and `config.ai.models.rewrite` (see defaults in the repo’s `src/lib/config.ts`).

6. **Context merge** — If present, these files under `context/` are concatenated into the prompt with headings: `profile.md`, `voice.md`, `themes.md`, `projects.md`, `examples.md`. `ideas context build --source <file>` appends an extra **Source** section from that file.

7. **Build** — The published binary is a single ESM bundle from `src/bin/ideas.ts` (tsup), shebanged for `node`.

For broader design goals and a longer-term command list, see [`SPEC.md`](./SPEC.md). The CLI currently implements the commands below; other commands listed in the spec are not shipped yet.

## Requirements

- Node.js 20+

## Install (local / dev)

```bash
npm install
npm run build
```

Run the CLI:

```bash
node dist/ideas.js --help
```

Link globally (optional):

```bash
npm link
ideas --help
```

## Quick start

```bash
ideas init
ideas add "My first idea" --body "Some notes"
ideas list
ideas promote <id>          # or: ideas promote   (interactive picker)
ideas open <id>             # or: ideas open     (interactive picker)
```

## AI commands

Set `AI_GATEWAY_API_KEY` (from the [Vercel dashboard](https://vercel.com/) for AI Gateway). Optionally pin models:

```bash
ideas configure --model-expand openai/gpt-5.4 --model-rewrite openai/gpt-5.4
```

```bash
ideas expand <id>           # print to stdout
ideas expand <id> --write # replace idea body with output
ideas rewrite <id>
ideas rewrite <id> --write
ideas context build --source path/to/file.md -o /tmp/context.md
```

Optional context files: `~/.ideas/context/profile.md`, `voice.md`, `themes.md`, `projects.md`, `examples.md` (paths follow `IDEAS_HOME` if set).

## Environment

| Variable | Description |
|----------|-------------|
| `IDEAS_HOME` | Root directory for config and data (default: `~/.ideas`). |
| `AI_GATEWAY_API_KEY` | Required for `expand` and `rewrite`. |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Bundle CLI with tsup (`dist/ideas.js`) |
| `npm run dev` | Run CLI with tsx (`src/bin/ideas.ts`) |
| `npm test` | Vitest |
| `npm run release` | changeset publish |

## Layout

See [`SPEC.md`](./SPEC.md) for the full directory layout and principles.
