import type { JurisprudenceComparison, SourceMap } from "@verdicta/shared";

export const createFallbackComparison = (answer: string, sourceMap: SourceMap): JurisprudenceComparison => ({
  overview: answer,
  rows: [],
  sourceMap
});
