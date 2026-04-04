type SelectableDocument = {
  id: string;
  title: string;
  citation: string | null;
  documentType: string;
};
import { useAppStore } from "@/hooks/use-app-store";

export const SourceSelector = ({ documents }: { documents: SelectableDocument[] }) => {
  const selectedDocumentIds = useAppStore((state) => state.selectedDocumentIds);
  const toggleDocument = useAppStore((state) => state.toggleDocument);

  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const selected = selectedDocumentIds.includes(document.id);
        return (
          <button
            key={document.id}
            type="button"
            onClick={() => toggleDocument(document.id)}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
              selected ? "border-border bg-accent text-foreground" : "border-border/60 bg-background/40 text-muted-foreground"
            }`}
          >
            <div className="font-medium text-foreground">{document.title}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em]">{document.citation ?? document.documentType}</div>
          </button>
        );
      })}
    </div>
  );
};
