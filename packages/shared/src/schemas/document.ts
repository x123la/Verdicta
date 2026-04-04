import { z } from "zod";

export const documentTypeSchema = z.enum(["pdf", "docx", "txt", "markdown"]);
export const extractionStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
  "ocr_required"
]);

export const documentPageSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  pageNumber: z.number().int().nonnegative(),
  extractedText: z.string()
});

export const documentChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  pageStart: z.number().int().nullable(),
  pageEnd: z.number().int().nullable(),
  chunkIndex: z.number().int().nonnegative(),
  heading: z.string().nullable(),
  text: z.string(),
  tokenEstimate: z.number().int().nonnegative(),
  embeddingJsonNullable: z.string().nullable(),
  createdAt: z.string(),
  matchScore: z.number().optional(),
  matchReason: z.string().optional()
});

export const documentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  checksum: z.string(),
  documentType: documentTypeSchema,
  jurisdiction: z.string().nullable(),
  court: z.string().nullable(),
  citation: z.string().nullable(),
  dateIssued: z.string().nullable(),
  parsedMetadata: z.record(z.string(), z.unknown()).default({}),
  extractionStatus: extractionStatusSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const documentDetailSchema = documentSchema.extend({
  pages: z.array(documentPageSchema).default([]),
  chunks: z.array(documentChunkSchema).default([])
});

export const documentSearchResultSchema = documentSchema.extend({
  matchReason: z.string(),
  matchScore: z.number(),
  hitChunk: documentChunkSchema.nullable()
});

export const importDocumentsSchema = z.object({
  workspaceId: z.string(),
  filePaths: z.array(z.string()).min(1)
});

export const listDocumentsSchema = z.object({
  workspaceId: z.string()
});

export const reindexDocumentSchema = z.object({
  documentId: z.string()
});

export const searchDocumentsSchema = z.object({
  workspaceId: z.string().optional(),
  query: z.string().min(1),
  documentTypes: z.array(documentTypeSchema).default([]),
  jurisdiction: z.string().optional(),
  court: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

export type DocumentRecord = z.infer<typeof documentSchema>;
export type DocumentDetail = z.infer<typeof documentDetailSchema>;
export type DocumentPage = z.infer<typeof documentPageSchema>;
export type DocumentChunk = z.infer<typeof documentChunkSchema>;
export type DocumentSearchResult = z.infer<typeof documentSearchResultSchema>;
export type ImportDocumentsInput = z.infer<typeof importDocumentsSchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
export type ReindexDocumentInput = z.infer<typeof reindexDocumentSchema>;
export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>;
