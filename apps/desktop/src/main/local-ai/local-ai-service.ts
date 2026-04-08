import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import {
  type InstalledLocalModel,
  type LocalDownloadQueueItem,
  type LocalModelCatalogEntry,
  type LocalModelFile,
  type LocalRuntimeConfig,
  type LocalRuntimeInstallStatus,
  type LocalRuntimeStatus,
  type LocalSystemProfile,
  type LocalTelemetry
} from "@verdicta/shared";
import { curatedModels } from "./curated-models";

const HUGGING_FACE_API = "https://huggingface.co/api/models";
const LOCAL_SERVER_PORT = 39241;
const LOCAL_SERVER_URL = `http://127.0.0.1:${LOCAL_SERVER_PORT}/v1`;
const DEFAULT_CONTEXT_SIZE = 8192;
const DEFAULT_GPU_LAYERS = 999;
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_REPEAT_PENALTY = 1.05;
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_THREADS = Math.max(1, Math.min(16, os.availableParallelism?.() ?? 8));
const DEFAULT_TOP_P = 0.95;
const LLAMA_CPP_RELEASE_API = "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest";

interface LocalAiManifest {
  runtimeConfig: LocalRuntimeConfig;
  installedModels: InstalledLocalModel[];
  downloadQueue: LocalDownloadQueueItem[];
}

const defaultRuntimeConfig = (): LocalRuntimeConfig => ({
  runtimePath: null,
  selectedModelId: null,
  contextSize: DEFAULT_CONTEXT_SIZE,
  gpuLayers: DEFAULT_GPU_LAYERS,
  threadCount: DEFAULT_THREADS,
  batchSize: 512,
  microBatchSize: 256,
  topK: 40,
  minP: 0.05,
  temperature: DEFAULT_TEMPERATURE,
  topP: DEFAULT_TOP_P,
  repeatPenalty: DEFAULT_REPEAT_PENALTY,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: DEFAULT_MAX_TOKENS,
  seed: -1,
  useGpu: true,
  flashAttention: true,
  offloadKqv: true,
  useMmap: true,
  useMlock: false,
  keepModelWarm: true
});

const defaultManifest = (): LocalAiManifest => ({
  runtimeConfig: defaultRuntimeConfig(),
  installedModels: [],
  downloadQueue: []
});

const defaultInstallStatus = (): LocalRuntimeInstallStatus => ({
  state: "not-installed",
  downloadUrl: null,
  assetName: null,
  bytesDownloaded: 0,
  totalBytes: null,
  progressPercent: 0,
  message: "Verdicta can install the local runtime for you.",
  lastError: null
});

const quantizationFromFileName = (fileName: string) => {
  const match = fileName.match(/(q\d(?:_[a-z0-9]+)+|q\d+_\d+|f16|bf16|iq\d(?:_[a-z0-9]+)+)/i);
  return match?.[1]?.toUpperCase() ?? "Unknown";
};

const modelIdFromParts = (repoId: string, fileName: string) =>
  `${repoId.replace(/[/:]/g, "__")}::${fileName.replace(/[/:]/g, "__")}`;

const downloadIdFromParts = (kind: "runtime" | "model", name: string) =>
  `${kind}:${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

const resolveDownloadUrl = (repoId: string, fileName: string) => {
  const segments = fileName.split("/").map((segment) => encodeURIComponent(segment));
  return `https://huggingface.co/${repoId}/resolve/main/${segments.join("/")}?download=true`;
};

const selectRecommendedFile = (files: LocalModelFile[]) => {
  const priorities = ["Q4_K_M", "Q5_K_M", "Q4_0", "Q6_K", "Q8_0", "F16", "BF16"];
  const sorted = [...files].sort((left, right) => {
    const leftPriority = priorities.indexOf(left.quantization);
    const rightPriority = priorities.indexOf(right.quantization);
    const leftRank = leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority;
    const rightRank = rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return (left.sizeBytes ?? Number.MAX_SAFE_INTEGER) - (right.sizeBytes ?? Number.MAX_SAFE_INTEGER);
  });
  return sorted[0] ?? null;
};

const sizeBytesToGb = (bytes?: number | null) => (bytes ? bytes / (1024 ** 3) : null);

const round1 = (value: number | null) => (value == null ? null : Math.round(value * 10) / 10);

const readText = (candidate: string) => {
  try {
    return fs.readFileSync(candidate, "utf8").trim();
  } catch {
    return null;
  }
};

