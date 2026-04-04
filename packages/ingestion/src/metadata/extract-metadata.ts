import type { ExtractedPage } from "../types";

const citationPattern = /\b\d+\s+[A-Z][A-Za-z. ]+\s+\d+\b/;
const courtPattern = /\b(Court of Appeals|Supreme Court|District Court|Court)\b/i;

export const extractDocumentMetadata = (pages: ExtractedPage[]) => {
  const combined = pages.map((page) => page.text).join("\n\n");
  const firstLines = combined.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8);
  const citation = combined.match(citationPattern)?.[0] ?? null;
  const court = combined.match(courtPattern)?.[0] ?? null;

  return {
    headings: firstLines.filter((line) => line.length < 90),
    summary: firstLines.slice(0, 3).join(" "),
    citation,
    court,
    jurisdiction: combined.includes("United States") ? "United States" : null,
    extractionConfidence: "deterministic"
  };
};
