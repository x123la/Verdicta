import { z } from "zod";

const claimSupportSchema = z.object({
  claim: z.string(),
  supportLevel: z.enum(["direct", "inference", "weak"]),
  referenceIds: z.array(z.string()).default([])
});

export const sourceReferenceSchema = z.object({
  id: z.string().default(""),
  documentId: z.string(),
  documentTitle: z.string(),
  chunkId: z.string(),
  pageStart: z.number().nullable(),
  pageEnd: z.number().nullable(),
  snippet: z.string(),
  supportLevel: z.enum(["direct", "inference", "weak"])
});

export const sourceMapSchema = z.object({
  references: z.array(sourceReferenceSchema),
  supportedClaims: z.array(claimSupportSchema).default([]),
  inferredAnalysis: z.array(z.string()).default([]),
  unsupportedClaims: z.array(z.string()).default([]),
  uncertainty: z.array(z.string()).default([])
});

export const chatMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
  sourceMap: sourceMapSchema,
  createdAt: z.string()
});

export const chatSessionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  mode: z.enum([
    "research",
    "case-brief",
    "jurisprudence-comparison",
    "drafting",
    "review",
    "study"
  ]),
  modelProvider: z.string(),
  modelName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const sendChatMessageSchema = z.object({
  chatId: z.string().optional(),
  workspaceId: z.string(),
  message: z.string().min(1),
  mode: z.enum([
    "research",
    "case-brief",
    "jurisprudence-comparison",
    "drafting",
    "review",
    "study"
  ]),
  selectedDocumentIds: z.array(z.string()).default([])
});

export const chatResponseSchema = z.object({
  chat: chatSessionSchema,
  assistantMessage: chatMessageSchema,
  grounded: z.boolean(),
  retrievalQuery: z.string(),
  answer: z.string(),
  sourceMap: sourceMapSchema
});

export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type SourceMap = z.infer<typeof sourceMapSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatSession = z.infer<typeof chatSessionSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
