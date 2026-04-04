# Provider System

Verdicta uses an internal provider abstraction in `packages/ai`.

## Required provider interface

- `listModels()`
- `generateText()`
- `streamText()`
- `embedText()`
- `healthCheck()`

## Built-in providers

- OpenAI-compatible endpoints
- Ollama
- Anthropic-compatible endpoints

## Adding a provider

1. Implement `AiProvider`.
2. Register the adapter in the provider registry.
3. Add any configuration fields needed in settings.
4. Test through the typed IPC `providers:test` flow before using it in research or drafting.
