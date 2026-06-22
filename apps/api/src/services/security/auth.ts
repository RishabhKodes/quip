import { timingSafeEqual } from "node:crypto";
import fastifyPlugin from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

const authPluginFn: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (request, reply) => {
    if (request.url.split("?", 1)[0] === "/health") return;

    const apiKey = process.env.QUIP_API_KEY;
    if (!apiKey) return;

    const header = request.headers["x-quip-api-key"];
    const providedKey = Array.isArray(header) ? header[0] : header;
    if (!providedKey || !secretsMatch(providedKey, apiKey)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
};

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export const authPlugin = fastifyPlugin(authPluginFn, {
  name: "quip-auth",
});
