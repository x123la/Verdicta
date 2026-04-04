import { providerConfigs } from "../schema/tables";
import type { VerdictaDatabase } from "../client";

export class ProviderConfigRepository {
  constructor(private readonly db: VerdictaDatabase) {}

  async list() {
    return this.db.select().from(providerConfigs);
  }
}
