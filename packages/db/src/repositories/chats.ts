import { desc, eq } from "drizzle-orm";
import type { ChatMessage, ChatSession, SourceMap } from "@verdicta/shared";
import { chatMessages, chats } from "../schema/tables";
import { createId, nowIso, parseJson } from "./base";
import type { VerdictaDatabase } from "../client";

const emptySourceMap: SourceMap = {
  references: [],
  supportedClaims: [],
  inferredAnalysis: [],
  unsupportedClaims: [],
  uncertainty: []
};

const toChat = (row: typeof chats.$inferSelect): ChatSession => ({
  id: row.id,
  workspaceId: row.workspaceId,
  title: row.title,
  mode: row.mode as ChatSession["mode"],
  modelProvider: row.modelProvider,
  modelName: row.modelName,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const toMessage = (row: typeof chatMessages.$inferSelect): ChatMessage => ({
  id: row.id,
  chatId: row.chatId,
  role: row.role as ChatMessage["role"],
  content: row.content,
  sourceMap: parseJson(row.sourceMapJson, emptySourceMap),
  createdAt: row.createdAt
});

export class ChatsRepository {
  constructor(private readonly db: VerdictaDatabase) {}

  async list(workspaceId: string): Promise<ChatSession[]> {
    const rows = await this.db.select().from(chats).where(eq(chats.workspaceId, workspaceId)).orderBy(desc(chats.updatedAt));
    return rows.map(toChat);
  }

  async get(chatId: string): Promise<ChatSession | null> {
    const [row] = await this.db.select().from(chats).where(eq(chats.id, chatId));
    return row ? toChat(row) : null;
  }

  async ensureChat(input: {
    chatId?: string;
    workspaceId: string;
    mode: ChatSession["mode"];
    title: string;
    modelProvider: string;
    modelName: string;
  }): Promise<ChatSession> {
    if (input.chatId) {
      const existing = await this.get(input.chatId);
      if (existing) {
        await this.db
          .update(chats)
          .set({
            title: input.title,
            mode: input.mode,
            modelProvider: input.modelProvider,
            modelName: input.modelName,
            updatedAt: nowIso()
          })
          .where(eq(chats.id, input.chatId));
        return (await this.get(input.chatId)) as ChatSession;
      }
    }

    const now = nowIso();
    const id = input.chatId ?? createId("chat");
    await this.db.insert(chats).values({
      id,
      workspaceId: input.workspaceId,
      title: input.title,
      mode: input.mode,
      modelProvider: input.modelProvider,
      modelName: input.modelName,
      createdAt: now,
      updatedAt: now
    });
    return (await this.get(id)) as ChatSession;
  }

  async listMessages(chatId: string): Promise<ChatMessage[]> {
    const rows = await this.db.select().from(chatMessages).where(eq(chatMessages.chatId, chatId)).orderBy(chatMessages.createdAt);
    return rows.map(toMessage);
  }

  async appendMessage(input: {
    chatId: string;
    role: ChatMessage["role"];
    content: string;
    sourceMap: SourceMap;
  }): Promise<ChatMessage> {
    const id = createId("msg");
    const createdAt = nowIso();
    await this.db.insert(chatMessages).values({
      id,
      chatId: input.chatId,
      role: input.role,
      content: input.content,
      sourceMapJson: JSON.stringify(input.sourceMap),
      createdAt
    });
    await this.db.update(chats).set({ updatedAt: createdAt }).where(eq(chats.id, input.chatId));
    const [row] = await this.db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return toMessage(row);
  }
}
