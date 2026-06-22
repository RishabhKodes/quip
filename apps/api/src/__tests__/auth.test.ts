import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import { authPlugin } from "../services/security/auth.js";

describe("auth middleware", () => {
  let app: ReturnType<typeof Fastify>;
  const originalKey = process.env.QUIP_API_KEY;

  beforeEach(async () => {
    app = Fastify();
    await app.register(authPlugin);
    app.get("/test", async () => ({ ok: true }));
    app.get("/health", async () => ({ ok: true }));
    await app.ready();
  });

  afterEach(() => {
    if (originalKey) {
      process.env.QUIP_API_KEY = originalKey;
    } else {
      delete process.env.QUIP_API_KEY;
    }
  });

  it("allows requests when no API key is configured", async () => {
    delete process.env.QUIP_API_KEY;
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(200);
  });

  it("rejects requests without API key when key is configured", async () => {
    process.env.QUIP_API_KEY = "test-secret";
    const res = await app.inject({ method: "GET", url: "/test" });
    expect(res.statusCode).toBe(401);
  });

  it("allows requests with correct API key", async () => {
    process.env.QUIP_API_KEY = "test-secret";
    const res = await app.inject({
      method: "GET",
      url: "/test",
      headers: { "x-quip-api-key": "test-secret" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("rejects requests with wrong API key", async () => {
    process.env.QUIP_API_KEY = "test-secret";
    const res = await app.inject({
      method: "GET",
      url: "/test",
      headers: { "x-quip-api-key": "wrong-key" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("always allows health endpoint regardless of auth", async () => {
    process.env.QUIP_API_KEY = "test-secret";
    const res = await app.inject({ method: "GET", url: "/health?probe=true" });
    expect(res.statusCode).toBe(200);
  });
});
