# ideas-cli

**ideas** is a local-first command-line tool for capturing ideas as Markdown on disk—no server, no database. Optional helpers call models through the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) (via the [`ai`](https://sdk.vercel.ai/docs) SDK) to expand or rewrite note bodies using your own context files.

## What it does

- **Stores ideas** under a configurable home directory (default `~/.ideas`) as `.md` files with YAML frontmatter (`id`, `title`, `slug`, `stage`, timestamps).
- **Stages workflow**: each idea lives in **inbox** → **drafts** → **posts** (`promote` moves files between folders and updates frontmatter).
- **Tags and search**: attach repeatable tags during capture, then search by text, stage, or tag.
- **Lists and opens** ideas in a table; you can pass an id or use an interactive picker when stdin/stdout are a TTY.
- **Health checks**: `ideas doctor` validates config, folders, editor availability, and optional AI setup.
- **AI (optional)**: `expand` turns a rough note into a structured outline; `rewrite` improves clarity while preserving meaning; `tag` suggests reusable tags and can write them to frontmatter. AI commands merge optional Markdown from `context/` into the prompt. `context build` prints or writes that merged context for inspection or reuse.

## How it works

1. **Initialization** — `ideas init` creates `config/`, `inbox/`, `drafts/`, `posts/`, `context/`, `scratch/`, `templates/`, writes `config/config.json` (defaults for editor and AI model ids), and `config/models.json` (registry snapshot; reserved for future use).

2. **Files** — New ideas are saved as `{id}-{slug}.md` in `inbox/`. The `id` is a 16-byte hex string. Bodies are Markdown after the frontmatter (parsed with [gray-matter](https://github.com/jonschlinkert/gray-matter)). Tags are stored as a `tags` array in frontmatter.

3. **Config** — `config.json` is validated with Zod. Paths like `~/.ideas` are expanded from the home directory. Override the root with `IDEAS_HOME` (used when resolving `config.json` location at bootstrap).

4. **Environment** — Before commands run, the CLI loads env files in order without overriding existing variables: `./.env.local`, `./.env`, then `~/.ideas/.env`. This helps GUI apps and editors that do not load your shell profile.

5. **AI** — `expand` / `rewrite` call `generateText` from the `ai` package with a model id string (e.g. `anthropic/claude-sonnet-4.6`). The gateway expects `AI_GATEWAY_API_KEY`. Model ids per task come from `config.ai.models.expand` and `config.ai.models.rewrite` (see defaults in the repo’s `src/lib/config.ts`).

6. **Context merge** — If present, these files under `context/` are concatenated into the prompt with headings: `profile.md`, `voice.md`, `themes.md`, `projects.md`, `examples.md`. `ideas context build --source <file>` appends an extra **Source** section from that file.

7. **Build** — The published binary is a single ESM bundle from `src/bin/ideas.ts` (tsup), shebanged for `node`.

For broader design goals and a longer-term command list, see [`SPEC.md`](./SPEC.md). The CLI currently implements the commands below; other commands listed in the spec are not shipped yet.

## Requirements

- Node.js 22+

## Install from npm

The package is published as **`ideas-cli`**. The [`ideas`](https://www.npmjs.com/package/ideas) name on npm belongs to another project, so this CLI is not installable as `npm install -g ideas`.

```bash
npm install -g ideas-cli
```

After install, the command you run is still **`ideas`** (see [Quick start](#quick-start)).

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
ideas doctor
ideas add "My first idea" --body "Some notes" --tag writing --tag oss
ideas list
ideas search "notes" --tag writing
ideas promote <id>          # or: ideas promote   (interactive picker)
ideas open <id>             # or: ideas open     (interactive picker)
```

## Demo

Run this against a temporary ideas home so it does not touch your real notes:

```bash
export IDEAS_HOME="$(mktemp -d)"

ideas init
ideas doctor

IDEA_ID="$(
  ideas add "Local-first writing workflow" \
    --body "A tiny CLI that captures rough notes, adds context, and turns them into publishable drafts." \
    --tag writing \
    --tag ai \
    --tag oss
)"

ideas list
ideas search "publishable" --tag ai
ideas promote "$IDEA_ID"
ideas list
```

Expected shape:

```text
Initialized ideas at /tmp/tmp...
ok IDEAS_HOME: /tmp/tmp... (/tmp/tmp...)
ok config: /tmp/tmp.../config/config.json
...
┌──────────────────────────────────┬────────┬──────────────────────────────┬──────────────────┐
│ id                               │ stage  │ title                        │ tags             │
├──────────────────────────────────┼────────┼──────────────────────────────┼──────────────────┤
│ ...                              │ inbox  │ Local-first writing workflow │ writing, ai, oss │
└──────────────────────────────────┴────────┴──────────────────────────────┴──────────────────┘
```

## AI commands

Set `AI_GATEWAY_API_KEY` (from the [Vercel dashboard](https://vercel.com/) for AI Gateway). Optionally pin models:

```bash
ideas configure --model-expand openai/gpt-5.4 --model-rewrite openai/gpt-5.4 --model-tag openai/gpt-5.4
```

```bash
ideas expand <id>           # print to stdout
ideas expand <id> --write # replace idea body with output
ideas rewrite <id>
ideas rewrite <id> --write
ideas tag <id>              # print suggested tags
ideas tag <id> --write      # merge suggested tags into frontmatter
ideas tag <id> --write --replace --max 3
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
| `npm run typecheck` | TypeScript strict-mode check |
| `npm run release` | changeset publish |

## Layout

See [`SPEC.md`](./SPEC.md) for the full directory layout and principles.
