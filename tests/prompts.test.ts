import { describe, expect, it } from "vitest";
import { buildGroundedSystemPrompt, buildGroundedUserPrompt } from "../packages/ai/src/prompts/legal";

describe("grounded legal prompts", () => {
  it("injects legal safety and source-grounding rules", () => {
    const system = buildGroundedSystemPrompt({
      mode: "research",
      workspaceTitle: "Federal Courts",
      workspaceJurisdiction: "United States",
      userQuestion: "What is the holding?",
      sources: []
    });
    const user = buildGroundedUserPrompt({
      mode: "research",
      workspaceTitle: "Federal Courts",
      workspaceJurisdiction: "United States",
      userQuestion: "What is the holding?",
      sources: []
    });

    expect(system).toContain("not a lawyer");
    expect(system).toContain("Do not fabricate citations");
    expect(user).toContain("No uploaded workspace sources were selected or retrieved.");
  });
});
