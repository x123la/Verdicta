import type { ExtractedPage } from "../types";

export interface ChunkedText {
  chunkIndex: number;
  heading: string | null;
  text: string;
  tokenEstimate: number;
  pageStart: number | null;
  pageEnd: number | null;
}

export const chunkText = (pages: ExtractedPage[], maxChars = 1400): ChunkedText[] => {
  const chunks: ChunkedText[] = [];
  let buffer = "";
  let heading: string | null = null;
  let startPage: number | null = null;
  let endPage: number | null = null;
  let index = 0;

  const flush = () => {
    const trimmed = buffer.trim();
    if (!trimmed) {
      return;
    }
    chunks.push({
      chunkIndex: index++,
      heading,
      text: trimmed,
      tokenEstimate: Math.ceil(trimmed.length / 4),
      pageStart: startPage,
      pageEnd: endPage
    });
    buffer = "";
    heading = null;
    startPage = null;
    endPage = null;
  };

  for (const page of pages) {
    const blocks = page.text
      .split(/\n{2,}/g)
      .map((block) => block.trim())
      .filter(Boolean);

    for (const block of blocks) {
      const blockHeading = inferHeading(block);
      const candidate = `${buffer ? `${buffer}\n\n` : ""}${block}`;
      if (candidate.length > maxChars && buffer) {
        flush();
      }

      if (startPage === null) {
        startPage = page.pageNumber;
      }
      endPage = page.pageNumber;
      heading ??= blockHeading;
      buffer = `${buffer ? `${buffer}\n\n` : ""}${block}`;
    }
  }

  flush();
  return chunks;
};

const inferHeading = (text: string): string | null => {
  const firstLine = text.split("\n")[0]?.trim();
  if (!firstLine) return null;
  if (firstLine.length < 90 && /^[A-Z0-9\s,:;().-]+$/.test(firstLine)) {
    return firstLine;
  }
  return null;
};
