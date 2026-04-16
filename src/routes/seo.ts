import type { FastifyPluginCallback } from "fastify";

const seoRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/robots.txt", (_request, reply) => {
    const baseUrl = process.env.PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
    const lines = ["User-agent: *", "Allow: /"];
    if (baseUrl) {
      lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
    }
    reply.type("text/plain").send(lines.join("\n") + "\n");
  });

  app.get("/sitemap.xml", (_request, reply) => {
    const baseUrl = process.env.PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
    if (!baseUrl) {
      reply.status(404).send();
      return;
    }
    const now = new Date().toISOString().split("T")[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    reply.type("application/xml").send(xml);
  });

  done();
};

export default seoRoutes;
