import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@verdicta/ui";

export const PanelShell = ({
  title,
  eyebrow,
  actions,
  children,
  className
}: PropsWithChildren<{ title: string; eyebrow?: string; actions?: ReactNode; className?: string }>) => (
  <section className={cn("rounded-3xl border border-border/70 bg-card/70 shadow-panel backdrop-blur-xl", className)}>
    <div className="flex items-start justify-between border-b border-border/70 px-5 py-4">
      <div>
        {eyebrow ? <div className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">{eyebrow}</div> : null}
        <h2 className="mt-1 text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {actions}
    </div>
    <div className="p-5">{children}</div>
  </section>
);
