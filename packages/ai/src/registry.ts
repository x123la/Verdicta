import type { AiProvider } from "./types";
import { AnthropicCompatibleProvider } from "./providers/anthropic-compatible";
import { OpenAiCompatibleProvider } from "./providers/openai-compatible";
import { OllamaProvider } from "./providers/ollama";

export interface ProviderRegistryConfig {
  providerName: string;
  baseUrl?: string | null;
  apiKey?: string | null;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, AiProvider>();

  constructor() {
    this.register({ providerName: "ollama", baseUrl: "http://127.0.0.1:11434/v1" });
  }

  register(config: ProviderRegistryConfig) {
    switch (config.providerName) {
      case "ollama":
        this.providers.set("ollama", new OllamaProvider(config.baseUrl ?? undefined));
        return;
      case "anthropic-compatible":
        this.providers.set(
          "anthropic-compatible",
          new AnthropicCompatibleProvider(config.baseUrl ?? "https://api.anthropic.com/v1", config.apiKey ?? undefined)
        );
        return;
      default:
        this.providers.set(
          config.providerName,
          new OpenAiCompatibleProvider(config.baseUrl ?? "https://api.openai.com/v1", config.apiKey ?? undefined)
        );
    }
  }

  registerProvider(providerName: string, provider: AiProvider) {
    this.providers.set(providerName, provider);
  }

  get(providerName: string): AiProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider not configured: ${providerName}`);
    }
    return provider;
  }

  listNames(): string[] {
    return [...this.providers.keys()];
  }
}
