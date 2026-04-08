import { z } from "zod";

export const localModelFileSchema = z.object({
  fileName: z.string(),
  quantization: z.string(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  downloadUrl: z.string().url()
});

export const localModelCatalogEntrySchema = z.object({
  repoId: z.string(),
  name: z.string(),
  author: z.string().nullable(),
  publisher: z.string().nullable().optional(),
  family: z.string().nullable().optional(),
  architecture: z.string().nullable().optional(),
  summary: z.string().nullable(),
  downloads: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  updatedAt: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  files: z.array(localModelFileSchema).default([]),
  capabilities: z.array(z.string()).default([]),
  modalities: z.array(z.string()).default([]),
  useCases: z.array(z.string()).default([]),
  collections: z.array(z.string()).default([]),
  featuredCategory: z.string().nullable().optional(),
  parameterLabel: z.string().nullable().optional(),
  parameterCountBillions: z.number().positive().nullable().optional(),
  contextWindowTokens: z.number().int().positive().nullable().optional(),
  license: z.string().nullable().optional(),
  homepage: z.string().url().nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  recommendedQuantization: z.string().nullable().optional(),
  recommendationReason: z.string().nullable().optional(),
  fitNotes: z.string().nullable().optional(),
  strengths: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  benchmarkNote: z.string().nullable().optional(),
  benchmarkArenaElo: z.number().nonnegative().nullable().optional(),
  benchmarkMmlu: z.number().nonnegative().nullable().optional(),
  benchmarkGsm8k: z.number().nonnegative().nullable().optional(),
  benchmarkHumanEval: z.number().nonnegative().nullable().optional(),
  benchmarkTokensPerSecond: z.number().nonnegative().nullable().optional(),
  minimumRamGb: z.number().nullable().optional(),
  recommendedRamGb: z.number().nullable().optional(),
  minimumVramGb: z.number().nullable().optional(),
  recommendedVramGb: z.number().nullable().optional()
});

export const installedLocalModelSchema = z.object({
  id: z.string(),
  repoId: z.string(),
  displayName: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  quantization: z.string(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  installedAt: z.string(),
  sourceDownloadUrl: z.string().url()
});

export const localRuntimeConfigSchema = z.object({
  runtimePath: z.string().nullable(),
  selectedModelId: z.string().nullable(),
  contextSize: z.number().int().min(512).max(131072),
  gpuLayers: z.number().int().min(0).max(999),
  threadCount: z.number().int().min(1).max(256),
  batchSize: z.number().int().min(1).max(8192),
  microBatchSize: z.number().int().min(1).max(4096),
  topK: z.number().int().min(1).max(200),
  minP: z.number().min(0).max(1),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  repeatPenalty: z.number().min(0.5).max(2),
  frequencyPenalty: z.number().min(-2).max(2),
  presencePenalty: z.number().min(-2).max(2),
  maxTokens: z.number().int().min(32).max(32768),
  seed: z.number().int().min(-1).max(2147483647),
  useGpu: z.boolean(),
  flashAttention: z.boolean(),
  offloadKqv: z.boolean(),
  useMmap: z.boolean(),
  useMlock: z.boolean(),
  keepModelWarm: z.boolean()
});

export const localRuntimeStatusSchema = z.object({
  available: z.boolean(),
  backend: z.literal("llama.cpp"),
  detectedRuntimePath: z.string().nullable(),
  message: z.string(),
  config: localRuntimeConfigSchema,
  installedModels: z.array(installedLocalModelSchema).default([])
});

export const localRuntimeInstallStatusSchema = z.object({
  state: z.enum(["not-installed", "installing", "installed", "error"]),
  downloadUrl: z.string().url().nullable(),
  assetName: z.string().nullable(),
  bytesDownloaded: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative().nullable(),
  progressPercent: z.number().min(0).max(100),
  message: z.string(),
  lastError: z.string().nullable()
});

export const localDownloadQueueItemSchema = z.object({
  id: z.string(),
  kind: z.enum(["runtime", "model"]),
  label: z.string(),
  repoId: z.string().nullable(),
  fileName: z.string().nullable(),
  status: z.enum(["queued", "downloading", "extracting", "completed", "failed"]),
  progressPercent: z.number().min(0).max(100),
  bytesDownloaded: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative().nullable(),
  speedBytesPerSecond: z.number().nonnegative().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  finishedAt: z.string().nullable(),
  lastError: z.string().nullable()
});

export const localSystemProfileSchema = z.object({
  os: z.string(),
  arch: z.string(),
  cpuModel: z.string(),
  cpuCores: z.number().int().nonnegative(),
  totalRamGb: z.number().nonnegative(),
  availableRamGb: z.number().nonnegative(),
  gpuName: z.string().nullable(),
  totalVramGb: z.number().nonnegative().nullable(),
  supportsGpuRuntime: z.boolean(),
  recommendation: z.string(),
  gpuVendor: z.enum(["NVIDIA", "AMD", "Apple", "Intel", "Unknown"]).default("Unknown"),
  gpuType: z.enum(["Integrated", "Dedicated", "Unknown"]).default("Unknown"),
  driverStatus: z.enum(["Installed", "Missing", "Unknown"]).default("Unknown"),
  runtimeRequirementMessage: z.string().nullable().default(null),
  runtimeRequirementActionUrl: z.string().url().nullable().default(null),
  cpuCoresMetadata: z.array(
    z.object({
      coreId: z.number().int(),
      model: z.string(),
      speedMHz: z.number()
    })
  ).default([])
});

export const localTelemetrySchema = z.object({
  tokensPerSecond: z.number().nonnegative().nullable(),
  cpuPercent: z.number().min(0).max(100).nullable(),
  ramUsedGb: z.number().nonnegative().nullable(),
  ramPercent: z.number().min(0).max(100).nullable(),
  vramUsedGb: z.number().nonnegative().nullable(),
  vramPercent: z.number().min(0).max(100).nullable(),
  gpuUtilPercent: z.number().min(0).max(100).nullable(),
  cpuTemperatureC: z.number().nullable(),
  gpuTemperatureC: z.number().nullable(),
  activeModelId: z.string().nullable(),
  backend: z.literal("llama.cpp")
});

export type LocalModelCatalogEntry = z.infer<typeof localModelCatalogEntrySchema>;
export type LocalModelFile = z.infer<typeof localModelFileSchema>;
export type InstalledLocalModel = z.infer<typeof installedLocalModelSchema>;
export type LocalRuntimeConfig = z.infer<typeof localRuntimeConfigSchema>;
export type LocalRuntimeStatus = z.infer<typeof localRuntimeStatusSchema>;
export type LocalRuntimeInstallStatus = z.infer<typeof localRuntimeInstallStatusSchema>;
export type LocalDownloadQueueItem = z.infer<typeof localDownloadQueueItemSchema>;
export type LocalSystemProfile = z.infer<typeof localSystemProfileSchema>;
export type LocalTelemetry = z.infer<typeof localTelemetrySchema>;
