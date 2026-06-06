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

  template.content.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!/^(https?:|mailto:)/i.test(href)) {
      link.removeAttribute("href");
      return;
    }
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  return template.innerHTML;
}
