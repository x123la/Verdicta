import { desc, eq } from "drizzle-orm";
import type { CreateWorkspaceInput, Workspace, WorkspaceActivity } from "@verdicta/shared";
import { chats, documents, drafts, notes, workspaces } from "../schema/tables";
import { createId, nowIso, parseJson } from "./base";
import type { VerdictaDatabase } from "../client";

const toWorkspace = (row: typeof workspaces.$inferSelect): Workspace => ({
  id: row.id,
  title: row.title,
  description: row.description,
  jurisdiction: row.jurisdiction,
  tags: parseJson(row.tagsJson, [] as string[]),
  defaultChatMode: row.defaultChatMode as Workspace["defaultChatMode"],
  preferredCitationStyle: row.preferredCitationStyle,
  preferredWritingMode: row.preferredWritingMode,
  preferredProvider: row.preferredProvider,
  preferredModel: row.preferredModel,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

export class WorkspaceRepository {
  constructor(private readonly db: VerdictaDatabase) {}

  async list(): Promise<Workspace[]> {
    const rows = await this.db.select().from(workspaces).orderBy(desc(workspaces.updatedAt));
    return rows.map(toWorkspace);
  }

  async get(id: string): Promise<Workspace | null> {
    const [row] = await this.db.select().from(workspaces).where(eq(workspaces.id, id));
    return row ? toWorkspace(row) : null;
  }

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const now = nowIso();
    const row = {
      id: createId("ws"),
      title: input.title,
      description: input.description,
      jurisdiction: input.jurisdiction,
      tagsJson: JSON.stringify(input.tags),
      defaultChatMode: input.defaultChatMode,
      preferredCitationStyle: input.preferredCitationStyle,
      preferredWritingMode: input.preferredWritingMode,
      preferredProvider: input.preferredProvider,
      preferredModel: input.preferredModel,
      createdAt: now,
      updatedAt: now
    };

    await this.db.insert(workspaces).values(row);
    return (await this.get(row.id)) as Workspace;
  }

  async getActivity(workspaceId: string): Promise<WorkspaceActivity[]> {
    const [documentRows, chatRows, draftRows, noteRows] = await Promise.all([
      this.db.select().from(documents).where(eq(documents.workspaceId, workspaceId)),
      this.db.select().from(chats).where(eq(chats.workspaceId, workspaceId)),
      this.db.select().from(drafts).where(eq(drafts.workspaceId, workspaceId)),
      this.db.select().from(notes).where(eq(notes.workspaceId, workspaceId))
    ]);

    return [
      ...documentRows.map((row) => ({
        id: `activity_${row.id}`,
        workspaceId,
        title: row.title,
        kind: "document" as const,
        timestamp: row.updatedAt,
        detail: `${row.documentType.toUpperCase()} source updated`
      })),
      ...chatRows.map((row) => ({
        id: `activity_${row.id}`,
        workspaceId,
        title: row.title,
        kind: "chat" as const,
        timestamp: row.updatedAt,
        detail: `${row.mode} session`
      })),
      ...draftRows.map((row) => ({
        id: `activity_${row.id}`,
        workspaceId,
        title: row.title,
        kind: "draft" as const,
        timestamp: row.updatedAt,
        detail: `${row.draftType} draft`
      })),
      ...noteRows.map((row) => ({
        id: `activity_${row.id}`,
        workspaceId,
        title: row.title,
        kind: "note" as const,
        timestamp: row.updatedAt,
        detail: "Workspace note"
      }))
    ].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }
}
