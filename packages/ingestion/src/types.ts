import type { ChunkedText } from "./chunking/chunk-text";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface IngestedDocument {
  title: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  documentType: "pdf" | "docx" | "txt" | "markdown";
  pages: ExtractedPage[];
  chunks: ChunkedText[];
  metadata: Record<string, unknown>;
}

export interface StoredFile {
  targetPath: string;
  checksum: string;
  fileSize: number;
  originalFileName: string;
}
