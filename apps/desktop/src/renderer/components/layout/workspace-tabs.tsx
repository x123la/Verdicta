import type { WorkspaceTab } from "@verdicta/shared";
import { NavLink } from "react-router-dom";
import { cn } from "@verdicta/ui";

const tabs: Array<{ tab: WorkspaceTab; suffix: string }> = [
  { tab: "overview", suffix: "" },
  { tab: "sources", suffix: "/sources" },
  { tab: "chat", suffix: "/chat" },
  { tab: "authorities", suffix: "/authorities" },
  { tab: "notes", suffix: "/notes" },
  { tab: "drafts", suffix: "/drafts" },
  { tab: "timeline", suffix: "" }
];

export const WorkspaceTabs = ({ workspaceId, activeTab }: { workspaceId: string; activeTab: WorkspaceTab }) => (
  <div className="flex flex-wrap gap-2 border-b border-border/70 px-6 py-3">
    {tabs.map(({ tab, suffix }) => (
      <NavLink
        key={tab}
        to={`/workspaces/${workspaceId}${suffix}`}
        className={cn(
          "rounded-full px-4 py-2 text-sm capitalize transition",
          activeTab === tab
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        )}
      >
        {tab}
      </NavLink>
    ))}
  </div>
);
