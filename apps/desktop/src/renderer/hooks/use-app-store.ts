import { create } from "zustand";
import type { ChatMode } from "@verdicta/shared";

interface AppState {
  activeChatMode: ChatMode;
  selectedDocumentIds: string[];
  activeInspector: "sources" | "citations" | "support" | "notes";
  setChatMode: (mode: ChatMode) => void;
  toggleDocument: (documentId: string) => void;
  setSelectedDocuments: (documentIds: string[]) => void;
  setInspector: (inspector: AppState["activeInspector"]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeChatMode: "research",
  selectedDocumentIds: [],
  activeInspector: "sources",
  setChatMode: (activeChatMode) => set({ activeChatMode }),
  setSelectedDocuments: (selectedDocumentIds) => set({ selectedDocumentIds }),
  setInspector: (activeInspector) => set({ activeInspector }),
  toggleDocument: (documentId) =>
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.includes(documentId)
        ? state.selectedDocumentIds.filter((item) => item !== documentId)
        : [...state.selectedDocumentIds, documentId]
    }))
}));
