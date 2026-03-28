import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? "3000");
const host = process.env.HOST ?? "0.0.0.0";
const logLevel = process.env.LOG_LEVEL ?? "info";
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? "60");
const rateLimitWindow = process.env.RATE_LIMIT_WINDOW ?? "1 minute";

const app = buildApp({
  logLevel,
  rateLimitMax,
  rateLimitWindow
});

try {
  await app.listen({
    host,
    port
  });
} catch (error) {
  app.log.error(error, "Server failed to start");
  process.exit(1);
}
