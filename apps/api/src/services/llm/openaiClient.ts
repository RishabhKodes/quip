import OpenAI from "openai";
import type { AskAIResponse } from "@quip/shared";
import type { ChatMessage } from "../context/buildPrompt.js";
import type { LlmRequestConfig } from "./llmClient.js";

function getClient(config?: LlmRequestConfig): OpenAI {
  return new OpenAI({
    apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
  });
}

function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));
}

export async function callOpenAI(
  messages: ChatMessage[],
  config?: LlmRequestConfig,
): Promise<AskAIResponse> {
  const client = getClient(config);
  const response = await client.chat.completions.create({
    model: config?.model || process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: toOpenAIMessages(messages),
    max_tokens: 2048,
  });

  return {
    answer: response.choices[0]?.message?.content || "",
    model: response.model,
    usage: {
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    },
  };
}

export async function* streamOpenAI(
  messages: ChatMessage[],
  config?: LlmRequestConfig,
): AsyncGenerator<string> {
  const client = getClient(config);
  const stream = await client.chat.completions.create({
    model: config?.model || process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: toOpenAIMessages(messages),
    max_tokens: 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