const detectRuntimeOnPath = () => {
  const candidates = ["llama-server", "llama-server.exe"];
  const pathValue = process.env.PATH ?? "";
  for (const segment of pathValue.split(path.delimiter)) {
    for (const candidate of candidates) {
      const fullPath = path.join(segment, candidate);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  return null;
};

export class LocalAiService {
  private readonly localAiDir: string;
  private readonly modelsDir: string;
  private readonly manifestPath: string;
  private readonly runtimeDir: string;
  private serverProcess: ChildProcessWithoutNullStreams | null = null;
  private activeModelId: string | null = null;
  private activeRuntimeKey: string | null = null;
  private installStatus = defaultInstallStatus();
  private lastTokenRate: number | null = null;

  constructor(userDataDir: string) {
    this.localAiDir = path.join(userDataDir, "local-ai");
    this.modelsDir = path.join(this.localAiDir, "models");
    this.runtimeDir = path.join(this.localAiDir, "runtime");
    this.manifestPath = path.join(this.localAiDir, "state.json");
    fs.mkdirSync(this.modelsDir, { recursive: true });
    fs.mkdirSync(this.runtimeDir, { recursive: true });
  }

  listInstalledModels() {
    return this.readManifest().installedModels;
  }

  listDownloads() {
    return this.readManifest().downloadQueue.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  getRuntimeInstallStatus() {
    return this.installStatus;
  }

  getServerBaseUrl() {
    return LOCAL_SERVER_URL;
  }

  getSystemProfile(): LocalSystemProfile {
    const totalRamGb = round1(os.totalmem() / (1024 ** 3)) ?? 0;
    const availableRamGb = round1(os.freemem() / (1024 ** 3)) ?? 0;
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model ?? "Unknown CPU";
    const gpu = this.detectGpu();

    let recommendation = "Recommended starting point: 7B to 8B GGUF models in Q4_K_M.";
    if (totalRamGb >= 28 && (gpu.totalVramGb ?? 0) >= 10) {
      recommendation = "This machine should handle 14B-class GGUF models comfortably with GPU offload.";
    } else if (totalRamGb >= 14) {
      recommendation = "This machine should run 7B to 8B GGUF models well. 12B to 14B may fit with smaller quantizations.";
    } else if (totalRamGb < 10) {
      recommendation = "Prefer compact 3B to 7B GGUF models and lower context sizes on this machine.";
    }

    return {
      os: `${process.platform}`,
      arch: process.arch,
      cpuModel,
      cpuCores: cpus.length,
      totalRamGb,
      availableRamGb,
      gpuName: gpu.name,
      totalVramGb: gpu.totalVramGb,
      supportsGpuRuntime: gpu.supportsGpuRuntime,
      recommendation,
      gpuVendor: gpu.gpuVendor,
      gpuType: gpu.gpuType,
      driverStatus: gpu.driverStatus,
      runtimeRequirementMessage: gpu.runtimeRequirementMessage,
      runtimeRequirementActionUrl: gpu.runtimeRequirementActionUrl,
      cpuCoresMetadata: cpus.map((core, i) => ({
        coreId: i,
        model: core.model,
        speedMHz: core.speed
      }))
    };
  }

  async getTelemetry(): Promise<LocalTelemetry> {
    const ramUsedGb = round1((os.totalmem() - os.freemem()) / (1024 ** 3));
    const ramPercent = round1(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    const cpuTemperatureC = this.readCpuTemperature();
    const gpu = this.detectGpu();
    const processStats = this.serverProcess ? this.readProcessUsage(this.serverProcess.pid) : null;

    return {
      tokensPerSecond: this.lastTokenRate,
      cpuPercent: processStats?.cpuPercent ?? null,
      ramUsedGb,
      ramPercent,
      vramUsedGb: gpu.usedVramGb,
      vramPercent: gpu.totalVramGb && gpu.usedVramGb != null ? round1((gpu.usedVramGb / gpu.totalVramGb) * 100) : null,
      gpuUtilPercent: gpu.utilPercent,
      cpuTemperatureC,
      gpuTemperatureC: gpu.temperatureC,
      activeModelId: this.activeModelId,
      backend: "llama.cpp"
    };
  }

  async searchCatalog(query: string, limit = 20): Promise<LocalModelCatalogEntry[]> {
    const system = this.getSystemProfile();
    const curatedMatches = curatedModels
      .filter((entry) => {
        if (!query.trim()) {
          return true;
        }
        const haystack = [
          entry.repoId,
          entry.name,
          entry.family,
          entry.summary,
          ...(entry.capabilities ?? []),
          ...(entry.useCases ?? []),
          ...(entry.tags ?? [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
      .map((entry) => this.enrichCatalogEntry(system, { ...entry, downloads: entry.downloads ?? 0, likes: entry.likes ?? 0, updatedAt: entry.updatedAt ?? null, files: [] }))
      .slice(0, limit);

    if (!query.trim()) {
      const remoteFeatured = await this.fetchRemoteCatalog(query, Math.max(limit - curatedMatches.length, 0), system);
      return this.dedupeCatalogEntries([...curatedMatches, ...remoteFeatured]).slice(0, limit);
    }

    const remoteResults = await this.fetchRemoteCatalog(query, limit, system);
    return this.dedupeCatalogEntries([...curatedMatches, ...remoteResults]).slice(0, limit);
  }

  async getCatalogDetail(repoId: string) {
    return this.fetchModelDetails(repoId);
  }

  private async fetchRemoteCatalog(query: string, limit: number, system: LocalSystemProfile): Promise<LocalModelCatalogEntry[]> {
    if (limit <= 0) {
      return [];
    }
    const url = new URL(HUGGING_FACE_API);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("full", "true");
    if (query.trim()) {
      url.searchParams.set("search", query.trim());
    } else {
      url.searchParams.set("sort", "downloads");
      url.searchParams.set("direction", "-1");
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Model catalog lookup failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as Array<{
      id?: string;
      author?: string;
      cardData?: { summary?: string };
      description?: string;
      downloads?: number;
      likes?: number;
      lastModified?: string;
      siblings?: Array<{ rfilename?: string; size?: number }>;
      tags?: string[];
    }>;

    return payload
      .map((entry) => {
        const repoId = entry.id ?? "";
        const files = (entry.siblings ?? [])
          .filter((file) => file.rfilename?.toLowerCase().endsWith(".gguf"))
          .map((file) => {
            const fileName = file.rfilename!;
            return {
              fileName,
              quantization: quantizationFromFileName(fileName),
              sizeBytes: file.size ?? null,
              downloadUrl: resolveDownloadUrl(repoId, fileName)
            };
          });

        return this.enrichCatalogEntry(system, {
          repoId,
          name: repoId.split("/").pop() ?? repoId,
          author: entry.author ?? null,
          publisher: entry.author ?? null,
          family: null,
          architecture: null,
          summary: entry.cardData?.summary ?? entry.description ?? null,
          downloads: entry.downloads ?? 0,
          likes: entry.likes ?? 0,
          updatedAt: entry.lastModified ?? null,
          tags: entry.tags ?? [],
          files,
          capabilities: [],
          modalities: [],
          useCases: [],
          collections: [],
          featuredCategory: null,
          parameterLabel: null,
          parameterCountBillions: null,
          contextWindowTokens: null,
          license: null,
          homepage: `https://huggingface.co/${repoId}`,
          releaseDate: null,
          fitNotes: null,
          strengths: [],
          limitations: [],
          languages: [],
          benchmarkNote: null,
          benchmarkArenaElo: null,
          benchmarkMmlu: null,
          benchmarkGsm8k: null,
          benchmarkHumanEval: null,
          benchmarkTokensPerSecond: null
        });
      })
      .filter((entry) => entry.repoId && entry.files.length > 0);
  }

  async installModel(repoId: string, fileName?: string): Promise<InstalledLocalModel> {
    const details = await this.fetchModelDetails(repoId);
    const selectedFile = fileName
      ? details.files.find((candidate) => candidate.fileName === fileName) ?? null
      : selectRecommendedFile(details.files);

    if (!selectedFile) {
      throw new Error("No compatible GGUF file is available for this model.");
    }

    const repoDir = path.join(this.modelsDir, repoId.replace(/\//g, "__"));
    fs.mkdirSync(repoDir, { recursive: true });

    const targetPath = path.join(repoDir, selectedFile.fileName.split("/").pop() ?? selectedFile.fileName);
    const downloadId = downloadIdFromParts("model", `${repoId}:${selectedFile.fileName}`);
    try {
      this.updateDownloadItem({
        id: downloadId,
        kind: "model",
        label: `${details.name} · ${selectedFile.quantization}`,
        repoId,
        fileName: selectedFile.fileName,
        status: "queued",
        progressPercent: 0,
        bytesDownloaded: 0,
        totalBytes: selectedFile.sizeBytes ?? null,
        speedBytesPerSecond: null,
        lastError: null
      });
      const manifest = this.readManifest();
      const installedModel: InstalledLocalModel = {
        id: modelIdFromParts(repoId, selectedFile.fileName),
        repoId,
        displayName: `${repoId} / ${selectedFile.quantization}`,
        fileName: selectedFile.fileName,
        filePath: targetPath,
        quantization: selectedFile.quantization,
        sizeBytes: selectedFile.sizeBytes,
        installedAt: new Date().toISOString(),
        sourceDownloadUrl: selectedFile.downloadUrl
      };

      if (!fs.existsSync(targetPath)) {
        this.downloadFile(selectedFile.downloadUrl, targetPath, (bytesDownloaded, totalBytes, speedBytesPerSecond) => {
          this.updateDownloadItem({
            id: downloadId,
            kind: "model",
            label: `${details.name} · ${selectedFile.quantization}`,
            repoId,
            fileName: selectedFile.fileName,
            status: "downloading",
            progressPercent: totalBytes ? Math.min(100, (bytesDownloaded / totalBytes) * 100) : 0,
            bytesDownloaded,
            totalBytes,
            speedBytesPerSecond,
            lastError: null
          });
        }).then(() => {
          const m = this.readManifest();
          const nextInstalledModels = m.installedModels
            .filter((entry) => entry.id !== installedModel.id)
            .concat(installedModel);
          this.writeManifest({
            runtimeConfig: {
              ...m.runtimeConfig,
              selectedModelId: m.runtimeConfig.selectedModelId ?? installedModel.id
            },
            installedModels: nextInstalledModels,
            downloadQueue: m.downloadQueue
          });
          this.completeDownloadItem(downloadId);
        }).catch((err) => {
          this.failDownloadItem(downloadId, err instanceof Error ? err.message : "Model installation failed.");
        });
      } else {
        const nextInstalledModels = manifest.installedModels
          .filter((entry) => entry.id !== installedModel.id)
          .concat(installedModel);
        this.writeManifest({
          runtimeConfig: {
            ...manifest.runtimeConfig,
            selectedModelId: manifest.runtimeConfig.selectedModelId ?? installedModel.id
          },
          installedModels: nextInstalledModels,
          downloadQueue: manifest.downloadQueue
        });
        this.completeDownloadItem(downloadId);
      }

      return installedModel;
    } catch (error) {
      this.failDownloadItem(downloadId, error instanceof Error ? error.message : "Model installation failed.");
      throw error;
    }
  }

  async installManagedRuntime(): Promise<LocalRuntimeInstallStatus> {
    if (this.installStatus.state === "installing") {
      return this.installStatus;
    }

    try {
      this.installStatus = {
        ...defaultInstallStatus(),
        state: "installing",
        message: "Looking up the latest llama.cpp runtime release."
      };

      const release = await this.fetchLatestRuntimeRelease();
      const asset = this.selectRuntimeAsset(release.assets);
      if (!asset) {
        throw new Error("No compatible llama.cpp runtime asset was found for this platform.");
      }
      const downloadId = downloadIdFromParts("runtime", asset.name);
      this.updateDownloadItem({
        id: downloadId,
        kind: "runtime",
        label: asset.name,
        repoId: null,
        fileName: null,
        status: "queued",
        progressPercent: 0,
        bytesDownloaded: 0,
        totalBytes: asset.size ?? null,
        speedBytesPerSecond: null,
        lastError: null
      });

      const archivePath = path.join(this.runtimeDir, asset.name);
      this.installStatus = {
        ...this.installStatus,
        assetName: asset.name,
        downloadUrl: asset.browser_download_url,
        totalBytes: asset.size ?? null,
        message: `Downloading ${asset.name}.`
      };

      this.downloadFile(asset.browser_download_url, archivePath, (bytesDownloaded, totalBytes, speedBytesPerSecond) => {
        this.installStatus = {
          ...this.installStatus,
          bytesDownloaded,
          totalBytes,
          progressPercent: totalBytes ? Math.min(100, (bytesDownloaded / totalBytes) * 100) : 0,
          message: `Downloading ${asset.name}.`
        };
        this.updateDownloadItem({
          id: downloadId,
          kind: "runtime",
          label: asset.name,
          repoId: null,
          fileName: null,
          status: "downloading",
          progressPercent: totalBytes ? Math.min(100, (bytesDownloaded / totalBytes) * 100) : 0,
          bytesDownloaded,
          totalBytes,
          speedBytesPerSecond,
          lastError: null
        });
      }).then(() => {
        this.installStatus = {
          ...this.installStatus,
          message: "Extracting runtime binaries."
        };
        this.updateDownloadItem({
          id: downloadId,
          kind: "runtime",
          label: asset.name,
          repoId: null,
          fileName: null,
          status: "extracting",
          progressPercent: 100,
          bytesDownloaded: this.installStatus.bytesDownloaded,
          totalBytes: this.installStatus.totalBytes,
          speedBytesPerSecond: null,
          lastError: null
        });

        const extractDir = path.join(this.runtimeDir, "current");
        fs.rmSync(extractDir, { recursive: true, force: true });
        fs.mkdirSync(extractDir, { recursive: true });
        this.extractArchive(archivePath, extractDir);

        const runtimePath = this.findRuntimeBinary(extractDir);
        if (!runtimePath) {
          throw new Error("Verdicta installed the runtime archive, but `llama-server` was not found inside it.");
        }
        fs.chmodSync(runtimePath, 0o755);

        const manifest = this.readManifest();
        this.writeManifest({
          runtimeConfig: {
            ...manifest.runtimeConfig,
            runtimePath
          },
          installedModels: manifest.installedModels,
          downloadQueue: manifest.downloadQueue
        });

        this.installStatus = {
          ...this.installStatus,
          state: "installed",
          progressPercent: 100,
          message: "Local runtime installed and ready.",
          lastError: null
        };
        this.completeDownloadItem(downloadId);
      }).catch((error) => {
        this.installStatus = {
          ...this.installStatus,
          state: "error",
          message: "Runtime installation failed.",
          lastError: error instanceof Error ? error.message : "Runtime installation failed."
        };
        this.failDownloadItem(downloadId, this.installStatus.lastError);
      });
    } catch (error) {
      this.installStatus = {
        ...this.installStatus,
        state: "error",
        message: "Runtime installation failed.",
        lastError: error instanceof Error ? error.message : "Runtime installation failed."
      };
    }

    return this.installStatus;
  }

  async removeModel(modelId: string) {
    const manifest = this.readManifest();
    const existing = manifest.installedModels.find((entry) => entry.id === modelId);
    if (!existing) {
      return { ok: true };
    }

    try {
      fs.rmSync(existing.filePath, { force: true });
    } catch {
      // Ignore file cleanup failures and still remove the manifest entry.
    }

    const nextInstalledModels = manifest.installedModels.filter((entry) => entry.id !== modelId);
    const nextRuntimeConfig = {
      ...manifest.runtimeConfig,
      selectedModelId:
        manifest.runtimeConfig.selectedModelId === modelId ? nextInstalledModels[0]?.id ?? null : manifest.runtimeConfig.selectedModelId
    };

    if (this.activeModelId === modelId) {
      this.stopServer();
    }

    this.writeManifest({
      runtimeConfig: nextRuntimeConfig,
      installedModels: nextInstalledModels,
      downloadQueue: manifest.downloadQueue
    });

    return { ok: true };
  }

  getRuntimeStatus(): LocalRuntimeStatus {
    const manifest = this.readManifest();
    const detectedRuntimePath = manifest.runtimeConfig.runtimePath || detectRuntimeOnPath();
    const selectedModel = manifest.installedModels.find((entry) => entry.id === manifest.runtimeConfig.selectedModelId) ?? null;

    let message = "Install a compatible llama.cpp runtime to enable local inference.";
    if (!detectedRuntimePath) {
      message = "Verdicta has not installed its local runtime yet. Use the in-app runtime installer.";
    } else if (!selectedModel) {
      message = "Install a GGUF model and choose it as the active local model.";
    } else {
      message = `Ready to run ${selectedModel.displayName} with llama.cpp.`;
    }

    return {
      available: Boolean(detectedRuntimePath && selectedModel),
      backend: "llama.cpp",
      detectedRuntimePath,
      message,
      config: {
        ...manifest.runtimeConfig,
        runtimePath: manifest.runtimeConfig.runtimePath ?? detectedRuntimePath
      },
      installedModels: manifest.installedModels
    };
  }

  configureRuntime(nextConfig: Partial<LocalRuntimeConfig>): LocalRuntimeStatus {
    const manifest = this.readManifest();
    const runtimeConfig = {
      ...manifest.runtimeConfig,
      ...nextConfig
    };

    this.writeManifest({
      runtimeConfig,
      installedModels: manifest.installedModels,
      downloadQueue: manifest.downloadQueue
    });

    if (this.serverProcess) {
      this.stopServer();
    }

    return this.getRuntimeStatus();
  }

  async ensureServer(modelName?: string) {
    const status = this.getRuntimeStatus();
    const targetModelId =
      modelName && modelName !== "auto" ? modelName : status.config.selectedModelId;
    const targetModel = status.installedModels.find((entry) => entry.id === targetModelId) ?? null;
    if (!targetModel) {
      throw new Error("No installed local model is selected.");
    }

    const runtimePath = status.config.runtimePath ?? status.detectedRuntimePath;
    if (!runtimePath) {
      throw new Error("llama.cpp `llama-server` was not found on this system.");
    }

    const runtimeKey = JSON.stringify({
      runtimePath,
      modelId: targetModel.id,
      contextSize: status.config.contextSize,
      gpuLayers: status.config.useGpu ? status.config.gpuLayers : 0,
      threadCount: status.config.threadCount,
      batchSize: status.config.batchSize,
      microBatchSize: status.config.microBatchSize,
      flashAttention: status.config.flashAttention,
      offloadKqv: status.config.offloadKqv,
      useMmap: status.config.useMmap,
      useMlock: status.config.useMlock
    });

    if (
      this.serverProcess &&
      !this.serverProcess.killed &&
      this.activeModelId === targetModel.id &&
      this.activeRuntimeKey === runtimeKey
    ) {
      return LOCAL_SERVER_URL;
    }

    this.stopServer();

    const args = [
      "-m",
      targetModel.filePath,
      "--host",
      "127.0.0.1",
      "--port",
      String(LOCAL_SERVER_PORT),
      "-c",
      String(status.config.contextSize),
      "-t",
      String(status.config.threadCount),
      "-b",
      String(status.config.batchSize),
      "-ub",
      String(status.config.microBatchSize),
      "-ngl",
      String(status.config.useGpu ? status.config.gpuLayers : 0)
    ];

    if (status.config.flashAttention) {
      args.push("-fa");
    }
    if (!status.config.offloadKqv) {
      args.push("--no-kv-offload");
    }
    if (!status.config.useMmap) {
      args.push("--no-mmap");
    }
    if (status.config.useMlock) {
      args.push("--mlock");
    }

    const child = spawn(runtimePath, args, {
      stdio: "pipe",
      env: process.env
    });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString().trim();
      this.updateTokenRateFromLogs(text);
      console.log(`[local-ai] ${text}`);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString().trim();
      this.updateTokenRateFromLogs(text);
      console.error(`[local-ai] ${text}`);
    });
    child.on("exit", (code, signal) => {
      console.log(`[local-ai] llama-server exited code=${code ?? "null"} signal=${signal ?? "null"}`);
      if (this.serverProcess === child) {
        this.serverProcess = null;
        this.activeModelId = null;
        this.activeRuntimeKey = null;
      }
    });

    this.serverProcess = child;
    this.activeModelId = targetModel.id;
    this.activeRuntimeKey = runtimeKey;

    await this.waitForServerReady();
    return LOCAL_SERVER_URL;
  }

  stopServer() {
    if (!this.serverProcess) {
      return;
    }
    this.serverProcess.kill("SIGTERM");
    this.serverProcess = null;
    this.activeModelId = null;
    this.activeRuntimeKey = null;
    this.lastTokenRate = null;
  }

  private readManifest(): LocalAiManifest {
    if (!fs.existsSync(this.manifestPath)) {
      const manifest = defaultManifest();
      this.writeManifest(manifest);
      return manifest;
    }

    try {
      const payload = JSON.parse(fs.readFileSync(this.manifestPath, "utf8")) as Partial<LocalAiManifest>;
      return {
        runtimeConfig: {
          ...defaultRuntimeConfig(),
          ...payload.runtimeConfig
        },
        installedModels: payload.installedModels ?? [],
        downloadQueue: payload.downloadQueue ?? []
      };
    } catch {
      const manifest = defaultManifest();
      this.writeManifest(manifest);
      return manifest;
    }
  }

  private writeManifest(manifest: LocalAiManifest) {
    fs.mkdirSync(this.localAiDir, { recursive: true });
    const tempPath = `${this.manifestPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2));
    fs.renameSync(tempPath, this.manifestPath);
  }

  private async fetchModelDetails(repoId: string): Promise<LocalModelCatalogEntry> {
    const system = this.getSystemProfile();
    const response = await fetch(`${HUGGING_FACE_API}/${repoId}`, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Could not inspect model ${repoId}: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as {
      id?: string;
      author?: string;
      cardData?: { summary?: string };
      description?: string;
      downloads?: number;
      likes?: number;
      lastModified?: string;
      siblings?: Array<{ rfilename?: string; size?: number }>;
      tags?: string[];
    };

    const files = (payload.siblings ?? [])
      .filter((file) => file.rfilename?.toLowerCase().endsWith(".gguf"))
      .map((file) => ({
        fileName: file.rfilename!,
        quantization: quantizationFromFileName(file.rfilename!),
        sizeBytes: file.size ?? null,
        downloadUrl: resolveDownloadUrl(repoId, file.rfilename!)
      }));
    const recommendedFile = selectRecommendedFile(files);

    const curated = curatedModels.find((entry) => entry.repoId === repoId);
    return this.enrichCatalogEntry(system, {
      repoId: payload.id ?? repoId,
      name: curated?.name ?? repoId.split("/").pop() ?? repoId,
      author: curated?.author ?? payload.author ?? null,
      family: curated?.family ?? null,
      summary: curated?.summary ?? payload.cardData?.summary ?? payload.description ?? null,
      downloads: payload.downloads ?? 0,
      likes: payload.likes ?? 0,
      updatedAt: payload.lastModified ?? null,
      tags: curated ? Array.from(new Set([...(payload.tags ?? []), ...(curated.tags ?? [])])) : payload.tags ?? [],
      files,
      publisher: curated?.publisher ?? null,
      capabilities: curated?.capabilities ?? [],
      modalities: curated?.modalities ?? [],
      useCases: curated?.useCases ?? [],
      collections: curated?.collections ?? [],
      featuredCategory: curated?.featuredCategory ?? null,
      architecture: curated?.architecture ?? null,
      parameterLabel: curated?.parameterLabel ?? null,
      parameterCountBillions: curated?.parameterCountBillions ?? null,
      contextWindowTokens: curated?.contextWindowTokens ?? null,
      license: curated?.license ?? null,
      homepage: curated?.homepage ?? `https://huggingface.co/${repoId}`,
      releaseDate: curated?.releaseDate ?? null,
      recommendedQuantization: curated?.recommendedQuantization ?? recommendedFile?.quantization ?? null,
      recommendationReason: curated?.recommendationReason ?? null,
      fitNotes: curated?.fitNotes ?? null,
      strengths: curated?.strengths ?? [],
      limitations: curated?.limitations ?? [],
      languages: curated?.languages ?? [],
      benchmarkNote: curated?.benchmarkNote ?? null,
      benchmarkArenaElo: curated?.benchmarkArenaElo ?? null,
      benchmarkMmlu: curated?.benchmarkMmlu ?? null,
      benchmarkGsm8k: curated?.benchmarkGsm8k ?? null,
      benchmarkHumanEval: curated?.benchmarkHumanEval ?? null,
      benchmarkTokensPerSecond: curated?.benchmarkTokensPerSecond ?? null,
      minimumRamGb: curated?.minimumRamGb ?? null,
      recommendedRamGb: curated?.recommendedRamGb ?? null,
      minimumVramGb: curated?.minimumVramGb ?? null,
      recommendedVramGb: curated?.recommendedVramGb ?? null
    });
  }

  private async downloadFile(
    url: string,
    targetPath: string,
    onProgress?: (bytesDownloaded: number, totalBytes: number | null, speedBytesPerSecond: number | null) => void
  ) {
    const tempPath = `${targetPath}.part`;
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Model download failed: ${response.status} ${response.statusText}`);
    }

    const totalBytes = Number(response.headers.get("content-length") ?? "") || null;
    const fileStream = fs.createWriteStream(tempPath);
    await new Promise<void>((resolve, reject) => {
      const reader = response.body!.getReader();
      let bytesDownloaded = 0;
      const startedAt = Date.now();

      const pump = async () => {
        try {
          const next = await reader.read();
          if (next.done) {
            fileStream.end(() => resolve());
            return;
          }
          bytesDownloaded += next.value.byteLength;
          fileStream.write(Buffer.from(next.value));
          const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
          onProgress?.(bytesDownloaded, totalBytes, bytesDownloaded / elapsedSeconds);
          await pump();
        } catch (error) {
          reject(error);
        }
      };

      fileStream.on("error", reject);
      void pump();
    });

    fs.renameSync(tempPath, targetPath);
  }

  private async waitForServerReady() {
    const timeoutAt = Date.now() + 20_000;
    let lastError = "Timed out waiting for llama.cpp.";

    while (Date.now() < timeoutAt) {
      try {
        const response = await fetch(`${LOCAL_SERVER_URL}/models`);
        if (response.ok) {
          return;
        }
        lastError = `${response.status} ${response.statusText}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Connection failed.";
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.stopServer();
    throw new Error(`Local runtime failed to start: ${lastError}`);
  }

  private buildModelRecommendation(system: LocalSystemProfile, modelSizeGb: number, quantization: string) {
    const gpuFit =
      system.totalVramGb != null && system.totalVramGb >= modelSizeGb * 1.1
        ? "It should fit in VRAM with GPU offload."
        : "It may need partial GPU offload or CPU-heavy execution.";
    const ramFit =
      system.totalRamGb >= modelSizeGb * 1.8
        ? "System RAM is sufficient for smooth local use."
        : "This model may be heavy for the available system RAM.";
    return `${quantization} is the recommended starting quantization for this machine. ${gpuFit} ${ramFit}`;
  }

  private enrichCatalogEntry(system: LocalSystemProfile, entry: LocalModelCatalogEntry): LocalModelCatalogEntry {
    const recommendedFile = entry.files.length ? selectRecommendedFile(entry.files) : null;
    const recommendedSizeGb = sizeBytesToGb(recommendedFile?.sizeBytes);
    return {
      ...entry,
      capabilities: entry.capabilities ?? [],
      modalities: entry.modalities ?? ["Text"],
      useCases: entry.useCases ?? [],
      collections: entry.collections ?? [],
      strengths: entry.strengths ?? [],
      limitations: entry.limitations ?? [],
      languages: entry.languages ?? [],
      homepage: entry.homepage ?? `https://huggingface.co/${entry.repoId}`,
      recommendedQuantization: entry.recommendedQuantization ?? recommendedFile?.quantization ?? null,
      recommendationReason:
        entry.recommendationReason ??
        (recommendedFile && recommendedSizeGb != null
          ? this.buildModelRecommendation(system, recommendedSizeGb, recommendedFile.quantization)
          : null),
      fitNotes:
        entry.fitNotes ??
        (recommendedFile && recommendedSizeGb != null
          ? `Expect roughly ${round1(recommendedSizeGb)} GB of model weights before KV cache and runtime overhead.`
          : null),
      minimumRamGb: entry.minimumRamGb ?? (recommendedSizeGb != null ? round1(recommendedSizeGb * 1.35) : null),
      recommendedRamGb: entry.recommendedRamGb ?? (recommendedSizeGb != null ? round1(recommendedSizeGb * 1.8) : null),
      minimumVramGb: entry.minimumVramGb ?? (recommendedSizeGb != null ? round1(recommendedSizeGb * 1.1) : null),
      recommendedVramGb: entry.recommendedVramGb ?? (recommendedSizeGb != null ? round1(recommendedSizeGb * 1.5) : null)
    };
  }

  private dedupeCatalogEntries(entries: LocalModelCatalogEntry[]) {
    const map = new Map<string, LocalModelCatalogEntry>();
    for (const entry of entries) {
      const existing = map.get(entry.repoId);
      if (!existing) {
        map.set(entry.repoId, entry);
        continue;
      }
      map.set(entry.repoId, {
        ...entry,
        files: entry.files.length ? entry.files : existing.files,
        capabilities: entry.capabilities.length ? entry.capabilities : existing.capabilities,
        useCases: entry.useCases.length ? entry.useCases : existing.useCases,
        summary: entry.summary ?? existing.summary,
        publisher: entry.publisher ?? existing.publisher,
        family: entry.family ?? existing.family,
        architecture: entry.architecture ?? existing.architecture,
        modalities: entry.modalities.length ? entry.modalities : existing.modalities,
        featuredCategory: entry.featuredCategory ?? existing.featuredCategory,
        collections: entry.collections.length ? entry.collections : existing.collections,
        parameterLabel: entry.parameterLabel ?? existing.parameterLabel,
        parameterCountBillions: entry.parameterCountBillions ?? existing.parameterCountBillions,
        contextWindowTokens: entry.contextWindowTokens ?? existing.contextWindowTokens,
        license: entry.license ?? existing.license,
        homepage: entry.homepage ?? existing.homepage,
        releaseDate: entry.releaseDate ?? existing.releaseDate,
        recommendedQuantization: entry.recommendedQuantization ?? existing.recommendedQuantization,
        recommendationReason: entry.recommendationReason ?? existing.recommendationReason,
        fitNotes: entry.fitNotes ?? existing.fitNotes,
        strengths: entry.strengths.length ? entry.strengths : existing.strengths,
        limitations: entry.limitations.length ? entry.limitations : existing.limitations,
        languages: entry.languages.length ? entry.languages : existing.languages,
        benchmarkNote: entry.benchmarkNote ?? existing.benchmarkNote,
        benchmarkArenaElo: entry.benchmarkArenaElo ?? existing.benchmarkArenaElo,
        benchmarkMmlu: entry.benchmarkMmlu ?? existing.benchmarkMmlu,
        benchmarkGsm8k: entry.benchmarkGsm8k ?? existing.benchmarkGsm8k,
        benchmarkHumanEval: entry.benchmarkHumanEval ?? existing.benchmarkHumanEval,
        benchmarkTokensPerSecond: entry.benchmarkTokensPerSecond ?? existing.benchmarkTokensPerSecond,
        minimumRamGb: entry.minimumRamGb ?? existing.minimumRamGb,
        recommendedRamGb: entry.recommendedRamGb ?? existing.recommendedRamGb,
        minimumVramGb: entry.minimumVramGb ?? existing.minimumVramGb,
        recommendedVramGb: entry.recommendedVramGb ?? existing.recommendedVramGb
      });
    }
    return [...map.values()];
  }

  private updateDownloadItem(
    next: Omit<LocalDownloadQueueItem, "createdAt" | "updatedAt" | "finishedAt"> & {
      createdAt?: string;
      updatedAt?: string;
      finishedAt?: string | null;
    }
  ) {
    const manifest = this.readManifest();
    const now = new Date().toISOString();
    const existing = manifest.downloadQueue.find((item) => item.id === next.id);
    const item: LocalDownloadQueueItem = {
      id: next.id,
      kind: next.kind,
      label: next.label,
      repoId: next.repoId,
      fileName: next.fileName,
      status: next.status,
      progressPercent: next.progressPercent,
      bytesDownloaded: next.bytesDownloaded,
      totalBytes: next.totalBytes,
      speedBytesPerSecond: next.speedBytesPerSecond,
      createdAt: existing?.createdAt ?? next.createdAt ?? now,
      updatedAt: next.updatedAt ?? now,
      finishedAt: next.finishedAt ?? existing?.finishedAt ?? null,
      lastError: next.lastError
    };

    const downloadQueue = manifest.downloadQueue.filter((entry) => entry.id !== item.id).concat(item).slice(-24);
    this.writeManifest({
      runtimeConfig: manifest.runtimeConfig,
      installedModels: manifest.installedModels,
      downloadQueue
    });
  }

  private completeDownloadItem(id: string) {
    const manifest = this.readManifest();
    const existing = manifest.downloadQueue.find((item) => item.id === id);
    if (!existing) {
      return;
    }
    this.writeManifest({
      runtimeConfig: manifest.runtimeConfig,
      installedModels: manifest.installedModels,
      downloadQueue: manifest.downloadQueue.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "completed",
              progressPercent: 100,
              updatedAt: new Date().toISOString(),
              finishedAt: new Date().toISOString(),
              speedBytesPerSecond: null,
              lastError: null
            }
          : item
      )
    });
  }

  private failDownloadItem(id: string, lastError: string | null) {
    const manifest = this.readManifest();
    const existing = manifest.downloadQueue.find((item) => item.id === id);
    if (!existing) {
      return;
    }
    this.writeManifest({
      runtimeConfig: manifest.runtimeConfig,
      installedModels: manifest.installedModels,
      downloadQueue: manifest.downloadQueue.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "failed",
              updatedAt: new Date().toISOString(),
              finishedAt: new Date().toISOString(),
              speedBytesPerSecond: null,
              lastError
            }
          : item
      )
    });
  }

  private detectGpu() {
    const nvidia = this.readNvidiaGpu();
    if (nvidia) {
      return {
        ...nvidia,
        gpuVendor: "NVIDIA" as const,
        gpuType: "Dedicated" as const,
        driverStatus: "Installed" as const,
        runtimeRequirementMessage: "CUDA toolkit requires modern NVIDIA drivers, which appear to be installed.",
        runtimeRequirementActionUrl: "https://developer.nvidia.com/cuda-downloads",
        supportsGpuRuntime: true
      };
    }

    if (process.platform === "darwin") {
      if (process.arch === "arm64") {
        return {
          name: "Apple Silicon GPU",
          gpuVendor: "Apple" as const,
          gpuType: "Integrated" as const,
          driverStatus: "Installed" as const,
          runtimeRequirementMessage: "Apple Metal acceleration requires no additional driver installation.",
          runtimeRequirementActionUrl: null,
          totalVramGb: round1(os.totalmem() / (1024 ** 3)),
          usedVramGb: null,
          utilPercent: null,
          temperatureC: null,
          supportsGpuRuntime: true
        };
      }
      try {
        const out = execFileSync("system_profiler", ["SPDisplaysDataType"], { encoding: "utf8" });
        const match = out.match(/Chipset Model:\s*(.*)/);
        if (match) {
          const name = match[1].trim();
          const gpuVendor = name.toLowerCase().includes("amd") || name.toLowerCase().includes("radeon") ? "AMD" : (name.toLowerCase().includes("intel") ? "Intel" : "Unknown");
          return {
            name,
            gpuVendor: gpuVendor as any,
            gpuType: gpuVendor === "Intel" ? "Integrated" as const : "Dedicated" as const,
            driverStatus: "Installed" as const,
            runtimeRequirementMessage: "Mac Intel acceleration relies on available Metal fallback operations.",
            runtimeRequirementActionUrl: null,
            totalVramGb: null,
            usedVramGb: null,
            utilPercent: null,
            temperatureC: null,
            supportsGpuRuntime: true
          };
        }
      } catch {
        // Fallback to default
      }
    }

    if (process.platform === "linux") {
      for (let i = 0; i < 2; i++) {
        const basePath = `/sys/class/drm/card${i}/device`;
        const vendor = readText(`${basePath}/vendor`);
        if (vendor && vendor.toLowerCase() === "0x1002") {
          let productName = readText(`${basePath}/product_name`);
          if (!productName) {
            try {
              const lspci = execFileSync("lspci", ["-vmm"], { encoding: "utf8" });
              const vgaBlock = lspci.split("\n\n").find(block => block.includes("VGA compatible controller") && block.includes("AMD"));
              if (vgaBlock) {
                const deviceMatch = vgaBlock.match(/Device:\s*(.*)/);
                if (deviceMatch) productName = deviceMatch[1].trim();
              }
            } catch {}
          }
          productName = productName || "AMD Radeon GPU";

          const vramTotalText = readText(`${basePath}/mem_info_vram_total`);
          const vramUsedText = readText(`${basePath}/mem_info_vram_used`);
          const busyText = readText(`${basePath}/gpu_busy_percent`);

          let driverStatus = "Unknown" as const;
          try {
            driverStatus = "Installed"; // If /sys/class/drm populated, amdgpu driver is usually loaded
          } catch {}

          return {
            name: productName,
            gpuVendor: "AMD" as const,
            gpuType: "Dedicated" as const,
            driverStatus,
            runtimeRequirementMessage: "Vulkan drivers (amdvlk or radv) or ROCm are required for AMD acceleration.",
            runtimeRequirementActionUrl: "https://rocm.docs.amd.com/projects/install-on-linux/en/latest/",
            totalVramGb: vramTotalText ? round1(Number(vramTotalText) / (1024 ** 3)) : null,
            usedVramGb: vramUsedText ? round1(Number(vramUsedText) / (1024 ** 3)) : null,
            utilPercent: busyText ? Number(busyText) : null,
            temperatureC: this.readGpuTemperature(),
            supportsGpuRuntime: true
          };
        }
      }
    }

    if (process.platform === "win32") {
      try {
        const out = execFileSync("wmic", ["path", "win32_VideoController", "get", "name"], { encoding: "utf8" });
        const lines = out.split("\n").map((l) => l.trim()).filter((l) => l && l.toLowerCase() !== "name");
        if (lines.length > 0) {
          const name = lines[0];
          let gpuVendor = "Unknown" as const;
          let gpuType = "Unknown" as const;
          if (name.toLowerCase().includes("amd") || name.toLowerCase().includes("radeon")) {
            gpuVendor = "AMD";
            gpuType = "Dedicated";
          } else if (name.toLowerCase().includes("intel")) {
            gpuVendor = "Intel";
            gpuType = "Integrated";
          } else if (name.toLowerCase().includes("nvidia")) {
            gpuVendor = "NVIDIA";
            gpuType = "Dedicated";
          }
          let actionUrl: string | null = null;
          if (gpuVendor === "AMD") actionUrl = "https://www.amd.com/en/support";
          if (gpuVendor === "NVIDIA") actionUrl = "https://developer.nvidia.com/cuda-downloads";
          if (gpuVendor === "Intel") actionUrl = "https://www.intel.com/content/www/us/en/download-center/home.html";

          return {
            name,
            gpuVendor,
            gpuType,
            driverStatus: "Unknown" as const,
            runtimeRequirementMessage: gpuVendor === "AMD" ? "Vulkan is recommended for AMD GPUs on Windows." : "Make sure your graphics drivers are up to date.",
            runtimeRequirementActionUrl: actionUrl,
            totalVramGb: null,
            usedVramGb: null,
            utilPercent: null,
            temperatureC: null,
            supportsGpuRuntime: true
          };
        }
      } catch {
        // Fallback to default
      }
    }

    return {
      name: null,
      gpuVendor: "Unknown" as const,
      gpuType: "Unknown" as const,
      driverStatus: "Missing" as const,
      runtimeRequirementMessage: "No compatible GPU detected. Verdicta will fall back to slower CPU execution.",
      runtimeRequirementActionUrl: null,
      totalVramGb: null,
      usedVramGb: null,
      utilPercent: null,
      temperatureC: this.readGpuTemperature(),
      supportsGpuRuntime: false
    };
  }

  private readNvidiaGpu() {
    try {
      const output = execFileSync(
        "nvidia-smi",
        [
          "--query-gpu=name,memory.total,memory.used,temperature.gpu,utilization.gpu",
          "--format=csv,noheader,nounits"
        ],
        { encoding: "utf8" }
      ).trim();
      if (!output) {
        return null;
      }
      const [name, totalMb, usedMb, temperature, util] = output.split(",").map((value) => value.trim());
      return {
        name,
        totalVramGb: round1(Number(totalMb) / 1024),
        usedVramGb: round1(Number(usedMb) / 1024),
        utilPercent: Number.isFinite(Number(util)) ? Number(util) : null,
        temperatureC: Number.isFinite(Number(temperature)) ? Number(temperature) : null
      };
    } catch {
      return null;
    }
  }

  private readCpuTemperature() {
    const zones = ["/sys/class/thermal/thermal_zone0/temp", "/sys/class/hwmon/hwmon0/temp1_input", "/sys/class/hwmon/hwmon1/temp1_input"];
    for (const zone of zones) {
      const value = readText(zone);
      if (value && Number.isFinite(Number(value))) {
        const numeric = Number(value);
        return numeric > 1000 ? round1(numeric / 1000) : numeric;
      }
    }
    return null;
  }

  private readGpuTemperature() {
    try {
      if (process.platform !== "linux") return null;
      const drmPath = "/sys/class/drm";
      if (!fs.existsSync(drmPath)) return null;
      const cards = fs.readdirSync(drmPath).filter((c) => c.startsWith("card"));
      for (const card of cards) {
        const hwmonPath = path.join(drmPath, card, "device", "hwmon");
        if (fs.existsSync(hwmonPath)) {
          const hwmons = fs.readdirSync(hwmonPath);
          for (const hwmon of hwmons) {
            const tempInputPath = path.join(hwmonPath, hwmon, "temp1_input");
            if (fs.existsSync(tempInputPath)) {
              const value = readText(tempInputPath);
              if (value && Number.isFinite(Number(value))) {
                const numeric = Number(value);
                return numeric > 1000 ? round1(numeric / 1000) : numeric;
              }
            }
          }
        }
      }
    } catch {}
    return null;
  }

  private readProcessUsage(pid: number) {
    try {
      const output = execFileSync("ps", ["-p", String(pid), "-o", "%cpu=,rss="], { encoding: "utf8" }).trim();
      const [cpuPercentText, rssKbText] = output.split(/\s+/);
      const cpuPercent = Number(cpuPercentText);
      const rssKb = Number(rssKbText);
      return {
        cpuPercent: Number.isFinite(cpuPercent) ? cpuPercent : null,
        rssGb: Number.isFinite(rssKb) ? round1(rssKb / (1024 ** 2)) : null
      };
    } catch {
      return null;
    }
  }

  private updateTokenRateFromLogs(text: string) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:tok\/s|tokens\/s)/i);
    if (match) {
      this.lastTokenRate = Number(match[1]);
    }
  }

  private async fetchLatestRuntimeRelease(): Promise<{
    assets: Array<{ name: string; browser_download_url: string; size?: number }>;
  }> {
    const response = await fetch(LLAMA_CPP_RELEASE_API, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Verdicta"
      }
    });
    if (!response.ok) {
      throw new Error(`Could not fetch llama.cpp runtime release metadata: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as {
      assets: Array<{ name: string; browser_download_url: string; size?: number }>;
    };
  }

  private selectRuntimeAsset(assets: Array<{ name: string; browser_download_url: string; size?: number }>) {
    const platform = process.platform;
    const arch = process.arch === "x64" ? "x64" : process.arch;
    const prefersGpu = this.getSystemProfile().supportsGpuRuntime;

    const scored = assets
      .map((asset) => {
        const name = asset.name.toLowerCase();
        let score = 0;
        if (platform === "linux" && (name.includes("linux") || name.includes("ubuntu"))) score += 10;
        if (platform === "darwin" && (name.includes("mac") || name.includes("darwin"))) score += 10;
        if (platform === "win32" && (name.includes("win") || name.includes("windows"))) score += 10;
        if (name.includes(arch)) score += 5;
        if (prefersGpu && name.includes("vulkan")) score += 4;
        if (!prefersGpu && !name.includes("vulkan") && !name.includes("cuda")) score += 3;
        if (name.includes("server")) score += 2;
        if (name.endsWith(".tar.gz") || name.endsWith(".zip")) score += 1;
        return { asset, score };
      })
      .sort((left, right) => right.score - left.score);

    return scored[0]?.score ? scored[0].asset : null;
  }

  private extractArchive(archivePath: string, targetDir: string) {
    if (archivePath.endsWith(".tar.gz") || archivePath.endsWith(".tgz")) {
      execFileSync("tar", ["-xzf", archivePath, "-C", targetDir]);
      return;
    }
    if (archivePath.endsWith(".zip")) {
      execFileSync("unzip", ["-o", archivePath, "-d", targetDir]);
      return;
    }
    throw new Error("Unsupported runtime archive format.");
  }

  private findRuntimeBinary(rootDir: string): string | null {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(rootDir, entry.name);
      if (entry.isDirectory()) {
        const nested = this.findRuntimeBinary(fullPath);
        if (nested) {
          return nested;
        }
      }
      if (entry.isFile() && (entry.name === "llama-server" || entry.name === "llama-server.exe")) {
        return fullPath;
      }
    }
    return null;
  }
}
