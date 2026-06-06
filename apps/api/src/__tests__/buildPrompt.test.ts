import { describe, it, expect } from "vitest";
import { buildMessages } from "../services/context/buildPrompt.js";

function allContent(messages: { content: string }[]): string {
  return messages.map((m) => m.content).join("\n");
}

describe("buildMessages", () => {
  it("includes all context fields across messages", () => {
    const messages = buildMessages({
      question: "What does this do?",
      selectedText: "const x = 42;",
      pageTitle: "My Page",
      pageUrl: "https://example.com",
      pageContext: {
        headings: ["Introduction", "Setup"],
        nearbyText: "Some nearby text",
      },
    });

    const combined = allContent(messages);
    expect(combined).toContain("What does this do?");
    expect(combined).toContain("const x = 42;");
    expect(combined).toContain("My Page");
    expect(combined).toContain("https://example.com");
    expect(combined).toContain("Introduction");
    expect(combined).toContain("Setup");
    expect(combined).toContain("Some nearby text");
  });

  it("has system message first and user question last", () => {
    const messages = buildMessages({
      question: "test question",
      selectedText: "",
      pageTitle: "",
      pageUrl: "",
      pageContext: {},
    });

    expect(messages[0].role).toBe("system");
    expect(messages[messages.length - 1].role).toBe("user");
    expect(messages[messages.length - 1].content).toBe("test question");
  });

  it("includes conversation history as separate messages", () => {
    const messages = buildMessages({
      question: "Follow up",
      selectedText: "",
      pageTitle: "",
      pageUrl: "",
      pageContext: {},
      conversationHistory: [
        { role: "user", content: "First question" },
        { role: "assistant", content: "First answer" },
      ],
    });

    expect(messages).toHaveLength(4);
    expect(messages[0].role).toBe("system");
    expect(messages[1]).toEqual({ role: "user", content: "First question" });
    expect(messages[2]).toEqual({ role: "assistant", content: "First answer" });
    expect(messages[3]).toEqual({ role: "user", content: "Follow up" });
  });

  it("uses visibleText as fallback when no nearbyText", () => {
    const messages = buildMessages({
      question: "test",
      selectedText: "",
      pageTitle: "",
      pageUrl: "",
      pageContext: {
        visibleText: "Visible page content here",
      },
    });

    expect(allContent(messages)).toContain("Visible page content here");
  });

  it("page context goes in system message, question stays in user message", () => {
    const messages = buildMessages({
      question: "What is this?",
      selectedText: "some code",
      pageTitle: "Dev Docs",
      pageUrl: "https://docs.example.com",
      pageContext: {},
    });

    const system = messages.find((m) => m.role === "system")!;
    const user = messages.find((m) => m.role === "user")!;

    expect(system.content).toContain("Dev Docs");
    expect(system.content).toContain("some code");
    expect(user.content).toBe("What is this?");
    expect(user.content).not.toContain("Dev Docs");
  });
});
