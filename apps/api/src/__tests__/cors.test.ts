import cors from "@fastify/cors";
import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { getCorsOptions } from "../services/security/cors.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalOrigins = process.env.CORS_ORIGINS;

afterEach(() => {
  restoreEnvironmentVariable("NODE_ENV", originalNodeEnv);
  restoreEnvironmentVariable("CORS_ORIGINS", originalOrigins);
});

describe("CORS configuration", () => {
  it("does not allow browser origins by default in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.CORS_ORIGINS;

    const app = Fastify();
    await app.register(cors, getCorsOptions());
    app.get("/test", async () => ({ ok: true }));

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: { origin: "https://example.com" },
    });

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows explicitly configured origins", async () => {
    process.env.NODE_ENV = "production";
    process.env.CORS_ORIGINS = "https://example.com";

    const app = Fastify();
    await app.register(cors, getCorsOptions());
    app.get("/test", async () => ({ ok: true }));

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: { origin: "https://example.com" },
    });

    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://example.com",
    );
  });
});

function restoreEnvironmentVariable(
  name: string,
  value: string | undefined,
): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
