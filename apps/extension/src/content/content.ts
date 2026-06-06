import { getSelectedText } from "./selection";
import { extractPageContext } from "./contextExtractor";
import {
  mountQuickAskDialog,
  unmountQuickAskDialog,
} from "./dialog/mountDialog";
import type { OpenQuickAskMessage } from "@shared/protocol";
import { getStoredSettings } from "../shared/settings";

chrome.runtime.onMessage.addListener((message: OpenQuickAskMessage) => {
  if (message.type !== "OPEN_QUICK_ASK") return;

  getStoredSettings().then((settings) => {
    const hostname = window.location.hostname;
    const isBlocked = settings.blockedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
    if (isBlocked) return;

    const existing = document.getElementById("quip-ai-root");
    if (existing) {
      unmountQuickAskDialog();
      return;
    }

    const selectedText =
      getSelectedText() || message.selectedTextFromMenu || "";

    const extractedContext = extractPageContext({ selectedText });
    const initialContext =
      settings.contextMode === "selected-only"
        ? {
            ...extractedContext,
            nearbyText: undefined,
            visibleText: undefined,
            headings: undefined,
          }
        : extractedContext;

    mountQuickAskDialog({
      selectedText,
      initialContext,
    });
  });
});
