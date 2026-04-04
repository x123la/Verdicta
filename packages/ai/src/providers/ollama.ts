import { OpenAiCompatibleProvider } from "./openai-compatible";

export class OllamaProvider extends OpenAiCompatibleProvider {
  name = "ollama";

  constructor(baseUrl = "http://127.0.0.1:11434/v1") {
    super(baseUrl);
  }
}
