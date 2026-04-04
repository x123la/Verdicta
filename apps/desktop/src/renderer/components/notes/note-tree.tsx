import type { NoteRecord } from "@verdicta/db";

export const NoteTree = ({
  notes,
  activeNoteId,
  onSelect
}: {
  notes: NoteRecord[];
  activeNoteId?: string;
  onSelect?: (note: NoteRecord) => void;
}) => (
  <div className="space-y-3">
    {notes.map((note) => (
      <button
        key={note.id}
        type="button"
        onClick={() => onSelect?.(note)}
        className={`w-full rounded-2xl border p-4 text-left ${
          activeNoteId === note.id ? "border-border bg-accent" : "border-border/70 bg-background/50"
        }`}
      >
        <div className="font-medium">{note.title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{note.documentIdNullable ? "Linked to source" : "Workspace note"}</div>
      </button>
    ))}
  </div>
);
