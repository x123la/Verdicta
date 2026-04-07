import {
  type AiProvider,
  type EmbedTextInput,
  type GenerateTextInput,
  type ModelSummary,
  type ProviderHealth,
  type StreamTextInput
} from "../types";
import { jsonRequest } from "../http";

export class OpenAiCompatibleProvider implements AiProvider {
  name = "openai-compatible";

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string
  ) {}

  private authHeaders(): Record<string, string> {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
  }

  async listModels(): Promise<ModelSummary[]> {
    const json = await jsonRequest<{ data?: Array<{ id: string }> }>({
      url: `${this.baseUrl}/models`,
      headers: this.authHeaders()
    });
    return (json.data ?? []).map((model) => ({ id: model.id, label: model.id }));
  }

  async generateText(input: GenerateTextInput): Promise<string> {
    const json = await jsonRequest<{
      choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
    }>({
      url: `${this.baseUrl}/chat/completions`,
      method: "POST",
      headers: this.authHeaders(),
      body: {
        model: input.model,
        temperature: input.temperature ?? 0.2,
        response_format: input.jsonMode ? { type: "json_object" } : undefined,
        messages: [
          ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
          { role: "user", content: input.prompt }
        ]
      }
    });

    const content = json.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      return content.map((item) => item.text ?? "").join("");
    }
    return content ?? "";
  }

  async streamText(input: StreamTextInput): Promise<string> {
    const text = await this.generateText(input);
    for (const token of text.split(/\s+/)) {
      if (token) {
        input.onToken(`${token} `);
      }
    }
    return text;
  }

  async embedText(input: EmbedTextInput): Promise<number[][]> {
    const json = await jsonRequest<{ data?: Array<{ embedding: number[] }> }>({
      url: `${this.baseUrl}/embeddings`,
      method: "POST",
      headers: this.authHeaders(),
      body: {
        model: input.model,
        input: input.texts
      }
    });
    return (json.data ?? []).map((item) => item.embedding);
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
