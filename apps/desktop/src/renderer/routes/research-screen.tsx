import { useEffect, useMemo, useState } from "react";
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setResponse(null);
                  setActiveChatId(undefined);
                  setMessage("");
                }}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  !activeChatId ? "bg-accent text-foreground" : "bg-background/50 text-muted-foreground"
                }`}
              >
                New session
              </button>
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    setResponse(null);
                    setActiveChatId(chat.id);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    activeChatId === chat.id ? "bg-accent text-foreground" : "bg-background/50 text-muted-foreground"
                  }`}
                >
                  {chat.title}
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
                className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.18em] ${
                  activeChatMode === mode ? "bg-accent text-foreground" : "text-muted-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
              activeChat
                ? `Continue ${activeChat.mode} analysis in "${activeChat.title}"`
                : "Ask a grounded question about the selected workspace sources"
            }
          />
          <div className="flex justify-end">
            <Button onClick={runGroundedChat} disabled={busy || !workspaceId || !message.trim()}>
              {busy ? "Generating..." : "Run grounded analysis"}
            </Button>
          </div>
          <ChatThread messages={messages} />
          {!messages.length ? (
            <div className="rounded-2xl border border-border/70 bg-background/55 p-5 text-sm text-muted-foreground">
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
