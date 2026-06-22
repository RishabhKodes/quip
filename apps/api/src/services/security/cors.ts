import type { FastifyCorsOptions } from "@fastify/cors";

export function getCorsOptions(): FastifyCorsOptions {
  const allowedOrigins = process.env.CORS_ORIGINS;
  const exposedHeaders = [
    "x-quip-free-limit",
    "x-quip-free-used",
    "x-quip-free-remaining",
  ];

  if (!allowedOrigins) {
    return {
      origin: process.env.NODE_ENV === "production" ? false : true,
      exposedHeaders,
      methods: ["GET", "POST", "OPTIONS"],
      maxAge: 86400,
    };
  }

  const origins = allowedOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowAllOrigins = origins.includes("*");

  return {
    exposedHeaders,
    methods: ["GET", "POST", "OPTIONS"],
    maxAge: 86400,
    origin: (origin, cb) => {
      if (!origin || allowAllOrigins || origins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
  };
}
