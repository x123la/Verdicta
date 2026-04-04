import { contextBridge, ipcRenderer } from "electron";
import { ipcSchemas, type IpcChannel } from "@verdicta/shared";
import { z } from "zod";

type Api = {
  invoke<K extends IpcChannel>(
    channel: K,
    payload: z.infer<(typeof ipcSchemas)[K]["input"]>
  ): Promise<z.infer<(typeof ipcSchemas)[K]["output"]>>;
};

const api: Api = {
  invoke: async (channel, payload) => {
    const schema = ipcSchemas[channel];
    const parsedPayload = schema.input.parse(payload);
    const result = await ipcRenderer.invoke(channel, parsedPayload);
    return schema.output.parse(result);
  }
};

contextBridge.exposeInMainWorld("verdicta", Object.freeze(api));
