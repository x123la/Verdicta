import { Card } from "@verdicta/ui";
import { useParams } from "react-router-dom";
import { PinnedAuthorities } from "@/components/authorities/pinned-authorities";
import { useWorkspaceDocuments } from "@/hooks/use-verdicta-query";

export const WorkspaceAuthoritiesScreen = () => {
  const { workspaceId } = useParams();
  const { data: documents } = useWorkspaceDocuments(workspaceId);
  const authorities =
    documents?.filter((document) => Boolean(document.citation || document.court || document.jurisdiction)) ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <Card>
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Authorities</div>
        <div className="mt-1 text-xl font-semibold">Pinned cases and statutes</div>
        <div className="mt-4">
          <PinnedAuthorities authorities={authorities ?? []} />
        </div>
      </Card>
      <Card className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Comparison workflow</div>
        <div className="rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
          Select authorities from the workspace and run a jurisprudence comparison to see fact patterns, issue framing, rule statements, reasoning, and practical distinctions.
        </div>
      </Card>
    </div>
  );
};
