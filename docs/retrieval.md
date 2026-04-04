# Retrieval

## Flow

1. User selects a workspace and optionally specific sources.
2. Query text is normalized.
3. Candidate document chunks are retrieved from local storage-backed indexes.
4. Results are ranked using baseline metadata and chunk-text relevance.
5. Top passages are assembled into the grounded prompt context.
6. The AI response is stored together with a structured source map.

## Grounding policy

- If no supporting source is found, the answer is labeled ungrounded.
- The system prompt requires separation between direct support, inference, and uncertainty.
- Citation chips in the UI are derived from stored source references, not guessed after the fact.
