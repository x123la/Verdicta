import type { DocumentDetail } from "@verdicta/shared";

export const TextViewer = ({ document }: { document: DocumentDetail }) => (
  <div className="rounded-2xl border border-border/70 bg-background/50 p-5">
    <div className="space-y-4">
      {document.pages.map((page) => (
        <div key={page.id}>
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Page {page.pageNumber}</div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-7">{page.extractedText}</div>
        </div>
      ))}
    </div>
  </div>
);
