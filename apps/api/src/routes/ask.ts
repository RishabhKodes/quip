import type { FastifyInstance } from "fastify";
import {
  DEFAULT_LOCAL_BASE_URL,
  DEFAULT_MODELS,
  isLoopbackModelUrl,
  LIMITS,
  LLM_PROVIDERS,
  normalizeLocalBaseUrl,
} from "@quip/shared";
import { z } from "zod";
import { buildMessages } from "../services/context/buildPrompt.js";
import {
  callLLM,
  streamLLM,
  type LlmRequestConfig,
} from "../services/llm/llmClient.js";

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
      chunks: z
        .array(
          z.object({
            kind: z.enum([
              "heading",
              "paragraph",
              "list",
              "code",
              "table",
              "quote",
            ]),
            text: z.string().trim().min(1).max(LIMITS.pageChunkChars),
            heading: z.string().max(LIMITS.pageChunkHeadingChars).optional(),
          }),
        )
        .max(LIMITS.pageChunksCount)
        .refine(
          (chunks) =>
            chunks.reduce(
              (total, chunk) =>
                total + chunk.text.length + (chunk.heading?.length || 0),
              0,
            ) <= LIMITS.pageChunksTotalChars,
          `Page chunks cannot exceed ${LIMITS.pageChunksTotalChars} total characters.`,
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

const providerSchema = z.enum(LLM_PROVIDERS);
const apiKeySchema = z.string().min(1).max(LIMITS.apiKeyChars);
const modelSchema = z.string().trim().min(1).max(LIMITS.modelIdChars);
const localBaseUrlSchema = z
  .string()
  .max(LIMITS.pageUrlChars)
  .refine(isLoopbackModelUrl);

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = headers[name];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export async function askRoute(app: FastifyInstance) {
  app.post("/ask", async (request, reply) => {
    const parsed = askSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0].message });
    }

    const body = parsed.data;
    const provider = getHeader(request.headers, "x-quip-llm-provider");
    const apiKey = getHeader(request.headers, "x-quip-llm-api-key");
    const model = getHeader(request.headers, "x-quip-llm-model");
    const localBaseUrl = getHeader(request.headers, "x-quip-llm-base-url");
    const isByokRequest = Boolean(provider || apiKey || model || localBaseUrl);
    let llmConfig: LlmRequestConfig | undefined;

    if (isByokRequest) {
      const parsedProvider = providerSchema.safeParse(provider);
      if (!parsedProvider.success) {
        return reply.code(400).send({
          error: "A valid LLM provider is required.",
          code: "INVALID_LLM_CONFIG",
        });
      }

      const resolvedModel = model || DEFAULT_MODELS[parsedProvider.data];
      const parsedModel = modelSchema.safeParse(resolvedModel);
      const parsedApiKey = apiKeySchema.safeParse(apiKey);
      const isLocal = parsedProvider.data === "local";
      const resolvedLocalBaseUrl = normalizeLocalBaseUrl(
        localBaseUrl || DEFAULT_LOCAL_BASE_URL,
      );
      const parsedLocalBaseUrl =
        localBaseUrlSchema.safeParse(resolvedLocalBaseUrl);

      if (
        !parsedModel.success ||
        (!isLocal && !parsedApiKey.success) ||
        (isLocal && !parsedLocalBaseUrl.success)
      ) {
        return reply.code(400).send({
          error: isLocal
            ? "A valid loopback model URL and model ID are required."
            : "An API key and valid model ID are required.",
          code: "INVALID_LLM_CONFIG",
        });
      }

      llmConfig = {
        provider: parsedProvider.data,
        model: parsedModel.data,
        ...(parsedApiKey.success ? { apiKey: parsedApiKey.data } : {}),
        ...(isLocal ? { baseUrl: parsedLocalBaseUrl.data } : {}),
      };
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
        return reply.code(502).send({
          error: "The configured LLM provider rejected the request.",
          code: "LLM_REQUEST_FAILED",
        });
      }

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
        reply.raw.write(
          `data: ${JSON.stringify({
            error: "The LLM response was interrupted.",
            code: "LLM_STREAM_FAILED",
          })}\n\n`,
        );
      } finally {
        reply.raw.end();
      }
      return;
    }

    try {
      const result = await callLLM(messages, llmConfig);
      reply.header("Cache-Control", "no-store");
      return result;
    } catch {
      return reply.code(502).send({
        error: "The configured LLM provider rejected the request.",
        code: "LLM_REQUEST_FAILED",
      });
    }
  });
}
