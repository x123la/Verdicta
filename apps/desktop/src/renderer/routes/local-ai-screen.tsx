import { type ChangeEvent, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Card } from "@verdicta/ui";
import {
  useConfigureLocalRuntime,
  useInstallLocalModel,
  useInstallLocalRuntime,
  useInstalledLocalModels,
  useLocalDownloadQueue,
  useLocalModelCatalog,
  useLocalModelDetail,
  useLocalRuntimeInstallStatus,
  useLocalRuntimeStatus,
  useLocalSystemProfile,
  useLocalTelemetry,
  useRemoveLocalModel,
  useSaveSettings,
  useSettings
} from "@/hooks/use-verdicta-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProviderStatusCard } from "@/components/settings/provider-status-card";
import { invokeIpc } from "@/lib/ipc";
import type {
  InstalledLocalModel,
  LocalModelCatalogEntry,
  LocalModelFile,
  LocalRuntimeConfig
} from "@verdicta/shared";

const formatBytes = (value?: number | null) => {
  if (!value) return "Unknown";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatSpeed = (value?: number | null) => {
  if (!value) return "Speed unavailable";
  return `${formatBytes(value)}/s`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const capabilityLabelMap: Array<[string, string]> = [
  ["vision", "Vision"],
  ["tool", "Tool use"],
  ["function", "Function calling"],
  ["code", "Coding"],
  ["reason", "Reasoning"],
  ["chat", "Chat"],
  ["embed", "Embeddings"],
  ["multilingual", "Multilingual"],
  ["math", "Math"],
  ["writing", "Writing"],
  ["summary", "Summarization"]
];

const deriveCapabilities = (entry: LocalModelCatalogEntry) => {
  if (entry.capabilities?.length) {
    return entry.capabilities;
  }
  const haystack = `${entry.summary ?? ""} ${entry.tags.join(" ")}`.toLowerCase();
  return capabilityLabelMap.filter(([needle]) => haystack.includes(needle)).map(([, label]) => label);
};

const classifyFit = (entry: LocalModelCatalogEntry, ramGb: number, vramGb?: number | null) => {
  const recommendedRam = entry.recommendedRamGb ?? Number.MAX_SAFE_INTEGER;
  const recommendedVram = entry.recommendedVramGb ?? Number.MAX_SAFE_INTEGER;
  if (ramGb >= recommendedRam && ((vramGb ?? 0) >= recommendedVram || entry.recommendedVramGb == null)) {
    return "Recommended";
  }
  if (ramGb >= (entry.minimumRamGb ?? Number.MAX_SAFE_INTEGER)) {
    return "Can run";
  }
  return "Heavy";
};

const runtimeNumberField = (
  label: string,
  value: number,
  onChange: (value: number) => void,
  description?: string
) => (
  <label className="grid gap-2 rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
    <span className="font-medium text-foreground">{label}</span>
    {description ? <span className="text-xs leading-6">{description}</span> : null}
    <Input
      type="number"
      value={Number.isFinite(value) ? String(value) : ""}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
      className="text-foreground"
    />
  </label>
);

const runtimeBooleanField = (
  label: string,
  checked: boolean,
  onChange: (checked: boolean) => void,
  description?: string
) => (
  <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1" />
    <span className="grid gap-1">
      <span className="font-medium text-foreground">{label}</span>
      {description ? <span className="text-xs leading-6">{description}</span> : null}
    </span>
  </label>
);

const LocalAiScreen = () => {
  const { data: settings } = useSettings();
  const { data: runtimeStatus } = useLocalRuntimeStatus();
  const { data: runtimeInstallStatus } = useLocalRuntimeInstallStatus();
  const { data: installedModels } = useInstalledLocalModels();
  const { data: systemProfile } = useLocalSystemProfile();
  const { data: telemetry } = useLocalTelemetry();
  const { data: downloads } = useLocalDownloadQueue();
  const [catalogQuery, setCatalogQuery] = useState("");
  const deferredCatalogQuery = useDeferredValue(catalogQuery.trim());
  const { data: catalog, isLoading: isCatalogLoading } = useLocalModelCatalog(deferredCatalogQuery, 72);
  const [selectedCatalogRepoId, setSelectedCatalogRepoId] = useState<string | null>(null);
  const { data: selectedCatalogDetail, isLoading: isDetailLoading } = useLocalModelDetail(selectedCatalogRepoId ?? undefined);
  const [fitFilter, setFitFilter] = useState<"all" | "recommended" | "can-run" | "heavy">("all");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [testMessage, setTestMessage] = useState("");
  const [draftRuntime, setDraftRuntime] = useState<LocalRuntimeConfig | null>(runtimeStatus?.config ?? null);
  const saveSettings = useSaveSettings();
  const configureRuntime = useConfigureLocalRuntime();
  const installLocalModel = useInstallLocalModel();
  const installLocalRuntime = useInstallLocalRuntime();
  const removeLocalModel = useRemoveLocalModel();

  useEffect(() => {
    if (runtimeStatus) {
      setDraftRuntime(runtimeStatus.config);
    }
  }, [runtimeStatus]);

  const filteredCatalog = useMemo(() => {
    if (!catalog?.length) {
      return [];
    }
    return catalog.filter((entry) => {
      const fit = classifyFit(entry, systemProfile?.totalRamGb ?? 0, systemProfile?.totalVramGb);
      const capabilities = deriveCapabilities(entry);
      const capabilityMatch =
        capabilityFilter === "all" || capabilities.some((capability) => capability === capabilityFilter);
      const fitMatch =
        fitFilter === "all" ||
        (fitFilter === "recommended" && fit === "Recommended") ||
        (fitFilter === "can-run" && fit === "Can run") ||
        (fitFilter === "heavy" && fit === "Heavy");
      const collectionMatch =
        collectionFilter === "all" ||
        entry.collections.includes(collectionFilter) ||
        entry.featuredCategory === collectionFilter;
      return capabilityMatch && fitMatch && collectionMatch;
    });
  }, [capabilityFilter, catalog, collectionFilter, fitFilter, systemProfile?.totalRamGb, systemProfile?.totalVramGb]);

  useEffect(() => {
    if (!filteredCatalog.length) {
      setSelectedCatalogRepoId(null);
      return;
    }
    setSelectedCatalogRepoId((current) =>
      current && filteredCatalog.some((entry) => entry.repoId === current) ? current : filteredCatalog[0]?.repoId ?? null
    );
  }, [filteredCatalog]);

  const selectedBrowseEntry =
    filteredCatalog.find((entry) => entry.repoId === selectedCatalogRepoId) ?? filteredCatalog[0] ?? null;
  const selectedCatalogEntry = selectedCatalogDetail ?? selectedBrowseEntry;
  const activeLocalModelId = draftRuntime?.selectedModelId ?? runtimeStatus?.config.selectedModelId ?? null;
  const installedModelIds = new Set((installedModels ?? []).map((model) => model.id));

  const capabilityOptions = useMemo(() => {
    const values = new Set<string>();
    for (const entry of catalog ?? []) {
      for (const capability of deriveCapabilities(entry)) {
        values.add(capability);
      }
    }
    return ["all", ...Array.from(values).sort()];
  }, [catalog]);

  const collectionOptions = useMemo(() => {
    const values = new Map<string, number>();
    for (const entry of catalog ?? []) {
      for (const collection of entry.collections) {
        values.set(collection, (values.get(collection) ?? 0) + 1);
      }
      if (entry.featuredCategory) {
        values.set(entry.featuredCategory, (values.get(entry.featuredCategory) ?? 0) + 1);
      }
    }
    return Array.from(values.entries()).sort((left, right) => right[1] - left[1]);
  }, [catalog]);

  const topCollections = collectionOptions.slice(0, 8);

  const clearFilters = () => {
    setCollectionFilter("all");
    setCapabilityFilter("all");
    setFitFilter("all");
  };

  const downloadItems = downloads ?? [];

  return (
    <div className="space-y-6">
      <Card className="border-none bg-gradient-to-br from-card via-card to-background p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">Local AI workspace</div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight">
                Curated catalog, managed local runtime, and machine-aware model setup
              </h1>
              <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
                Browse a built-in model catalog before you search, inspect fit guidance and benchmark-style facts, install
                models with queue visibility, and tune the local runtime from one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ProviderStatusCard label="Backend" value={runtimeStatus?.backend ?? "llama.cpp"} />
              <ProviderStatusCard label="Runtime" value={runtimeStatus?.available ? "Ready" : "Needs setup"} />
              <ProviderStatusCard label="Installed models" value={`${installedModels?.length ?? 0}`} />
              <ProviderStatusCard label="Default" value={`${settings?.defaultModelProvider ?? "local"} / ${settings?.defaultModelName ?? "auto"}`} />
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="border border-border/70 bg-background/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Browse shelves</div>
                    <div className="mt-2 text-xl font-semibold">Start from curated collections</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {filteredCatalog.length} visible model{filteredCatalog.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      collectionFilter === "all"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/70 bg-card/60 text-muted-foreground"
                    }`}
                    onClick={() => setCollectionFilter("all")}
                  >
                    All catalog
                  </button>
                  {topCollections.map(([collection, count]) => (
                    <button
                      key={collection}
                      type="button"
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        collectionFilter === collection
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/70 bg-card/60 text-muted-foreground"
                      }`}
                      onClick={() => setCollectionFilter((current) => (current === collection ? "all" : collection))}
                    >
                      {collection} · {count}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="border border-border/70 bg-background/50 p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Machine fit</div>
                <div className="mt-2 text-lg font-semibold">{systemProfile?.recommendation ?? "Profiling local hardware"}</div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {systemProfile?.cpuModel ?? "Unknown CPU"} · {systemProfile?.cpuCores ?? "?"} threads
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  RAM {systemProfile?.availableRamGb ?? "?"} / {systemProfile?.totalRamGb ?? "?"} GB available
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  GPU {systemProfile?.gpuName ?? "Not detected"}
                  {systemProfile?.totalVramGb ? ` · ${systemProfile.totalVramGb} GB VRAM` : ""}
                </div>
              </Card>
            </div>
          </div>

          <Card className="space-y-4 border border-border/70 bg-background/55 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Activity</div>
                <div className="mt-2 text-xl font-semibold">Downloads and runtime</div>
              </div>
              <Button
                onClick={async () => {
                  const result = await installLocalRuntime.mutateAsync();
                  setTestMessage(result.lastError ?? result.message);
                }}
                disabled={installLocalRuntime.isPending || runtimeInstallStatus?.state === "installing"}
              >
                {runtimeInstallStatus?.state === "installing"
                  ? "Installing runtime..."
                  : runtimeInstallStatus?.state === "installed"
                    ? "Reinstall runtime"
                    : "Install runtime"}
              </Button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{runtimeStatus?.message}</div>
              <div className="mt-2">Runtime path: {runtimeStatus?.config.runtimePath ?? runtimeStatus?.detectedRuntimePath ?? "Not installed yet"}</div>
              {testMessage ? <div className="mt-2">{testMessage}</div> : null}
            </div>

            <div className="space-y-3">
              {downloadItems.length ? (
                downloadItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/70 bg-card/75 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {item.kind} · {item.status}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{Math.round(item.progressPercent)}%</div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                      <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${item.progressPercent}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatBytes(item.bytesDownloaded)} / {formatBytes(item.totalBytes)}
                      </span>
                      <span>{formatSpeed(item.speedBytesPerSecond)}</span>
                    </div>
                    {item.lastError ? <div className="mt-2 text-xs text-red-300">{item.lastError}</div> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-4 text-sm text-muted-foreground">
                  No runtime or model downloads yet. Start with a curated model below.
                </div>
              )}
            </div>
          </Card>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_360px]">
        <Card className="space-y-5 border border-border/70 bg-background/55 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Catalog</div>
              <div className="mt-2 text-2xl font-semibold">Search and compare local models</div>
            </div>
            <div className="w-full max-w-xl space-y-3">
              <Input
                value={catalogQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setCatalogQuery(event.target.value)}
                placeholder="Search model family, publisher, capability, use case, or repo"
              />
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ["all", "All fits"],
                  ["recommended", "Recommended"],
                  ["can-run", "Can run"],
                  ["heavy", "Heavy"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      fitFilter === value
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/70 bg-card/60 text-muted-foreground"
                    }`}
                    onClick={() =>
                      setFitFilter((current) => (current === value ? "all" : (value as typeof fitFilter)))
                    }
                  >
                    {label}
                  </button>
                ))}
                {capabilityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      capabilityFilter === option
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/70 bg-card/60 text-muted-foreground"
                    }`}
                    onClick={() => setCapabilityFilter((current) => (current === option ? "all" : option))}
                  >
                    {option === "all" ? "All capabilities" : option}
                  </button>
                ))}
                <button
                  type="button"
                  className="rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-3 rounded-[28px] border border-border/70 bg-card/70 p-3">
              {isCatalogLoading ? (
                <div className="rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                  Loading catalog...
                </div>
              ) : null}

              {!isCatalogLoading && !filteredCatalog.length ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-5 text-sm text-muted-foreground">
                  No models match the current search and filters.
                  <div className="mt-3">
                    <Button className="bg-background" onClick={() => {
                      setCatalogQuery("");
                      clearFilters();
                    }}>
                      Reset browse state
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="max-h-[980px] space-y-3 overflow-auto pr-1">
                {filteredCatalog.map((entry) => {
                  const fit = classifyFit(entry, systemProfile?.totalRamGb ?? 0, systemProfile?.totalVramGb);
                  const capabilities = deriveCapabilities(entry);
                  return (
                    <button
                      key={entry.repoId}
                      type="button"
                      onClick={() => setSelectedCatalogRepoId(entry.repoId)}
                      className={`block w-full rounded-2xl border p-4 text-left transition ${
                        selectedBrowseEntry?.repoId === entry.repoId
                          ? "border-foreground bg-background text-foreground shadow-panel"
                          : "border-border/70 bg-background/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold">{entry.name}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {entry.publisher ?? entry.author ?? entry.family ?? "Unknown publisher"}
                          </div>
                        </div>
                        <div className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          {fit}
                        </div>
                      </div>
                      <div className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {entry.summary ?? "No model summary available."}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(capabilities.length ? capabilities : ["General"]).slice(0, 3).map((capability) => (
                          <span key={capability} className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
                            {capability}
                          </span>
                        ))}
                        {entry.modalities.map((modality) => (
                          <span key={modality} className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
                            {modality}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>{entry.parameterLabel ?? "Unknown size"}</span>
                        <span>{entry.contextWindowTokens ? `${entry.contextWindowTokens.toLocaleString()} ctx` : "Unknown ctx"}</span>
                        <span>{entry.recommendedQuantization ?? "Quant TBD"}</span>
                        <span>{entry.benchmarkTokensPerSecond ? `${entry.benchmarkTokensPerSecond} tok/s est.` : "tok/s TBD"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-border/70 bg-card/80 p-6">
              {selectedCatalogEntry ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Model inspector</div>
                      <div>
                        <h2 className="text-3xl font-semibold tracking-tight">{selectedCatalogEntry.name}</h2>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {selectedCatalogEntry.publisher ?? selectedCatalogEntry.author ?? "Unknown publisher"} · {selectedCatalogEntry.family ?? selectedCatalogEntry.architecture ?? "General family"}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">{selectedCatalogEntry.repoId}</div>
                      </div>
                      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                        {selectedCatalogEntry.summary ?? "No model summary available for this entry."}
                      </p>
                    </div>

                    <div className="grid gap-2 text-right text-sm text-muted-foreground">
                      <div>{selectedCatalogEntry.downloads.toLocaleString()} downloads</div>
                      <div>{selectedCatalogEntry.likes.toLocaleString()} likes</div>
                      <div>Updated {formatDate(selectedCatalogEntry.updatedAt)}</div>
                      <div>{selectedCatalogEntry.license ?? "License unknown"}</div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {[
                      ["Machine fit", classifyFit(selectedCatalogEntry, systemProfile?.totalRamGb ?? 0, systemProfile?.totalVramGb)],
                      ["Parameters", selectedCatalogEntry.parameterLabel ?? "Unknown"],
                      ["Context", selectedCatalogEntry.contextWindowTokens ? `${selectedCatalogEntry.contextWindowTokens.toLocaleString()} tokens` : "Unknown"],
                      ["Recommended quant", selectedCatalogEntry.recommendedQuantization ?? "Inspect builds"],
                      ["RAM target", selectedCatalogEntry.recommendedRamGb ? `${selectedCatalogEntry.recommendedRamGb} GB` : "Unknown"],
                      ["VRAM target", selectedCatalogEntry.recommendedVramGb ? `${selectedCatalogEntry.recommendedVramGb} GB` : "Unknown"]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-border/70 bg-background/55 p-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                        <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-5">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Capabilities and fit</div>
                      <div className="flex flex-wrap gap-2">
                        {(deriveCapabilities(selectedCatalogEntry).length ? deriveCapabilities(selectedCatalogEntry) : ["General purpose"]).map((capability) => (
                          <span key={capability} className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground">
                            {capability}
                          </span>
                        ))}
                        {selectedCatalogEntry.modalities.map((modality) => (
                          <span key={modality} className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground">
                            {modality}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm leading-7 text-muted-foreground">
                        {selectedCatalogEntry.recommendationReason ?? selectedCatalogEntry.fitNotes ?? "No editorial fit note yet."}
                      </div>
                      <div className="text-sm leading-7 text-muted-foreground">
                        {selectedCatalogEntry.fitNotes ?? "System requirement notes unavailable."}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-5">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Benchmarks and metadata</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["Arena", selectedCatalogEntry.benchmarkArenaElo ? `${selectedCatalogEntry.benchmarkArenaElo}` : "N/A"],
                          ["MMLU", selectedCatalogEntry.benchmarkMmlu ? `${selectedCatalogEntry.benchmarkMmlu}%` : "N/A"],
                          ["GSM8K", selectedCatalogEntry.benchmarkGsm8k ? `${selectedCatalogEntry.benchmarkGsm8k}%` : "N/A"],
                          ["HumanEval", selectedCatalogEntry.benchmarkHumanEval ? `${selectedCatalogEntry.benchmarkHumanEval}%` : "N/A"],
                          ["Throughput", selectedCatalogEntry.benchmarkTokensPerSecond ? `${selectedCatalogEntry.benchmarkTokensPerSecond} tok/s` : "N/A"],
                          ["Release", formatDate(selectedCatalogEntry.releaseDate)]
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                            <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm leading-7 text-muted-foreground">
                        {selectedCatalogEntry.benchmarkNote ?? "Benchmark notes are editorial summary values intended for comparison inside the app."}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background/55 p-5">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Strengths</div>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {(selectedCatalogEntry.strengths.length ? selectedCatalogEntry.strengths : ["No strengths note yet."]).map((item) => (
                          <div key={item}>• {item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/55 p-5">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Watch-outs</div>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {(selectedCatalogEntry.limitations.length ? selectedCatalogEntry.limitations : ["No limitations note yet."]).map((item) => (
                          <div key={item}>• {item}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background/55 p-5">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Use cases</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(selectedCatalogEntry.useCases.length ? selectedCatalogEntry.useCases : ["General assistant"]).map((useCase) => (
                          <span key={useCase} className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground">
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/55 p-5">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Languages and collections</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedCatalogEntry.languages.map((language) => (
                          <span key={language} className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground">
                            {language}
                          </span>
                        ))}
                        {selectedCatalogEntry.collections.map((collection) => (
                          <span key={collection} className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground">
                            {collection}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Install builds</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {isDetailLoading ? "Refreshing GGUF file list..." : "Choose a quantization and install directly into Verdicta-managed storage."}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {(selectedCatalogEntry.files.length ? selectedCatalogEntry.files : []).slice(0, 14).map((file: LocalModelFile) => {
                        const installedId = `${selectedCatalogEntry.repoId.replace(/[/:]/g, "__")}::${file.fileName.replace(/[/:]/g, "__")}`;
                        const isInstalled = installedModelIds.has(installedId);
                        return (
                          <div
                            key={file.fileName}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/50 p-4"
                          >
                            <div>
                              <div className="text-sm font-medium">{file.quantization}</div>
                              <div className="mt-1 text-xs text-muted-foreground">{file.fileName}</div>
                              <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {formatBytes(file.sizeBytes)}
                              </div>
                            </div>
                            <Button
                              className="bg-background"
                              disabled={installLocalModel.isPending || isInstalled}
                              onClick={async () => {
                                const installed = await installLocalModel.mutateAsync({
                                  repoId: selectedCatalogEntry.repoId,
                                  fileName: file.fileName
                                });
                                setTestMessage(`Installed ${installed.displayName}.`);
                              }}
                            >
                              {isInstalled ? "Installed" : installLocalModel.isPending ? "Installing..." : "Install build"}
                            </Button>
                          </div>
                        );
                      })}
                      {!selectedCatalogEntry.files.length ? (
                        <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                          No GGUF builds surfaced for this selection yet.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-dashed border-border/70 bg-background/30 p-8 text-sm text-muted-foreground">
                  Select a model from the catalog to inspect its details.
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 border border-border/70 bg-background/55 p-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Installed models</div>
              <div className="mt-2 text-xl font-semibold">Ready in Verdicta</div>
            </div>
            <div className="space-y-3">
              {(installedModels ?? []).map((model: InstalledLocalModel) => (
                <div key={model.id} className="rounded-2xl border border-border/70 bg-card/75 p-4">
                  <div className="text-sm font-medium">{model.displayName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{model.repoId}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {model.quantization} · {formatBytes(model.sizeBytes)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      className={activeLocalModelId === model.id ? "bg-foreground text-background" : "bg-background"}
                      onClick={async () => {
                        await configureRuntime.mutateAsync({ selectedModelId: model.id });
                        await saveSettings.mutateAsync({
                          defaultModelProvider: "local",
                          defaultModelName: model.id
                        });
                        setTestMessage(`Selected ${model.displayName} as the active local model.`);
                      }}
                    >
                      {activeLocalModelId === model.id ? "Active model" : "Use in chats"}
                    </Button>
                    <Button
                      className="bg-background"
                      onClick={async () => {
                        await removeLocalModel.mutateAsync({ modelId: model.id });
                        setTestMessage(`Removed ${model.displayName}.`);
                      }}
                      disabled={removeLocalModel.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {!installedModels?.length ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-4 text-sm text-muted-foreground">
                  No local models installed yet. Pick a curated model and install a build.
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-4 border border-border/70 bg-background/55 p-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Live telemetry</div>
              <div className="mt-2 text-xl font-semibold">Current runtime stats</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                ["Throughput", telemetry?.tokensPerSecond != null ? `${telemetry.tokensPerSecond.toFixed(1)} tok/s` : "Unavailable"],
                ["RAM", telemetry?.ramUsedGb != null ? `${telemetry.ramUsedGb} GB` : "Unavailable"],
                ["CPU", telemetry?.cpuPercent != null ? `${telemetry.cpuPercent}%` : "Unavailable"],
                ["GPU", telemetry?.gpuUtilPercent != null ? `${telemetry.gpuUtilPercent}%` : "Unavailable"],
                ["VRAM", telemetry?.vramUsedGb != null ? `${telemetry.vramUsedGb} GB` : "Unavailable"],
                ["Temps", `${telemetry?.cpuTemperatureC ?? "?"}°C CPU · ${telemetry?.gpuTemperatureC ?? "?"}°C GPU`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                  <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
                </div>
              ))}
            </div>
            <Button
              className="bg-background"
              onClick={async () => {
                const result = await invokeIpc("providers:test", { providerName: "local" });
                setTestMessage(result.message);
              }}
            >
              Test runtime
            </Button>
          </Card>
        </div>
      </div>

      <Card className="space-y-5 border border-border/70 bg-background/55 p-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Advanced runtime</div>
          <div className="mt-2 text-2xl font-semibold">Backend launch and inference controls</div>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
            Tune launch parameters, memory behavior, and sampling defaults directly inside Verdicta. These settings are
            used when the managed local runtime starts your selected model.
          </p>
        </div>

        {draftRuntime ? (
          <div className="space-y-5">
            <label className="grid gap-2 text-sm text-muted-foreground">
              <span>`llama-server` path</span>
              <Input
                value={draftRuntime.runtimePath ?? ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraftRuntime((current) => (current ? { ...current, runtimePath: event.target.value || null } : current))
                }
                placeholder={runtimeStatus?.detectedRuntimePath ?? "/usr/local/bin/llama-server"}
              />
            </label>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="space-y-4 border border-border/70 bg-card/70 p-4">
                <div>
                  <div className="text-sm font-semibold">Launch profile</div>
                  <div className="mt-1 text-xs text-muted-foreground">Model loading, context, threading, and batch sizing.</div>
                </div>
                <div className="grid gap-3">
                  {runtimeNumberField("Context window", draftRuntime.contextSize, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, contextSize: value } : current)),
                    "Higher values improve long-document support but increase memory use."
                  )}
                  {runtimeNumberField("GPU layers", draftRuntime.gpuLayers, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, gpuLayers: value } : current)),
                    "Controls how much of the model is offloaded to the GPU."
                  )}
                  {runtimeNumberField("CPU threads", draftRuntime.threadCount, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, threadCount: value } : current)),
                    "Thread count used by llama.cpp."
                  )}
                  {runtimeNumberField("Batch size", draftRuntime.batchSize, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, batchSize: value } : current)),
                    "Prompt processing batch size."
                  )}
                  {runtimeNumberField("Micro batch", draftRuntime.microBatchSize, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, microBatchSize: value } : current)),
                    "Lower this if you see instability on weaker GPUs."
                  )}
                </div>
              </Card>

              <Card className="space-y-4 border border-border/70 bg-card/70 p-4">
                <div>
                  <div className="text-sm font-semibold">Sampling defaults</div>
                  <div className="mt-1 text-xs text-muted-foreground">Default generation behavior for local chats.</div>
                </div>
                <div className="grid gap-3">
                  {runtimeNumberField("Max response tokens", draftRuntime.maxTokens, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, maxTokens: value } : current))
                  )}
                  {runtimeNumberField("Temperature", draftRuntime.temperature, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, temperature: value } : current))
                  )}
                  {runtimeNumberField("Top-p", draftRuntime.topP, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, topP: value } : current))
                  )}
                  {runtimeNumberField("Top-k", draftRuntime.topK, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, topK: value } : current))
                  )}
                  {runtimeNumberField("Min-p", draftRuntime.minP, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, minP: value } : current))
                  )}
                  {runtimeNumberField("Repeat penalty", draftRuntime.repeatPenalty, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, repeatPenalty: value } : current))
                  )}
                  {runtimeNumberField("Frequency penalty", draftRuntime.frequencyPenalty, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, frequencyPenalty: value } : current))
                  )}
                  {runtimeNumberField("Presence penalty", draftRuntime.presencePenalty, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, presencePenalty: value } : current))
                  )}
                  {runtimeNumberField("Seed", draftRuntime.seed, (value) =>
                    setDraftRuntime((current) => (current ? { ...current, seed: value } : current)),
                    "Use -1 for random output."
                  )}
                </div>
              </Card>

              <Card className="space-y-4 border border-border/70 bg-card/70 p-4">
                <div>
                  <div className="text-sm font-semibold">Memory and offload</div>
                  <div className="mt-1 text-xs text-muted-foreground">Advanced backend behavior similar to dedicated local AI apps.</div>
                </div>
                <div className="grid gap-3">
                  {runtimeBooleanField("Use GPU acceleration", draftRuntime.useGpu, (checked) =>
                    setDraftRuntime((current) => (current ? { ...current, useGpu: checked } : current))
                  )}
                  {runtimeBooleanField("Enable flash attention", draftRuntime.flashAttention, (checked) =>
                    setDraftRuntime((current) => (current ? { ...current, flashAttention: checked } : current))
                  )}
                  {runtimeBooleanField("Offload K/Q/V cache", draftRuntime.offloadKqv, (checked) =>
                    setDraftRuntime((current) => (current ? { ...current, offloadKqv: checked } : current))
                  )}
                  {runtimeBooleanField("Use mmap", draftRuntime.useMmap, (checked) =>
                    setDraftRuntime((current) => (current ? { ...current, useMmap: checked } : current)),
                    "Disable if your platform has memory-mapping issues."
                  )}
                  {runtimeBooleanField("Use mlock", draftRuntime.useMlock, (checked) =>
                    setDraftRuntime((current) => (current ? { ...current, useMlock: checked } : current)),
                    "Attempts to keep model memory resident."
                  )}
                  {runtimeBooleanField("Keep model warm", draftRuntime.keepModelWarm, (checked) =>
                    setDraftRuntime((current) => (current ? { ...current, keepModelWarm: checked } : current)),
                    "Leave the local runtime running between requests for faster follow-ups."
                  )}
                </div>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={async () => {
                  if (!draftRuntime) return;
                  await configureRuntime.mutateAsync(draftRuntime);
                  setTestMessage("Local runtime settings saved.");
                }}
                disabled={configureRuntime.isPending}
              >
                {configureRuntime.isPending ? "Saving runtime..." : "Save runtime settings"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export { LocalAiScreen };
