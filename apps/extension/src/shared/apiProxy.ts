import type {
  QuipApiProxyRequest,
  QuipApiProxyResponse,
  QuipApiStreamEvent,
  QuipApiStreamRequest,
} from "@shared/protocol";

const API_STREAM_PORT = "quip-api-stream";

export async function proxyApiRequest(
  request: Omit<QuipApiProxyRequest, "type">,
): Promise<QuipApiProxyResponse> {
  const response = (await chrome.runtime.sendMessage({
    type: "QUIP_API_PROXY_REQUEST",
    ...request,
  } satisfies QuipApiProxyRequest)) as QuipApiProxyResponse | undefined;

  if (!response) {
    throw new Error("The Quip extension service worker did not respond.");
  }
  if (response.networkError) throw new Error(response.networkError);
  return response;
}

export function proxyApiStream(
  request: Omit<QuipApiStreamRequest, "type">,
  onData: (data: string) => void,
): Promise<Omit<QuipApiProxyResponse, "networkError">> {
  return new Promise((resolve, reject) => {
    const port = chrome.runtime.connect({ name: API_STREAM_PORT });
    let response:
      | Omit<QuipApiProxyResponse, "body" | "networkError">
      | undefined;
    let body = "";
    let completed = false;

    port.onMessage.addListener((message: QuipApiStreamEvent) => {
      if (message.type === "response") {
        response = message;
      } else if (message.type === "data") {
        onData(message.data);
      } else if (message.type === "body") {
        body += message.body;
      } else if (message.type === "error") {
        completed = true;
        port.disconnect();
        reject(new Error(message.message));
      } else if (message.type === "done") {
        completed = true;
        port.disconnect();
        if (!response) {
          reject(new Error("The Quip API returned no response metadata."));
          return;
        }
        resolve({ ...response, body });
      }
    });

    port.onDisconnect.addListener(() => {
      if (!completed) {
        reject(new Error("The Quip API connection closed unexpectedly."));
      }
    });

    port.postMessage({
      type: "QUIP_API_STREAM_REQUEST",
      ...request,
    } satisfies QuipApiStreamRequest);
  });
}
