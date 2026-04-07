import { z } from "zod";

export const workspaceSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  jurisdiction: z.string().default("General"),
  tags: z.array(z.string()).default([]),
  defaultChatMode: z.enum([
    "research",
    "case-brief",
    "jurisprudence-comparison",
    "drafting",
    "review",
    "study"
  ]),
  preferredCitationStyle: z.string().default("Bluebook"),
  preferredWritingMode: z.string().default("Professional"),
  preferredProvider: z.string().default("local"),
  preferredModel: z.string().default("auto"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const workspaceActivitySchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  kind: z.enum(["document", "chat", "draft", "note", "authority"]),
  timestamp: z.string(),
  detail: z.string()
});

export const createWorkspaceSchema = workspaceSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceActivity = z.infer<typeof workspaceActivitySchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
