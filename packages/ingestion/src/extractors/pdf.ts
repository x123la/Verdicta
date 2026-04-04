import fs from "node:fs/promises";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ExtractedPage } from "../types";

export const extractPdfPages = async (filePath: string): Promise<ExtractedPage[]> => {
  const data = await fs.readFile(filePath);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: ExtractedPage[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({
      pageNumber: pageIndex,
      text
    });
  }

  return pages;
};
