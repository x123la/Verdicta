import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  ...timestamps
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  theme: text("theme").notNull(),
  defaultModelProvider: text("default_model_provider").notNull(),
  defaultModelName: text("default_model_name").notNull(),
  citationStyle: text("citation_style").notNull(),
  privacyMode: integer("privacy_mode", { mode: "boolean" }).notNull(),
  localOnly: integer("local_only", { mode: "boolean" }).notNull(),
  cloudAllowed: integer("cloud_allowed", { mode: "boolean" }).notNull(),
  exportFormat: text("export_format").notNull().default("markdown"),
  ...timestamps
});

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    jurisdiction: text("jurisdiction").notNull(),
    tagsJson: text("tags_json").notNull(),
    defaultChatMode: text("default_chat_mode").notNull(),
    preferredCitationStyle: text("preferred_citation_style").notNull(),
    preferredWritingMode: text("preferred_writing_mode").notNull(),
    preferredProvider: text("preferred_provider").notNull(),
    preferredModel: text("preferred_model").notNull(),
    ...timestamps
  },
  (table) => ({
    titleIdx: index("workspaces_title_idx").on(table.title)
  })
);

export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    title: text("title").notNull(),
    fileName: text("file_name").notNull(),
    filePath: text("file_path").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    checksum: text("checksum").notNull(),
    documentType: text("document_type").notNull(),
    jurisdiction: text("jurisdiction"),
    court: text("court"),
    citation: text("citation"),
    dateIssued: text("date_issued"),
    parsedMetadataJson: text("parsed_metadata_json").notNull(),
    extractionStatus: text("extraction_status").notNull(),
    ...timestamps
  },
  (table) => ({
    workspaceIdx: index("documents_workspace_idx").on(table.workspaceId),
    titleIdx: index("documents_title_idx").on(table.title),
    checksumIdx: index("documents_checksum_idx").on(table.checksum)
  })
);

export const documentPages = sqliteTable(
  "document_pages",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").notNull().references(() => documents.id),
    pageNumber: integer("page_number").notNull(),
    extractedText: text("extracted_text").notNull()
  },
  (table) => ({
    documentPageIdx: index("document_pages_doc_page_idx").on(table.documentId, table.pageNumber)
  })
);

export const documentChunks = sqliteTable(
  "document_chunks",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").notNull().references(() => documents.id),
    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),
    chunkIndex: integer("chunk_index").notNull(),
    heading: text("heading"),
    text: text("text").notNull(),
    tokenEstimate: integer("token_estimate").notNull(),
    embeddingJsonNullable: text("embedding_json_nullable"),
    createdAt: text("created_at").notNull()
  },
  (table) => ({
    chunkDocIdx: index("document_chunks_doc_idx").on(table.documentId, table.chunkIndex)
  })
);

export const citations = sqliteTable(
  "citations",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").notNull().references(() => documents.id),
    normalizedCitation: text("normalized_citation").notNull(),
    rawCitationText: text("raw_citation_text").notNull(),
    pageReference: text("page_reference"),
    createdAt: text("created_at").notNull()
  },
  (table) => ({
    citationIdx: index("citations_doc_idx").on(table.documentId, table.normalizedCitation)
  })
);

export const chats = sqliteTable(
  "chats",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    title: text("title").notNull(),
    mode: text("mode").notNull(),
    modelProvider: text("model_provider").notNull(),
    modelName: text("model_name").notNull(),
    ...timestamps
  },
  (table) => ({
    chatWorkspaceIdx: index("chats_workspace_idx").on(table.workspaceId, table.updatedAt)
  })
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id").notNull().references(() => chats.id),
    role: text("role").notNull(),
    content: text("content").notNull(),
    sourceMapJson: text("source_map_json").notNull(),
    createdAt: text("created_at").notNull()
  },
  (table) => ({
    chatMessageIdx: index("chat_messages_chat_idx").on(table.chatId, table.createdAt)
  })
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    documentIdNullable: text("document_id_nullable").references(() => documents.id),
    title: text("title").notNull(),
    contentJson: text("content_json").notNull(),
    ...timestamps
  },
  (table) => ({
    noteWorkspaceIdx: index("notes_workspace_idx").on(table.workspaceId, table.updatedAt)
  })
);

export const annotations = sqliteTable(
  "annotations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    documentId: text("document_id").notNull().references(() => documents.id),
    pageNumber: integer("page_number").notNull(),
    selectionText: text("selection_text").notNull(),
    note: text("note").notNull(),
    color: text("color").notNull(),
    ...timestamps
  },
  (table) => ({
    annotationDocIdx: index("annotations_doc_idx").on(table.documentId, table.pageNumber)
  })
);

export const drafts = sqliteTable(
  "drafts",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id),
    title: text("title").notNull(),
    draftType: text("draft_type").notNull(),
    contentJson: text("content_json").notNull(),
    sourceMapJson: text("source_map_json").notNull(),
    verificationStatus: text("verification_status").notNull(),
    ...timestamps
  },
  (table) => ({
    draftWorkspaceIdx: index("drafts_workspace_idx").on(table.workspaceId, table.updatedAt)
  })
);

export const providerConfigs = sqliteTable("provider_configs", {
  id: text("id").primaryKey(),
  providerName: text("provider_name").notNull(),
  baseUrlNullable: text("base_url_nullable"),
  encryptedApiKeyNullable: text("encrypted_api_key_nullable"),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull(),
  ...timestamps
});
