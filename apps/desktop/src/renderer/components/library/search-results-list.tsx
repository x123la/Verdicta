import { Badge } from "@verdicta/ui";
import { Link } from "react-router-dom";
import type { DocumentSearchResult } from "@verdicta/shared";

export const SearchResultsList = ({ results }: { results: DocumentSearchResult[] }) => (
  <div className="space-y-3">
    {results.map((result) => (
      <Link
        key={`${result.id}-${result.hitChunk?.id ?? "doc"}`}
        to={`/documents/${result.id}`}
        className="block rounded-2xl border border-border/70 bg-background/55 p-4 transition hover:bg-accent/40"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">{result.title}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">{result.matchReason}</div>
          </div>
          <Badge>Score {result.matchScore}</Badge>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {result.hitChunk?.text.slice(0, 220) ?? "Open the source to inspect supporting passages."}
        </div>
      </Link>
    ))}
  </div>
);
