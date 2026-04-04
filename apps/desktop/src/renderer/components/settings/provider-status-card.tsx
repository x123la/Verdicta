export const ProviderStatusCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
    <div className="mt-2 text-sm">{value}</div>
  </div>
);
