export const LLM_PROVIDERS = ["openai", "anthropic", "local"] as const;

export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  local: "llama3.2",
};

export const DEFAULT_LOCAL_BASE_URL = "http://127.0.0.1:11434/v1";

export function getDefaultModel(provider: LlmProvider): string {
  return DEFAULT_MODELS[provider];
}

export function isLoopbackModelUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const isLoopback =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]";
    return (
      isLoopback &&
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function normalizeLocalBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}
