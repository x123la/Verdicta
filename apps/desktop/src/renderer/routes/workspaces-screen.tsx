import { Badge, Card } from "@verdicta/ui";
import { Link, useParams } from "react-router-dom";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { TimelineView } from "@/components/workspaces/timeline-view";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { useCreateWorkspace, useWorkspaceActivity, useWorkspaces } from "@/hooks/use-verdicta-query";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";

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
        <CreateWorkspaceDialog trigger={<Button>Create workspace</Button>} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex items-start justify-between gap-6 border-border/80 bg-background/50 p-8 shadow-sm backdrop-blur-3xl">
        <div>
          <div className="text-[11px] uppercase font-bold tracking-[0.24em] text-muted-foreground/80">Matter Overview</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground/90">{activeWorkspace.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{activeWorkspace.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeWorkspace.tags.map((tag) => (
            <Badge key={tag} className="bg-primary/10 text-primary border-primary/20">{tag}</Badge>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0 border-border/80 bg-background/50 shadow-sm backdrop-blur-3xl">
        <WorkspaceTabs workspaceId={activeWorkspace.id} activeTab="overview" />
        <div className="grid gap-4 px-8 py-6 lg:grid-cols-4">
          {[
            ["Jurisdiction", activeWorkspace.jurisdiction],
            ["Default mode", activeWorkspace.defaultChatMode],
            ["Citation style", activeWorkspace.preferredCitationStyle],
            ["Model", `${activeWorkspace.preferredProvider} / ${activeWorkspace.preferredModel}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-border/60 bg-card/40 p-4">
              <div className="text-sm font-medium text-muted-foreground">{label}</div>
              <div className="mt-2 text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-border/80 bg-background/50 p-8 shadow-sm backdrop-blur-3xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-bold tracking-[0.22em] text-muted-foreground/80">Timeline</div>
              <div className="mt-1 text-xl font-semibold">Recent workspace activity</div>
            </div>
            <Link to={`/workspaces/${activeWorkspace.id}/chat`} className="text-sm font-medium text-primary hover:underline">Open research</Link>
          </div>
          <div className="mt-6">
            <TimelineView items={activity ?? []} />
          </div>
        </Card>
        <Card className="space-y-4 border-border/80 bg-background/50 p-8 shadow-sm backdrop-blur-3xl">
          <div className="text-[11px] uppercase font-bold tracking-[0.22em] text-muted-foreground/80">Next actions</div>
          <Link to={`/workspaces/${activeWorkspace.id}/sources`} className="block rounded-[20px] border border-border/60 bg-card/40 px-5 py-4 text-sm font-medium hover:bg-accent/40 hover:border-border/80 transition-all">Import or inspect sources</Link>
          <Link to={`/workspaces/${activeWorkspace.id}/drafts`} className="block rounded-[20px] border border-border/60 bg-card/40 px-5 py-4 text-sm font-medium hover:bg-accent/40 hover:border-border/80 transition-all">Open draft workspace</Link>
          <Link to={`/workspaces/${activeWorkspace.id}/notes`} className="block rounded-[20px] border border-border/60 bg-card/40 px-5 py-4 text-sm font-medium hover:bg-accent/40 hover:border-border/80 transition-all">Capture issue notes</Link>
        </Card>
      </div>
    </div>
  );
};
