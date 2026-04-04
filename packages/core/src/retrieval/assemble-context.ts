import type { SourceReference } from "@verdicta/shared";

export const assembleContext = (sources: SourceReference[], limit = 8) =>
  sources
    .slice(0, limit)
    .map(
      (source, index) =>
        `[${index + 1}] ${source.documentTitle} pp. ${source.pageStart ?? "?"}-${source.pageEnd ?? "?"}\n${source.snippet}`
    )
    .join("\n\n");
