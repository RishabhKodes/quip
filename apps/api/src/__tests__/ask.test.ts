import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { askRoute } from "../routes/ask.js";
import { callLLM, streamLLM } from "../services/llm/llmClient.js";

vi.mock("../services/llm/llmClient.js", () => ({
  callLLM: vi.fn().mockResolvedValue({
    answer: "Test answer",
    model: "test-model",
    usage: { inputTokens: 10, outputTokens: 5 },
  }),
  streamLLM: vi.fn(),
}));

describe("/api/ask", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await app.register(cors, { origin: true });
    await app.register(askRoute, {
      prefix: "/api",
    });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns 400 when question is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when question is empty", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",
      payload: { question: "" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns answer for valid request", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",

      payload: {
        question: "What is this?",
        selectedText: "Hello world",
        pageTitle: "Test Page",
        pageUrl: "https://example.com",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.answer).toBe("Test answer");
  });

  it("handles request with minimal fields", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",

      payload: { question: "Hello" },
    });

    expect(res.statusCode).toBe(200);
  });

  it("rejects question exceeding max length", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",
      payload: { question: "x".repeat(2001) },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects oversized nested page context", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",

      payload: {
        question: "Hello",
        pageContext: {
          visibleText: "x".repeat(50001),
        },
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("rejects too many structured page chunks", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",

      payload: {
        question: "Hello",
        pageContext: {
          chunks: Array.from({ length: 121 }, () => ({
            kind: "paragraph",
            text: "Page content",
          })),
        },
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("does not expose the retired usage endpoint", async () => {
    const res = await app.inject({ method: "GET", url: "/api/usage" });
    expect(res.statusCode).toBe(404);
  });

  it("allows server-configured requests beyond the former allowance without a client ID", async () => {
    for (let index = 0; index < 12; index += 1) {
      const res = await app.inject({
        method: "POST",
        url: "/api/ask",
        payload: { question: `Question ${index + 1}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers["x-quip-free-remaining"]).toBeUndefined();
      expect(res.json()).not.toHaveProperty("usageStatus");
    }
    expect(callLLM).toHaveBeenLastCalledWith(expect.any(Array), undefined);
  });

  it("forwards BYOK credentials and model to the selected provider", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",
      headers: {
        "x-quip-llm-provider": "openai",
        "x-quip-llm-model": "my-model",
        "x-quip-llm-api-key": "user-secret",
      },
      payload: { question: "Use my model" },
    });

    expect(res.statusCode).toBe(200);
    expect(vi.mocked(callLLM)).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        provider: "openai",
        model: "my-model",
        apiKey: "user-secret",
      }),
    );
  });

  it.each([
    ["openai", "gpt-4o-mini"],
    ["anthropic", "claude-sonnet-4-20250514"],
  ] as const)(
    "uses the default %s model when no custom model is supplied",
    async (provider, expectedModel) => {
      const res = await app.inject({
        method: "POST",
        url: "/api/ask",
        headers: {
          "x-quip-llm-provider": provider,
          "x-quip-llm-api-key": "user-secret",
        },
        payload: { question: "Use the default model" },
      });

      expect(res.statusCode).toBe(200);
      expect(vi.mocked(callLLM)).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          provider,
          model: expectedModel,
          apiKey: "user-secret",
        }),
      );
    },
  );

  it("routes local requests to a loopback OpenAI-compatible endpoint", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",
      headers: {
        "x-quip-llm-provider": "local",
        "x-quip-llm-base-url": "http://127.0.0.1:11434/v1/",
      },
      payload: { question: "Use my local model" },
    });

    expect(res.statusCode).toBe(200);
    expect(vi.mocked(callLLM)).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        provider: "local",
        model: "llama3.2",
        baseUrl: "http://127.0.0.1:11434/v1",
      }),
    );
  });

  it("rejects non-loopback local model endpoints", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/ask",
      headers: {
        "x-quip-llm-provider": "local",
        "x-quip-llm-base-url": "https://models.example.com/v1",
      },
      payload: { question: "Use a remote endpoint" },
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toMatchObject({
      code: "INVALID_LLM_CONFIG",
    });
    expect(callLLM).not.toHaveBeenCalled();
  });

  it("returns a provider error when a request fails", async () => {
    vi.mocked(callLLM).mockRejectedValueOnce(new Error("provider failure"));

    const res = await app.inject({
      method: "POST",
      url: "/api/ask",

      payload: { question: "Will this fail?" },
    });

    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body)).toMatchObject({
      code: "LLM_REQUEST_FAILED",
    });
  });

  it("returns a provider error when a stream fails to start", async () => {
    vi.mocked(streamLLM).mockImplementationOnce(async function* () {
      throw new Error("provider failure");
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/ask",

      payload: { question: "Stream this", stream: true },
    });

    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body)).toMatchObject({
      code: "LLM_REQUEST_FAILED",
    });
  });

  it("streams successful responses with CORS headers", async () => {
    vi.mocked(streamLLM).mockImplementationOnce(async function* () {
      yield "Hello";
      yield " world";
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/ask",
      headers: {
        origin: "https://example.com",
      },
      payload: { question: "Stream this", stream: true },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://example.com",
    );
    expect(res.headers["x-quip-free-remaining"]).toBeUndefined();
    expect(res.body).toContain('data: {"text":"Hello"}');
    expect(res.body).toContain('data: {"text":" world"}');
    expect(res.body).toContain("data: [DONE]");
  });

  it("reports an interrupted stream without a successful completion event", async () => {
    vi.mocked(streamLLM).mockImplementationOnce(async function* () {
      yield "Partial";
      throw new Error("stream failure");
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/ask",

      payload: { question: "Stream this", stream: true },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('"code":"LLM_STREAM_FAILED"');
    expect(res.body).not.toContain("data: [DONE]");
  });
  it.each(["openai", "anthropic"])(
    "rejects %s requests without a personal API key",
    async (provider) => {
      const res = await app.inject({
        method: "POST",
        url: "/api/ask",
        headers: { "x-quip-llm-provider": provider },
        payload: { question: "Hello" },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe("INVALID_LLM_CONFIG");
      expect(callLLM).not.toHaveBeenCalled();
    },
  );

  it.each(["openai", "anthropic", "local"])(
    "streams with the selected %s provider",
    async (provider) => {
      vi.mocked(streamLLM).mockImplementationOnce(async function* () {
        yield "Answer";
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/ask",
        headers: {
          "x-quip-llm-provider": provider,
          ...(provider === "local"
            ? {}
            : { "x-quip-llm-api-key": "personal-key" }),
        },
        payload: { question: "Hello", stream: true },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('data: {"text":"Answer"}');
      expect(streamLLM).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          provider,
          ...(provider === "local"
            ? { baseUrl: "http://127.0.0.1:11434/v1" }
            : { apiKey: "personal-key" }),
        }),
      );
    },
  );
});
