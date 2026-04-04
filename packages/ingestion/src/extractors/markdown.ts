import fs from "node:fs/promises";
import type { ExtractedPage } from "../types";

export const extractMarkdownFile = async (filePath: string): Promise<ExtractedPage[]> => {
  const content = await fs.readFile(filePath, "utf8");
  const normalized = content
    .replace(/^#{1,6}\s+/gm, (match) => `${match.trim().toUpperCase()}\n`)
    .replace(/\r\n/g, "\n");
  return [{ pageNumber: 1, text: normalized }];
};
