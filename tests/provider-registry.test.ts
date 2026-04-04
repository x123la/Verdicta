import { describe, expect, it } from "vitest";
import { ProviderRegistry } from "../packages/ai/src/registry";

describe("provider registry", () => {
  it("registers local and compatible providers by name", () => {
    const registry = new ProviderRegistry();
    registry.register({ providerName: "openai-compatible", baseUrl: "https://api.openai.com/v1" });
    registry.register({ providerName: "anthropic-compatible", baseUrl: "https://api.anthropic.com/v1" });

    expect(registry.listNames()).toContain("ollama");
    expect(registry.listNames()).toContain("openai-compatible");
    expect(registry.listNames()).toContain("anthropic-compatible");
  });
});
