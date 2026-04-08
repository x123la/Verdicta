import { Badge, cn } from "@verdicta/ui";
import { BookOpenText, Bot, FolderKanban, Home, LibraryBig, PencilLine, Settings2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const groups = [
  {
    label: "Workspace",
    items: [
      { to: "/", label: "Home", icon: Home, end: true },
      { to: "/workspaces", label: "Workspaces", icon: FolderKanban },
      { to: "/drafts", label: "Drafts", icon: PencilLine }
    ]
  },
  {
    label: "Resources",
    items: [
      { to: "/library", label: "Library", icon: LibraryBig },
      { to: "/research", label: "Research", icon: BookOpenText }
    ]
  },
  {
    label: "System",
    items: [
      { to: "/local-ai", label: "Local AI", icon: Bot },
      { to: "/settings", label: "Settings", icon: Settings2 }
    ]
  }
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="relative z-50 flex h-full w-[280px] flex-col border-r border-border/80 bg-background/60 px-4 py-8 backdrop-blur-3xl window-drag">
      <div className="mb-10 px-2 space-y-3 no-drag">
        <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">Verdicta</div>
        <div>
          <div className="text-xl font-bold tracking-tight">Intelligence</div>
          <div className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Premium research, drafting, and verification grounded in your materials.
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-drag space-y-8 px-1">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-2.5 ml-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </div>
            <nav className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute inset-0 rounded-xl bg-card border border-border/80 shadow-panel"
                        initial={false}
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <Icon className={cn("relative z-10 h-[18px] w-[18px] transition-opacity", isActive ? "text-primary opacity-100" : "opacity-70 group-hover:opacity-100")} />
                    <span className="relative z-10">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="mt-auto px-1 no-drag">
        <div className="rounded-xl border border-border/60 bg-muted/40 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Local-first</Badge>
          </div>
          <div className="text-xs leading-relaxed text-muted-foreground">
            All AI operations execute safely on your local hardware constraints.
          </div>
        </div>
      </div>
    </aside>
  );
};
