# ideas CLI — SPEC.md

## Overview

`ideas` is a local-first TypeScript CLI that helps developers and creators:

1. Capture ideas instantly
2. Organize them as markdown files
3. Expand and transform them using AI
4. Maintain a structured, agent-friendly content system
5. Use Vercel AI SDK + AI Gateway for model routing

All data is stored locally under `~/.ideas` using markdown files with YAML frontmatter.

---

## Core Principles

- Local-first (no backend)
- Markdown-native (no database)
- Low friction (fast capture)
- AI is optional, not required
- Agent-friendly file structure
- Minimal configuration, extensible later

---

## Tech Stack

- Node.js (>=20)
- TypeScript (ESM)
- CLI: `commander` or `cac`
- AI: `ai` (Vercel AI SDK)
- Validation: `zod`
- Frontmatter: `gray-matter`
- Build: `tsup`
- Testing: `vitest`

---

## Directory Structure

```
~/.ideas/
  config/
    config.json
    models.json
  inbox/
  drafts/
  posts/
  context/
  scratch/
  templates/
```

---

## CLI Commands

### Core
- init
- configure
- add
- list
- open
- promote
- move
- search

### AI
- brainstorm
- expand
- rewrite
- repurpose
- summarize
- classify
- context build

---

## Config Example

```json
{
  "rootDir": "~/.ideas",
  "editor": "code",
  "ai": {
    "models": {
      "brainstorm": "openai/gpt-5.4",
      "expand": "anthropic/claude-sonnet-4.6",
      "rewrite": "openai/gpt-5.4"
    }
  }
}
```

---

## Scripts

```json
{
  "build": "tsup src/bin/ideas.ts",
  "dev": "tsx src/bin/ideas.ts",
  "test": "vitest",
  "release": "changeset publish"
}
```

---

## Final Note

If something feels slow or complex, it’s wrong.
