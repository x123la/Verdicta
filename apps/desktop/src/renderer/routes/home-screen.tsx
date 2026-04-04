import { Badge, Card } from "@verdicta/ui";
import { Link } from "react-router-dom";
import { useSettings, useWorkspaces } from "@/hooks/use-verdicta-query";

export const HomeScreen = () => {
  const { data: workspaces } = useWorkspaces();
  const { data: settings } = useSettings();
  const primaryWorkspace = workspaces?.[0];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <Card className="space-y-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Home dashboard</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Premium legal research, grounded by your sources.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Verdicta organizes matters, ingests authorities, retrieves supporting passages, and keeps every answer traceable back to the source material that supports it.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Recent workspaces", `${workspaces?.length ?? 0}`],
            ["Grounded outputs", "Source mapped"],
            ["Provider posture", settings?.localOnly ? "Local only" : "Cloud optional"],
            ["Citation style", settings?.citationStyle ?? "Bluebook"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-3 text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
        {primaryWorkspace ? (
          <Link to={`/workspaces/${primaryWorkspace.id}`} className="inline-flex rounded-xl border border-border/80 bg-accent px-4 py-2 text-sm font-medium">
            Open primary workspace
          </Link>
        ) : null}
      </Card>

      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">Quick actions</div>
            <div className="mt-1 text-lg font-semibold">Start from a legal workflow</div>
          </div>
          <Badge>Structured outputs</Badge>
        </div>
        <div className="space-y-3">
          {["Case brief generator", "Jurisprudence comparison", "Memo outline generation", "Source support review", "Study mode materials"].map((item) => (
            <div key={item} className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-sm">
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
