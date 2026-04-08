import type { WorkspaceTab } from "@verdicta/shared";
import { NavLink } from "react-router-dom";
import { cn } from "@verdicta/ui";
import { motion } from "framer-motion";

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
  <div className="flex flex-wrap gap-1.5 border-b border-border/60 bg-background/40 px-6 py-3 backdrop-blur-lg">
    {tabs.map(({ tab, suffix }) => (
      <NavLink
        key={tab}
        to={`/workspaces/${workspaceId}${suffix}`}
        className={cn(
          "relative rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          activeTab === tab
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {activeTab === tab && (
          <motion.div
            layoutId="activeWorkspaceTab"
            className="absolute inset-0 z-0 rounded-full bg-accent/80 border border-border/60 shadow-sm"
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />
        )}
        <span className="relative z-10">{tab}</span>
      </NavLink>
    ))}
  </div>
);
