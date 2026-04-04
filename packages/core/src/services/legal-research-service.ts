import {
  buildGroundedSystemPrompt,
  buildGroundedUserPrompt,
  ProviderRegistry
} from "@verdicta/ai";
import type {
  ChatResponse,
  SendChatMessageInput,
  SourceMap,
  SupportReview
} from "@verdicta/shared";
import type {
  ChatsRepository,
  DraftsRepository,
  SettingsRepository,
  VerdictaDatabase,
  WorkspaceRepository
} from "@verdicta/db";
import { retrieveRelevantChunks } from "../retrieval/retrieve";
import { normalizeQuery } from "../retrieval/normalize-query";

const emptySourceMap: SourceMap = {
  references: [],
  supportedClaims: [],
  inferredAnalysis: [],
  unsupportedClaims: [],
  uncertainty: []
};

const parseJson = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export class LegalResearchService {
  constructor(
    private readonly db: VerdictaDatabase,
    private readonly settingsRepository: SettingsRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly chatsRepository: ChatsRepository,
    private readonly draftsRepository: DraftsRepository,
    private readonly providers: ProviderRegistry
  ) {}

  async answer(input: SendChatMessageInput): Promise<ChatResponse> {
    const settings = await this.settingsRepository.get();
    const workspace = await this.workspaceRepository.get(input.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found.");
    }

    const normalizedQuery = normalizeQuery(input.message);
    const sources = await retrieveRelevantChunks(
      this.db,
      input.workspaceId,
      normalizedQuery,
      input.selectedDocumentIds
    );

    const chat = await this.chatsRepository.ensureChat({
      chatId: input.chatId,
      workspaceId: input.workspaceId,
      mode: input.mode,
      title: input.message.slice(0, 60),
      modelProvider: settings.defaultModelProvider || workspace.preferredProvider,
      modelName: settings.defaultModelName || workspace.preferredModel
    });

    await this.chatsRepository.appendMessage({
      chatId: chat.id,
      role: "user",
      content: input.message,
      sourceMap: emptySourceMap
    });

    if (!sources.length) {
      const assistantMessage = await this.chatsRepository.appendMessage({
        chatId: chat.id,
        role: "assistant",
        content:
          "No uploaded material currently supports a grounded answer for this request. Select sources or add documents before relying on this output.",
        sourceMap: {
          ...emptySourceMap,
          unsupportedClaims: [input.message],
          uncertainty: ["No matching uploaded authority was retrieved."]
        }
      });

      return {
        chat,
        assistantMessage,
        retrievalQuery: normalizedQuery,
        answer: assistantMessage.content,
        grounded: false,
        sourceMap: assistantMessage.sourceMap
      };
    }

    const provider = this.providers.get(settings.defaultModelProvider || workspace.preferredProvider);
    const raw = await provider.generateText({
      model: settings.defaultModelName || workspace.preferredModel,
      jsonMode: true,
      systemPrompt: buildGroundedSystemPrompt({
        mode: input.mode,
        workspaceTitle: workspace.title,
        workspaceJurisdiction: workspace.jurisdiction,
        citationStyle: workspace.preferredCitationStyle,
        preferredWritingMode: workspace.preferredWritingMode,
        userQuestion: input.message,
        sources
      }),
      prompt: buildGroundedUserPrompt({
        mode: input.mode,
        workspaceTitle: workspace.title,
        workspaceJurisdiction: workspace.jurisdiction,
        citationStyle: workspace.preferredCitationStyle,
        preferredWritingMode: workspace.preferredWritingMode,
        userQuestion: input.message,
        sources
      })
    });

    const parsed = parseJson(
      raw,
      {
        answer: raw,
        supportedClaims: [],
        inferredAnalysis: [],
        unsupportedClaims: [],
        uncertainty: []
      }
    );

    const sourceMap: SourceMap = {
      references: sources,
      supportedClaims: parsed.supportedClaims ?? [],
      inferredAnalysis: parsed.inferredAnalysis ?? [],
      unsupportedClaims: parsed.unsupportedClaims ?? [],
      uncertainty: parsed.uncertainty ?? []
    };

    const assistantMessage = await this.chatsRepository.appendMessage({
      chatId: chat.id,
      role: "assistant",
      content: parsed.answer ?? raw,
      sourceMap
    });

    return {
      chat,
      assistantMessage,
      retrievalQuery: normalizedQuery,
      answer: assistantMessage.content,
      grounded: true,
      sourceMap
    };
  }

  async reviewDraftSupport(workspaceId: string, draftId: string, prompt: string): Promise<SupportReview> {
    const drafts = await this.draftsRepository.list(workspaceId);
    const draft = drafts.find((entry) => entry.id === draftId);
    if (!draft) {
      throw new Error("Draft not found.");
    }

    const response = await this.answer({
      workspaceId,
      chatId: undefined,
      message: `${prompt}\n\nDraft:\n${draft.contentJson}`,
      mode: "review",
      selectedDocumentIds: []
    });

    return {
      summary: response.answer,
      supportedClaims: response.sourceMap.supportedClaims.map((item) => item.claim),
      weaklySupportedClaims: response.sourceMap.supportedClaims
        .filter((item) => item.supportLevel === "weak")
        .map((item) => item.claim),
      unsupportedClaims: response.sourceMap.unsupportedClaims,
      unsupportedCitations: [],
      hallucinationRisks: response.sourceMap.uncertainty,
      sourceMap: response.sourceMap
    };
  }
}
