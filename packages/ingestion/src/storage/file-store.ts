import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { StoredFile } from "../types";

export const storeImportedFile = (workspaceId: string, sourcePath: string, storageRoot: string): StoredFile => {
  const workspaceRoot = path.join(storageRoot, workspaceId);
  fs.mkdirSync(workspaceRoot, { recursive: true });

  const inputBuffer = fs.readFileSync(sourcePath);
  const checksum = crypto.createHash("sha256").update(inputBuffer).digest("hex");
  const ext = path.extname(sourcePath).toLowerCase();
  const fileName = `${checksum}${ext}`;
  const targetPath = path.join(workspaceRoot, fileName);

  if (!fs.existsSync(targetPath)) {
    fs.copyFileSync(sourcePath, targetPath);
  }

  return {
    targetPath,
    checksum,
    fileSize: inputBuffer.byteLength,
    originalFileName: path.basename(sourcePath)
  };
};
