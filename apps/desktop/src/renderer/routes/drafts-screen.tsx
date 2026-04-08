import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@verdicta/ui";
import { useParams } from "react-router-dom";
import { PanelShell } from "@/components/layout/panel-shell";
import { TiptapEditor } from "@/components/drafts/tiptap-editor";
import { SourceInspector } from "@/components/drafts/source-inspector";
import { VerificationPanel } from "@/components/drafts/verification-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import { useDrafts, useSaveDraft, useWorkspaces } from "@/hooks/use-verdicta-query";

const initialContent = JSON.stringify({
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Argument Section" }] },
    { type: "paragraph", content: [{ type: "text", text: "This drafting workspace preserves source traceability and exposes support verification beside the editor." }] }
  ]
});

export const DraftsScreen = () => {
  const params = useParams();
  const { data: workspaces } = useWorkspaces();
  const workspaceId = params.workspaceId ?? workspaces?.[0]?.id;
  const { data: drafts } = useDrafts(workspaceId);
  const saveDraft = useSaveDraft();
  const [activeDraftId, setActiveDraftId] = useState<string>();
  const [isCreatingNewDraft, setIsCreatingNewDraft] = useState(false);
  const activeDraft = isCreatingNewDraft
    ? undefined
    : drafts?.find((draft) => draft.id === activeDraftId) ?? drafts?.[0];
  const [title, setTitle] = useState("Untitled draft");
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (!drafts?.length) {
      setActiveDraftId(undefined);
      setIsCreatingNewDraft(true);
      setTitle("Untitled draft");
      setContent(initialContent);
      return;
    }

    if (isCreatingNewDraft) {
      return;
    }

    const nextActiveDraft =
      drafts.find((draft) => draft.id === activeDraftId) ?? drafts[0];

    setActiveDraftId(nextActiveDraft?.id);
    setTitle(nextActiveDraft?.title ?? "Untitled draft");
    setContent(nextActiveDraft?.contentJson ?? initialContent);
  }, [activeDraftId, drafts, isCreatingNewDraft]);

  const parsedSourceMap = useMemo(() => {
    if (!activeDraft?.sourceMapJson) return null;
    try {
      return JSON.parse(activeDraft.sourceMapJson);
    } catch {
      return null;
    }
  }, [activeDraft]);

  return (
    <div className="grid h-full gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
      <PanelShell title="Draft list" eyebrow="Drafts">
        <div className="space-y-3">
          <Button
            onClick={() => {
              setIsCreatingNewDraft(true);
              setActiveDraftId(undefined);
              setTitle("Untitled draft");
              setContent(initialContent);
            }}
            className="w-full"
          >
            New draft
          </Button>
          {(drafts ?? []).map((draft) => (
            <button
              key={draft.id}
              type="button"
              onClick={() => {
                setIsCreatingNewDraft(false);
                setActiveDraftId(draft.id);
              }}
              className={`relative w-full rounded-2xl border p-4 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeDraft?.id === draft.id
                  ? "border-border/60 text-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-accent/40"
              }`}
            >
              {activeDraft?.id === draft.id && (
                <motion.div layoutId="activeDraftTab" className="absolute inset-0 bg-accent/80 border border-border/60 shadow-sm rounded-2xl z-0" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
              )}
              <div className="relative z-10 font-semibold">{draft.title}</div>
              <div className="relative z-10 mt-1 text-xs opacity-70">{draft.draftType}</div>
            </button>
          ))}
          {!drafts?.length ? (
            <EmptyState
              title="No drafts yet"
              body="Create a draft to begin outlining arguments, study material, or memo sections with linked source support."
            />
          ) : null}
        </div>
      </PanelShell>
      <PanelShell title="Drafting editor" eyebrow="Tiptap editor" actions={<Badge>Traceable</Badge>}>
        <div className="space-y-4 flex flex-col h-full">
          <Input 
            value={title} 
            onChange={(event) => setTitle(event.target.value)} 
            placeholder="Draft title" 
            className="bg-background/40 border-border/80 shadow-sm text-lg font-semibold py-6"
          />
          <div className="flex-1 min-h-[400px] border border-border/60 rounded-[18px] bg-card/60 overflow-hidden shadow-inner">
            <TiptapEditor content={content} onChange={setContent} />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (!workspaceId) return;
                const saved = await saveDraft.mutateAsync({
                  id: isCreatingNewDraft ? undefined : activeDraft?.id,
                  workspaceId,
                  title: title.trim() || "Untitled draft",
                  draftType: activeDraft?.draftType ?? "legal-memo",
                  contentJson: content,
                  sourceMapJson:
                    activeDraft?.sourceMapJson ??
                    JSON.stringify({
                      references: [],
                      supportedClaims: [],
                      inferredAnalysis: [],
                      unsupportedClaims: [],
                      uncertainty: []
                    }),
                  verificationStatus: activeDraft?.verificationStatus ?? "pending"
                });
                setIsCreatingNewDraft(false);
                setActiveDraftId(saved.id);
              }}
              disabled={saveDraft.isPending || !workspaceId}
            >
              {saveDraft.isPending ? "Saving..." : "Save draft"}
            </Button>
          </div>
        </div>
      </PanelShell>
      <PanelShell title="Support verification" eyebrow="Inspector">
        <div className="space-y-3 text-sm text-muted-foreground">
          <VerificationPanel status={activeDraft?.verificationStatus ?? "pending"} />
          <SourceInspector sourceMap={parsedSourceMap} />
        </div>
      </PanelShell>
    </div>
  );
};
