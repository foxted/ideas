import { z } from "zod";

export const ideaFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  stage: z.enum(["inbox", "drafts", "posts"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IdeaFrontmatter = z.infer<typeof ideaFrontmatterSchema>;

export interface IdeaDocument {
  frontmatter: IdeaFrontmatter;
  body: string;
  filePath: string;
}
