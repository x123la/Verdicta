import type { InputHTMLAttributes } from "react";
import { cn } from "@verdicta/ui";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "w-full rounded-xl border border-border bg-input/70 px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
      className
    )}
    {...props}
  />
);
