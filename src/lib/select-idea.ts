import select from "@inquirer/select";

import type { IdeasConfig } from "./config.js";
import { listIdeas } from "./content.js";

export async function resolveIdeaId(config: IdeasConfig, id: string | undefined): Promise<string> {
  const trimmed = id?.trim();
  if (trimmed) {
    return trimmed;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "Idea id is required in non-interactive mode. Pass <id> or run `ideas list` to see ids.",
    );
  }

  const ideas = await listIdeas(config);
  if (ideas.length === 0) {
    throw new Error('No ideas yet. Add one with `ideas add "Title"`.');
  }

  return select({
    message: "Select an idea",
    choices: ideas.map((i) => {
      const { id: ideaId, title, stage } = i.frontmatter;
      const shortTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;
      return {
        name: `${ideaId}  ${stage}  ${shortTitle}`,
        value: ideaId,
      };
    }),
  });
}
