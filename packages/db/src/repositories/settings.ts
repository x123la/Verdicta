import { eq } from "drizzle-orm";
import type { Settings, UpdateSettingsInput } from "@verdicta/shared";
import { providerConfigs, settings } from "../schema/tables";
import { createId, nowIso } from "./base";
import type { VerdictaDatabase } from "../client";

const defaultUserId = "user_default";
const defaultSettingsId = "settings_default";

export class SettingsRepository {
  constructor(private readonly db: VerdictaDatabase) {}

  async get(): Promise<Settings> {
    const [base] = await this.db.select().from(settings).where(eq(settings.id, defaultSettingsId));
    const providers = await this.db.select().from(providerConfigs);
    return {
      id: base.id,
      userId: base.userId,
      theme: base.theme as Settings["theme"],
      defaultModelProvider: base.defaultModelProvider,
      defaultModelName: base.defaultModelName,
      citationStyle: base.citationStyle,
      privacyMode: Boolean(base.privacyMode),
      localOnly: Boolean(base.localOnly),
      cloudAllowed: Boolean(base.cloudAllowed),
      exportFormat: (base.exportFormat ?? "markdown") as Settings["exportFormat"],
      providerConfigs: providers.map((row) => ({
        id: row.id,
        providerName: row.providerName,
        baseUrl: row.baseUrlNullable,
        encryptedApiKey: row.encryptedApiKeyNullable,
        isEnabled: Boolean(row.isEnabled)
      }))
    };
  }

  async upsert(input: UpdateSettingsInput): Promise<Settings> {
    const now = nowIso();
    const [existing] = await this.db.select().from(settings).where(eq(settings.id, defaultSettingsId));
    const row = {
      id: defaultSettingsId,
      userId: defaultUserId,
      theme: input.theme ?? existing?.theme ?? "dark",
      defaultModelProvider: input.defaultModelProvider ?? existing?.defaultModelProvider ?? "ollama",
      defaultModelName: input.defaultModelName ?? existing?.defaultModelName ?? "llama3.1",
      citationStyle: input.citationStyle ?? existing?.citationStyle ?? "Bluebook",
      privacyMode: input.privacyMode ?? Boolean(existing?.privacyMode ?? true),
      localOnly: input.localOnly ?? Boolean(existing?.localOnly ?? false),
      cloudAllowed: input.cloudAllowed ?? Boolean(existing?.cloudAllowed ?? true),
      exportFormat: input.exportFormat ?? existing?.exportFormat ?? "markdown",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    if (existing) {
      await this.db.update(settings).set(row).where(eq(settings.id, defaultSettingsId));
    } else {
      await this.db.insert(settings).values(row);
    }

    if (input.providerConfigs) {
      for (const provider of input.providerConfigs) {
        const id = provider.id || createId("provider");
        const [existingProvider] = await this.db
          .select()
          .from(providerConfigs)
          .where(eq(providerConfigs.id, id));
        const providerRow = {
          id,
          providerName: provider.providerName,
          baseUrlNullable: provider.baseUrl,
          encryptedApiKeyNullable: provider.encryptedApiKey,
          isEnabled: provider.isEnabled,
          createdAt: existingProvider?.createdAt ?? now,
          updatedAt: now
        };
        if (existingProvider) {
          await this.db.update(providerConfigs).set(providerRow).where(eq(providerConfigs.id, id));
        } else {
          await this.db.insert(providerConfigs).values(providerRow);
        }
      }
    }

    return this.get();
  }
}
