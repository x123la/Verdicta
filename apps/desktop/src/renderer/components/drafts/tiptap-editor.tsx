import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export const TiptapEditor = ({
  content,
  onChange
}: {
  content: string;
  onChange: (value: string) => void;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Draft a case brief, memo section, argument block, or study summary with linked source support."
      })
    ],
    content,
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON()))
  });

  return (
    <div className="min-h-[620px] rounded-2xl border border-border/70 bg-background/50 p-5">
      <EditorContent editor={editor} className="prose prose-invert max-w-none text-sm" />
    </div>
  );
};
