import { z } from "zod";

import { sourceMapSchema } from "./chat";

export const workflowRunSchema = z.object({
  workspaceId: z.string(),
  selectedDocumentIds: z.array(z.string()).default([]),
  prompt: z.string().min(1)
});

export const caseBriefSchema = z.object({
  facts: z.string(),
  issue: z.string(),
  rule: z.string(),
  holding: z.string(),
  reasoning: z.string(),
  disposition: z.string(),
  significance: z.string(),
  sourceMap: sourceMapSchema
});

export const jurisprudenceComparisonSchema = z.object({
  overview: z.string(),
  rows: z.array(
    z.object({
      authorityTitle: z.string(),
      facts: z.string(),
      issueFraming: z.string(),
      rules: z.string(),
      reasoning: z.string(),
      practicalDistinction: z.string(),
      basis: z.string()
    })
  ),
  sourceMap: sourceMapSchema
});

export const memoOutlineSchema = z.object({
  issue: z.string(),
  rule: z.string(),
  application: z.string(),
  counterarguments: z.string(),
  conclusion: z.string(),
  sourceMap: sourceMapSchema
});

export const supportReviewSchema = z.object({
  summary: z.string(),
  supportedClaims: z.array(z.string()),
  weaklySupportedClaims: z.array(z.string()),
  unsupportedClaims: z.array(z.string()),
  unsupportedCitations: z.array(z.string()),
  hallucinationRisks: z.array(z.string()),
  sourceMap: sourceMapSchema
});

export const studyModeSchema = z.object({
  summary: z.string(),
  flashcards: z.array(z.object({ front: z.string(), back: z.string() })),
  issueSpottingQuestions: z.array(z.string()),
  hypotheticals: z.array(z.string()),
  sourceMap: sourceMapSchema
});

export type WorkflowRunInput = z.infer<typeof workflowRunSchema>;
export type CaseBrief = z.infer<typeof caseBriefSchema>;
export type JurisprudenceComparison = z.infer<typeof jurisprudenceComparisonSchema>;
export type MemoOutline = z.infer<typeof memoOutlineSchema>;
export type SupportReview = z.infer<typeof supportReviewSchema>;
export type StudyModePayload = z.infer<typeof studyModeSchema>;
