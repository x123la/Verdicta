# Verdicta

Verdicta is a local-first Electron desktop application for law students and legal professionals who need a serious research and drafting workspace rather than a generic chatbot. The app organizes documents by workspace or matter, indexes them locally in SQLite, retrieves supporting passages, and keeps AI outputs traceable through structured source maps.

## Stack

- Electron
- TypeScript everywhere
- React + Vite
- Tailwind CSS + shadcn-style UI primitives
- Zustand + TanStack Query
- SQLite + Drizzle ORM + FTS5
- pdf.js for PDF extraction and viewing
- Tiptap for drafting
- Electron Builder for packaging
- pnpm workspaces monorepo

## Monorepo layout

```text
/apps
  /desktop
/packages
  /ui
  /core
  /db
  /ai
  /shared
  /legal
  /ingestion
/tests
/docs
```

## Setup

1. Install Node.js 20 or newer.
2. Install pnpm 9 or newer.
3. Run `pnpm install`.

## Run in development

```bash
pnpm dev
```

This starts the Vite renderer and launches Electron against the secure preload bridge.

## Build and package

```bash
pnpm build
```

Electron Builder packages the desktop app for Windows, macOS, and Linux using [apps/desktop/package.json](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/apps/desktop/package.json).

## Database and demo data

On first launch the main process:

1. creates the local SQLite database in Electron user data,
2. runs schema creation and indexes,
3. seeds a demo workspace with sample authority content, a chat, a note, and a draft.

## Add a new AI provider

1. Create a provider class in [packages/ai/src/providers](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/packages/ai/src/providers) that implements `AiProvider` from [packages/ai/src/types.ts](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/packages/ai/src/types.ts).
2. Register it in [packages/ai/src/registry.ts](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/packages/ai/src/registry.ts).
3. Persist provider configuration through [packages/db/src/repositories/settings.ts](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/packages/db/src/repositories/settings.ts).
4. Expose provider testing or workflow usage through [apps/desktop/src/main/ipc.ts](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/apps/desktop/src/main/ipc.ts).

## Retrieval flow

1. Imported files are copied into workspace-scoped local storage.
2. The ingestion layer extracts text, infers headings, and creates ordered chunks with page references.
3. The database stores document rows, pages, chunks, and FTS artifacts.
4. Retrieval normalizes the user query, searches chunk text plus metadata, and ranks the best passages.
5. The legal research service injects those passages into a grounded prompt and persists the resulting source map.

## How grounding is enforced

Grounding is enforced in three layers:

1. Retrieval must produce supporting chunks before the app returns a grounded answer.
2. Prompt templates require the model to separate supported claims, inferred analysis, unsupported claims, and uncertainty.
3. Assistant messages are stored with structured source maps instead of opaque free-form citations.

## Notes

This environment does not currently expose `node`, `npm`, or `pnpm`, so dependency installation and runtime verification could not be executed here. The repository has been updated with the production-oriented structure, typed contracts, desktop shell, domain repositories, renderer surfaces, workflow scaffolding, and documentation needed to continue in a normal Node-enabled environment.

## License

Verdicta is proprietary software.

- Source code in this repository is governed by [LICENSE](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/LICENSE).
- Distributed commercial copies should be governed by [COMMERCIAL-EULA.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/COMMERCIAL-EULA.md).
- Hosted or online service usage should be governed by [TERMS-OF-SERVICE.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/TERMS-OF-SERVICE.md).
- Data handling disclosures should be governed by [PRIVACY-POLICY.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/PRIVACY-POLICY.md).
