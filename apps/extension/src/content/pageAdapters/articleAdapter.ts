import type { PageContextPayload } from "@shared/protocol";
import { LIMITS } from "@shared/limits";

export function extractArticle(
  selectedText: string,
): Partial<PageContextPayload> {
  const article = document.querySelector(
    "article, [role='article'], .post-content, .entry-content, .article-body",
  );

  const headings = Array.from(
    (article || document).querySelectorAll("h1, h2, h3"),
  )
    .map((h) => h.textContent?.trim())
    .filter(Boolean)
    .slice(0, LIMITS.headingsCount) as string[];

  const metadata: Record<string, string> = {};

  const author = document.querySelector(
    "[rel='author'], .author-name, .byline",
  );
  if (author?.textContent) metadata.author = author.textContent.trim();

  const publishDate = document.querySelector(
    "time[datetime], .publish-date, .post-date",
  );
  if (publishDate) {
    metadata.publishDate =
      publishDate.getAttribute("datetime") ||
      publishDate.textContent?.trim() ||
      "";
  }

  const articleText = (article?.textContent || document.body.innerText || "")
    .trim()
    .slice(0, LIMITS.visibleTextChars);

  return {
    selectedText: selectedText.slice(0, LIMITS.selectedTextChars),
    visibleText: articleText,
    headings,
    metadata,
    adapter: "article",
  };
}
