import { describe, expect, it } from "vitest";
import { ipcSchemas } from "../packages/shared/src/schemas/ipc";

describe("ipc schemas", () => {
  it("validates chat payloads", () => {
    const parsed = ipcSchemas["chat:send"].input.parse({
      workspaceId: "ws_1",
      message: "What is the holding?",
      mode: "research",
      selectedDocumentIds: []
    });

    expect(parsed.mode).toBe("research");
  });
});
