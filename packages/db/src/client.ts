import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema/tables";
import { documentFtsDefinition } from "./schema/fts";

export type VerdictaDatabase = ReturnType<typeof createDatabase>;

export const createDatabase = (dbPath?: string) => {
  const resolved = dbPath ?? path.join(process.cwd(), "data", "verdicta.sqlite");
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const sqlite = new Database(resolved);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(documentFtsDefinition);
  return drizzle(sqlite, { schema });
};
