export type OpenQuickAskMessage = {
  type: "OPEN_QUICK_ASK";
  source: "keyboard" | "context-menu" | "action-button";
  selectedTextFromMenu?: string;
};

export type OpenQuipSettingsMessage = {
  type: "OPEN_QUIP_SETTINGS";
};

export type QuipRuntimeMessage = OpenQuickAskMessage | OpenQuipSettingsMessage;

export type QuipApiProxyRequest = {
  type: "QUIP_API_PROXY_REQUEST";
  url: string;
  method: "GET" | "POST";
  headers: Record<string, string>;
  body?: string;
};

export type QuipApiProxyResponse = {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  body: string;
  networkError?: string;
};

export type QuipApiStreamRequest = Omit<QuipApiProxyRequest, "type"> & {
  type: "QUIP_API_STREAM_REQUEST";
};

export type QuipApiStreamEvent =
  | {
      type: "response";
      ok: boolean;
      status: number;
      headers: Record<string, string>;
    }
  | { type: "data"; data: string }
  | { type: "body"; body: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type AskAIRequest = {
  question: string;
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  pageContext: PageContextPayload;
};

export type PageContextChunk = {
  kind: "heading" | "paragraph" | "list" | "code" | "table" | "quote";
  text: string;
  heading?: string;
};

export type PageContextPayload = {
  title: string;
  url: string;
  selectedText: string;
  nearbyText?: string;
  visibleText?: string;
  headings?: string[];
  metadata?: Record<string, string>;
  chunks?: PageContextChunk[];
  adapter?: string;
};

export type AskAIResponse = {
  answer: string;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};
