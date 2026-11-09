import { DEFAULT_API_URL, STORAGE_KEYS } from "./constants";
import { DEFAULT_LOCAL_BASE_URL, type LlmProvider } from "@shared/models";

export type { LlmProvider } from "@shared/models";

export interface QuipSettings {
  apiUrl: string;
  quipApiKey: string;
  contextMode: "full" | "selected-only";
  useOwnKey: boolean;
  provider: LlmProvider;
  model: string;
  llmApiKey: string;
  localBaseUrl: string;
}

export const DEFAULT_SETTINGS: QuipSettings = {
  apiUrl: DEFAULT_API_URL,
  quipApiKey: "",
  contextMode: "full",
  useOwnKey: true,
  provider: "openai",
  model: "",
  llmApiKey: "",
  localBaseUrl: DEFAULT_LOCAL_BASE_URL,
};

export function getStoredSettings(): Promise<QuipSettings> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve(DEFAULT_SETTINGS);
      return;
    }

    chrome.storage.local.get(STORAGE_KEYS.settings, (result) => {
      resolve({
        ...DEFAULT_SETTINGS,
        ...(result[STORAGE_KEYS.settings] || {}),
      });
    });
  });
}

export function normalizeApiUrl(apiUrl: string): string {
  const url = new URL(apiUrl.trim());
  const pathname = url.pathname.replace(/\/+$/, "");
  url.pathname = pathname.endsWith("/api") ? pathname : `${pathname}/api`;
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function validateApiUrl(apiUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(apiUrl.trim());
  } catch {
    return "Enter a valid quip API URL.";
  }

  if (url.username || url.password) {
    return "The quip API URL cannot contain embedded credentials.";
  }

  const isLocalhost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";

  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalhost)) {
    return "Use HTTPS for remote quip API servers.";
  }

  return null;
}
