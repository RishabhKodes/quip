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
  return `${apiUrl.trim().replace(/\/+$/, "")}/api`;
}
