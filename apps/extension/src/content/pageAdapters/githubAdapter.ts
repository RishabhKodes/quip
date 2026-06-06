import type { PageContextPayload } from "@shared/protocol";
import { LIMITS } from "@shared/limits";

export function extractGitHub(
  selectedText: string,
): Partial<PageContextPayload> {
  const url = window.location.href;
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const repo = pathParts.length >= 2 ? `${pathParts[0]}/${pathParts[1]}` : "";

  const metadata: Record<string, string> = { repo };

  if (pathParts[2] === "blob" || pathParts[2] === "tree") {
    metadata.branch = pathParts[3] || "";
    metadata.filePath = pathParts.slice(4).join("/");
  }

  if (pathParts[2] === "pull") {
    metadata.prNumber = pathParts[3] || "";
  }

  if (pathParts[2] === "issues") {
    metadata.issueNumber = pathParts[3] || "";
  }

  const codeLines = extractCodeFromBlob();
  const prComments = extractPRComments();

  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((h) => h.textContent?.trim())
    .filter(Boolean)
    .slice(0, LIMITS.headingsCount) as string[];

  const nearbyParts: string[] = [];
  if (codeLines) nearbyParts.push(codeLines);
  if (prComments) nearbyParts.push(prComments);

  const nearbyText = nearbyParts
    .join("\n\n---\n\n")
    .slice(0, LIMITS.nearbyTextChars);

  return {
    selectedText: selectedText.slice(0, LIMITS.selectedTextChars),
    nearbyText: nearbyText || undefined,
    headings,
    metadata,
    adapter: "github",
  };
}

function extractCodeFromBlob(): string {
  const codeTable = document.querySelector(".js-file-line-container, .react-code-lines");
  if (!codeTable) return "";
  return (codeTable.textContent || "").trim().slice(0, 8000);
}

function extractPRComments(): string {
  const comments = document.querySelectorAll(
    ".timeline-comment .comment-body, .review-comment .comment-body",
  );
  if (comments.length === 0) return "";

  return Array.from(comments)
    .map((c) => c.textContent?.trim())
    .filter(Boolean)
    .slice(0, 20)
    .join("\n\n")
    .slice(0, 5000);
}
