import { type AiProvider, type EmbedTextInput, type GenerateTextInput, type ModelSummary, type ProviderHealth, type StreamTextInput } from "../types";
import { jsonRequest } from "../http";

export class AnthropicCompatibleProvider implements AiProvider {
  name = "anthropic-compatible";

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string
  ) {}

  async listModels(): Promise<ModelSummary[]> {
    return [{ id: "claude-sonnet", label: "claude-sonnet" }];
  }

  async generateText(input: GenerateTextInput): Promise<string> {
    const json = await jsonRequest<{
      content?: Array<{ text?: string }>;
    }>({
      url: `${this.baseUrl}/messages`,
      method: "POST",
      headers: {
        ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
        "anthropic-version": "2023-06-01"
      },
      body: {
        model: input.model,
        max_tokens: 1400,
        system: input.systemPrompt,
        messages: [{ role: "user", content: input.prompt }]
      }
    });
    return (json.content ?? []).map((item) => item.text ?? "").join("");
  }

  async streamText(input: StreamTextInput): Promise<string> {
    const text = await this.generateText(input);
    for (const token of text.split(/\s+/)) {
      if (token) input.onToken(`${token} `);
    }
    return text;
  }

  async embedText(_input: EmbedTextInput): Promise<number[][]> {
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      await this.listModels();
      return { ok: true, message: "Provider reachable." };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Connection failed." };
    }
  }
}
