import path from "node:path";
import { chunkText } from "./chunking/chunk-text";
import { extractDocxFile } from "./extractors/docx";
import { extractMarkdownFile } from "./extractors/markdown";
import { extractPdfPages } from "./extractors/pdf";
import { extractTextFile } from "./extractors/text";
import { extractDocumentMetadata } from "./metadata/extract-metadata";
import { storeImportedFile } from "./storage/file-store";
import type { IngestedDocument } from "./types";

const toDocumentType = (ext: string): IngestedDocument["documentType"] => {
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "docx";
  if (ext === ".md") return "markdown";
  return "txt";
};

const toMimeType = (documentType: IngestedDocument["documentType"]) => {
  switch (documentType) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "markdown":
      return "text/markdown";
    default:
      return "text/plain";
  }
};

export const ingestFile = async (
  workspaceId: string,
  filePath: string,
  storageRoot: string
): Promise<IngestedDocument> => {
  const stored = storeImportedFile(workspaceId, filePath, storageRoot);
  const ext = path.extname(filePath).toLowerCase();
  const documentType = toDocumentType(ext);

  const pages =
    documentType === "pdf"
      ? await extractPdfPages(stored.targetPath)
      : documentType === "docx"
        ? await extractDocxFile(stored.targetPath)
        : documentType === "markdown"
          ? await extractMarkdownFile(stored.targetPath)
          : await extractTextFile(stored.targetPath);

  const metadata = extractDocumentMetadata(pages);

  return {
    title: path.basename(filePath, ext),
    fileName: stored.originalFileName,
    filePath: stored.targetPath,
    mimeType: toMimeType(documentType),
    fileSize: stored.fileSize,
    checksum: stored.checksum,
    documentType,
    pages,
    chunks: chunkText(pages),
    metadata: {
      ...metadata,
      extractionMethod: documentType === "pdf" ? "native-pdf-text" : "structured-file",
      ocrUsed: false
    }
  };
};
