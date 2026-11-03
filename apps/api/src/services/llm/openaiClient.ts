import OpenAI from "openai";
import { DEFAULT_MODELS, type AskAIResponse } from "@quip/shared";
import type { ChatMessage } from "../context/buildPrompt.js";
import type { LlmRequestConfig } from "./llmClient.js";

function getClient(config?: LlmRequestConfig): OpenAI {
  return new OpenAI({
    apiKey:
      config?.apiKey ||
      (config?.provider === "local" ? "local" : process.env.OPENAI_API_KEY),
    ...(config?.baseUrl ? { baseURL: config.baseUrl } : {}),
  });
}

function getModel(config?: LlmRequestConfig): string {
  if (config?.model) return config.model;
  if (config?.provider === "local") return DEFAULT_MODELS.local;
  return process.env.OPENAI_MODEL || DEFAULT_MODELS.openai;
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
    model: getModel(config),
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
    model: getModel(config),
    messages: toOpenAIMessages(messages),
    max_tokens: 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
