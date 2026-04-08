import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Bot, FolderKanban, Home, LayoutDashboard, LibraryBig, Settings2 } from "lucide-react";

export const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    
    const openCmdk = () => setOpen(true);
    window.addEventListener("open-cmdk", openCmdk);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-cmdk", openCmdk);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-50 w-full max-w-[640px] overflow-hidden rounded-xl border border-border/50 bg-card/95 shadow-panel backdrop-blur-xl">
        <Command
          className="flex w-full flex-col overflow-hidden bg-transparent"
          shouldFilter={true}
        >
          <div className="flex items-center border-b border-border/40 px-3">
            <Command.Input
              className="flex h-14 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Type a command or search..."
              autoFocus
            />
          </div>
          <Command.List className="max-h-[340px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Navigation" className="px-2 py-2 text-xs font-semibold text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => navigate("/"))}
                className="flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent/80 aria-selected:bg-accent/80 transition-colors"
              >
                <Home className="h-4 w-4" /> Home Dashboard
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/workspaces"))}
                className="flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent/80 aria-selected:bg-accent/80 transition-colors"
              >
                <FolderKanban className="h-4 w-4" /> Workspaces
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/library"))}
                className="flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent/80 aria-selected:bg-accent/80 transition-colors"
              >
                <LibraryBig className="h-4 w-4" /> Local Library
              </Command.Item>
            </Command.Group>

            <Command.Group heading="System" className="px-2 py-2 text-xs font-semibold text-muted-foreground">
              <Command.Item
                onSelect={() => runCommand(() => navigate("/local-ai"))}
                className="flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent/80 aria-selected:bg-accent/80 transition-colors"
              >
                <Bot className="h-4 w-4" /> Local AI Models
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate("/settings"))}
                className="flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent/80 aria-selected:bg-accent/80 transition-colors"
              >
                <Settings2 className="h-4 w-4" /> Settings & Providers
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
