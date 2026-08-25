import type { FastifyInstance, FastifyReply } from "fastify";
import { LIMITS } from "@quip/shared";
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
  question: z.string().trim().min(1).max(LIMITS.questionChars),
  selectedText: z.string().max(LIMITS.selectedTextChars).default(""),
  pageTitle: z.string().max(LIMITS.pageTitleChars).default(""),
  pageUrl: z.string().max(LIMITS.pageUrlChars).default(""),
  pageContext: z
    .object({
      title: z.string().max(LIMITS.pageTitleChars).default(""),
      url: z.string().max(LIMITS.pageUrlChars).default(""),
      selectedText: z.string().max(LIMITS.selectedTextChars).default(""),
      nearbyText: z.string().max(LIMITS.nearbyTextChars).optional(),
      visibleText: z.string().max(LIMITS.visibleTextChars).optional(),
      headings: z
        .array(z.string().max(LIMITS.headingChars))
        .max(LIMITS.headingsCount)
        .optional(),
      metadata: z
        .record(z.string().max(LIMITS.metadataValueChars))
        .refine(
          (metadata) => Object.keys(metadata).length <= LIMITS.metadataEntries,
          `Metadata cannot contain more than ${LIMITS.metadataEntries} entries.`,
        )
        .optional(),
      adapter: z.string().max(100).optional(),
    })
    .default({}),
  stream: z.boolean().default(false),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(LIMITS.conversationMessageChars),
      }),
    )
    .max(LIMITS.conversationMessages)
    .default([]),
});

interface AskRouteOptions {
  usageStore?: FreeUsageStore;
}

const clientIdSchema = z.string().uuid();
const providerSchema = z.enum(["openai", "anthropic"]);
const apiKeySchema = z.string().min(1).max(LIMITS.apiKeyChars);
const modelSchema = z.string().trim().min(1).max(LIMITS.modelIdChars);

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
    reply.header("Cache-Control", "no-store");
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
    let reservedClientId: string | undefined;

    if (isByokRequest) {
      const parsedProvider = providerSchema.safeParse(provider);
      const parsedApiKey = apiKeySchema.safeParse(apiKey);
      const parsedModel = modelSchema.safeParse(model);
      if (
        !parsedProvider.success ||
        !parsedApiKey.success ||
        !parsedModel.success
      ) {
        return reply.code(400).send({
          error: "Provider, model, and API key are required for BYOK requests.",
          code: "INVALID_LLM_CONFIG",
        });
      }
      llmConfig = {
        provider: parsedProvider.data,
        apiKey: parsedApiKey.data,
        model: parsedModel.data,
      };
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
        const requestLabel = currentUsage.limit === 1 ? "request" : "requests";
        setUsageHeaders(reply, currentUsage);
        return reply.code(402).send({
          error: `You have used all ${currentUsage.limit} free ${requestLabel}. Add your API key and model in Quip settings to continue.`,
          code: "FREE_LIMIT_REACHED",
          usageStatus: currentUsage,
        });
      }
      reservedClientId = parsedClientId.data;
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
      const iterator = streamLLM(messages, llmConfig)[Symbol.asyncIterator]();
      let firstChunk: IteratorResult<string>;

      try {
        firstChunk = await iterator.next();
      } catch {
        const usageStatus = reservedClientId
          ? usageStore.release(reservedClientId)
          : undefined;
        if (usageStatus) setUsageHeaders(reply, usageStatus);
        return reply.code(502).send({
          error: "The configured LLM provider rejected the request.",
          code: "LLM_REQUEST_FAILED",
          usageStatus,
        });
      }

      const usageStatus = reservedClientId
        ? usageStore.get(reservedClientId)
        : undefined;
      if (usageStatus) setUsageHeaders(reply, usageStatus);
      reply.header("Content-Type", "text/event-stream; charset=utf-8");
      reply.header("Cache-Control", "no-cache, no-transform");
      reply.header("Connection", "keep-alive");
      reply.header("X-Accel-Buffering", "no");
      const responseHeaders = reply.getHeaders();
      reply.hijack();
      for (const [name, value] of Object.entries(responseHeaders)) {
        if (value !== undefined) reply.raw.setHeader(name, value);
      }
      reply.raw.writeHead(200);

      try {
        if (!firstChunk.done) {
          reply.raw.write(
            `data: ${JSON.stringify({ text: firstChunk.value })}\n\n`,
          );
        }

        while (true) {
          const chunk = await iterator.next();
          if (chunk.done) break;
          reply.raw.write(`data: ${JSON.stringify({ text: chunk.value })}\n\n`);
        }
        reply.raw.write("data: [DONE]\n\n");
      } catch {
        const releasedUsage = reservedClientId
          ? usageStore.release(reservedClientId)
          : undefined;
        reply.raw.write(
          `data: ${JSON.stringify({
            error: "The LLM response was interrupted.",
            code: "LLM_STREAM_FAILED",
            usageStatus: releasedUsage,
          })}\n\n`,
        );
      } finally {
        reply.raw.end();
      }
      return;
    }

    try {
      const result = await callLLM(messages, llmConfig);
      const usageStatus = reservedClientId
        ? usageStore.get(reservedClientId)
        : undefined;
      if (usageStatus) setUsageHeaders(reply, usageStatus);
      reply.header("Cache-Control", "no-store");
      return result;
    } catch {
      const usageStatus = reservedClientId
        ? usageStore.release(reservedClientId)
        : undefined;
      if (usageStatus) setUsageHeaders(reply, usageStatus);
      return reply.code(502).send({
        error: "The configured LLM provider rejected the request.",
        code: "LLM_REQUEST_FAILED",
        usageStatus,
      });
    }
  });
}
