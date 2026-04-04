import { Card } from "@verdicta/ui";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ImportDropzone } from "@/components/sources/import-dropzone";
import { IngestionStatusBadge } from "@/components/sources/ingestion-status-badge";
import { SearchFilters } from "@/components/library/search-filters";
import { EmptyState } from "@/components/common/empty-state";
import { useDocuments, useImportDocuments, useWorkspaceDocuments } from "@/hooks/use-verdicta-query";
import { invokeIpc } from "@/lib/ipc";

export const WorkspaceSourcesScreen = () => {
  const { workspaceId } = useParams();
  const [query, setQuery] = useState("");
  const importDocuments = useImportDocuments();
  const { data: documents } = useWorkspaceDocuments(workspaceId);
  const { data: searchResults } = useDocuments(workspaceId, query);
  const rows = useMemo(
    () => (query.trim() ? (searchResults ?? []) : (documents ?? [])),
    [documents, query, searchResults]
  );

  const handleImport = async () => {
    if (!workspaceId) return;
    const filePaths = await invokeIpc("system:pick-files", {
      filters: [
        { name: "Supported legal sources", extensions: ["pdf", "docx", "txt", "md"] },
        { name: "PDF", extensions: ["pdf"] },
        { name: "Word", extensions: ["docx"] },
        { name: "Text and Markdown", extensions: ["txt", "md"] }
      ]
    });
    if (!filePaths.length) return;
    await importDocuments.mutateAsync({ workspaceId, filePaths });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Sources</div>
          <h1 className="mt-2 text-2xl font-semibold">Workspace sources and ingestion</h1>
        </div>
        <ImportDropzone onImport={handleImport} disabled={importDocuments.isPending} />
        <SearchFilters query={query} onQueryChange={setQuery} />
      </Card>
      {rows.length ? (
        <Card className="overflow-hidden rounded-2xl border border-border/70 p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-background/70 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Citation</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((document) => (
                <tr key={document.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/documents/${document.id}`} className="hover:underline">
                      {document.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{document.citation ?? "N/A"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{document.documentType}</td>
                  <td className="px-4 py-3">
                    <IngestionStatusBadge status={document.extractionStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState
          title="No sources yet"
          body="Import authorities into this workspace to enable search, grounded research, and source-backed drafting."
        />
      )}
    </div>
  );
};
