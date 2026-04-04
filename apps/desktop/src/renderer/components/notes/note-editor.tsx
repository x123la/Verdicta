import { Input } from "@/components/ui/input";

export const NoteEditor = ({
  title,
  body,
  onTitleChange,
  onBodyChange
}: {
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
}) => (
  <div className="space-y-3 rounded-2xl border border-border/70 bg-background/50 p-5">
    <Input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Note title" />
    <textarea
      value={body}
      onChange={(event) => onBodyChange(event.target.value)}
      className="min-h-[240px] w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none"
      placeholder="Capture issue framing, quoted passages, or AI-generated summaries."
    />
  </div>
);
