import type { HTMLAttributes } from "react";
import { cn } from "./utils";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border border-border/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground",
      className
    )}
    {...props}
  />
);
