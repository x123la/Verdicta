import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@verdicta/ui";

export const PanelShell = ({
  title,
  eyebrow,
  actions,
  children,
  className
}: PropsWithChildren<{ title: string; eyebrow?: string; actions?: ReactNode; className?: string }>) => (
  <section className={cn("rounded-[32px] border border-border/80 bg-background/50 shadow-sm backdrop-blur-3xl overflow-hidden flex flex-col", className)}>
    <div className="flex items-center justify-between border-b border-border/60 bg-card/40 px-6 py-5 shrink-0">
      <div>
        {eyebrow ? <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</div> : null}
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    <div className="p-6 flex-1 min-h-0 overflow-y-auto">{children}</div>
  </section>
);
