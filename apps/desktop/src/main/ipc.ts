import { dialog, ipcMain, safeStorage } from "electron";
import type { BrowserWindow } from "electron";
import { eq } from "drizzle-orm";
import {
  ChatsRepository,
  createDatabase,
  createId,
  documentChunks,
  documentPages,
  DocumentRepository,
  DraftsRepository,
  NotesRepository,
  SettingsRepository,
  WorkspaceRepository
} from "@verdicta/db";
import {
  DraftService,
  IpcRouter,
  LegalResearchService,
  NotesService
} from "@verdicta/core";
import { ProviderRegistry } from "@verdicta/ai";
import {
  createFallbackCaseBrief,
  createFallbackComparison,
  createFallbackMemoOutline,
  createFallbackStudyMode,
  createFallbackSupportReview
} from "@verdicta/legal";
import { ingestFile } from "@verdicta/ingestion";
import { ipcSchemas } from "@verdicta/shared";
import { getAppPaths } from "./bootstrap";

const buildServices = () => {
  const { dbPath, documentsDir } = getAppPaths();
  const db = createDatabase(dbPath);
  const settingsRepository = new SettingsRepository(db);
  const workspaceRepository = new WorkspaceRepository(db);
  const documentRepository = new DocumentRepository(db);
  const chatsRepository = new ChatsRepository(db);
  const draftsRepository = new DraftsRepository(db);
  const notesRepository = new NotesRepository(db);
  const providers = new ProviderRegistry();

  return {
    db,
    documentsDir,
    settingsRepository,
    workspaceRepository,
    documentRepository,
    chatsRepository,
    draftsRepository,
    notesRepository,
    providers,
    legalResearch: new LegalResearchService(
      db,
      settingsRepository,
      workspaceRepository,
      chatsRepository,
      draftsRepository,
      providers
    ),
    draftsService: new DraftService(draftsRepository),
    notesService: new NotesService(notesRepository)
  };
};

const encryptSecret = (value: string | null) => {
  if (!value) return null;
  if (!safeStorage.isEncryptionAvailable()) {
    return value;
  }
  return safeStorage.encryptString(value).toString("base64");
};

const decryptSecret = (value: string | null) => {
  if (!value) return null;
  if (!safeStorage.isEncryptionAvailable()) {
    return value;
  }
  return safeStorage.decryptString(Buffer.from(value, "base64"));
};

