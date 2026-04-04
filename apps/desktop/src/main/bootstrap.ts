import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { createDatabase, runMigrations, seedDemoData } from "@verdicta/db";

export const getAppPaths = () => {
  const userData = app.getPath("userData");
  const dataDir = path.join(userData, "data");
  const dbPath = path.join(dataDir, "verdicta.sqlite");
  const documentsDir = path.join(dataDir, "documents");
  fs.mkdirSync(documentsDir, { recursive: true });
  return { userData, dataDir, dbPath, documentsDir };
};

export const bootstrapPersistence = async () => {
  const { dbPath } = getAppPaths();
  createDatabase(dbPath);
  await runMigrations(dbPath);
  await seedDemoData(dbPath);
};
