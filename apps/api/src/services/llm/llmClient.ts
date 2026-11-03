import { callOpenAI, streamOpenAI } from "./openaiClient.js";
import { callAnthropic, streamAnthropic } from "./anthropicClient.js";
import type { AskAIResponse, LlmProvider } from "@quip/shared";
import type { ChatMessage } from "../context/buildPrompt.js";

export interface LlmRequestConfig {
  provider?: LlmProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

function getProvider(config?: LlmRequestConfig): LlmProvider {
  const provider = config?.provider || process.env.LLM_PROVIDER || "openai";
  if (
    provider === "openai" ||
    provider === "anthropic" ||
    provider === "local"
  ) {
    return provider;
  }
  throw new Error(`Unsupported LLM provider: ${provider}`);
}

export async function callLLM(
  messages: ChatMessage[],
  config?: LlmRequestConfig,
): Promise<AskAIResponse> {
  const provider = getProvider(config);

  if (provider === "openai" || provider === "local") {
    return callOpenAI(messages, config);
  }
  return callAnthropic(messages, config);
}

export async function* streamLLM(
  messages: ChatMessage[],
  config?: LlmRequestConfig,
): AsyncGenerator<string> {
  const provider = getProvider(config);

  if (provider === "openai" || provider === "local") {
    yield* streamOpenAI(messages, config);
    return;
  }
  yield* streamAnthropic(messages, config);
}
