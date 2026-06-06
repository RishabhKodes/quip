import type { PageContextPayload } from "@shared/protocol";
import { extractGitHub } from "./githubAdapter";
import { extractDocs } from "./docsAdapter";
import { extractStackOverflow } from "./stackoverflowAdapter";
import { extractArticle } from "./articleAdapter";

export type AdapterName =
  | "github"
  | "docs"
  | "stackoverflow"
  | "article"
  | "base";

export function detectAdapter(url: string): AdapterName {
  const hostname = new URL(url).hostname;

  if (hostname === "github.com" || hostname.endsWith(".github.com")) {
    return "github";
  }

  if (hostname === "stackoverflow.com" || hostname === "stackexchange.com") {
    return "stackoverflow";
  }

  if (
    hostname.includes("docs.") ||
    hostname === "developer.mozilla.org" ||
    hostname.includes("readthedocs") ||
    hostname.includes("gitbook") ||
    url.includes("/docs/") ||
    url.includes("/documentation/")
  ) {
    return "docs";
  }

  const articleEl = document.querySelector("article, [role='article']");
  if (articleEl) {
    return "article";
  }

  return "base";
}

export function extractWithAdapter(
  adapter: AdapterName,
  selectedText: string,
): Partial<PageContextPayload> | null {
  switch (adapter) {
    case "github":
      return extractGitHub(selectedText);
    case "docs":
      return extractDocs(selectedText);
    case "stackoverflow":
      return extractStackOverflow(selectedText);
    case "article":
      return extractArticle(selectedText);
    default:
      return null;
  }
}
