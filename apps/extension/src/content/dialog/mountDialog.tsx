import React from "react";
import { createRoot } from "react-dom/client";
import { QuickAskDialog } from "./QuickAskDialog";
import { getDialogStyles } from "./styles";
import type { PageContextPayload } from "@shared/protocol";

const HOST_ID = "quip-ai-root";
let mountedRoot: ReturnType<typeof createRoot> | null = null;
let mountedHost: HTMLElement | null = null;

interface MountProps {
  selectedText: string;
  initialContext: PageContextPayload;
}

export function mountQuickAskDialog(props: MountProps) {
  unmountQuickAskDialog();

  // Shadow DOM isolates styles, but keyboard events still reach the page's
  // capture listeners. A separate document keeps page shortcuts out of Quip.
  const host = document.createElement("iframe");
  host.id = HOST_ID;
  host.title = "quip";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "100vw";
  host.style.height = "100vh";
  host.style.zIndex = "2147483647";
  host.style.border = "0";
  host.style.colorScheme = "light";
  document.documentElement.appendChild(host);

  const dialogDocument = host.contentDocument;
  if (!dialogDocument) {
    host.remove();
    return;
  }
  dialogDocument.title = "quip";

  const container = dialogDocument.createElement("div");
  dialogDocument.body.appendChild(container);
  const shadow = container.attachShadow({ mode: "open" });

  const styleEl = dialogDocument.createElement("style");
  styleEl.textContent = getDialogStyles();
  shadow.appendChild(styleEl);

  const app = dialogDocument.createElement("div");
  app.style.pointerEvents = "auto";
  shadow.appendChild(app);

  const root = createRoot(app);
  mountedRoot = root;
  mountedHost = host;

  function handleClose() {
    unmountQuickAskDialog();
  }

  root.render(
    <QuickAskDialog
      selectedText={props.selectedText}
      initialContext={props.initialContext}
      onClose={handleClose}
    />,
  );
}

export function unmountQuickAskDialog() {
  const root = mountedRoot;
  const host = mountedHost;
  mountedRoot = null;
  mountedHost = null;

  root?.unmount();
  host?.remove();

  const untrackedHost = document.getElementById(HOST_ID);
  if (untrackedHost) untrackedHost.remove();
}
