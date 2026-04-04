import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type {
  DocumentChunk,
  DocumentDetail,
  DocumentRecord,
  DocumentSearchResult,
  SearchDocumentsInput
} from "@verdicta/shared";
import { documentChunks, documentPages, documents } from "../schema/tables";
import type { VerdictaDatabase } from "../client";
import { nowIso, parseJson } from "./base";

const toDocument = (row: typeof documents.$inferSelect): DocumentRecord => ({
  id: row.id,
  workspaceId: row.workspaceId,
  title: row.title,
  fileName: row.fileName,
  filePath: row.filePath,
  mimeType: row.mimeType,
  fileSize: row.fileSize,
  checksum: row.checksum,
  documentType: row.documentType as DocumentRecord["documentType"],
  jurisdiction: row.jurisdiction,
  court: row.court,
  citation: row.citation,
  dateIssued: row.dateIssued,
  extractionStatus: row.extractionStatus as DocumentRecord["extractionStatus"],
  parsedMetadata: parseJson(row.parsedMetadataJson, {}),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const toChunk = (row: typeof documentChunks.$inferSelect): DocumentChunk => ({
  id: row.id,
  documentId: row.documentId,
  pageStart: row.pageStart,
  pageEnd: row.pageEnd,
  chunkIndex: row.chunkIndex,
  heading: row.heading,
  text: row.text,
  tokenEstimate: row.tokenEstimate,
  embeddingJsonNullable: row.embeddingJsonNullable,
  createdAt: row.createdAt
});

export type DocumentInsert = Omit<DocumentRecord, "parsedMetadata" | "createdAt" | "updatedAt"> & {
  parsedMetadata: Record<string, unknown>;
};

export class DocumentRepository {
  constructor(private readonly db: VerdictaDatabase) {}

  async createMany(items: DocumentInsert[]): Promise<DocumentRecord[]> {
    const now = nowIso();
    if (!items.length) {
      return [];
    }

    await this.db.insert(documents).values(
      items.map((item) => ({
        id: item.id,
        workspaceId: item.workspaceId,
        title: item.title,
        fileName: item.fileName,
        filePath: item.filePath,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        checksum: item.checksum,
        documentType: item.documentType,
        jurisdiction: item.jurisdiction,
        court: item.court,
        citation: item.citation,
        dateIssued: item.dateIssued,
        parsedMetadataJson: JSON.stringify(item.parsedMetadata),
        extractionStatus: item.extractionStatus,
        createdAt: now,
        updatedAt: now
      }))
    );

    const rows = await this.db.select().from(documents).orderBy(desc(documents.createdAt));
    const ids = new Set(items.map((item) => item.id));
    return rows.filter((row) => ids.has(row.id)).map(toDocument);
  }

  async updateExtractionStatus(documentId: string, extractionStatus: DocumentRecord["extractionStatus"]) {
    await this.db
      .update(documents)
      .set({ extractionStatus, updatedAt: nowIso() })
      .where(eq(documents.id, documentId));
  }

  async get(documentId: string): Promise<DocumentDetail | null> {
    const [row] = await this.db.select().from(documents).where(eq(documents.id, documentId));
    if (!row) {
      return null;
    }

    const [pages, chunks] = await Promise.all([
      this.db.select().from(documentPages).where(eq(documentPages.documentId, documentId)),
      this.db.select().from(documentChunks).where(eq(documentChunks.documentId, documentId))
    ]);

    return {
      ...toDocument(row),
      pages: pages.map((page) => ({
        id: page.id,
        documentId: page.documentId,
        pageNumber: page.pageNumber,
        extractedText: page.extractedText
      })),
      chunks: chunks.map(toChunk)
    };
  }

  async listByWorkspace(workspaceId: string): Promise<DocumentRecord[]> {
    const rows = await this.db
      .select()
      .from(documents)
      .where(eq(documents.workspaceId, workspaceId))
      .orderBy(desc(documents.updatedAt));
    return rows.map(toDocument);
  }

  async search(input: SearchDocumentsInput): Promise<DocumentSearchResult[]> {
    const predicates = [];
    if (input.workspaceId) predicates.push(eq(documents.workspaceId, input.workspaceId));
    if (input.jurisdiction) predicates.push(eq(documents.jurisdiction, input.jurisdiction));
    if (input.court) predicates.push(eq(documents.court, input.court));
    if (input.dateFrom) predicates.push(gte(documents.dateIssued, input.dateFrom));
    if (input.dateTo) predicates.push(lte(documents.dateIssued, input.dateTo));
    if (input.documentTypes.length) {
      predicates.push(
        sql`${documents.documentType} in ${sql.raw(`(${input.documentTypes.map((value) => `'${value}'`).join(",")})`)}`
      );
    }

    const chunkRows = await this.db
      .select({
        documentId: documentChunks.documentId,
        chunkId: documentChunks.id,
        pageStart: documentChunks.pageStart,
        pageEnd: documentChunks.pageEnd,
        chunkIndex: documentChunks.chunkIndex,
        heading: documentChunks.heading,
        text: documentChunks.text,
        tokenEstimate: documentChunks.tokenEstimate,
        embeddingJsonNullable: documentChunks.embeddingJsonNullable,
        createdAt: documentChunks.createdAt,
        title: documents.title,
        workspaceId: documents.workspaceId,
        fileName: documents.fileName,
        filePath: documents.filePath,
        mimeType: documents.mimeType,
        fileSize: documents.fileSize,
        checksum: documents.checksum,
        documentType: documents.documentType,
        jurisdiction: documents.jurisdiction,
        court: documents.court,
        citation: documents.citation,
        dateIssued: documents.dateIssued,
        parsedMetadataJson: documents.parsedMetadataJson,
        extractionStatus: documents.extractionStatus,
        docCreatedAt: documents.createdAt,
        docUpdatedAt: documents.updatedAt,
        matchScore: sql<number>`
          (case when lower(${documents.title}) like lower(${"%" + input.query + "%"}) then 12 else 0 end) +
          (case when ${documentChunks.heading} is not null and lower(${documentChunks.heading}) like lower(${"%" + input.query + "%"}) then 7 else 0 end) +
          (case when lower(${documentChunks.text}) like lower(${"%" + input.query + "%"}) then 5 else 0 end) +
          (case when ${documents.citation} is not null and lower(${documents.citation}) like lower(${"%" + input.query + "%"}) then 8 else 0 end)
        `
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(
        and(
          ...predicates,
          sql`(
            lower(${documents.title}) like lower(${"%" + input.query + "%"}) or
            lower(coalesce(${documents.citation}, '')) like lower(${"%" + input.query + "%"}) or
            lower(${documentChunks.text}) like lower(${"%" + input.query + "%"})
          )`
        )
      )
      .orderBy(desc(sql`matchScore`));

    return chunkRows.slice(0, 50).map((row) => ({
      id: row.documentId,
      workspaceId: row.workspaceId,
      title: row.title,
      fileName: row.fileName,
      filePath: row.filePath,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
      checksum: row.checksum,
      documentType: row.documentType as DocumentRecord["documentType"],
      jurisdiction: row.jurisdiction,
      court: row.court,
      citation: row.citation,
      dateIssued: row.dateIssued,
      parsedMetadata: parseJson(row.parsedMetadataJson, {}),
      extractionStatus: row.extractionStatus as DocumentRecord["extractionStatus"],
      createdAt: row.docCreatedAt,
      updatedAt: row.docUpdatedAt,
      matchReason:
        row.heading && row.heading.toLowerCase().includes(input.query.toLowerCase())
          ? `Matched heading "${row.heading}"`
          : row.title.toLowerCase().includes(input.query.toLowerCase())
            ? "Matched document title"
            : "Matched source text",
      matchScore: row.matchScore,
      hitChunk: {
        id: row.chunkId,
        documentId: row.documentId,
        pageStart: row.pageStart,
        pageEnd: row.pageEnd,
        chunkIndex: row.chunkIndex,
        heading: row.heading,
        text: row.text,
        tokenEstimate: row.tokenEstimate,
        embeddingJsonNullable: row.embeddingJsonNullable,
        createdAt: row.createdAt,
        matchScore: row.matchScore,
        matchReason: "Chunk relevance"
      }
    }));
  }
}
