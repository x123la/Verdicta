import fs from "node:fs/promises";
import type { ExtractedPage } from "../types";

export const extractTextFile = async (filePath: string): Promise<ExtractedPage[]> => {
  const content = await fs.readFile(filePath, "utf8");
  return [{ pageNumber: 1, text: content }];
};
