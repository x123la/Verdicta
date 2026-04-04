export const VerificationPanel = ({ status }: { status: string }) => (
  <div className="rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
    Verification status: <span className="font-medium text-foreground">{status}</span>. Unsupported claims and weak support appear here before export.
  </div>
);
