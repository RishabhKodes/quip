import { afterEach, describe, expect, it, vi } from "vitest";
import { callAnthropic } from "../services/llm/anthropicClient.js";
import { callLLM } from "../services/llm/llmClient.js";
import { callOpenAI } from "../services/llm/openaiClient.js";

vi.mock("../services/llm/openaiClient.js", () => ({
  callOpenAI: vi.fn().mockResolvedValue({ answer: "OpenAI" }),
  streamOpenAI: vi.fn(),
}));

vi.mock("../services/llm/anthropicClient.js", () => ({
  callAnthropic: vi.fn().mockResolvedValue({ answer: "Anthropic" }),
  streamAnthropic: vi.fn(),
}));

const originalProvider = process.env.LLM_PROVIDER;

afterEach(() => {
  vi.clearAllMocks();
  if (originalProvider === undefined) {
    delete process.env.LLM_PROVIDER;
  } else {
    process.env.LLM_PROVIDER = originalProvider;
  }
});

describe("LLM provider selection", () => {
  it("uses OpenAI when no provider is configured", async () => {
    delete process.env.LLM_PROVIDER;

    await callLLM([]);

    expect(callOpenAI).toHaveBeenCalledOnce();
    expect(callAnthropic).not.toHaveBeenCalled();
  });

  it("honors the configured server provider", async () => {
    process.env.LLM_PROVIDER = "anthropic";

    await callLLM([]);

    expect(callAnthropic).toHaveBeenCalledOnce();
    expect(callOpenAI).not.toHaveBeenCalled();
  });
});
