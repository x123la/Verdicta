import { useEffect, useMemo, useState } from "react";
import { Card } from "@verdicta/ui";
import { Input } from "@/components/ui/input";
import { ProviderConfigForm } from "@/components/settings/provider-config-form";
import { ProviderStatusCard } from "@/components/settings/provider-status-card";
import { useSaveSettings, useSettings } from "@/hooks/use-verdicta-query";
import { invokeIpc } from "@/lib/ipc";
import type { ProviderConfig } from "@verdicta/shared";

export const SettingsScreen = () => {
  const { data: settings, refetch } = useSettings();
  const saveSettings = useSaveSettings();
  const [testMessage, setTestMessage] = useState("");
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
              isEnabled: true
            }
          ],
    [settings]
  );
  const [draftSettings, setDraftSettings] = useState(settings);

  useEffect(() => {
    if (settings) {
      setDraftSettings(settings);
    }
  }, [settings]);

  return (
    <div className="space-y-4">
      <Card className="space-y-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Settings</div>
          <h1 className="mt-2 text-2xl font-semibold">Providers, privacy, and defaults</h1>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/50 p-5">
              <Input
                value={draftSettings?.defaultModelProvider ?? ""}
                onChange={(event) =>
                  setDraftSettings((current) =>
                    current
                      ? {
                          ...current,
                          defaultModelProvider: event.target.value
                        }
                      : current
                  )
                }
                placeholder="Default provider"
              />
              <Input
                value={draftSettings?.defaultModelName ?? ""}
                onChange={(event) =>
                  setDraftSettings((current) =>
                    current
                      ? {
                          ...current,
                          defaultModelName: event.target.value
                        }
                      : current
                  )
                }
                placeholder="Default model"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-border/70 px-4 py-2 text-sm"
                  onClick={async () => {
                    if (!draftSettings) return;
                    await saveSettings.mutateAsync(draftSettings);
                    await refetch();
                  }}
                >
                  Save defaults
                </button>
              </div>
            </div>
            {providerConfigs.map((providerConfig) => (
              <ProviderConfigForm
                key={providerConfig.id}
                config={
                  draftSettings?.providerConfigs.find((item) => item.id === providerConfig.id) ?? providerConfig
                }
                onChange={(nextConfig) =>
                  setDraftSettings((current) =>
                    current
                      ? {
                          ...current,
                          providerConfigs: current.providerConfigs.map((item) =>
                            item.id === nextConfig.id ? nextConfig : item
                          )
                        }
                      : current
                  )
                }
                onSave={async () => {
                  if (!draftSettings) return;
                  await saveSettings.mutateAsync({
                    providerConfigs: draftSettings.providerConfigs
                  });
                  await refetch();
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
            {testMessage ? <ProviderStatusCard label="Connection test" value={testMessage} /> : null}
          </div>
        </div>
      </Card>
    </div>
  );
};
