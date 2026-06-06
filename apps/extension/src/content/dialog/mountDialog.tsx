import React from "react";
import { createRoot } from "react-dom/client";
import { QuickAskDialog } from "./QuickAskDialog";
import { getDialogStyles } from "./styles";
import type { PageContextPayload } from "@shared/protocol";

const HOST_ID = "quip-ai-root";

interface MountProps {
  selectedText: string;
  initialContext: PageContextPayload;
}

export function mountQuickAskDialog(props: MountProps) {
  const existing = document.getElementById(HOST_ID);
  if (existing) {
    existing.remove();
  }

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

  function handleClose() {
    root.unmount();
    host.remove();
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
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();
}
