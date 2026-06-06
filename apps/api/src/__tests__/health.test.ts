import { describe, it, expect, beforeEach } from "vitest";
import Fastify from "fastify";
import { healthRoute } from "../routes/health.js";

describe("/health", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(healthRoute);
    await app.ready();
  });

  it("returns ok", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
  });
});
