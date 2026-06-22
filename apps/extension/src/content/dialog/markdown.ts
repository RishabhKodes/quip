import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(text: string): string {
  if (!text) return "";
  const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const result = marked.parse(safeText);
  if (typeof result === "string") return sanitizeRenderedMarkdown(result);
  return "";
}

function sanitizeRenderedMarkdown(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;

  const allowedTags = new Set([
    "A",
    "BLOCKQUOTE",
    "BR",
    "CODE",
    "DEL",
    "EM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HR",
    "LI",
    "OL",
    "P",
    "PRE",
    "STRONG",
    "TABLE",
    "TBODY",
    "TD",
    "TH",
    "THEAD",
    "TR",
    "UL",
  ]);

  for (const element of Array.from(template.content.querySelectorAll("*"))) {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(document.createTextNode(element.textContent || ""));
      continue;
    }

    const href = element.tagName === "A" ? element.getAttribute("href") : null;
    for (const attribute of Array.from(element.attributes)) {
      element.removeAttribute(attribute.name);
    }

    if (element instanceof HTMLAnchorElement && href) {
      try {
        const url = new URL(href, window.location.href);
        if (url.protocol === "http:" || url.protocol === "https:") {
          element.href = url.href;
          element.target = "_blank";
          element.rel = "noopener noreferrer";
        }
      } catch {
        // Leave malformed links as plain text.
      }
    }
  }

  return template.innerHTML;
}
