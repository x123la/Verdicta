import { describe, expect, it } from "vitest";
import { rankSearchResults } from "../packages/core/src/search/rank-results";

describe("search ranking", () => {
  it("orders higher scores first", () => {
    const ranked = rankSearchResults([
      {
        id: "doc_1",
        workspaceId: "ws_1",
        title: "A",
        fileName: "a.txt",
        filePath: "a.txt",
        mimeType: "text/plain",
        fileSize: 1,
        checksum: "1",
        documentType: "txt",
        jurisdiction: null,
        court: null,
        citation: null,
        dateIssued: null,
        parsedMetadata: {},
        extractionStatus: "completed",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        matchReason: "test",
        matchScore: 2,
        hitChunk: null
      },
      {
        id: "doc_2",
        workspaceId: "ws_1",
        title: "B",
        fileName: "b.txt",
        filePath: "b.txt",
        mimeType: "text/plain",
        fileSize: 1,
        checksum: "2",
        documentType: "txt",
        jurisdiction: null,
        court: null,
        citation: null,
        dateIssued: null,
        parsedMetadata: {},
        extractionStatus: "completed",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        matchReason: "test",
        matchScore: 9,
        hitChunk: null
      }
    ]);

    expect(ranked[0]?.id).toBe("doc_2");
  });
});
