type Authority = {
  id: string;
  title: string;
  citation: string | null;
  documentType: string;
};

export const PinnedAuthorities = ({ authorities }: { authorities: Authority[] }) => (
  <div className="space-y-3">
    {authorities.map((authority) => (
      <div key={authority.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
        <div className="font-medium">{authority.title}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">{authority.citation ?? authority.documentType}</div>
      </div>
    ))}
  </div>
);
