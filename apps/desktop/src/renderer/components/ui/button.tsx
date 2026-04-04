import type { ButtonHTMLAttributes } from "react";
import { cn } from "@verdicta/ui";

export const Button = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-xl border border-border/80 bg-accent px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);
