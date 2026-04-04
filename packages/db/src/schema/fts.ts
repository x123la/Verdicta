export const documentFtsDefinition = `
  CREATE VIRTUAL TABLE IF NOT EXISTS document_fts USING fts5(
    chunk_id UNINDEXED,
    document_id UNINDEXED,
    workspace_id UNINDEXED,
    title,
    heading,
    body
  );
`;
