import { Badge, Card } from "@verdicta/ui";
import { Link } from "react-router-dom";
import { useSettings, useWorkspaces } from "@/hooks/use-verdicta-query";
import { CopyPlus, Network, Scale, LayoutPanelLeft, ShieldEllipsis, GitMerge, FileCheck2, SquarePlay } from "lucide-react";

export const HomeScreen = () => {
  const { data: workspaces } = useWorkspaces();
  const { data: settings } = useSettings();
  const primaryWorkspace = workspaces?.[0];

  return (
    <div className="grid h-full gap-5 xl:grid-cols-[1.5fr_1fr]">
      <Card className="flex flex-col border-border/80 bg-background/50 backdrop-blur-3xl p-8 shadow-sm">
        <div className="flex-1">
          <div className="text-[11px] uppercase font-bold tracking-[0.24em] text-muted-foreground/80 flex items-center gap-2">
            <LayoutPanelLeft className="w-4 h-4 text-primary shrink-0" /> Local Intelligence Dashboard
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground/90">Premium legal research, <span className="text-primary/90">grounded by your sources.</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Verdicta organizes matters, ingests authorities, retrieves supporting passages, and keeps every AI answer explicitly mapped to the source material that supports it.
          </p>

          <div className="mt-10 grid gap-4 grid-cols-2">
            {[
              ["Active Workspaces", `${workspaces?.length ?? 0}`, Network],
              ["Research Traces", "Full Provenance", GitMerge],
              ["Provider Isolation", settings?.localOnly ? "Local Only" : "Cloud Extended", ShieldEllipsis],
              ["Citation Preference", settings?.citationStyle ?? "Bluebook", Scale]
            ].map(([label, value, Icon]) => (
              <div key={label as string} className="group rounded-[24px] border border-border/60 bg-card/40 p-5 transition-all hover:bg-accent/40 hover:border-border/80">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {/* @ts-ignore */}
                  <Icon className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  {label as string}
                </div>
                <div className="mt-3 text-2xl font-semibold">{value as string}</div>
              </div>
            ))}
          </div>
        </div>

        {primaryWorkspace ? (
          <div className="mt-8">
            <Link to={`/workspaces/${primaryWorkspace.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-foreground text-background hover:bg-foreground/90 px-6 py-3 text-sm font-semibold transition-all">
              <SquarePlay className="w-4 h-4" /> Open Primary Workspace
            </Link>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-5">
        <Card className="flex flex-col border-border/80 bg-background/50 backdrop-blur-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-bold tracking-[0.24em] text-muted-foreground/80">Quick Start</div>
              <div className="mt-1 text-xl font-semibold">Legal Workflows</div>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/20">Structured</Badge>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {[
              ["Case Brief Generator", "Draft a quick summary from imported jurisprudence.", FileCheck2],
              ["Jurisprudence Comparison", "Cross-examine contrasting rulings side-by-side.", Scale],
              ["Memo Outline Generation", "Lay out structural blocks for primary arguments.", CopyPlus]
            ].map(([title, desc, Icon]) => (
              <button key={title as string} className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card/40 hover:bg-accent/40 hover:border-border/80 p-4 transition-all text-left">
                <div className="rounded-full bg-background border border-border/60 p-2 text-muted-foreground group-hover:text-primary transition-colors">
                  {/* @ts-ignore */}
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{title as string}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{desc as string}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
