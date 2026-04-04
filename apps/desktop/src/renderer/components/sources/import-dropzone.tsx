import { Button } from "@/components/ui/button";

export const ImportDropzone = ({
  onImport,
  disabled = false
}: {
  onImport: () => void;
  disabled?: boolean;
}) => (
  <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-6">
    <div className="text-sm leading-7 text-muted-foreground">
      Import PDF, DOCX, TXT, or Markdown sources into this workspace. Files are copied into managed local storage and
      chunked for grounded retrieval.
    </div>
    <div className="mt-4">
      <Button onClick={onImport} disabled={disabled}>
        {disabled ? "Importing..." : "Import source files"}
      </Button>
    </div>
  </div>
);
