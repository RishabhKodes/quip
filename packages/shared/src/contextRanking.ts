import { LIMITS } from "./limits.js";
import type { PageContextChunk } from "./protocol.js";

const IGNORED_QUERY_TERMS = new Set([
  "about",
  "also",
  "and",
  "are",
  "but",
  "can",
  "could",
  "did",
  "do",
  "does",
  "explain",
  "for",
  "from",
  "how",
  "into",
  "is",
  "it",
  "its",
  "list",
  "of",
  "on",
  "or",
  "page",
  "please",
  "show",
  "summarize",
  "summary",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "would",
  "you",
  "your",
]);

export function selectRelevantPageChunks(
  chunks: PageContextChunk[],
  question: string,
  selectedText: string,
  nearbyText = "",
): PageContextChunk[] {
  if (chunks.length <= LIMITS.relevantPageChunks) {
    return removeDuplicateChunks(chunks, selectedText, nearbyText);
  }

  const queryTerms = tokenize(question).filter(
    (term) => !IGNORED_QUERY_TERMS.has(term),
  );
  const selectedNeedle = normalizeText(selectedText).slice(0, 200);
  const scored = chunks.map((chunk, index) => ({
    index,
    score: scoreChunk(chunk, queryTerms, selectedNeedle),
  }));
  const coverageSlots = queryTerms.length > 0 ? 3 : LIMITS.relevantPageChunks;
  const relevanceLimit = LIMITS.relevantPageChunks - coverageSlots;
  const selected = new Set<number>();

  for (const entry of scored) {
    if (entry.score < 1000 || selected.size >= relevanceLimit) continue;
    for (const index of [entry.index, entry.index - 1, entry.index + 1]) {
      if (index >= 0 && index < chunks.length) selected.add(index);
      if (selected.size >= relevanceLimit) break;
    }
  }

  const byRelevance = [...scored].sort(
    (left, right) => right.score - left.score || left.index - right.index,
  );

  for (const entry of byRelevance) {
    if (selected.size >= relevanceLimit || entry.score <= 0) break;
    selected.add(entry.index);
  }

  addCoverageIndexes(selected, chunks.length);

  return removeDuplicateChunks(
    [...selected]
      .sort((left, right) => left - right)
      .map((index) => chunks[index]),
    selectedText,
    nearbyText,
  ).slice(0, LIMITS.relevantPageChunks);
}

export function formatPageChunks(chunks: PageContextChunk[]): string {
  return chunks
    .map((chunk) => {
      const label = chunk.kind[0].toUpperCase() + chunk.kind.slice(1);
      const section = chunk.heading ? ` | Section: ${chunk.heading}` : "";
      return `[${label}${section}]\n${chunk.text}`;
    })
    .join("\n\n");
}

function scoreChunk(
  chunk: PageContextChunk,
  queryTerms: string[],
  selectedNeedle: string,
): number {
  const text = normalizeText(chunk.text);
  const heading = normalizeText(chunk.heading || "");
  let score = 0;

  if (
    selectedNeedle.length >= 20 &&
    (text.includes(selectedNeedle) || selectedNeedle.includes(text))
  ) {
    score += 1000;
  }

  const textTerms = tokenize(text);
  const headingTerms = new Set(tokenize(heading));
  for (const term of queryTerms) {
    const occurrences = Math.min(
      textTerms.filter((candidate) => candidate === term).length,
      4,
    );
    score += occurrences * 2;
    if (headingTerms.has(term)) score += 6;
  }

  if (
    chunk.kind === "code" &&
    queryTerms.some((term) =>
      ["code", "class", "error", "function", "method", "type"].includes(term),
    )
  ) {
    score += 3;
  }
  return score;
}

function addCoverageIndexes(selected: Set<number>, chunkCount: number): void {
  if (chunkCount === 0) return;

  while (
    selected.size < LIMITS.relevantPageChunks &&
    selected.size < chunkCount
  ) {
    let bestIndex = -1;
    let bestDistance = -1;
    for (let index = 0; index < chunkCount; index += 1) {
      if (selected.has(index)) continue;
      const distance =
        selected.size === 0
          ? chunkCount - index
          : Math.min(
              ...[...selected].map((selectedIndex) =>
                Math.abs(selectedIndex - index),
              ),
            );
      if (distance > bestDistance) {
        bestIndex = index;
        bestDistance = distance;
      }
    }
    if (bestIndex === -1) break;
    selected.add(bestIndex);
  }
}

function removeDuplicateChunks(
  chunks: PageContextChunk[],
  selectedText: string,
  nearbyText: string,
): PageContextChunk[] {
  const existingContext = [selectedText, nearbyText]
    .map(normalizeText)
    .filter(Boolean);
  const seen = new Set<string>();

  return chunks.filter((chunk) => {
    const normalized = normalizeText(chunk.text);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return !existingContext.some(
      (context) =>
        normalized.length >= 40 &&
        (context.includes(normalized) || normalized.includes(context)),
    );
  });
}

function tokenize(text: string): string[] {
  return normalizeText(text).match(/[\p{L}\p{N}_-]{2,}/gu) || [];
}

function normalizeText(text: string): string {
  return text.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}
