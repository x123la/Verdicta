import { useMemo, useState } from "react";
import { Card } from "@verdicta/ui";
import { ProviderConfigForm } from "@/components/settings/provider-config-form";
import { ProviderStatusCard } from "@/components/settings/provider-status-card";
import { useSaveSettings, useSettings } from "@/hooks/use-verdicta-query";
import { invokeIpc } from "@/lib/ipc";
import type { ProviderConfig } from "@verdicta/shared";

export const SettingsScreen = () => {
  const { data: settings, refetch } = useSettings();
  const saveSettings = useSaveSettings();
  const [testMessage, setTestMessage] = useState("");
  const [draftSettings, setDraftSettings] = useState(settings);

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
    <div className="space-y-4">
      <Card className="space-y-6">
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
    </div>
  );
};
