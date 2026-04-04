import type { DocumentDetail } from "@verdicta/shared";

export const PdfViewer = ({ document }: { document: DocumentDetail }) => (
  <div className="rounded-2xl border border-border/70 bg-background/50 p-5">
    <div className="text-sm text-muted-foreground">
      PDF text preview for <span className="font-medium text-foreground">{document.title}</span>. The extracted text
      below is searchable and grounded in the stored document pages.
    </div>
    <div className="mt-4 space-y-3">
      {document.pages.map((page) => (
        <div key={page.id} className="rounded-xl border border-border/70 bg-card/80 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Page {page.pageNumber}</div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-7">{page.extractedText}</div>
        </div>
      ))}
    </div>
  </div>
);
