import type { ipcSchemas, IpcChannel } from "@verdicta/shared";
import type { z } from "zod";

export const invokeIpc = <K extends IpcChannel>(
  channel: K,
  payload: z.infer<(typeof ipcSchemas)[K]["input"]>
) => window.verdicta.invoke(channel, payload);
