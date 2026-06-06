import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import { askRoute } from "../routes/ask.js";
import { callLLM } from "../services/llm/llmClient.js";
import { MemoryFreeUsageStore } from "../services/usage/freeUsageStore.js";

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
  const clientId = "f1f31f6c-3482-4c1f-96e6-6e5cb91224a4";

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await app.register(askRoute, {
      prefix: "/api",
      usageStore: new MemoryFreeUsageStore(),
    });
    await app.ready();
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
      headers: { "x-quip-client-id": clientId },
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
      headers: { "x-quip-client-id": clientId },
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

  it("reports free usage for a client", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/usage",
      headers: { "x-quip-client-id": clientId },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      limit: 10,
      used: 0,
      remaining: 10,
    });
  });

  it("blocks the eleventh free request", async () => {
    for (let index = 0; index < 10; index += 1) {
      const res = await app.inject({
        method: "POST",
        url: "/api/ask",
        headers: { "x-quip-client-id": clientId },
        payload: { question: `Question ${index + 1}` },
      });
      expect(res.statusCode).toBe(200);
    }

    const blocked = await app.inject({
      method: "POST",
      url: "/api/ask",
      headers: { "x-quip-client-id": clientId },
      payload: { question: "Question 11" },
    });

    expect(blocked.statusCode).toBe(402);
    expect(JSON.parse(blocked.body)).toMatchObject({
      code: "FREE_LIMIT_REACHED",
      usageStatus: { limit: 10, used: 10, remaining: 0 },
    });
  });

  it("forwards BYOK provider settings without using free quota", async () => {
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

    const usage = await app.inject({
      method: "GET",
      url: "/api/usage",
      headers: { "x-quip-client-id": clientId },
    });
    expect(JSON.parse(usage.body).remaining).toBe(10);
  });
});
