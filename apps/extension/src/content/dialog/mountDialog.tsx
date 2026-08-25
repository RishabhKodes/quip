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

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "100vw";
  host.style.height = "100vh";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = getDialogStyles();
  shadow.appendChild(styleEl);

  const app = document.createElement("div");
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
