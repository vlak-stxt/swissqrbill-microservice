import type { FastifyPluginCallback } from "fastify";

const healthRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/health", () => ({
    service: "swissqrbill-microservice",
    status: "ok",
    timestamp: new Date().toISOString()
  }));

  done();
};

export default healthRoutes;
