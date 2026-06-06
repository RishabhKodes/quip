import Anthropic from "@anthropic-ai/sdk";
import type { AskAIResponse } from "@quip/shared";
import type { ChatMessage } from "../context/buildPrompt.js";
import type { LlmRequestConfig } from "./llmClient.js";

function getClient(config?: LlmRequestConfig): Anthropic {
  return new Anthropic({
    apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY,
  });
}

function splitMessages(messages: ChatMessage[]) {
  const systemMsg = messages.find((m) => m.role === "system");
  const userMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  return { system: systemMsg?.content, messages: userMessages };
}

export async function callAnthropic(
  messages: ChatMessage[],
  config?: LlmRequestConfig,
): Promise<AskAIResponse> {
  const client = getClient(config);
  const { system, messages: userMessages } = splitMessages(messages);

  const response = await client.messages.create({
    model:
      config?.model ||
      process.env.ANTHROPIC_MODEL ||
      "claude-sonnet-4-20250514",
    max_tokens: 2048,
    ...(system ? { system } : {}),
    messages: userMessages,
  });

  const textBlock = response.content.find((b) => b.type === "text");

  return {
    answer: textBlock?.text || "",
    model: response.model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

export async function* streamAnthropic(
  messages: ChatMessage[],
  config?: LlmRequestConfig,
): AsyncGenerator<string> {
  const client = getClient(config);
  const { system, messages: userMessages } = splitMessages(messages);

  const stream = client.messages.stream({
    model:
      config?.model ||
      process.env.ANTHROPIC_MODEL ||
      "claude-sonnet-4-20250514",
    max_tokens: 2048,
    ...(system ? { system } : {}),
    messages: userMessages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
