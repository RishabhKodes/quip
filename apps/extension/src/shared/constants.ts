declare const __QUIP_DEFAULT_API_URL__: string;

export const STORAGE_KEYS = {
  settings: "quipSettings",
  clientId: "quipClientId",
  usage: "quipUsage",
} as const;

export const DEFAULT_API_URL = __QUIP_DEFAULT_API_URL__;
export const FREE_REQUEST_LIMIT = 10;
