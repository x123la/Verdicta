import { Badge } from "@verdicta/ui";
import { Search, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/hooks/use-verdicta-query";
import { useEffect, useState } from "react";

const sectionTitle = (pathname: string) => {
  if (pathname.startsWith("/workspaces")) return "Workspace Intelligence";
  if (pathname.startsWith("/library")) return "Local Legal Library";
  if (pathname.startsWith("/research")) return "Grounded Legal Research";
  if (pathname.startsWith("/drafts")) return "Drafting and Verification";
  if (pathname.startsWith("/local-ai")) return "Local AI Runtime Catalog";
  if (pathname.startsWith("/settings")) return "Provider and Privacy Settings";
  if (pathname.startsWith("/documents")) return "Document Viewer";
  return "Home Dashboard";
};

export const TopBar = () => {
  const { data: settings } = useSettings();
  const location = useLocation();
  const [isMac, setIsMac] = useState(false);
  
  useEffect(() => {
    setIsMac(navigator.userAgent.includes("Mac"));
  }, []);

  return (
    <header className="window-drag flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/60 px-6 backdrop-blur-3xl">
      <div className="flex flex-1 items-center gap-4">
        <div className="no-drag flex items-center gap-2">
          <div className="text-[13px] font-semibold text-muted-foreground/70">Verdicta Workspace</div>
          <span className="text-muted-foreground/30">/</span>
          <div className="text-[13px] font-bold text-foreground">{sectionTitle(location.pathname)}</div>
        </div>
      </div>

      <div className="flex flex-1 justify-center px-4">
        <button 
          className="no-drag group flex h-[34px] w-full max-w-[340px] items-center gap-2.5 rounded-[8px] border border-border/80 bg-input/40 px-3 text-sm text-muted-foreground transition-all hover:border-border hover:bg-input/80 hover:text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => window.dispatchEvent(new CustomEvent('open-cmdk'))}
        >
          <Search className="h-[14px] w-[14px]" />
          <span className="flex-1 text-left text-[13px]">Search or jump to...</span>
          <kbd className="inline-flex h-5 items-center gap-1 rounded bg-muted shadow-sm px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-hover:text-foreground group-hover:bg-background transition-colors">
            <span>{isMac ? "⌘" : "Ctrl"}</span>K
          </kbd>
        </button>
      </div>

      <div className="no-drag flex flex-1 items-center justify-end gap-3">
        <Badge className="gap-1.5 bg-background shadow-xs text-xs font-semibold py-1">
          <ShieldCheck className="h-3 w-3 text-indigo-400" />
          {settings?.privacyMode ? "Privacy Mode" : "Standard"}
        </Badge>
        <Badge className="gap-1.5 bg-background shadow-xs text-xs font-semibold py-1">
          <Sparkles className="h-3 w-3 text-violet-400" />
          {settings?.defaultModelProvider ?? "Pending"} / {settings?.defaultModelName ?? "Pending"}
        </Badge>
      </div>
    </header>
  );
};
