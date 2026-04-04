import { Input } from "@/components/ui/input";

export const SearchFilters = ({
  query,
  onQueryChange
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) => (
  <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/50 p-4 md:grid-cols-[2fr_1fr_1fr]">
    <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search by issue, rule, holding, citation, or phrase" />
    <div className="rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground">Workspace scoped</div>
    <div className="rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground">Chunk text + metadata ranking</div>
  </div>
);
