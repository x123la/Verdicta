import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

const HomeScreen = lazy(() => import("@/routes/home-screen").then((module) => ({ default: module.HomeScreen })));
const WorkspacesScreen = lazy(() =>
  import("@/routes/workspaces-screen").then((module) => ({ default: module.WorkspacesScreen }))
);
const LibraryScreen = lazy(() =>
  import("@/routes/library-screen").then((module) => ({ default: module.LibraryScreen }))
);
const ResearchScreen = lazy(() =>
  import("@/routes/research-screen").then((module) => ({ default: module.ResearchScreen }))
);
const DraftsScreen = lazy(() =>
  import("@/routes/drafts-screen").then((module) => ({ default: module.DraftsScreen }))
);
const LocalAiScreen = lazy(() =>
  import("@/routes/local-ai-screen").then((module) => ({ default: module.LocalAiScreen }))
);
const SettingsScreen = lazy(() =>
  import("@/routes/settings-screen").then((module) => ({ default: module.SettingsScreen }))
);
const WorkspaceSourcesScreen = lazy(() =>
  import("@/routes/workspace-sources-screen").then((module) => ({ default: module.WorkspaceSourcesScreen }))
);
const WorkspaceAuthoritiesScreen = lazy(() =>
  import("@/routes/workspace-authorities-screen").then((module) => ({ default: module.WorkspaceAuthoritiesScreen }))
);
const WorkspaceNotesScreen = lazy(() =>
  import("@/routes/workspace-notes-screen").then((module) => ({ default: module.WorkspaceNotesScreen }))
);
const DocumentViewerScreen = lazy(() =>
  import("@/routes/document-viewer-screen").then((module) => ({ default: module.DocumentViewerScreen }))
);

const RouteLoadingState = () => (
  <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-panel">
    <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Verdicta</div>
    <div className="mt-3 text-xl font-semibold">Loading workspace</div>
    <div className="mt-2 text-sm text-muted-foreground">
      Initializing the selected screen and restoring your local state.
    </div>
  </div>
);

const AppShell = () => (
  <div className="flex h-screen overflow-hidden text-foreground">
    <AppSidebar />
    <main className="flex min-w-0 flex-1 flex-col">
      <TopBar />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <Suspense fallback={<RouteLoadingState />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  </div>
);

export const AppRouter = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/workspaces" element={<WorkspacesScreen />} />
      <Route path="/workspaces/:workspaceId" element={<WorkspacesScreen />} />
      <Route path="/workspaces/:workspaceId/sources" element={<WorkspaceSourcesScreen />} />
      <Route path="/workspaces/:workspaceId/chat" element={<ResearchScreen />} />
      <Route path="/workspaces/:workspaceId/authorities" element={<WorkspaceAuthoritiesScreen />} />
      <Route path="/workspaces/:workspaceId/notes" element={<WorkspaceNotesScreen />} />
      <Route path="/workspaces/:workspaceId/drafts" element={<DraftsScreen />} />
      <Route path="/library" element={<LibraryScreen />} />
      <Route path="/research" element={<ResearchScreen />} />
      <Route path="/drafts" element={<DraftsScreen />} />
      <Route path="/local-ai" element={<LocalAiScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/documents/:documentId" element={<DocumentViewerScreen />} />
    </Route>
  </Routes>
);
