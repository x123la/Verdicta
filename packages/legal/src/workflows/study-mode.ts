import type { SourceMap, StudyModePayload } from "@verdicta/shared";

export const createFallbackStudyMode = (answer: string, sourceMap: SourceMap): StudyModePayload => ({
  summary: answer,
  flashcards: [],
  issueSpottingQuestions: [],
  hypotheticals: [],
  sourceMap
});
