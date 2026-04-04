import type { MemoOutline, SourceMap } from "@verdicta/shared";

export const createFallbackMemoOutline = (answer: string, sourceMap: SourceMap): MemoOutline => ({
  issue: answer,
  rule: "Rule section unavailable.",
  application: "Application section unavailable.",
  counterarguments: "Counterarguments unavailable.",
  conclusion: "Conclusion unavailable.",
  sourceMap
});
