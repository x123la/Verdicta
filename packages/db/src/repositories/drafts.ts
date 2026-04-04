import { desc, eq } from "drizzle-orm";
import { drafts } from "../schema/tables";
import { createId, nowIso } from "./base";
import type { VerdictaDatabase } from "../client";

export interface DraftRecord {
  id: string;
  workspaceId: string;
  title: string;
  draftType: "case-brief" | "legal-memo" | "argument-section" | "study-summary" | "class-note-summary";
  contentJson: string;
  sourceMapJson: string;
  verificationStatus: "verified" | "partial" | "unsupported" | "pending";
  createdAt: string;
  updatedAt: string;
}

export class DraftsRepository {
  constructor(private readonly db: VerdictaDatabase) {}

  async list(workspaceId: string): Promise<DraftRecord[]> {
    return this.db.select().from(drafts).where(eq(drafts.workspaceId, workspaceId)).orderBy(desc(drafts.updatedAt));
  }

  async upsert(input: Omit<DraftRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<DraftRecord> {
    const now = nowIso();
    if (input.id) {
      await this.db
        .update(drafts)
        .set({
          title: input.title,
          draftType: input.draftType,
          contentJson: input.contentJson,
          sourceMapJson: input.sourceMapJson,
          verificationStatus: input.verificationStatus,
          updatedAt: now
        })
        .where(eq(drafts.id, input.id));
      const [row] = await this.db.select().from(drafts).where(eq(drafts.id, input.id));
      return row;
    }

    const id = createId("draft");
    await this.db.insert(drafts).values({
      id,
      workspaceId: input.workspaceId,
      title: input.title,
      draftType: input.draftType,
      contentJson: input.contentJson,
      sourceMapJson: input.sourceMapJson,
      verificationStatus: input.verificationStatus,
      createdAt: now,
      updatedAt: now
    });
    const [row] = await this.db.select().from(drafts).where(eq(drafts.id, id));
    return row;
  }
}
