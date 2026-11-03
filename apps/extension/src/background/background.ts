import type {
  OpenQuickAskMessage,
  QuipApiProxyRequest,
  QuipApiProxyResponse,
  QuipApiStreamEvent,
  QuipApiStreamRequest,
} from "@shared/protocol";

const API_STREAM_PORT = "quip-api-stream";

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: "ask-ai-selection",
    title: "Ask Quip about this",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "ask-ai-selection") return;
  await openQuipInTab(tab, {
    type: "OPEN_QUICK_ASK",
    source: "context-menu",
    selectedTextFromMenu: info.selectionText,
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-quick-ask") return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  await openQuipInTab(tab, {
    type: "OPEN_QUICK_ASK",
    source: "keyboard",
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "OPEN_QUIP_SETTINGS") {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (isApiProxyRequest(message)) {
    void proxyApiRequest(message).then(sendResponse);
    return true;
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== API_STREAM_PORT) return;

  const controller = new AbortController();
  port.onDisconnect.addListener(() => controller.abort());
  port.onMessage.addListener((message: unknown) => {
    if (!isApiStreamRequest(message)) return;
    void proxyApiStream(port, message, controller.signal);
  });
});

async function openQuipInTab(
  tab: chrome.tabs.Tab | undefined,
  message: OpenQuickAskMessage,
): Promise<void> {
  if (!tab?.id || !tab.url || !/^https?:\/\//i.test(tab.url)) return;

  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      // Chrome blocks script injection on internal and restricted pages.
    }
  }
}

async function proxyApiRequest(
  request: QuipApiProxyRequest,
): Promise<QuipApiProxyResponse> {
  try {
    assertHttpUrl(request.url);
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      ...(request.body ? { body: request.body } : {}),
    });
    return {
      ok: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    };
  } catch {
    return {
      ok: false,
      status: 0,
      headers: {},
      body: "",
      networkError: getConnectionError(request.url),
    };
  }
}

async function proxyApiStream(
  port: chrome.runtime.Port,
  request: QuipApiStreamRequest,
  signal: AbortSignal,
): Promise<void> {
  try {
    assertHttpUrl(request.url);
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      ...(request.body ? { body: request.body } : {}),
      signal,
    });
    postStreamEvent(port, {
      type: "response",
      ok: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      postStreamEvent(port, { type: "body", body: await response.text() });
      postStreamEvent(port, { type: "done" });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("The API response did not include a body.");
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      const data = decoder.decode(value, { stream: !done });
      if (data) postStreamEvent(port, { type: "data", data });
      if (done) break;
    }
    postStreamEvent(port, { type: "done" });
  } catch (error) {
    if (signal.aborted) return;
    const specificMessage =
      error instanceof Error &&
      (error.message === "Unsupported API URL protocol." ||
        error.message === "The API response did not include a body.")
        ? error.message
        : undefined;
    postStreamEvent(port, {
      type: "error",
      message: specificMessage || getConnectionError(request.url),
    });
  }
}

function postStreamEvent(
  port: chrome.runtime.Port,
  event: QuipApiStreamEvent,
): void {
  try {
    port.postMessage(event);
  } catch {
    // The dialog may have closed while the request was active.
  }
}

function isApiProxyRequest(message: unknown): message is QuipApiProxyRequest {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<QuipApiProxyRequest>;
  return (
    candidate.type === "QUIP_API_PROXY_REQUEST" &&
    typeof candidate.url === "string" &&
    (candidate.method === "GET" || candidate.method === "POST") &&
    Boolean(candidate.headers && typeof candidate.headers === "object")
  );
}

function isApiStreamRequest(message: unknown): message is QuipApiStreamRequest {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<QuipApiStreamRequest>;
  return (
    candidate.type === "QUIP_API_STREAM_REQUEST" &&
    typeof candidate.url === "string" &&
    (candidate.method === "GET" || candidate.method === "POST") &&
    Boolean(candidate.headers && typeof candidate.headers === "object")
  );
}

function assertHttpUrl(value: string): void {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported API URL protocol.");
  }
}

function getConnectionError(value: string): string {
  try {
    const url = new URL(value);
    const isLocal =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]";
    if (isLocal) {
      return `Could not reach the Quip API at ${url.origin}. Start it with \`pnpm dev:api\` and verify the API URL in settings.`;
    }
  } catch {
    // The URL validator in the UI will provide the specific format error.
  }
  return "Could not reach the Quip API. Verify the API URL and network connection.";
}
