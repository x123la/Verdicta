import type { WorkspaceActivity } from "@verdicta/shared";

export const TimelineView = ({ items }: { items: WorkspaceActivity[] }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <div key={item.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">{item.title}</div>
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.kind}</div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">{item.detail}</div>
      </div>
    ))}
  </div>
);
