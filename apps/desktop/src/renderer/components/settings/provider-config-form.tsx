import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProviderConfig } from "@verdicta/shared";

export const ProviderConfigForm = ({
  config,
  onChange,
  onSave,
  onTest
}: {
  config: ProviderConfig;
  onChange: (config: ProviderConfig) => void;
  onSave: () => void;
  onTest: () => void;
}) => (
  <div className="rounded-2xl border border-border/70 bg-background/50 p-5">
    <div className="text-sm font-medium">{config.providerName}</div>
    <div className="mt-3 space-y-3">
      <Input
        value={config.baseUrl ?? ""}
        onChange={(event) => onChange({ ...config, baseUrl: event.target.value || null })}
        placeholder="Provider base URL"
      />
      <Input
        value={config.encryptedApiKey ?? ""}
        onChange={(event) => onChange({ ...config, encryptedApiKey: event.target.value || null })}
        placeholder="API key"
      />
      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={config.isEnabled}
          onChange={(event) => onChange({ ...config, isEnabled: event.target.checked })}
        />
        Provider enabled
      </label>
      <div className="flex gap-3">
        <Button onClick={onSave}>Save</Button>
        <Button onClick={onTest}>Test connection</Button>
      </div>
    </div>
  </div>
);
