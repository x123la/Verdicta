import { sql } from "drizzle-orm";
import { createDatabase } from "./client";
import { users } from "./schema/tables";

export const runMigrations = async (dbPath?: string) => {
  const db = createDatabase(dbPath);
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id text primary key,
      display_name text not null,
      created_at text not null,
      updated_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id text primary key,
      user_id text not null,
      theme text not null,
      default_model_provider text not null,
      default_model_name text not null,
      citation_style text not null,
      privacy_mode integer not null,
      local_only integer not null,
      cloud_allowed integer not null,
      export_format text not null default 'markdown',
      created_at text not null,
      updated_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS workspaces (
      id text primary key,
      title text not null,
      description text not null,
      jurisdiction text not null,
      tags_json text not null,
      default_chat_mode text not null,
      preferred_citation_style text not null,
      preferred_writing_mode text not null,
      preferred_provider text not null,
      preferred_model text not null,
      created_at text not null,
      updated_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS documents (
      id text primary key,
      workspace_id text not null,
      title text not null,
      file_name text not null,
      file_path text not null,
      mime_type text not null,
      file_size integer not null,
      checksum text not null,
      document_type text not null,
      jurisdiction text,
      court text,
      citation text,
      date_issued text,
      parsed_metadata_json text not null,
      extraction_status text not null,
      created_at text not null,
      updated_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS document_pages (
      id text primary key,
      document_id text not null,
      page_number integer not null,
      extracted_text text not null
    )`,
    `CREATE TABLE IF NOT EXISTS document_chunks (
      id text primary key,
      document_id text not null,
      page_start integer,
      page_end integer,
      chunk_index integer not null,
      heading text,
      text text not null,
      token_estimate integer not null,
      embedding_json_nullable text,
      created_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS citations (
      id text primary key,
      document_id text not null,
      normalized_citation text not null,
      raw_citation_text text not null,
      page_reference text,
      created_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS chats (
      id text primary key,
      workspace_id text not null,
      title text not null,
      mode text not null,
      model_provider text not null,
      model_name text not null,
      created_at text not null,
      updated_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id text primary key,
      chat_id text not null,
      role text not null,
      content text not null,
      source_map_json text not null,
      created_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS notes (
      id text primary key,
      workspace_id text not null,
      document_id_nullable text,
      title text not null,
      content_json text not null,
      created_at text not null,
      updated_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS annotations (
      id text primary key,
      workspace_id text not null,
      document_id text not null,
      page_number integer not null,
      selection_text text not null,
      note text not null,
      color text not null,
      created_at text not null,
      updated_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS drafts (
      id text primary key,
      workspace_id text not null,
      title text not null,
      draft_type text not null,
      content_json text not null,
      source_map_json text not null,
      verification_status text not null,
      created_at text not null,
      updated_at text not null
    )`,
    `CREATE TABLE IF NOT EXISTS provider_configs (
      id text primary key,
      provider_name text not null,
      base_url_nullable text,
      encrypted_api_key_nullable text,
      is_enabled integer not null,
      created_at text not null,
      updated_at text not null
    )`,
    "CREATE INDEX IF NOT EXISTS documents_workspace_idx ON documents(workspace_id)",
    "CREATE INDEX IF NOT EXISTS documents_checksum_idx ON documents(checksum)",
    "CREATE INDEX IF NOT EXISTS document_chunks_doc_idx ON document_chunks(document_id, chunk_index)",
    "CREATE INDEX IF NOT EXISTS chat_messages_chat_idx ON chat_messages(chat_id, created_at)",
    "CREATE INDEX IF NOT EXISTS drafts_workspace_idx ON drafts(workspace_id, updated_at)",
    "CREATE INDEX IF NOT EXISTS notes_workspace_idx ON notes(workspace_id, updated_at)"
  ];

  for (const statement of statements) {
    await db.run(sql.raw(statement));
  }

  const now = new Date().toISOString();
  await db
    .insert(users)
    .values({
      id: "user_default",
      displayName: "Verdicta User",
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoNothing();
};
