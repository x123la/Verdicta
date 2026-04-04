import { z } from "zod";
import { createWorkspaceSchema, workspaceActivitySchema, workspaceSchema } from "./workspace";
import {
  documentDetailSchema,
  documentSchema,
  documentSearchResultSchema,
  importDocumentsSchema,
  listDocumentsSchema,
  reindexDocumentSchema,
  searchDocumentsSchema
} from "./document";
import {
  chatResponseSchema,
  chatSessionSchema,
  sendChatMessageSchema,
  chatMessageSchema
} from "./chat";
import { settingsSchema, updateSettingsSchema, providerHealthSchema } from "./settings";
import {
  caseBriefSchema,
  jurisprudenceComparisonSchema,
  memoOutlineSchema,
  studyModeSchema,
  supportReviewSchema,
  workflowRunSchema
} from "./legal-workflows";

const noteSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  documentIdNullable: z.string().nullable(),
  title: z.string(),
  contentJson: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const draftSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  draftType: z.enum([
    "case-brief",
    "legal-memo",
    "argument-section",
    "study-summary",
    "class-note-summary"
  ]),
  contentJson: z.string(),
  sourceMapJson: z.string(),
  verificationStatus: z.enum(["verified", "partial", "unsupported", "pending"]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ipcSchemas = {
  "workspace:create": {
    input: createWorkspaceSchema,
    output: workspaceSchema
  },
  "workspace:list": {
    input: z.void(),
    output: z.array(workspaceSchema)
  },
  "workspace:activity": {
    input: z.object({ workspaceId: z.string() }),
    output: z.array(workspaceActivitySchema)
  },
  "documents:import": {
    input: importDocumentsSchema,
    output: z.array(documentSchema)
  },
  "documents:list": {
    input: listDocumentsSchema,
    output: z.array(documentSchema)
  },
  "documents:search": {
    input: searchDocumentsSchema,
    output: z.array(documentSearchResultSchema)
  },
  "documents:get": {
    input: z.object({ documentId: z.string() }),
    output: documentDetailSchema.nullable()
  },
  "documents:reindex": {
    input: reindexDocumentSchema,
    output: documentSchema
  },
  "chat:list": {
    input: z.object({ workspaceId: z.string() }),
    output: z.array(chatSessionSchema)
  },
  "chat:messages": {
    input: z.object({ chatId: z.string() }),
    output: z.array(chatMessageSchema)
  },
  "chat:send": {
    input: sendChatMessageSchema,
    output: chatResponseSchema
  },
  "workflow:case-brief": {
    input: workflowRunSchema,
    output: caseBriefSchema
  },
  "workflow:jurisprudence-comparison": {
    input: workflowRunSchema,
    output: jurisprudenceComparisonSchema
  },
  "workflow:memo-outline": {
    input: workflowRunSchema,
    output: memoOutlineSchema
  },
  "workflow:study-mode": {
    input: workflowRunSchema,
    output: studyModeSchema
  },
  "workflow:support-review": {
    input: workflowRunSchema,
    output: supportReviewSchema
  },
  "notes:list": {
    input: z.object({ workspaceId: z.string() }),
    output: z.array(noteSchema)
  },
  "notes:upsert": {
    input: noteSchema.partial().extend({ workspaceId: z.string(), title: z.string(), contentJson: z.string() }),
    output: noteSchema
  },
  "drafts:list": {
    input: z.object({ workspaceId: z.string() }),
    output: z.array(draftSchema)
  },
  "drafts:upsert": {
    input: draftSchema.partial().extend({
      workspaceId: z.string(),
      title: z.string(),
      draftType: draftSchema.shape.draftType,
      contentJson: z.string(),
      sourceMapJson: z.string(),
      verificationStatus: draftSchema.shape.verificationStatus
    }),
    output: draftSchema
  },
  "settings:get": {
    input: z.void(),
    output: settingsSchema
  },
  "settings:update": {
    input: updateSettingsSchema,
    output: settingsSchema
  },
  "providers:test": {
    input: z.object({ providerName: z.string() }),
    output: providerHealthSchema
  },
  "system:pick-files": {
    input: z.object({
      filters: z
        .array(
          z.object({
            name: z.string(),
            extensions: z.array(z.string()).default([])
          })
        )
        .default([])
    }),
    output: z.array(z.string())
  }
} as const;

export type IpcChannel = keyof typeof ipcSchemas;
