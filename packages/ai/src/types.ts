import type { ChatMode, SourceReference } from "@verdicta/shared";

export interface ModelSummary {
  id: string;
  label: string;
  contextWindow?: number;
}

export interface GenerateTextInput {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
}

export interface StreamTextInput extends GenerateTextInput {
  onToken: (token: string) => void;
}

export interface EmbedTextInput {
  model: string;
  texts: string[];
}

export interface ProviderHealth {
  ok: boolean;
  message: string;
}

export interface AiProvider {
  name: string;
  listModels(): Promise<ModelSummary[]>;
  generateText(input: GenerateTextInput): Promise<string>;
  streamText(input: StreamTextInput): Promise<string>;
  embedText(input: EmbedTextInput): Promise<number[][]>;
  healthCheck(): Promise<ProviderHealth>;
}

export interface GroundedPromptInput {
  mode: ChatMode;
  workspaceTitle: string;
  workspaceJurisdiction: string;
  citationStyle?: string;
  preferredWritingMode?: string;
  userQuestion: string;
  sources: SourceReference[];
}
