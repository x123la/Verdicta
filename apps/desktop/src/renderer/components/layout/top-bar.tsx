import { Badge } from "@verdicta/ui";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/hooks/use-verdicta-query";

const sectionTitle = (pathname: string) => {
  if (pathname.startsWith("/workspaces")) return "Workspace intelligence";
  if (pathname.startsWith("/library")) return "Local legal library";
  if (pathname.startsWith("/research")) return "Grounded legal research";
  if (pathname.startsWith("/drafts")) return "Drafting and verification";
  if (pathname.startsWith("/settings")) return "Provider and privacy settings";
  if (pathname.startsWith("/documents")) return "Document viewer";
  return "Home dashboard";
};

export const TopBar = () => {
  const { data: settings } = useSettings();
  const location = useLocation();

  return (
    <header className="flex items-center justify-between border-b border-border/70 px-6 py-4">
      <div>
        <div className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Verdicta workspace</div>
        <div className="mt-1 text-lg font-semibold">{sectionTitle(location.pathname)}</div>
      </div>
      <div className="flex items-center gap-3">
        <Badge className="gap-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          {settings?.privacyMode ? "Privacy mode on" : "Standard mode"}
        </Badge>
        <Badge className="gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          {settings?.defaultModelProvider ?? "Provider pending"} / {settings?.defaultModelName ?? "Model pending"}
        </Badge>
      </div>
    </header>
  );
};
