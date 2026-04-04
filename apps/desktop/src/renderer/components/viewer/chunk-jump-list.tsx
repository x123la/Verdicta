import type { DocumentChunk } from "@verdicta/shared";

export const ChunkJumpList = ({ chunks }: { chunks: DocumentChunk[] }) => (
  <div className="space-y-3">
    {chunks.slice(0, 8).map((chunk) => (
      <div key={chunk.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {chunk.heading ?? `Chunk ${chunk.chunkIndex + 1}`} | pp. {chunk.pageStart ?? "?"}-{chunk.pageEnd ?? "?"}
        </div>
        <div className="mt-2 text-sm leading-6 text-muted-foreground">{chunk.text.slice(0, 180)}</div>
      </div>
    ))}
  </div>
);
