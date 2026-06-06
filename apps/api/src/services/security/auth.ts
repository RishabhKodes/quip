import type { FastifyInstance, FastifyPluginAsync } from "fastify";

const authPluginFn: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health") return;

    const apiKey = process.env.QUIP_API_KEY;
    if (!apiKey) return;

    const header = request.headers["x-quip-api-key"];
    if (header !== apiKey) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
};

(authPluginFn as unknown as Record<symbol, boolean>)[
  Symbol.for("skip-override")
] = true;

export { authPluginFn as authPlugin };
