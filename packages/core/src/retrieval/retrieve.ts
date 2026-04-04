import type { SourceReference } from "@verdicta/shared";
import type { VerdictaDatabase } from "@verdicta/db";
import { DocumentRepository } from "@verdicta/db";
import { normalizeQuery } from "./normalize-query";

export const retrieveRelevantChunks = async (
  db: VerdictaDatabase,
  workspaceId: string,
  query: string,
  selectedDocumentIds: string[]
): Promise<SourceReference[]> => {
  const repository = new DocumentRepository(db);
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  const results = await repository.search({
    workspaceId,
    query: normalizedQuery,
    documentTypes: [],
    court: undefined,
    jurisdiction: undefined,
    dateFrom: undefined,
    dateTo: undefined
  });

  return results
    .filter((row) => !selectedDocumentIds.length || selectedDocumentIds.includes(row.id))
    .slice(0, 8)
    .flatMap((row) =>
      row.hitChunk
        ? [
            {
              id: `${row.id}:${row.hitChunk.id}`,
              documentId: row.id,
              documentTitle: row.title,
              chunkId: row.hitChunk.id,
              pageStart: row.hitChunk.pageStart,
              pageEnd: row.hitChunk.pageEnd,
              snippet: row.hitChunk.text.slice(0, 700),
              supportLevel: row.matchScore >= 10 ? "direct" : "weak"
            } satisfies SourceReference
          ]
        : []
    );
};
