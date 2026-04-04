import type { SourceMap } from "@verdicta/shared";

export const SourceInspector = ({ sourceMap }: { sourceMap: SourceMap | null }) => (
  <div className="rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
    {sourceMap?.references.length
      ? `${sourceMap.references.length} source-backed passages are linked to the current drafting context.`
      : "Insert quotes, link notes, and inspect source-backed passages here."}
  </div>
);
