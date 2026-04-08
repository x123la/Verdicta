import { useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Card } from "@verdicta/ui";
import { ProviderConfigForm } from "@/components/settings/provider-config-form";
import { ProviderStatusCard } from "@/components/settings/provider-status-card";
import { useLocalSystemProfile, useLocalTelemetry, useSaveSettings, useSettings } from "@/hooks/use-verdicta-query";
import { invokeIpc } from "@/lib/ipc";
import type { ProviderConfig } from "@verdicta/shared";

export const SettingsScreen = () => {
  const { data: settings, refetch } = useSettings();
  const saveSettings = useSaveSettings();
  const [testMessage, setTestMessage] = useState("");
  const [draftSettings, setDraftSettings] = useState(settings);
  const { data: systemProfile } = useLocalSystemProfile();
  const { data: telemetry } = useLocalTelemetry();

  const providerConfigs = useMemo<ProviderConfig[]>(
    () =>
      settings?.providerConfigs.length
        ? settings.providerConfigs
        : [
            {
              id: "provider_ollama",
              providerName: "ollama",
              baseUrl: "http://127.0.0.1:11434/v1",
              encryptedApiKey: null,
              isEnabled: false
            }
          ],
    [settings]
  );

  const effectiveDraftSettings =
    draftSettings && !draftSettings.providerConfigs.length
      ? {
          ...draftSettings,
          providerConfigs
        }
      : draftSettings;

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Settings</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">System & AI Providers</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Manage integrations, defaults, and review your live telemetry and hardware profiling.
        </p>
      </div>

      <Tabs.Root defaultValue="hardware" className="flex flex-col gap-6">
        <Tabs.List className="flex shrink-0 w-full items-center gap-4 border-b border-border/60 pb-2">
          <Tabs.Trigger value="hardware" className="relative px-2 py-1 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground data-[state=active]:text-foreground after:absolute after:-bottom-[9px] after:left-0 after:h-[2px] after:w-full after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100">
            Telemetry & Hardware
          </Tabs.Trigger>
          <Tabs.Trigger value="providers" className="relative px-2 py-1 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground data-[state=active]:text-foreground after:absolute after:-bottom-[9px] after:left-0 after:h-[2px] after:w-full after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100">
            API Providers & Defaults
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="providers" className="outline-none">
          <Card className="space-y-6 border border-border/70 bg-background/55 p-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Settings</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Privacy, providers, and defaults</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Local AI now lives in its own dedicated workspace. Use this screen for application defaults, privacy posture,
            and optional external provider connectors only.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
          <div className="space-y-4">
            {providerConfigs.map((providerConfig) => (
              <ProviderConfigForm
                key={providerConfig.id}
                config={
                  effectiveDraftSettings?.providerConfigs.find((item: ProviderConfig) => item.id === providerConfig.id) ??
                  providerConfig
                }
                onChange={(nextConfig: ProviderConfig) =>
                  setDraftSettings((current) =>
                    current
                      ? {
                          ...current,
                          providerConfigs: (current.providerConfigs.length ? current.providerConfigs : providerConfigs).map(
                            (item: ProviderConfig) => (item.id === nextConfig.id ? nextConfig : item)
                          )
                        }
                      : current
                  )
                }
                onSave={async () => {
                  if (!effectiveDraftSettings) return;
                  await saveSettings.mutateAsync({
                    providerConfigs: effectiveDraftSettings.providerConfigs
                  });
                  await refetch();
                  setTestMessage(`Saved ${providerConfig.providerName} provider config.`);
                }}
                onTest={async () => {
                  const result = await invokeIpc("providers:test", { providerName: providerConfig.providerName });
                  setTestMessage(result.message);
                }}
              />
            ))}
          </div>

          <div className="grid gap-3">
            <ProviderStatusCard label="Theme" value={settings?.theme ?? "dark"} />
            <ProviderStatusCard label="Citation style" value={settings?.citationStyle ?? "Bluebook"} />
            <ProviderStatusCard label="Local only" value={settings?.localOnly ? "Yes" : "No"} />
            <ProviderStatusCard label="Cloud allowed" value={settings?.cloudAllowed ? "Yes" : "No"} />
            <ProviderStatusCard
              label="Default route"
              value={`${settings?.defaultModelProvider ?? "local"} / ${settings?.defaultModelName ?? "auto"}`}
            />
            {testMessage ? <ProviderStatusCard label="Status" value={testMessage} /> : null}
          </div>
        </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="hardware" className="outline-none">
          <Card className="space-y-6 border border-border/70 bg-background/55 p-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Hardware & Telemetry</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">System hardware profiling</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Verdicta automatically detects your computational hardware to route workloads. Check your current telemetry, live thermal status, and driver health here.
          </p>
          {systemProfile?.runtimeRequirementMessage && (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-xl bg-orange-500/10 px-4 py-3 text-sm text-orange-200 border border-orange-500/20">
              <p>{systemProfile.runtimeRequirementMessage}</p>
              {systemProfile.runtimeRequirementActionUrl && (
                <button
                  type="button"
                  onClick={() =>
                    invokeIpc("system:openExternal", { url: systemProfile.runtimeRequirementActionUrl! })
                  }
                  className="rounded bg-orange-500/20 px-3 py-1.5 text-xs font-semibold hover:bg-orange-500/30 transition-colors"
                >
                  Resolve Driver Setup
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold px-1 text-muted-foreground">Hardware profile</h3>
            <div className="grid gap-2">
              <ProviderStatusCard label="CPU" value={`${systemProfile?.cpuModel ?? "?"} (${systemProfile?.cpuCores ?? "?"} threads)`} />
              <ProviderStatusCard label="System RAM" value={`${telemetry?.ramUsedGb ?? "?"} / ${systemProfile?.totalRamGb ?? "?"} GB`} />
              <ProviderStatusCard label="GPU Model" value={systemProfile?.gpuName ?? "Not detected"} />
              <ProviderStatusCard label="GPU Vendor" value={systemProfile?.gpuVendor ?? "Unknown"} />
              <ProviderStatusCard label="GPU Class" value={systemProfile?.gpuType ?? "Unknown"} />
            </div>
            {systemProfile?.cpuCoresMetadata?.length ? (
              <div className="pt-2">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1">Per-Core Speeds</div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
                  {systemProfile.cpuCoresMetadata.map((c) => (
                    <div key={c.coreId} className="flex justify-between rounded border border-border/40 bg-card/40 px-2 py-1 text-xs">
                      <span className="text-muted-foreground/70">#{c.coreId}</span>
                      <span className="font-medium">{c.speedMHz} MHz</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold px-1 text-muted-foreground">Live telemetry</h3>
            <div className="grid gap-2">
              <ProviderStatusCard label="GPU Driver" value={systemProfile?.driverStatus ?? "Unknown"} />
              <ProviderStatusCard label="VRAM usage" value={`${telemetry?.vramUsedGb ?? 0} / ${systemProfile?.totalVramGb ?? "Shared"} GB`} />
              <ProviderStatusCard label="GPU Usage" value={telemetry?.gpuUtilPercent != null ? `${telemetry.gpuUtilPercent}%` : "Idle / Unavailable"} />
              <ProviderStatusCard label="CPU Temps" value={telemetry?.cpuTemperatureC ? `${telemetry.cpuTemperatureC} °C` : "Unknown"} />
              <ProviderStatusCard label="GPU Temps" value={telemetry?.gpuTemperatureC ? `${telemetry.gpuTemperatureC} °C` : "Unknown"} />
            </div>
          </div>
        </div>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};
