import { useEffect, useState } from "react";
import { Card } from "@verdicta/ui";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteTree } from "@/components/notes/note-tree";
import { useNotes, useSaveNote, useWorkspaces } from "@/hooks/use-verdicta-query";

export const WorkspaceNotesScreen = () => {
  const { workspaceId } = useParams();
  const { data: workspaces } = useWorkspaces();
  const resolvedWorkspaceId = workspaceId ?? workspaces?.[0]?.id;
  const { data: notes } = useNotes(resolvedWorkspaceId);
  const saveNote = useSaveNote();
  const [activeNoteId, setActiveNoteId] = useState<string>();
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [title, setTitle] = useState("New workspace note");
  const [body, setBody] = useState("Capture issue framing, supporting quotations, and unresolved questions here.");

  useEffect(() => {
    if (!notes?.length) {
      setActiveNoteId(undefined);
      setIsCreatingNewNote(true);
      return;
    }
    if (isCreatingNewNote) {
      return;
    }
    const active = notes.find((note) => note.id === activeNoteId) ?? notes[0];
    setActiveNoteId(active.id);
    setTitle(active.title);
    try {
      const parsed = JSON.parse(active.contentJson);
      const text = parsed?.content?.[0]?.content?.[0]?.text;
      setBody(typeof text === "string" ? text : "");
    } catch {
      setBody(active.contentJson);
    }
  }, [activeNoteId, isCreatingNewNote, notes]);

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card>
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Note folders</div>
        <div className="mt-4">
          <NoteTree
            notes={notes ?? []}
            activeNoteId={activeNoteId}
            onSelect={(note) => {
              setIsCreatingNewNote(false);
              setActiveNoteId(note.id);
              setTitle(note.title);
              try {
                const parsed = JSON.parse(note.contentJson);
                const text = parsed?.content?.[0]?.content?.[0]?.text;
                setBody(typeof text === "string" ? text : "");
              } catch {
                setBody(note.contentJson);
              }
            }}
          />
        </div>
      </Card>
      <div className="space-y-4">
        <NoteEditor title={title} body={body} onTitleChange={setTitle} onBodyChange={setBody} />
        <div className="flex justify-end">
          <Button
            onClick={async () => {
              if (!resolvedWorkspaceId) return;
              const saved = await saveNote.mutateAsync({
                id: isCreatingNewNote ? undefined : activeNoteId,
                workspaceId: resolvedWorkspaceId,
                title,
                contentJson: JSON.stringify({
                  type: "doc",
                  content: [{ type: "paragraph", content: [{ type: "text", text: body }] }]
                }),
                documentIdNullable: null
              });
              setIsCreatingNewNote(false);
              setActiveNoteId(saved.id);
            }}
            disabled={saveNote.isPending || !resolvedWorkspaceId}
          >
            {saveNote.isPending ? "Saving..." : "Save note"}
          </Button>
          <Button
            onClick={() => {
              setIsCreatingNewNote(true);
              setActiveNoteId(undefined);
              setTitle("New workspace note");
              setBody("Capture issue framing, supporting quotations, and unresolved questions here.");
            }}
          >
            New note
          </Button>
        </div>
      </div>
    </div>
  );
};
