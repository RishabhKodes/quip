import { LIMITS } from "@shared/limits";
import type { PageContextPayload } from "@shared/protocol";
import { getSelectionRange } from "./selection";
import { detectAdapter, extractWithAdapter } from "./pageAdapters/registry";

export function extractPageContext(input: {
  selectedText: string;
}): PageContextPayload {
  const title = document.title || "";
  const url = window.location.href;
  const adapter = detectAdapter(url);

  const adapterContext = extractWithAdapter(adapter, input.selectedText);
  if (adapterContext) {
    return {
      ...adapterContext,
      title,
      url,
      selectedText: input.selectedText.slice(0, LIMITS.selectedTextChars),
      visibleText: adapterContext.visibleText || extractVisibleText(),
    };
  }

  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((h) => h.textContent?.trim())
    .filter(Boolean)
    .slice(0, LIMITS.headingsCount) as string[];

  const nearbyText = extractNearbyText(input.selectedText);
  const visibleText = extractVisibleText();

  return {
    title,
    url,
    selectedText: input.selectedText.slice(0, LIMITS.selectedTextChars),
    nearbyText,
    visibleText,
    headings,
    adapter: "base",
  };
}

function extractNearbyText(selectedText: string): string {
  if (!selectedText) return "";

  const range = getSelectionRange();
  if (range) {
    return extractNearbyFromRange(range);
  }

  const fullText = document.body?.innerText || "";
  const index = fullText.indexOf(selectedText);
  if (index === -1) return "";

  const beforeStart = Math.max(0, index - 4000);
  const afterEnd = Math.min(
    fullText.length,
    index + selectedText.length + 4000,
  );
  return fullText.slice(beforeStart, afterEnd);
}

function extractNearbyFromRange(range: Range): string {
  const container = range.commonAncestorContainer;
  const block = findBlockParent(
    container instanceof Element ? container : container.parentElement,
  );
  if (!block) return "";

  const parts: string[] = [];

  const prev = block.previousElementSibling;
  if (prev) parts.push(prev.textContent?.trim() || "");

  parts.push(block.textContent?.trim() || "");

  const next = block.nextElementSibling;
  if (next) parts.push(next.textContent?.trim() || "");

  return parts.filter(Boolean).join("\n\n").slice(0, LIMITS.nearbyTextChars);
}

function findBlockParent(el: Element | null): Element | null {
  const blockTags = new Set([
    "P",
    "DIV",
    "SECTION",
    "ARTICLE",
    "LI",
    "BLOCKQUOTE",
    "PRE",
    "TD",
    "TH",
    "HEADER",
    "FOOTER",
    "MAIN",
  ]);
  let current = el;
  while (current && current !== document.body) {
    if (blockTags.has(current.tagName)) return current;
    current = current.parentElement;
  }
  return el;
}

function extractVisibleText(): string {
  return (document.body?.innerText || "").slice(0, LIMITS.visibleTextChars);
}
