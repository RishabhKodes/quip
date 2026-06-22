import type { PageContextPayload } from "@shared/protocol";
import { LIMITS } from "@shared/limits";

export function extractStackOverflow(
  selectedText: string,
): Partial<PageContextPayload> {
  const questionTitle =
    document
      .querySelector("#question-header h1, .question-hyperlink")
      ?.textContent?.trim() || "";

  const questionBody =
    document
      .querySelector(".question .s-prose, .question .post-text")
      ?.textContent?.trim()
      ?.slice(0, 4000) || "";

  const answers = extractAnswers();
  const tags = extractTags();

  const metadata: Record<string, string> = {};
  if (tags.length > 0) metadata.tags = tags.join(", ");

  const nearbyParts: string[] = [];
  if (questionBody) nearbyParts.push("Question:\n" + questionBody);
  if (answers) nearbyParts.push("Top answers:\n" + answers);

  const nearbyText = nearbyParts
    .join("\n\n---\n\n")
    .slice(0, LIMITS.nearbyTextChars);

  const headings = [questionTitle].filter(Boolean);

  return {
    selectedText: selectedText.slice(0, LIMITS.selectedTextChars),
    nearbyText: nearbyText || undefined,
    headings,
    metadata,
    adapter: "stackoverflow",
  };
}

function extractAnswers(): string {
  const answerElements = document.querySelectorAll(
    ".answer .s-prose, .answer .post-text",
  );
  return Array.from(answerElements)
    .slice(0, 3)
    .map((a, i) => `Answer ${i + 1}:\n${a.textContent?.trim()}`)
    .join("\n\n---\n\n")
    .slice(0, 5000);
}

function extractTags(): string[] {
  return Array.from(
    document.querySelectorAll(".post-tag, .js-post-tag-list-item a"),
  )
    .map((t) => t.textContent?.trim())
    .filter(Boolean) as string[];
}
