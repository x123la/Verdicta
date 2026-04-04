import type { SourceMap } from "@verdicta/shared";
import { Badge } from "@verdicta/ui";

export const SourceMapPanel = ({ sourceMap }: { sourceMap: SourceMap | null }) => {
  if (!sourceMap) {
    return <div className="rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">Supporting passages, uncertainty flags, and jumpable citations appear here.</div>;
  }

  return (
    <div className="space-y-3">
      {sourceMap.references.map((source) => (
        <div key={source.id || `${source.documentId}-${source.chunkId}`} className="rounded-2xl border border-border/70 bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{source.documentTitle}</div>
            <Badge>{source.supportLevel}</Badge>
          </div>
          <div className="mt-3 text-sm leading-6 text-muted-foreground">{source.snippet}</div>
        </div>
      ))}
      {sourceMap.uncertainty.length ? (
        <div className="rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Uncertainty</div>
          <div className="mt-2">{sourceMap.uncertainty.join(" ")}</div>
        </div>
      ) : null}
    </div>
  );
};