export const registerIpcHandlers = (_window: BrowserWindow) => {
  const services = buildServices();
  const router = new IpcRouter({
    "workspace:create": (input) => services.workspaceRepository.create(input),
    "workspace:list": () => services.workspaceRepository.list(),
    "workspace:activity": ({ workspaceId }) => services.workspaceRepository.getActivity(workspaceId),
    "documents:import": async (input) => {
      const ingested = await Promise.all(
        input.filePaths.map((filePath) => ingestFile(input.workspaceId, filePath, services.documentsDir))
      );

      const records = await services.documentRepository.createMany(
        ingested.map((doc) => ({
          id: createId("doc"),
          workspaceId: input.workspaceId,
          title: doc.title,
          fileName: doc.fileName,
          filePath: doc.filePath,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          checksum: doc.checksum,
          documentType: doc.documentType,
          jurisdiction: (doc.metadata.jurisdiction as string | null) ?? null,
          court: (doc.metadata.court as string | null) ?? null,
          citation: (doc.metadata.citation as string | null) ?? null,
          dateIssued: (doc.metadata.dateIssued as string | null) ?? null,
          extractionStatus: "completed",
          parsedMetadata: doc.metadata
        }))
      );

      for (const [index, doc] of ingested.entries()) {
        const record = records[index];
        if (!record) continue;
        for (const page of doc.pages) {
          await services.db.insert(documentPages).values({
            id: createId("page"),
            documentId: record.id,
            pageNumber: page.pageNumber,
            extractedText: page.text
          });
        }
        for (const chunk of doc.chunks) {
          await services.db.insert(documentChunks).values({
            id: createId("chunk"),
            documentId: record.id,
            pageStart: chunk.pageStart,
            pageEnd: chunk.pageEnd,
            chunkIndex: chunk.chunkIndex,
            heading: chunk.heading,
            text: chunk.text,
            tokenEstimate: chunk.tokenEstimate,
            embeddingJsonNullable: null,
            createdAt: new Date().toISOString()
          });
        }
      }
      return records;
    },
    "documents:list": ({ workspaceId }) => services.documentRepository.listByWorkspace(workspaceId),
    "documents:search": (input) => services.documentRepository.search(input),
    "documents:get": ({ documentId }) => services.documentRepository.get(documentId),
    "documents:reindex": async ({ documentId }) => {
      const document = await services.documentRepository.get(documentId);
      if (!document) {
        throw new Error("Document not found.");
      }
      const ingested = await ingestFile(document.workspaceId, document.filePath, services.documentsDir);
      await services.documentRepository.updateExtractionStatus(documentId, "processing");
      await services.db.delete(documentPages).where(eq(documentPages.documentId, documentId));
      await services.db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));
      for (const page of ingested.pages) {
        await services.db.insert(documentPages).values({
          id: createId("page"),
          documentId,
          pageNumber: page.pageNumber,
          extractedText: page.text
        });
      }
      for (const chunk of ingested.chunks) {
        await services.db.insert(documentChunks).values({
          id: createId("chunk"),
          documentId,
          pageStart: chunk.pageStart,
          pageEnd: chunk.pageEnd,
          chunkIndex: chunk.chunkIndex,
          heading: chunk.heading,
          text: chunk.text,
          tokenEstimate: chunk.tokenEstimate,
          embeddingJsonNullable: null,
          createdAt: new Date().toISOString()
        });
      }
      await services.documentRepository.updateExtractionStatus(documentId, "completed");
      return (await services.documentRepository.get(documentId))!;
    },
    "chat:list": ({ workspaceId }) => services.chatsRepository.list(workspaceId),
    "chat:messages": ({ chatId }) => services.chatsRepository.listMessages(chatId),
    "chat:send": async (input) => {
      const settings = await services.settingsRepository.get();
      for (const provider of settings.providerConfigs) {
        if (provider.isEnabled) {
          services.providers.register({
            providerName: provider.providerName,
            baseUrl: provider.baseUrl,
            apiKey: decryptSecret(provider.encryptedApiKey)
          });
        }
      }
      return services.legalResearch.answer(input);
    },
    "workflow:case-brief": async (input) => {
      const response = await services.legalResearch.answer({
        workspaceId: input.workspaceId,
        chatId: undefined,
        message: input.prompt,
        mode: "case-brief",
        selectedDocumentIds: input.selectedDocumentIds
      });
      return createFallbackCaseBrief(response.answer, response.sourceMap);
    },
    "workflow:jurisprudence-comparison": async (input) => {
      const response = await services.legalResearch.answer({
        workspaceId: input.workspaceId,
        chatId: undefined,
        message: input.prompt,
        mode: "jurisprudence-comparison",
        selectedDocumentIds: input.selectedDocumentIds
      });
      return createFallbackComparison(response.answer, response.sourceMap);
    },
    "workflow:memo-outline": async (input) => {
      const response = await services.legalResearch.answer({
        workspaceId: input.workspaceId,
        chatId: undefined,
        message: input.prompt,
        mode: "drafting",
        selectedDocumentIds: input.selectedDocumentIds
      });
      return createFallbackMemoOutline(response.answer, response.sourceMap);
    },
    "workflow:study-mode": async (input) => {
      const response = await services.legalResearch.answer({
        workspaceId: input.workspaceId,
        chatId: undefined,
        message: input.prompt,
        mode: "study",
        selectedDocumentIds: input.selectedDocumentIds
      });
      return createFallbackStudyMode(response.answer, response.sourceMap);
    },
    "workflow:support-review": async (input) => {
      const response = await services.legalResearch.answer({
        workspaceId: input.workspaceId,
        chatId: undefined,
        message: input.prompt,
        mode: "review",
        selectedDocumentIds: input.selectedDocumentIds
      });
      return createFallbackSupportReview(response.answer, response.sourceMap);
    },
    "notes:list": ({ workspaceId }) => services.notesService.list(workspaceId),
    "notes:upsert": (input) => services.notesService.upsert(input),
    "drafts:list": ({ workspaceId }) => services.draftsService.list(workspaceId),
    "drafts:upsert": (input) => services.draftsService.upsert(input),
    "settings:get": () => services.settingsRepository.get(),
    "settings:update": async (input) => {
      const providerConfigs = input.providerConfigs?.map((provider) => ({
        ...provider,
        encryptedApiKey: encryptSecret(provider.encryptedApiKey)
      }));
      return services.settingsRepository.upsert({
        ...input,
        providerConfigs
      });
    },
    "providers:test": async ({ providerName }) => {
      const settings = await services.settingsRepository.get();
      const provider = settings.providerConfigs.find((item) => item.providerName === providerName);
      if (!provider) {
        return { ok: false, message: "Provider config not found." };
      }
      services.providers.register({
        providerName,
        baseUrl: provider.baseUrl,
        apiKey: decryptSecret(provider.encryptedApiKey)
      });
      return services.providers.get(providerName).healthCheck();
    },
    "system:pick-files": async ({ filters }) => {
      const result = await dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters
      });
      return result.canceled ? [] : result.filePaths;
    }
  });

  for (const channel of Object.keys(ipcSchemas)) {
    ipcMain.handle(channel, async (_event, payload) => router.invoke(channel as never, payload));
  }
};
