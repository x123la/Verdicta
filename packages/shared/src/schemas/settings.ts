import { z } from "zod";

export const providerConfigSchema = z.object({
  id: z.string(),
  providerName: z.string(),
  baseUrl: z.string().url().nullable(),
  encryptedApiKey: z.string().nullable(),
  isEnabled: z.boolean()
});

export const settingsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  theme: z.enum(["dark", "light", "system"]),
  defaultModelProvider: z.string(),
  defaultModelName: z.string(),
  citationStyle: z.string(),
  privacyMode: z.boolean(),
  localOnly: z.boolean(),
  cloudAllowed: z.boolean(),
  exportFormat: z.enum(["markdown", "docx-structure"]).default("markdown"),
  providerConfigs: z.array(providerConfigSchema).default([])
});

export const updateSettingsSchema = settingsSchema.partial().extend({
  id: z.string().optional(),
  userId: z.string().optional()
});

export const providerHealthSchema = z.object({
  ok: z.boolean(),
  message: z.string()
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ProviderHealth = z.infer<typeof providerHealthSchema>;
