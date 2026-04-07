import { Badge, Card } from "@verdicta/ui";
import { Link, useParams } from "react-router-dom";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { TimelineView } from "@/components/workspaces/timeline-view";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { useCreateWorkspace, useWorkspaceActivity, useWorkspaces } from "@/hooks/use-verdicta-query";

export const WorkspacesScreen = () => {
  const { workspaceId } = useParams();
  const createWorkspace = useCreateWorkspace();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.find((workspace) => workspace.id === workspaceId) ?? workspaces?.[0];
  const { data: activity } = useWorkspaceActivity(activeWorkspace?.id);

  if (!activeWorkspace) {
    return (
      <div className="space-y-4">
        <EmptyState title="No workspaces yet" body="Create a workspace to organize documents, notes, chats, and drafts by matter." />
        <Button
          onClick={() =>
            createWorkspace.mutate({
              title: "New Legal Matter",
              description: "Workspace for legal research, source review, and drafting.",
              jurisdiction: "General",
              tags: [],
              defaultChatMode: "research",
              preferredCitationStyle: "Bluebook",
              preferredWritingMode: "Professional",
              preferredProvider: "local",
              preferredModel: "auto"
            })
          }
          disabled={createWorkspace.isPending}
        >
          {createWorkspace.isPending ? "Creating..." : "Create workspace"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">Matter</div>
          <h1 className="mt-2 text-2xl font-semibold">{activeWorkspace.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{activeWorkspace.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeWorkspace.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <WorkspaceTabs workspaceId={activeWorkspace.id} activeTab="overview" />
        <div className="grid gap-4 px-6 py-5 lg:grid-cols-4">
          {[
            ["Jurisdiction", activeWorkspace.jurisdiction],
            ["Default mode", activeWorkspace.defaultChatMode],
            ["Citation style", activeWorkspace.preferredCitationStyle],
            ["Model", `${activeWorkspace.preferredProvider} / ${activeWorkspace.preferredModel}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border/70 bg-background/55 p-4">
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-2 text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Timeline</div>
              <div className="mt-1 text-lg font-semibold">Recent workspace activity</div>
            </div>
            <Link to={`/workspaces/${activeWorkspace.id}/chat`} className="text-sm text-muted-foreground">Open research</Link>
          </div>
          <div className="mt-4">
            <TimelineView items={activity ?? []} />
          </div>
        </Card>
        <Card className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Next actions</div>
          <Link to={`/workspaces/${activeWorkspace.id}/sources`} className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-sm">Import or inspect sources</Link>
          <Link to={`/workspaces/${activeWorkspace.id}/drafts`} className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-sm">Open draft workspace</Link>
          <Link to={`/workspaces/${activeWorkspace.id}/notes`} className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-sm">Capture issue notes</Link>
        </Card>
      </div>
    </div>
  );
};
