# Architecture

## Main process

- Bootstraps local persistence, migrations, and demo data.
- Owns database access, ingestion orchestration, provider calls, and settings handling.
- Exposes only typed IPC channels validated by Zod.
- Encrypts API keys with Electron `safeStorage` when available.

## Renderer process

- Owns all UI, local interaction state, and route navigation.
- Uses TanStack Query for IPC-backed reads and writes.
- Uses Zustand for lightweight UI state such as source selection and chat mode.
- Never receives raw filesystem, shell, or unrestricted Electron access.

## Shared contracts

- `@verdicta/shared` contains Zod schemas for IPC, domain objects, workflows, and source maps.
- Preload exposes one API surface: `window.verdicta.invoke`.
- Every privileged action crosses a typed and validated IPC boundary.

## Data model

- SQLite is the primary local store.
- Drizzle tables cover users, settings, workspaces, documents, pages, chunks, citations, chats, notes, annotations, drafts, and provider configs.
- FTS5 is used for chunk text and metadata lookup.

## Retrieval and grounding

- Queries are normalized before retrieval.
- Search combines source text and metadata signals.
- The legal research service assembles supporting excerpts and requires structured grounded output.
- Assistant messages persist both the answer text and the structured source map.

## Trust model

- `contextIsolation: true`
- `sandbox: true`
- `nodeIntegration: false`
- strict CSP in the renderer HTML
- no arbitrary shell execution
- no remote code loading
- API keys encrypted when secure storage is available
