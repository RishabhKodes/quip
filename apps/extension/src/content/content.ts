import { getSelectedText } from "./selection";
import { extractPageContext } from "./contextExtractor";
import {
  mountQuickAskDialog,
  unmountQuickAskDialog,
} from "./dialog/mountDialog";
import type { OpenQuickAskMessage } from "@shared/protocol";
import { getStoredSettings } from "../shared/settings";

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isOpenQuickAskMessage(message)) return;

  getStoredSettings().then((settings) => {
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
            chunks: undefined,
          }
        : extractedContext;

    mountQuickAskDialog({
      selectedText,
      initialContext,
    });
  });
});

function isOpenQuickAskMessage(
  message: unknown,
): message is OpenQuickAskMessage {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<OpenQuickAskMessage>;
  return (
    candidate.type === "OPEN_QUICK_ASK" &&
    (candidate.source === "keyboard" ||
      candidate.source === "context-menu" ||
      candidate.source === "action-button")
  );
}
