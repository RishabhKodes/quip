import type { PageContextPayload } from "@shared/protocol";
import { LIMITS } from "@shared/limits";

export function extractDocs(
  selectedText: string,
): Partial<PageContextPayload> {
  const headings = extractHeadingHierarchy();
  const currentSection = extractCurrentSection(selectedText);
  const codeBlocks = extractCodeBlocks();

  const nearbyParts: string[] = [];
  if (currentSection) nearbyParts.push(currentSection);
  if (codeBlocks) nearbyParts.push("Code examples:\n" + codeBlocks);

  const nearbyText = nearbyParts
    .join("\n\n---\n\n")
    .slice(0, LIMITS.nearbyTextChars);

  return {
    selectedText: selectedText.slice(0, LIMITS.selectedTextChars),
    nearbyText: nearbyText || undefined,
    headings,
    adapter: "docs",
  };
}

function extractHeadingHierarchy(): string[] {
  const allHeadings = document.querySelectorAll(
    "h1, h2, h3, h4",
  );
  return Array.from(allHeadings)
    .map((h) => {
      const level = parseInt(h.tagName[1]);
      const indent = "  ".repeat(level - 1);
      return `${indent}${h.textContent?.trim()}`;
    })
    .filter(Boolean)
    .slice(0, LIMITS.headingsCount);
}

function extractCurrentSection(selectedText: string): string {
  if (!selectedText) return "";

  const main =
    document.querySelector("article, main, [role='main'], .markdown-body, .content") ||
    document.body;

  const allElements = main.querySelectorAll("h1, h2, h3, h4, p, li, pre, td, blockquote");
  let matchIndex = -1;

  for (let i = 0; i < allElements.length; i++) {
    if (allElements[i].textContent?.includes(selectedText.slice(0, 100))) {
      matchIndex = i;
      break;
    }
  }

  if (matchIndex === -1) return "";

  const start = Math.max(0, matchIndex - 5);
  const end = Math.min(allElements.length, matchIndex + 10);

  return Array.from(allElements)
    .slice(start, end)
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 6000);
}

function extractCodeBlocks(): string {
  const blocks = document.querySelectorAll("pre code, pre");
  return Array.from(blocks)
    .map((b) => b.textContent?.trim())
    .filter(Boolean)
    .slice(0, 10)
    .join("\n\n---\n\n")
    .slice(0, 4000);
}
