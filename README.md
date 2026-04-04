# Verdicta

Verdicta is a local-first AI law assistant built for legal research, drafting,
and document-grounded analysis. It is designed for people who need more than a
generic chatbot: law students, solo practitioners, legal teams, and other
professionals who want a structured workspace for serious legal work.

Instead of treating legal research like a casual conversation, Verdicta
organizes documents by workspace or matter, retrieves supporting passages from
local sources, and keeps AI outputs tied to traceable source maps. The goal is
simple: help users move faster without losing rigor.

## At a glance

- Purpose-built for legal workflows rather than general chat
- Local-first desktop architecture for stronger control over documents and data
- Matter-based organization for research, notes, chats, and drafts
- Retrieval-backed answers designed to stay grounded in imported materials
- Structured source mapping to improve traceability and review
- Commercial, proprietary product intended for sale and professional use

## Who it is for

Verdicta is intended for users who need an AI-assisted legal workspace with more
discipline than a consumer chatbot can offer.

- Law students who want a better system for reading, organizing, and drafting
- Legal professionals who need faster first-pass research and writing support
- Teams evaluating AI tools that require a more controlled and auditable flow
- Builders and operators who want a legal AI product with a clear application
  architecture and extensible provider model

## What Verdicta does

Verdicta brings research, drafting, and document retrieval into one desktop
environment.

### Core capabilities

- Organizes work by workspace or matter
- Imports and indexes legal documents locally
- Extracts text and stores chunked retrieval artifacts
- Retrieves relevant supporting passages for user questions
- Generates grounded responses with structured source maps
- Supports note-taking, chat history, and draft creation in the same workflow

### Why that matters

Many AI tools are fast but difficult to trust. Verdicta is built around the idea
that useful legal AI should help users move faster while still making it easier
to inspect what the system relied on. The product is meant to support review,
not replace it.

## Product principles

### 1. Local-first by design

Verdicta is built as an Electron desktop application with a local SQLite data
layer. This approach supports faster local workflows and gives users more direct
control over their working materials.

### 2. Grounding before confidence

The system is designed to retrieve supporting passages before producing a
grounded answer. Prompting and persistence are structured around distinguishing
supported claims, inferred analysis, unsupported points, and uncertainty.

### 3. Workspaces instead of loose chats

Legal work is contextual. Verdicta groups documents, notes, drafts, and
assistant interactions inside workspace or matter boundaries so research remains
organized over time.

### 4. Traceability over opacity

Assistant outputs are not treated as isolated text blobs. The application stores
structured source maps so answers can be reviewed against the materials that
informed them.

## How the product works

At a high level, the workflow looks like this:

1. A user creates or opens a workspace or matter.
2. Source documents are imported into local, workspace-scoped storage.
3. The ingestion pipeline extracts text, infers headings, and creates ordered
   chunks with page references.
4. The app stores document, page, chunk, and full-text-search artifacts in
   SQLite.
5. When the user asks a question, retrieval ranks the best supporting passages.
6. The legal research layer injects those passages into a grounded prompt.
7. The response is persisted together with a structured source map for later
   review.

## Trust and grounding

Grounding is enforced in three layers:

1. Retrieval must produce supporting chunks before the app returns a grounded
   answer.
2. Prompt templates require the model to separate supported claims, inferred
   analysis, unsupported claims, and uncertainty.
3. Assistant messages are stored with structured source maps instead of opaque
   free-form citations.

This does not make AI output automatically correct, and Verdicta should not be
treated as a substitute for legal judgment. It is designed to improve speed,
organization, and reviewability.

## Technical overview

Verdicta is implemented as a TypeScript monorepo with a desktop-first
application architecture.

### Stack

- Electron
- TypeScript
- React + Vite
- Tailwind CSS with shadcn-style UI primitives
- Zustand + TanStack Query
- SQLite + Drizzle ORM + FTS5
- pdf.js for PDF extraction and viewing
- Tiptap for drafting
- Electron Builder for packaging
- pnpm workspaces

### Monorepo layout

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

## Developer quick start

### Requirements

- Node.js 20 or newer
- pnpm 9 or newer

### Install dependencies

```bash
pnpm install
```

### Start in development

```bash
pnpm dev
```

This starts the Vite renderer and launches Electron against the secure preload
bridge.

### Build and package

```bash
pnpm build
```

Electron Builder packages the desktop app for Windows, macOS, and Linux using
[apps/desktop/package.json](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/apps/desktop/package.json).

## Data and initialization

On first launch, the main process:

1. Creates the local SQLite database in Electron user data.
2. Runs schema creation and indexes.
3. Seeds a demo workspace with sample authority content, a chat, a note, and a
   draft.

## Extending AI providers

To add a new AI provider:

1. Create a provider class in
   [packages/ai/src/providers](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/packages/ai/src/providers)
   that implements `AiProvider` from
   [packages/ai/src/types.ts](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/packages/ai/src/types.ts).
2. Register it in
   [packages/ai/src/registry.ts](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/packages/ai/src/registry.ts).
3. Persist provider configuration through
   [packages/db/src/repositories/settings.ts](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/packages/db/src/repositories/settings.ts).
4. Expose provider testing or workflow usage through
   [apps/desktop/src/main/ipc.ts](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/apps/desktop/src/main/ipc.ts).

## Additional documentation

Supporting design and implementation notes are available in:

- [architecture.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/docs/architecture.md)
- [providers.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/docs/providers.md)
- [retrieval.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/docs/retrieval.md)
- [security.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/docs/security.md)

## Product and legal status

Verdicta is proprietary software intended as a commercial product.

- Source code in this repository is governed by
  [LICENSE](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/LICENSE).
- Distributed commercial copies should be governed by
  [COMMERCIAL-EULA.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/COMMERCIAL-EULA.md).
- Hosted or online service usage should be governed by
  [TERMS-OF-SERVICE.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/TERMS-OF-SERVICE.md).
- Data handling disclosures should be governed by
  [PRIVACY-POLICY.md](/C:/Users/Lucas Alonso/Documents/Repo/Verdicta/PRIVACY-POLICY.md).

## Current environment note

This environment does not currently expose `node`, `npm`, or `pnpm`, so runtime
verification could not be executed here. The repository documentation and legal
pack were prepared in the current workspace, but application install and runtime
checks should be completed in a normal Node-enabled environment.
