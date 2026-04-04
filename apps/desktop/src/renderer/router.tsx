import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { HomeScreen } from "@/routes/home-screen";
import { WorkspacesScreen } from "@/routes/workspaces-screen";
import { LibraryScreen } from "@/routes/library-screen";
import { ResearchScreen } from "@/routes/research-screen";
import { DraftsScreen } from "@/routes/drafts-screen";
import { SettingsScreen } from "@/routes/settings-screen";
import { WorkspaceSourcesScreen } from "@/routes/workspace-sources-screen";
import { WorkspaceAuthoritiesScreen } from "@/routes/workspace-authorities-screen";
import { WorkspaceNotesScreen } from "@/routes/workspace-notes-screen";
import { DocumentViewerScreen } from "@/routes/document-viewer-screen";

const AppShell = () => (
  <div className="flex h-screen overflow-hidden text-foreground">
    <AppSidebar />
    <main className="flex min-w-0 flex-1 flex-col">
      <TopBar />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <Outlet />
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
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/documents/:documentId" element={<DocumentViewerScreen />} />
    </Route>
  </Routes>
);
