import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { buildMessages } from "../services/context/buildPrompt.js";
import {
  callLLM,
  streamLLM,
  type LlmRequestConfig,
} from "../services/llm/llmClient.js";
import {
  FileFreeUsageStore,
  type FreeUsageStore,
  type UsageSnapshot,
} from "../services/usage/freeUsageStore.js";

const askSchema = z.object({
  question: z.string().min(1).max(2000),
  selectedText: z.string().max(15000).default(""),
  pageTitle: z.string().max(500).default(""),
  pageUrl: z.string().max(2000).default(""),
  pageContext: z
    .object({
      title: z.string().default(""),
      url: z.string().default(""),
      selectedText: z.string().default(""),
      nearbyText: z.string().optional(),
      visibleText: z.string().optional(),
      headings: z.array(z.string()).optional(),
      metadata: z.record(z.string()).optional(),
      adapter: z.string().optional(),
    })
    .default({}),
  stream: z.boolean().default(false),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
});

interface AskRouteOptions {
  usageStore?: FreeUsageStore;
}

const clientIdSchema = z.string().uuid();
const providerSchema = z.enum(["openai", "anthropic"]);

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = headers[name];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function setUsageHeaders(reply: FastifyReply, usage: UsageSnapshot): void {
  reply.header("x-quip-free-limit", usage.limit);
  reply.header("x-quip-free-used", usage.used);
  reply.header("x-quip-free-remaining", usage.remaining);
}

export async function askRoute(
  app: FastifyInstance,
  options: AskRouteOptions = {},
) {
  const usageStore = options.usageStore || new FileFreeUsageStore();

  app.get("/usage", async (request, reply) => {
    const clientId = getHeader(request.headers, "x-quip-client-id");
    const parsedClientId = clientIdSchema.safeParse(clientId);
    if (!parsedClientId.success) {
      return reply
        .code(400)
        .send({ error: "A valid Quip client ID is required." });
    }

    return usageStore.get(parsedClientId.data);
  });

  app.post("/ask", async (request, reply) => {
    const parsed = askSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const body = parsed.data;
    const provider = getHeader(request.headers, "x-quip-llm-provider");
    const apiKey = getHeader(request.headers, "x-quip-llm-api-key");
    const model = getHeader(request.headers, "x-quip-llm-model");
    const isByokRequest = Boolean(provider || apiKey || model);
    let llmConfig: LlmRequestConfig | undefined;

    if (isByokRequest) {
      const parsedProvider = providerSchema.safeParse(provider);
      if (!parsedProvider.success || !apiKey || !model) {
        return reply.code(400).send({
          error: "Provider, model, and API key are required for BYOK requests.",
          code: "INVALID_LLM_CONFIG",
        });
      }
      llmConfig = { provider: parsedProvider.data, apiKey, model };
    } else {
      const clientId = getHeader(request.headers, "x-quip-client-id");
      const parsedClientId = clientIdSchema.safeParse(clientId);
      if (!parsedClientId.success) {
        return reply
          .code(400)
          .send({ error: "A valid Quip client ID is required." });
      }

      const usage = usageStore.reserve(parsedClientId.data);
      if (!usage) {
        const currentUsage = usageStore.get(parsedClientId.data);
        setUsageHeaders(reply, currentUsage);
        return reply.code(402).send({
          error:
            "You have used all 10 free requests. Add your API key and model in Quip settings to continue.",
          code: "FREE_LIMIT_REACHED",
          usageStatus: currentUsage,
        });
      }
      setUsageHeaders(reply, usage);
    }

    const messages = buildMessages({
      question: body.question,
      selectedText: body.selectedText,
      pageTitle: body.pageTitle,
      pageUrl: body.pageUrl,
      pageContext: body.pageContext,
      conversationHistory: body.conversationHistory,
    });

    if (body.stream) {
      const origin = request.headers.origin || "*";
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
      });

      for await (const chunk of streamLLM(messages, llmConfig)) {
        reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      reply.raw.write(`data: [DONE]\n\n`);
      reply.raw.end();
      return;
    }

    const result = await callLLM(messages, llmConfig);
    return result;
  });
}
