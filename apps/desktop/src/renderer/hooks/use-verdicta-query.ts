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

export const useLocalModelCatalog = (query: string, limit = 20) =>
  useQuery({
    queryKey: ["local-model-catalog", query, limit],
    queryFn: () => invokeIpc("local-models:catalog", { query, limit })
  });

export const useLocalModelDetail = (repoId?: string) =>
  useQuery({
    queryKey: ["local-model-detail", repoId],
    queryFn: () => invokeIpc("local-models:detail", { repoId: repoId! }),
    enabled: Boolean(repoId)
  });

export const useInstalledLocalModels = () =>
  useQuery({
    queryKey: ["local-models-installed"],
    queryFn: () => invokeIpc("local-models:installed", undefined)
  });

export const useLocalRuntimeStatus = () =>
  useQuery({
    queryKey: ["local-model-runtime"],
    queryFn: () => invokeIpc("local-models:runtime", undefined)
  });

export const useLocalRuntimeInstallStatus = () =>
  useQuery({
    queryKey: ["local-model-runtime-install"],
    queryFn: () => invokeIpc("local-models:runtime-install", undefined),
    refetchInterval: 1000
  });

export const useLocalDownloadQueue = () =>
  useQuery({
    queryKey: ["local-model-downloads"],
    queryFn: () => invokeIpc("local-models:downloads", undefined),
    refetchInterval: 1000
  });

export const useLocalSystemProfile = () =>
  useQuery({
    queryKey: ["local-model-system-profile"],
    queryFn: () => invokeIpc("local-models:system-profile", undefined)
  });

export const useLocalTelemetry = () =>
  useQuery({
    queryKey: ["local-model-telemetry"],
    queryFn: () => invokeIpc("local-models:telemetry", undefined),
    refetchInterval: 1500
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

export const useInstallLocalModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof invokeIpc<"local-models:install">>[1]) =>
      invokeIpc("local-models:install", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["local-models-installed"] });
      void queryClient.invalidateQueries({ queryKey: ["local-model-runtime"] });
      void queryClient.invalidateQueries({ queryKey: ["local-model-downloads"] });
    }
  });
};

export const useRemoveLocalModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof invokeIpc<"local-models:remove">>[1]) =>
      invokeIpc("local-models:remove", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["local-models-installed"] });
      void queryClient.invalidateQueries({ queryKey: ["local-model-runtime"] });
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    }
  });
};

export const useConfigureLocalRuntime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof invokeIpc<"local-models:configure">>[1]) =>
      invokeIpc("local-models:configure", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["local-model-runtime"] });
    }
  });
};

export const useInstallLocalRuntime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => invokeIpc("local-models:runtime-install-start", undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["local-model-runtime-install"] });
      void queryClient.invalidateQueries({ queryKey: ["local-model-runtime"] });
      void queryClient.invalidateQueries({ queryKey: ["local-model-system-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["local-model-downloads"] });
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
