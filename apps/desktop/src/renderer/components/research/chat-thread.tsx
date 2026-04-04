import type { ChatMessage } from "@verdicta/shared";
import { CitationChip } from "./citation-chip";

export const ChatThread = ({ messages }: { messages: ChatMessage[] }) => (
  <div className="space-y-4">
    {messages.map((message) => (
      <div key={message.id} className="rounded-2xl border border-border/70 bg-background/55 p-4">
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{message.role}</div>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-7">{message.content}</div>
        {message.sourceMap.references.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.sourceMap.references.map((reference) => (
              <CitationChip key={reference.id || `${reference.documentId}-${reference.chunkId}`} source={reference} />
            ))}
          </div>
        ) : null}
      </div>
    ))}
  </div>
);
