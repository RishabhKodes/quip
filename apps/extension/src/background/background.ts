import type { OpenQuickAskMessage } from "@shared/protocol";

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

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "OPEN_QUIP_SETTINGS") {
    chrome.runtime.openOptionsPage();
  }
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
