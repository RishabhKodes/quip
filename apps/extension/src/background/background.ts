chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-ai-selection",
    title: "Ask Quip about this",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "ask-ai-selection") return;
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "OPEN_QUICK_ASK",
      source: "context-menu",
      selectedTextFromMenu: info.selectionText,
    });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await chrome.tabs.sendMessage(tab.id, {
      type: "OPEN_QUICK_ASK",
      source: "context-menu",
      selectedTextFromMenu: info.selectionText,
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-quick-ask") return;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "OPEN_QUICK_ASK",
      source: "keyboard",
    });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await chrome.tabs.sendMessage(tab.id, {
      type: "OPEN_QUICK_ASK",
      source: "keyboard",
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "OPEN_QUICK_ASK",
      source: "action-button",
    });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await chrome.tabs.sendMessage(tab.id, {
      type: "OPEN_QUICK_ASK",
      source: "action-button",
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "OPEN_QUIP_SETTINGS") {
    chrome.runtime.openOptionsPage();
  }
});
