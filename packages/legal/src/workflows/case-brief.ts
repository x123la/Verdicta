import type { CaseBrief, SourceMap } from "@verdicta/shared";

export const createFallbackCaseBrief = (answer: string, sourceMap: SourceMap): CaseBrief => ({
  facts: answer,
  issue: "Issue extraction unavailable.",
  rule: "Rule extraction unavailable.",
  holding: "Holding extraction unavailable.",
  reasoning: answer,
  disposition: "Disposition unavailable.",
  significance: "Review cited authorities for significance.",
  sourceMap
});
