import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@verdicta/ui";
import { useParams } from "react-router-dom";
import { PanelShell } from "@/components/layout/panel-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import { useAppStore } from "@/hooks/use-app-store";
import {
  useChatMessages,
  useChats,
  useWorkspaceDocuments,
  useWorkspaces
} from "@/hooks/use-verdicta-query";
import { invokeIpc } from "@/lib/ipc";
import { ChatThread } from "@/components/research/chat-thread";
import { SourceSelector } from "@/components/research/source-selector";
import { SourceMapPanel } from "@/components/research/source-map-panel";
import type { ChatResponse, ChatSession } from "@verdicta/shared";

const modes = ["research", "case-brief", "jurisprudence-comparison", "drafting", "review", "study"] as const;

export const ResearchScreen = () => {
  const { workspaceId: routeWorkspaceId } = useParams();
  const { data: workspaces } = useWorkspaces();
  const workspaceId = routeWorkspaceId ?? workspaces?.[0]?.id ?? "";
  const { data: chats } = useChats(workspaceId);
  const { data: documents } = useWorkspaceDocuments(workspaceId);
  const selectedDocumentIds = useAppStore((state) => state.selectedDocumentIds);
  const activeChatMode = useAppStore((state) => state.activeChatMode);
  const setChatMode = useAppStore((state) => state.setChatMode);
  const [activeChatId, setActiveChatId] = useState<string>();
  const { data: storedMessages } = useChatMessages(activeChatId);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!chats?.length) {
      setActiveChatId(undefined);
      setResponse(null);
      return;
    }
    setActiveChatId((current) =>
      current && chats.some((chat) => chat.id === current) ? current : chats[0]?.id
    );
  }, [chats]);

  useEffect(() => {
    if (!activeChatId || !chats?.length) return;
    const activeChat = chats.find((chat) => chat.id === activeChatId);
    if (activeChat) {
      setChatMode(activeChat.mode);
    }
  }, [activeChatId, chats, setChatMode]);

  const runGroundedChat = async () => {
    if (!workspaceId || !message.trim()) return;
    setBusy(true);
    try {
      const next = await invokeIpc("chat:send", {
        workspaceId,
        chatId: activeChatId,
        message,
        mode: activeChatMode,
        selectedDocumentIds
      });
      setResponse(next);
      setActiveChatId(next.chat.id);
      setMessage("");
    } finally {
      setBusy(false);
    }
  };

  const messages = useMemo(() => {
    if (response && storedMessages?.some((entry) => entry.id === response.assistantMessage.id)) {
      return storedMessages;
    }
    return response ? [...(storedMessages ?? []), response.assistantMessage] : (storedMessages ?? []);
  }, [response, storedMessages]);

  const activeChat = useMemo<ChatSession | undefined>(
    () => chats?.find((chat) => chat.id === activeChatId),
    [activeChatId, chats]
  );
  const inspectorSourceMap =
    response?.sourceMap ??
    [...messages].reverse().find((entry) => entry.role === "assistant")?.sourceMap ??
    null;

  return (
    <div className="grid h-full gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <PanelShell title="Source selector" eyebrow="Research">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Answers default to selected and retrieved sources. If nothing supports the answer, Verdicta says so explicitly.
          </div>
          {documents?.length ? (
            <SourceSelector documents={documents} />
          ) : (
            <EmptyState
              title="No sources available"
              body="Import documents into this workspace before asking the model to ground an answer in your materials."
            />
          )}
        </div>
      </PanelShell>

      <PanelShell title="Grounded legal chat" eyebrow="Research workspace" actions={<Badge>{activeChatMode}</Badge>} className="flex flex-col">
        <div className="space-y-4">
          {chats?.length ? (
            <div className="flex flex-wrap gap-1.5 p-1 bg-background/40 border border-border/40 rounded-full w-max">
              <button
                type="button"
                onClick={() => {
                  setResponse(null);
                  setActiveChatId(undefined);
                  setMessage("");
                }}
                className={`relative rounded-full px-4 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                  !activeChatId ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {!activeChatId && <motion.div layoutId="researchSessionTab" className="absolute inset-0 bg-accent/80 border border-border/60 shadow-sm rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <span className="relative z-10">New Session</span>
              </button>
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    setResponse(null);
                    setActiveChatId(chat.id);
                  }}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                    activeChatId === chat.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {activeChatId === chat.id && <motion.div layoutId="researchSessionTab" className="absolute inset-0 bg-accent/80 border border-border/60 shadow-sm rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className="relative z-10">{chat.title}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setChatMode(mode)}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-all border ${
                  activeChatMode === mode 
                    ? "bg-foreground text-background border-foreground shadow-sm" 
                    : "bg-background/40 text-muted-foreground border-border/60 hover:bg-accent/40 hover:text-foreground hover:border-border/80"
                }`}
              >
                {mode.replace("-", " ")}
              </button>
            ))}
          </div>
          <div className="relative">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="pr-24 bg-card/40 border-border/80 focus-visible:ring-primary shadow-sm"
              placeholder={
                activeChat
                  ? `Continue ${activeChat.mode.replace("-", " ")} analysis...`
                  : "Ask a grounded question about the selected workspace sources..."
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  runGroundedChat();
                }
              }}
            />
            <div className="absolute right-1 top-1 bottom-1 flex items-center">
              <Button size="sm" onClick={runGroundedChat} disabled={busy || !workspaceId || !message.trim()} className="h-full rounded-[6px] px-4 font-semibold shadow-none">
                {busy ? "Running..." : "Run"}
              </Button>
            </div>
          </div>
          <div className="flex-1 mt-4">
            <ChatThread messages={messages} />
          </div>
          {!messages.length ? (
            <div className="rounded-[20px] border border-border/80 bg-background/50 p-6 text-sm text-muted-foreground backdrop-blur-md shadow-sm">
              <div className="font-semibold text-foreground mb-1">Grounded analysis</div>
              Use the grounded chat to produce research answers, case briefs, comparisons, memo outlines, study materials, and support reviews with visible provenance.
            </div>
          ) : null}
        </div>
      </PanelShell>

      <PanelShell title="Citations and support" eyebrow="Inspector">
        <SourceMapPanel sourceMap={inspectorSourceMap} />
        {chats?.length ? (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
            {chats.length} stored research session(s) are available for this workspace.
          </div>
        ) : null}
      </PanelShell>
    </div>
  );
};
