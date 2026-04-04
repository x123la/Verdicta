import { describe, expect, it } from "vitest";
import { normalizeQuery } from "../packages/core/src/retrieval/normalize-query";
import { assembleContext } from "../packages/core/src/retrieval/assemble-context";

describe("retrieval helpers", () => {
  it("normalizes query whitespace and punctuation", () => {
    expect(normalizeQuery("  holding!!!   first amendment  ")).toBe("holding first amendment");
  });

  it("assembles source context blocks", () => {
    const context = assembleContext([
      {
        id: "ref_1",
        documentId: "doc_1",
        documentTitle: "Sample Opinion",
        chunkId: "chunk_1",
        pageStart: 4,
        pageEnd: 5,
        snippet: "The regulation was content-based.",
        supportLevel: "direct"
      }
    ]);

    expect(context).toContain("Sample Opinion");
    expect(context).toContain("content-based");
  });
});
