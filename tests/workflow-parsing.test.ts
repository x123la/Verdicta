import { describe, expect, it } from "vitest";
import {
  caseBriefSchema,
  jurisprudenceComparisonSchema,
  memoOutlineSchema,
  studyModeSchema,
  supportReviewSchema
} from "../packages/shared/src/schemas/legal-workflows";

const sourceMap = {
  references: [],
  supportedClaims: [],
  inferredAnalysis: [],
  unsupportedClaims: [],
  uncertainty: []
};

describe("workflow schemas", () => {
  it("validates case brief output", () => {
    expect(
      caseBriefSchema.parse({
        facts: "Facts",
        issue: "Issue",
        rule: "Rule",
        holding: "Holding",
        reasoning: "Reasoning",
        disposition: "Disposition",
        significance: "Significance",
        sourceMap
      }).holding
    ).toBe("Holding");
  });

  it("validates comparison, memo, study, and review outputs", () => {
    expect(
      jurisprudenceComparisonSchema.parse({ overview: "Overview", rows: [], sourceMap }).overview
    ).toBe("Overview");
    expect(
      memoOutlineSchema.parse({
        issue: "Issue",
        rule: "Rule",
        application: "Application",
        counterarguments: "Counterarguments",
        conclusion: "Conclusion",
        sourceMap
      }).conclusion
    ).toBe("Conclusion");
    expect(
      studyModeSchema.parse({
        summary: "Summary",
        flashcards: [],
        issueSpottingQuestions: [],
        hypotheticals: [],
        sourceMap
      }).summary
    ).toBe("Summary");
    expect(
      supportReviewSchema.parse({
        summary: "Summary",
        supportedClaims: [],
        weaklySupportedClaims: [],
        unsupportedClaims: [],
        unsupportedCitations: [],
        hallucinationRisks: [],
        sourceMap
      }).summary
    ).toBe("Summary");
  });
});
