import { LIMITS } from "@quip/shared";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface BuildMessagesInput {
  question: string;
  selectedText: string;
  pageTitle: string;
  pageUrl: string;
  pageContext: {
    headings?: string[];
    nearbyText?: string;
    visibleText?: string;
    metadata?: Record<string, string>;
    adapter?: string;
  };
  conversationHistory?: { role: string; content: string }[];
}

export function buildMessages(input: BuildMessagesInput): ChatMessage[] {
  const selectedText = input.selectedText.slice(0, LIMITS.selectedTextChars);
  const headings = (input.pageContext.headings || [])
    .slice(0, LIMITS.headingsCount)
    .join("\n");
  const nearbyText = (input.pageContext.nearbyText || "").slice(
    0,
    LIMITS.nearbyTextChars,
  );
  const visibleText = (input.pageContext.visibleText || "").slice(
    0,
    LIMITS.visibleTextChars,
  );

  let contextBlock = "";
  if (input.pageTitle) contextBlock += `Page: ${input.pageTitle}\n`;
  if (input.pageUrl) contextBlock += `URL: ${input.pageUrl}\n`;
  if (headings) contextBlock += `\nPage headings:\n${headings}\n`;
  if (selectedText) contextBlock += `\nText the user selected:\n${selectedText}\n`;
  if (nearbyText) contextBlock += `\nText near the selection:\n${nearbyText}\n`;
  if (visibleText) contextBlock += `\nFull visible page content:\n${visibleText}\n`;

  const system = `You are Quip, an AI assistant embedded in the user's browser. Answer any question the user asks, just like ChatGPT would. Use your full knowledge.

The user is currently browsing a webpage. Below is the full content extracted from that page including sidebars, stats, and metadata. When the user asks about something that appears in the page content below, ALWAYS use that information first -- it is live data from their screen. Only fall back to your own knowledge for things not present in the page content.

${contextBlock.trim()}`;

  const messages: ChatMessage[] = [{ role: "system", content: system }];

  if (input.conversationHistory && input.conversationHistory.length > 0) {
    for (const msg of input.conversationHistory) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  messages.push({ role: "user", content: input.question });

  return messages;
}
