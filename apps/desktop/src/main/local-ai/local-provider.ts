import { jsonRequest } from "@verdicta/ai";
import type {
  AiProvider,
  EmbedTextInput,
  GenerateTextInput,
  ModelSummary,
  ProviderHealth,
  StreamTextInput
} from "@verdicta/ai";
import { LocalAiService } from "./local-ai-service";

export class LocalRuntimeProvider implements AiProvider {
  name = "local";

  constructor(private readonly localAi: LocalAiService) {}

  async listModels(): Promise<ModelSummary[]> {
    return this.localAi.listInstalledModels().map((model) => ({
      id: model.id,
      label: model.displayName
    }));
  }

  async generateText(input: GenerateTextInput): Promise<string> {
    const baseUrl = await this.localAi.ensureServer(input.model);
    const status = this.localAi.getRuntimeStatus();

    const json = await jsonRequest<{
      choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
    }>({
      url: `${baseUrl}/chat/completions`,
      method: "POST",
      body: {
        model: input.model === "auto" ? undefined : input.model,
        temperature: input.temperature ?? status.config.temperature,
        top_p: status.config.topP,
        top_k: status.config.topK,
        min_p: status.config.minP,
        repeat_penalty: status.config.repeatPenalty,
        frequency_penalty: status.config.frequencyPenalty,
        presence_penalty: status.config.presencePenalty,
        seed: status.config.seed >= 0 ? status.config.seed : undefined,
        max_tokens: status.config.maxTokens,
        response_format: input.jsonMode ? { type: "json_object" } : undefined,
        messages: [
          ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
          { role: "user", content: input.prompt }
        ]
      }
    });

    const content = json.choices?.[0]?.message?.content;
    if (!status.config.keepModelWarm) {
      this.localAi.stopServer();
    }
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

  async embedText(_input: EmbedTextInput): Promise<number[][]> {
    throw new Error("Local embedding support is not wired yet for the managed runtime.");
  }

  async healthCheck(): Promise<ProviderHealth> {
    const status = this.localAi.getRuntimeStatus();
    return {
      ok: status.available,
      message: status.message
    };
  }
}
