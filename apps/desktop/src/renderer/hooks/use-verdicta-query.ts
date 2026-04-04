import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invokeIpc } from "@/lib/ipc";

export const useWorkspaces = () =>
  useQuery({
    queryKey: ["workspaces"],
    queryFn: () => invokeIpc("workspace:list", undefined)
  });

export const useWorkspaceActivity = (workspaceId?: string) =>
  useQuery({
    queryKey: ["workspace-activity", workspaceId],
    queryFn: () => invokeIpc("workspace:activity", { workspaceId: workspaceId! }),
    enabled: Boolean(workspaceId)
  });

export const useDocuments = (workspaceId?: string, query = "") =>
  useQuery({
    queryKey: ["documents", workspaceId, query],
    queryFn: () =>
      invokeIpc("documents:search", {
        workspaceId,
        query: query || " ",
        documentTypes: [],
        court: undefined,
        jurisdiction: undefined,
        dateFrom: undefined,
        dateTo: undefined
      }),
    enabled: Boolean(workspaceId && query.trim().length > 0)
  });

export const useWorkspaceDocuments = (workspaceId?: string) =>
  useQuery({
    queryKey: ["workspace-documents", workspaceId],
    queryFn: () => invokeIpc("documents:list", { workspaceId: workspaceId! }),
    enabled: Boolean(workspaceId)
  });

export const useDocumentDetail = (documentId?: string) =>
  useQuery({
    queryKey: ["document", documentId],
    queryFn: () => invokeIpc("documents:get", { documentId: documentId! }),
    enabled: Boolean(documentId)
  });

export const useChats = (workspaceId?: string) =>
  useQuery({
    queryKey: ["chats", workspaceId],
    queryFn: () => invokeIpc("chat:list", { workspaceId: workspaceId! }),
    enabled: Boolean(workspaceId)
  });

export const useChatMessages = (chatId?: string) =>
  useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: () => invokeIpc("chat:messages", { chatId: chatId! }),
    enabled: Boolean(chatId)
  });

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: () => invokeIpc("settings:get", undefined)
  });

export const useNotes = (workspaceId?: string) =>
  useQuery({
    queryKey: ["notes", workspaceId],
    queryFn: () => invokeIpc("notes:list", { workspaceId: workspaceId! }),
    enabled: Boolean(workspaceId)
  });

export const useDrafts = (workspaceId?: string) =>
  useQuery({
    queryKey: ["drafts", workspaceId],
    queryFn: () => invokeIpc("drafts:list", { workspaceId: workspaceId! }),
    enabled: Boolean(workspaceId)
  });

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof invokeIpc<"workspace:create">>[1]) =>
      invokeIpc("workspace:create", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    }
  });
};

export const useSaveSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof invokeIpc<"settings:update">>[1]) =>
      invokeIpc("settings:update", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    }
  });
};

export const useImportDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof invokeIpc<"documents:import">>[1]) =>
      invokeIpc("documents:import", input),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["workspace-documents", variables.workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["documents", variables.workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["workspace-activity", variables.workspaceId] });
    }
  });
};

export const useSaveDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof invokeIpc<"drafts:upsert">>[1]) =>
      invokeIpc("drafts:upsert", input),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["drafts", variables.workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["workspace-activity", variables.workspaceId] });
    }
  });
};

export const useSaveNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof invokeIpc<"notes:upsert">>[1]) =>
      invokeIpc("notes:upsert", input),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["notes", variables.workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["workspace-activity", variables.workspaceId] });
    }
  });
};
