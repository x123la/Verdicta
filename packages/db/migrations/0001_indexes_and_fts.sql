CREATE INDEX IF NOT EXISTS documents_checksum_idx ON documents(checksum);
CREATE INDEX IF NOT EXISTS drafts_workspace_idx ON drafts(workspace_id, updated_at);
CREATE INDEX IF NOT EXISTS notes_workspace_idx ON notes(workspace_id, updated_at);
CREATE VIRTUAL TABLE IF NOT EXISTS document_fts USING fts5(
  chunk_id UNINDEXED,
  document_id UNINDEXED,
  workspace_id UNINDEXED,
  title,
  heading,
  body
);
