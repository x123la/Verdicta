import type { ipcSchemas, IpcChannel } from "@verdicta/shared";
import type { z } from "zod";

declare global {
  interface Window {
    verdicta: {
      invoke<K extends IpcChannel>(
        channel: K,
        payload: z.infer<(typeof ipcSchemas)[K]["input"]>
      ): Promise<z.infer<(typeof ipcSchemas)[K]["output"]>>;
    };
  }
}

export {};
