import type { SourceMap, SupportReview } from "@verdicta/shared";

export const createFallbackSupportReview = (answer: string, sourceMap: SourceMap): SupportReview => ({
  summary: answer,
  supportedClaims: [],
  weaklySupportedClaims: [],
  unsupportedClaims: sourceMap.unsupportedClaims,
  unsupportedCitations: [],
  hallucinationRisks: sourceMap.uncertainty,
  sourceMap
});
