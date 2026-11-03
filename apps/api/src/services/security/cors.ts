import type { FastifyCorsOptions } from "@fastify/cors";

export function getCorsOptions(): FastifyCorsOptions {
  const allowedOrigins = process.env.CORS_ORIGINS;

  if (!allowedOrigins) {
    return {
      origin: process.env.NODE_ENV === "production" ? false : true,
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
