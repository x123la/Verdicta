import type { SearchDocumentsInput } from "@verdicta/shared";

export const buildFilterSummary = (input: SearchDocumentsInput) => {
  const parts = [
    input.workspaceId ? "workspace scoped" : "all workspaces",
    input.documentTypes.length ? `types: ${input.documentTypes.join(", ")}` : null,
    input.jurisdiction ? `jurisdiction: ${input.jurisdiction}` : null,
    input.court ? `court: ${input.court}` : null
  ].filter(Boolean);

  return parts.join(" | ");
};
