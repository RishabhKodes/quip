import type { FastifyCorsOptions } from "@fastify/cors";

export function getCorsOptions(): FastifyCorsOptions {
  const allowedOrigins = process.env.CORS_ORIGINS;

  if (!allowedOrigins) {
    return {
      origin: true,
      exposedHeaders: [
        "x-quip-free-limit",
        "x-quip-free-used",
        "x-quip-free-remaining",
      ],
    };
  }

  const origins = allowedOrigins.split(",").map((o) => o.trim());

  return {
    exposedHeaders: [
      "x-quip-free-limit",
      "x-quip-free-used",
      "x-quip-free-remaining",
    ],
    origin: (origin, cb) => {
      if (!origin || origins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
  };
}
