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

const app = Fastify({ logger: true });

await app.register(cors, getCorsOptions());
await app.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX || "60", 10),
  timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
});

app.register(healthRoute);
app.register(authPlugin);
app.register(askRoute, { prefix: "/api" });

const port = parseInt(process.env.API_PORT || "3000", 10);
await app.listen({ port, host: "0.0.0.0" });
