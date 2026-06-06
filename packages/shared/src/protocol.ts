export type OpenQuickAskMessage = {
  type: "OPEN_QUICK_ASK";
  source: "keyboard" | "context-menu" | "action-button";
  selectedTextFromMenu?: string;
};

export type OpenQuipSettingsMessage = {
  type: "OPEN_QUIP_SETTINGS";
};

export type QuipRuntimeMessage = OpenQuickAskMessage | OpenQuipSettingsMessage;

export type AskAIRequest = {
  question: string;
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  pageContext: PageContextPayload;
};

export type PageContextPayload = {
  title: string;
  url: string;
  selectedText: string;
  nearbyText?: string;
  visibleText?: string;
  headings?: string[];
  metadata?: Record<string, string>;
  adapter?: string;
};

export type AskAIResponse = {
  answer: string;
  model?: string;
  usageStatus?: {
    limit: number;
    used: number;
    remaining: number;
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};
