import { DEFAULT_API_URL, FREE_REQUEST_LIMIT, STORAGE_KEYS } from "./constants";

export type LlmProvider = "openai" | "anthropic";

export interface QuipSettings {
  apiUrl: string;
  quipApiKey: string;
  contextMode: "full" | "selected-only";
  blockedDomains: string[];
  useOwnKey: boolean;
  provider: LlmProvider;
  model: string;
  llmApiKey: string;
}

export interface UsageStatus {
  limit: number;
  used: number;
  remaining: number;
}

export const DEFAULT_SETTINGS: QuipSettings = {
  apiUrl: DEFAULT_API_URL,
  quipApiKey: "",
  contextMode: "full",
  blockedDomains: [],
  useOwnKey: false,
  provider: "openai",
  model: "",
  llmApiKey: "",
};

export const DEFAULT_USAGE: UsageStatus = {
  limit: FREE_REQUEST_LIMIT,
  used: 0,
  remaining: FREE_REQUEST_LIMIT,
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

export function getOrCreateClientId(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve(crypto.randomUUID());
      return;
    }

    chrome.storage.local.get(STORAGE_KEYS.clientId, (result) => {
      const existing = result[STORAGE_KEYS.clientId];
      if (typeof existing === "string" && existing) {
        resolve(existing);
        return;
      }

      const clientId = crypto.randomUUID();
      chrome.storage.local.set({ [STORAGE_KEYS.clientId]: clientId }, () => {
        resolve(clientId);
      });
    });
  });
}

export function getStoredUsage(): Promise<UsageStatus> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve(DEFAULT_USAGE);
      return;
    }

    chrome.storage.local.get(STORAGE_KEYS.usage, (result) => {
      resolve({
        ...DEFAULT_USAGE,
        ...(result[STORAGE_KEYS.usage] || {}),
      });
    });
  });
}

export function storeUsage(usage: UsageStatus): void {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.set({ [STORAGE_KEYS.usage]: usage });
  }
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
    return "Enter a valid Quip API URL.";
  }

  if (url.username || url.password) {
    return "The Quip API URL cannot contain embedded credentials.";
  }

  const isLocalhost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";

  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalhost)) {
    return "Use HTTPS for remote Quip API servers.";
  }

  return null;
}
