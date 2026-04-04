import { ipcSchemas, type IpcChannel } from "@verdicta/shared";
import { z } from "zod";

type HandlerMap = {
  [K in IpcChannel]?: (input: z.infer<(typeof ipcSchemas)[K]["input"]>) => Promise<z.infer<(typeof ipcSchemas)[K]["output"]>>;
};

export class IpcRouter {
  constructor(private readonly handlers: HandlerMap) {}

  async invoke<K extends IpcChannel>(
    channel: K,
    payload: unknown
  ): Promise<z.infer<(typeof ipcSchemas)[K]["output"]>> {
    const schema = ipcSchemas[channel];
    const parsed = schema.input.parse(payload);
    const handler = this.handlers[channel];
    if (!handler) {
      throw new Error(`Missing IPC handler for ${channel}`);
    }
    const result = await handler(parsed as never);
    return schema.output.parse(result);
  }
}
