# Security

## Renderer restrictions

- `contextIsolation` enabled
- `sandbox` enabled
- `nodeIntegration` disabled
- strict CSP on renderer HTML
- no raw shell or filesystem exposure

## Main-process responsibilities

- Filesystem access
- database writes
- ingestion
- provider calls
- secrets handling

## Secrets

- API keys are encrypted with Electron `safeStorage` when available.
- If encryption is unavailable, the app can still store provider config but should surface the degraded state in settings.

## Logging

- Logging utilities are designed to redact obvious secret fields such as API keys and authorization headers before output.
