import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { askRoute } from "./routes/ask.js";
import { healthRoute } from "./routes/health.js";
import { authPlugin } from "./services/security/auth.js";
import { getCorsOptions } from "./services/security/cors.js";

const app = Fastify({
  bodyLimit: parsePositiveInteger(process.env.BODY_LIMIT_BYTES, 512 * 1024),
  trustProxy: process.env.TRUST_PROXY === "true",
  logger: {
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: [
        'req.headers["x-quip-api-key"]',
        'req.headers["x-quip-llm-api-key"]',
      ],
      censor: "[REDACTED]",
    },
  },
});

await app.register(cors, getCorsOptions());
await app.register(rateLimit, {
  max: parsePositiveInteger(process.env.RATE_LIMIT_MAX, 60),
  timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
});

await app.register(healthRoute);
await app.register(authPlugin);
await app.register(askRoute, { prefix: "/api" });

const port = parsePositiveInteger(process.env.API_PORT, 3000);
const host = process.env.API_HOST || "127.0.0.1";
await app.listen({ port, host });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
