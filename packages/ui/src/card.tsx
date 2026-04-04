import type { HTMLAttributes } from "react";
import { cn } from "./utils";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-2xl border border-border/70 bg-card/90 p-5 shadow-panel backdrop-blur-sm",
      className
    )}
    {...props}
  />
);
