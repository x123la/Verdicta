import type { DocumentDetail } from "@verdicta/shared";

export const AnnotationLayer = ({ document }: { document: DocumentDetail }) => {
  const metadataEntries = Object.entries(document.parsedMetadata ?? {});

  return (
    <div className="rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
      <div className="text-[11px] uppercase tracking-[0.22em]">Document metadata</div>
      <div className="mt-3 space-y-2">
        <div>
          Pages: <span className="text-foreground">{document.pages.length}</span>
        </div>
        <div>
          Chunks: <span className="text-foreground">{document.chunks.length}</span>
        </div>
        <div>
          File: <span className="break-all text-foreground">{document.filePath}</span>
        </div>
        {metadataEntries.length ? (
          <div className="space-y-1 pt-2">
            {metadataEntries.slice(0, 6).map(([key, value]) => (
              <div key={key}>
                {key}: <span className="text-foreground">{typeof value === "string" ? value : JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
