CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  display_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  theme TEXT NOT NULL,
  default_model_provider TEXT NOT NULL,
  default_model_name TEXT NOT NULL,
  citation_style TEXT NOT NULL,
  privacy_mode INTEGER NOT NULL,
  local_only INTEGER NOT NULL,
  cloud_allowed INTEGER NOT NULL,
  export_format TEXT NOT NULL DEFAULT 'markdown',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  default_chat_mode TEXT NOT NULL,
  preferred_citation_style TEXT NOT NULL,
  preferred_writing_mode TEXT NOT NULL,
  preferred_provider TEXT NOT NULL,
  preferred_model TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  document_type TEXT NOT NULL,
  jurisdiction TEXT,
  court TEXT,
  citation TEXT,
  date_issued TEXT,
  parsed_metadata_json TEXT NOT NULL,
  extraction_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_pages (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  extracted_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  chunk_index INTEGER NOT NULL,
  heading TEXT,
  text TEXT NOT NULL,
  token_estimate INTEGER NOT NULL,
  embedding_json_nullable TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL,
  normalized_citation TEXT NOT NULL,
  raw_citation_text TEXT NOT NULL,
  page_reference TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  mode TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  source_map_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  document_id_nullable TEXT,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  selection_text TEXT NOT NULL,
  note TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  draft_type TEXT NOT NULL,
  content_json TEXT NOT NULL,
  source_map_json TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_configs (
  id TEXT PRIMARY KEY NOT NULL,
  provider_name TEXT NOT NULL,
  base_url_nullable TEXT,
  encrypted_api_key_nullable TEXT,
  is_enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
