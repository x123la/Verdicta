export const EmptyState = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-6 text-sm text-muted-foreground">
    <div className="font-medium text-foreground">{title}</div>
    <div className="mt-2 leading-6">{body}</div>
  </div>
);
