export type ThemeMode = "dark" | "light" | "system";

export type ChatMode =
  | "research"
  | "case-brief"
  | "jurisprudence-comparison"
  | "drafting"
  | "review"
  | "study";

export type DraftType =
  | "case-brief"
  | "legal-memo"
  | "argument-section"
  | "study-summary"
  | "class-note-summary";

export type VerificationStatus = "verified" | "partial" | "unsupported" | "pending";

export type ExtractionStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "ocr_required";

export type ProviderKind =
  | "local"
  | "openai-compatible"
  | "anthropic-compatible"
  | "ollama"
  | "lm-studio";

export type WorkspaceTab =
  | "overview"
  | "sources"
  | "chat"
  | "authorities"
  | "notes"
  | "drafts"
  | "timeline";

export type SupportLevel = "direct" | "inference" | "weak";

export type DocumentViewerMode = "pdf" | "text";
