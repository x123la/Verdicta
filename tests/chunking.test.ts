import { describe, expect, it } from "vitest";
import { chunkText } from "../packages/ingestion/src/chunking/chunk-text";

describe("chunkText", () => {
  it("creates ordered chunks with page references", () => {
    const chunks = chunkText([
      { pageNumber: 1, text: "FACTS\n\nA short paragraph.\n\nAnother paragraph." },
      { pageNumber: 2, text: "ISSUE\n\nWhether the policy violates the First Amendment." }
    ], 50);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.pageStart).toBe(1);
    expect(chunks.at(-1)?.pageEnd).toBe(2);
  });
});
