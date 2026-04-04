import { Card } from "@verdicta/ui";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { SearchFilters } from "@/components/library/search-filters";
import { SearchResultsList } from "@/components/library/search-results-list";
import { useDocuments, useWorkspaces } from "@/hooks/use-verdicta-query";

export const LibraryScreen = () => {
  const { data: workspaces } = useWorkspaces();
  const [query, setQuery] = useState("");
  const { data: results } = useDocuments(workspaces?.[0]?.id, query);

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Library</div>
          <h1 className="mt-2 text-2xl font-semibold">Search across local legal materials</h1>
        </div>
        <SearchFilters query={query} onQueryChange={setQuery} />
      </Card>
      {query.trim() ? (
        <SearchResultsList results={results ?? []} />
      ) : (
        <EmptyState
          title="Search the library"
          body="Enter an issue, holding, citation, court, or phrase to search across documents in the active workspace."
        />
      )}
    </div>
  );
};
