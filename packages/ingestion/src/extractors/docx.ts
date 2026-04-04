import fs from "node:fs/promises";
import JSZip from "jszip";
import type { ExtractedPage } from "../types";

export const extractDocxFile = async (filePath: string): Promise<ExtractedPage[]> => {
  const buffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) {
    return [{ pageNumber: 1, text: "" }];
  }

  const text = xml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return [{ pageNumber: 1, text }];
};
