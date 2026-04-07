import { Badge, cn } from "@verdicta/ui";
import { BookOpenText, Bot, FolderKanban, Home, LibraryBig, PencilLine, Settings2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/workspaces", label: "Workspaces", icon: FolderKanban },
  { to: "/library", label: "Library", icon: LibraryBig },
  { to: "/research", label: "Research", icon: BookOpenText },
  { to: "/drafts", label: "Drafts", icon: PencilLine },
  { to: "/local-ai", label: "Local AI", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings2 }
] as const;

export const AppSidebar = () => (
  <aside className="flex h-full w-[272px] flex-col border-r border-border/70 bg-card/65 px-4 py-5 backdrop-blur-xl">
    <div className="mb-8 space-y-3">
      <div className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">Verdicta</div>
      <div>
        <div className="text-xl font-semibold tracking-tight">Legal Intelligence Workspace</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Premium research, drafting, and verification grounded in your uploaded legal materials.
        </div>
      </div>
      <div className="flex gap-2">
        <Badge>Local-first</Badge>
        <Badge>Traceable</Badge>
      </div>
    </div>

    <nav className="space-y-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition",
                isActive
                  ? "border border-border bg-accent text-foreground shadow-panel"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>

    <div className="mt-auto rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Trust posture</div>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">
        Grounded outputs separate direct support, inference, and uncertainty. Provider access stays behind a typed
        preload bridge.
      </div>
    </div>
  </aside>
);
