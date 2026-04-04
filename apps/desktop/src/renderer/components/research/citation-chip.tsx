import type { SourceReference } from "@verdicta/shared";
import { Badge } from "@verdicta/ui";

export const CitationChip = ({ source }: { source: SourceReference }) => (
  <Badge>
    {source.documentTitle} pp. {source.pageStart ?? "?"}-{source.pageEnd ?? "?"}
  </Badge>
);
