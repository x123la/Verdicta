export const legalWorkflowPrompts = {
  caseBrief: (sources: string) => `
Return JSON with keys facts, issue, rule, holding, reasoning, disposition, significance.
Stay grounded in the provided sources and keep the prose compact.
Sources:
${sources}
`.trim(),
  jurisprudenceComparison: (sources: string) => `
Return JSON with keys overview and rows.
Each row must contain authorityTitle, facts, issueFraming, rules, reasoning, practicalDistinction, basis.
Sources:
${sources}
`.trim(),
  memoOutline: (sources: string) => `
Return JSON with keys issue, rule, application, counterarguments, conclusion.
Each field must be a concise paragraph grounded in sources.
Sources:
${sources}
`.trim(),
  studyMode: (sources: string) => `
Return JSON with keys summary, flashcards, issueSpottingQuestions, hypotheticals.
Sources:
${sources}
`.trim(),
  supportReview: (draft: string, sources: string) => `
Review the draft against the selected sources.
Return JSON with keys summary, supportedClaims, weaklySupportedClaims, unsupportedClaims, unsupportedCitations, hallucinationRisks.
Draft:
${draft}
Sources:
${sources}
`.trim()
};
