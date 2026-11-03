import { LIMITS } from "@shared/limits";
import type { PageContextChunk, PageContextPayload } from "@shared/protocol";
import { getSelectionRange } from "./selection";
import { detectAdapter, extractWithAdapter } from "./pageAdapters/registry";

export function extractPageContext(input: {
  selectedText: string;
}): PageContextPayload {
  const title = document.title || "";
  const url = window.location.href;
  const adapter = detectAdapter(url);
  const chunks = extractStructuredChunks();

  const adapterContext = extractWithAdapter(adapter, input.selectedText);
  if (adapterContext) {
    const nearbyText =
      adapterContext.nearbyText || extractNearbyText(input.selectedText);
    return {
      ...adapterContext,
      title,
      url,
      selectedText: input.selectedText.slice(0, LIMITS.selectedTextChars),
      nearbyText: nearbyText || undefined,
      visibleText:
        chunks.length === 0
          ? adapterContext.visibleText || extractVisibleText()
          : undefined,
      chunks,
    };
  }

  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((h) => h.textContent?.trim())
    .filter(Boolean)
    .slice(0, LIMITS.headingsCount) as string[];

  const nearbyText = extractNearbyText(input.selectedText);
  const visibleText = chunks.length === 0 ? extractVisibleText() : undefined;

  return {
    title,
    url,
    selectedText: input.selectedText.slice(0, LIMITS.selectedTextChars),
    nearbyText,
    visibleText,
    headings,
    chunks,
    adapter: "base",
  };
}

function extractStructuredChunks(): PageContextChunk[] {
  const root =
    document.querySelector(
      "article, main, [role='main'], [role='article'], .markdown-body, .post-content, .entry-content, .article-body",
    ) || document.body;
  if (!root) return [];

  const elements = Array.from(
    root.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, li, pre, table, blockquote, dt, dd",
    ),
  );
  const headingStack: string[] = [];
  const seen = new Set<string>();
  const candidates: PageContextChunk[] = [];

  for (const element of elements) {
    if (isIgnoredElement(element) || isNestedContentBlock(element, root)) {
      continue;
    }

    const kind = getChunkKind(element);
    const text = getElementText(element, kind);
    if (!text) continue;

    if (kind === "heading") {
      const level = Number.parseInt(element.tagName.slice(1), 10);
      headingStack.length = Math.max(level - 1, 0);
      headingStack[level - 1] = text;
    }

    const dedupeKey = normalizeForComparison(text);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const heading = headingStack.filter(Boolean).join(" > ");
    candidates.push({
      kind,
      text: text.slice(0, LIMITS.pageChunkChars),
      ...(heading && heading !== text
        ? { heading: heading.slice(0, LIMITS.pageChunkHeadingChars) }
        : {}),
    });
  }

  return sampleChunks(candidates);
}

function isIgnoredElement(element: Element): boolean {
  if (
    element.closest(
      "#quip-ai-root, nav, header, footer, aside, form, dialog, [role='navigation'], [role='banner'], [role='contentinfo'], [aria-hidden='true'], [hidden]",
    )
  ) {
    return true;
  }

  const style = window.getComputedStyle(element);
  return style.display === "none" || style.visibility === "hidden";
}

function isNestedContentBlock(element: Element, root: Element): boolean {
  if (/^H[1-6]$/.test(element.tagName)) return false;
  const parentBlock = element.parentElement?.closest(
    "p, li, pre, table, blockquote, dt, dd",
  );
  return Boolean(parentBlock && root.contains(parentBlock));
}

function getChunkKind(element: Element): PageContextChunk["kind"] {
  if (/^H[1-6]$/.test(element.tagName)) return "heading";
  if (element.tagName === "PRE") return "code";
  if (element.tagName === "TABLE") return "table";
  if (element.tagName === "LI" || element.tagName === "DT") return "list";
  if (element.tagName === "BLOCKQUOTE" || element.tagName === "DD") {
    return "quote";
  }
  return "paragraph";
}

function getElementText(
  element: Element,
  kind: PageContextChunk["kind"],
): string {
  const rawText =
    element instanceof HTMLElement ? element.innerText : element.textContent;
  if (!rawText) return "";

  if (kind === "code" || kind === "table") {
    return rawText
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return rawText.replace(/\s+/g, " ").trim();
}

function normalizeForComparison(text: string): string {
  return text.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function sampleChunks(chunks: PageContextChunk[]): PageContextChunk[] {
  if (chunks.length === 0) return [];

  const count = Math.min(chunks.length, LIMITS.extractedPageChunksCount);
  const sampled = new Map<number, PageContextChunk>();
  for (let slot = 0; slot < count; slot += 1) {
    const index =
      count === 1 ? 0 : Math.round((slot * (chunks.length - 1)) / (count - 1));
    sampled.set(index, chunks[index]);
  }

  const result: PageContextChunk[] = [];
  let totalChars = 0;
  for (const chunk of sampled.values()) {
    const chunkChars = chunk.text.length + (chunk.heading?.length || 0);
    if (totalChars + chunkChars > LIMITS.extractedPageChunksTotalChars) break;
    result.push(chunk);
    totalChars += chunkChars;
  }
  return result;
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
