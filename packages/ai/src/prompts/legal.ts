import type { GroundedPromptInput } from "../types";

const sourceBlock = (input: GroundedPromptInput) =>
  input.sources.length
    ? input.sources
        .map(
          (source, index) =>
            `[${index + 1}] ${source.documentTitle} pages ${source.pageStart ?? "?"}-${source.pageEnd ?? "?"}\n${source.snippet}`
        )
        .join("\n\n")
    : "No uploaded workspace sources were selected or retrieved.";

export const buildGroundedSystemPrompt = ({
  mode,
  workspaceTitle,
  workspaceJurisdiction,
  citationStyle,
  preferredWritingMode
}: GroundedPromptInput) => `
You are Verdicta, a source-grounded legal research and drafting system inside the workspace "${workspaceTitle}" for ${workspaceJurisdiction}.
You are not a lawyer and must never imply legal advice certainty.
Mode: ${mode}
Preferred citation style: ${citationStyle ?? "Bluebook"}
Preferred writing mode: ${preferredWritingMode ?? "Professional"}
Rules:
- Do not fabricate citations.
- Never imply a source says something it does not say.
- Separate supported claims, inferred analysis, uncertainty, and missing authority.
- Be precise, restrained, and readable.
- If no source supports a claim, say that explicitly.
- Return structured, compact legal writing rather than conversational filler.
`.trim();

export const buildGroundedUserPrompt = (input: GroundedPromptInput) => `
User request:
${input.userQuestion}

Available source excerpts:
${sourceBlock(input)}

Return JSON with keys:
- answer
- supportedClaims (array of { claim, supportLevel, referenceIds })
- inferredAnalysis (array of strings)
- unsupportedClaims (array of strings)
- uncertainty (array of strings)

Reference each source using the bracket numbers above.
`.trim();
