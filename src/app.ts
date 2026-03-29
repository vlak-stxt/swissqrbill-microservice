import { fileURLToPath } from "node:url";
import path from "node:path";

import Fastify from "fastify";
import formbody from "@fastify/formbody";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";

import apiRoutes from "./routes/api.js";
import healthRoutes from "./routes/health.js";
import uiRoutes from "./routes/ui.js";

export interface AppOptions {
  logLevel?: string;
  rateLimitMax: number;
  rateLimitWindow: string;
}

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export function buildApp(options: AppOptions) {
  const app = Fastify({
    bodyLimit: 64 * 1024,
    logger: {
      level: options.logLevel ?? "info"
    }
  });

  app.addHook("onRequest", async (request, reply) => {
    if (request.url.length > 4096) {
      return reply.status(414).send({
        error: "uri_too_long",
        message: "Request URL is too long."
      });
    }
  });

  app.addHook("onSend", async (request, reply, payload) => {
    if (request.url.startsWith("/public/")) {
      reply.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      reply.header("Pragma", "no-cache");
      reply.header("Expires", "0");
      reply.header("Surrogate-Control", "no-store");
    }

    return payload;
  });

  app.register(formbody);
  app.register(rateLimit, {
    max: options.rateLimitMax,
    timeWindow: options.rateLimitWindow
  });
  app.register(fastifyStatic, {
    cacheControl: false,
    etag: false,
    lastModified: false,
    prefix: "/public/",
    root: path.join(currentDir, "..", "public")
  });

  app.register(healthRoutes);
  app.register(uiRoutes);
  app.register(apiRoutes);

  return app;
}
