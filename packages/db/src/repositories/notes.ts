import { desc, eq } from "drizzle-orm";
import { notes } from "../schema/tables";
import { createId, nowIso } from "./base";
import type { VerdictaDatabase } from "../client";

export interface NoteRecord {
  id: string;
  workspaceId: string;
  documentIdNullable: string | null;
  title: string;
  contentJson: string;
  createdAt: string;
  updatedAt: string;
}

export class NotesRepository {
  constructor(private readonly db: VerdictaDatabase) {}

  async list(workspaceId: string): Promise<NoteRecord[]> {
    return this.db.select().from(notes).where(eq(notes.workspaceId, workspaceId)).orderBy(desc(notes.updatedAt));
  }

  async upsert(input: Omit<NoteRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<NoteRecord> {
    const now = nowIso();
    if (input.id) {
      await this.db
        .update(notes)
        .set({
          title: input.title,
          contentJson: input.contentJson,
          documentIdNullable: input.documentIdNullable,
          updatedAt: now
        })
        .where(eq(notes.id, input.id));
      const [row] = await this.db.select().from(notes).where(eq(notes.id, input.id));
      return row;
    }

    const id = createId("note");
    await this.db.insert(notes).values({
      id,
      workspaceId: input.workspaceId,
      documentIdNullable: input.documentIdNullable,
      title: input.title,
      contentJson: input.contentJson,
      createdAt: now,
      updatedAt: now
    });
    const [row] = await this.db.select().from(notes).where(eq(notes.id, id));
    return row;
  }
}
