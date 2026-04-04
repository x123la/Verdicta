import { ChatsRepository } from "./repositories/chats";
import { createDatabase } from "./client";
import { DocumentRepository } from "./repositories/documents";
import { DraftsRepository } from "./repositories/drafts";
import { NotesRepository } from "./repositories/notes";
import { SettingsRepository } from "./repositories/settings";
import { WorkspaceRepository } from "./repositories/workspaces";

export const seedDemoData = async (dbPath?: string) => {
  const db = createDatabase(dbPath);
  const settingsRepo = new SettingsRepository(db);
  const workspaceRepo = new WorkspaceRepository(db);
  const documentRepo = new DocumentRepository(db);
  const chatsRepo = new ChatsRepository(db);
  const notesRepo = new NotesRepository(db);
  const draftsRepo = new DraftsRepository(db);

  await settingsRepo.upsert({
    theme: "dark",
    defaultModelProvider: "ollama",
    defaultModelName: "llama3.1",
    citationStyle: "Bluebook",
    privacyMode: true,
    localOnly: false,
    cloudAllowed: true,
    exportFormat: "markdown",
    providerConfigs: [
      {
        id: "provider_ollama",
        providerName: "ollama",
        baseUrl: "http://127.0.0.1:11434/v1",
        encryptedApiKey: null,
        isEnabled: true
      },
      {
        id: "provider_openai",
        providerName: "openai-compatible",
        baseUrl: "https://api.openai.com/v1",
        encryptedApiKey: null,
        isEnabled: false
      }
    ]
  });

  const existingWorkspaces = await workspaceRepo.list();
  if (existingWorkspaces.length) {
    return;
  }

  const workspace = await workspaceRepo.create({
    title: "Constitutional Litigation Seminar",
    description: "Research and drafting workspace for appellate case analysis and memo practice.",
    jurisdiction: "United States",
    tags: ["Con Law", "First Amendment", "Appellate"],
    defaultChatMode: "research",
    preferredCitationStyle: "Bluebook",
    preferredWritingMode: "Professional",
    preferredProvider: "ollama",
    preferredModel: "llama3.1"
  });

  await documentRepo.createMany([
    {
      id: "doc_demo_1",
      workspaceId: workspace.id,
      title: "Demo Appellate Opinion",
      fileName: "demo-opinion.txt",
      filePath: "data/demo/demo-opinion.txt",
      mimeType: "text/plain",
      fileSize: 2048,
      checksum: "demo-checksum-opinion",
      documentType: "txt",
      jurisdiction: "United States",
      court: "Court of Appeals",
      citation: "123 F.4th 456",
      dateIssued: "2025-03-12",
      extractionStatus: "completed",
      parsedMetadata: {
        headings: ["Facts", "Issue", "Holding"],
        summary: "Sample appellate opinion for demo purposes."
      }
    },
    {
      id: "doc_demo_2",
      workspaceId: workspace.id,
      title: "Municipal Speech Ordinance",
      fileName: "speech-ordinance.md",
      filePath: "data/demo/speech-ordinance.md",
      mimeType: "text/markdown",
      fileSize: 1536,
      checksum: "demo-checksum-statute",
      documentType: "markdown",
      jurisdiction: "United States",
      court: null,
      citation: "City Ord. 17-2",
      dateIssued: "2024-09-01",
      extractionStatus: "completed",
      parsedMetadata: {
        headings: ["Purpose", "Restrictions", "Enforcement"],
        summary: "Sample ordinance text."
      }
    }
  ]);

  const chat = await chatsRepo.ensureChat({
    workspaceId: workspace.id,
    mode: "research",
    title: "Initial authority review",
    modelProvider: "ollama",
    modelName: "llama3.1"
  });

  await chatsRepo.appendMessage({
    chatId: chat.id,
    role: "assistant",
    content:
      "The current workspace is seeded with a sample appellate opinion and ordinance so you can test grounded legal research flows immediately.",
    sourceMap: {
      references: [],
      supportedClaims: [],
      inferredAnalysis: [],
      unsupportedClaims: [],
      uncertainty: ["Demo content only; replace with real authorities before relying on outputs."]
    }
  });

  await notesRepo.upsert({
    workspaceId: workspace.id,
    documentIdNullable: "doc_demo_1",
    title: "Issue framing notes",
    contentJson: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Track viewpoint discrimination analysis and time-place-manner distinctions." }] }]
    })
  });

  await draftsRepo.upsert({
    workspaceId: workspace.id,
    title: "Bench memo outline",
    draftType: "legal-memo",
    contentJson: JSON.stringify({
      type: "doc",
      content: [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Bench Memo" }] }]
    }),
    sourceMapJson: JSON.stringify({
      references: [],
      supportedClaims: [],
      inferredAnalysis: [],
      unsupportedClaims: [],
      uncertainty: []
    }),
    verificationStatus: "pending"
  });
};
