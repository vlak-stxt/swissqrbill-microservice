import type { FastifyPluginCallback, FastifyReply } from "fastify";

import type { OutputFormat } from "../types/payment.js";
import { buildMetadata, renderPdf, renderSvg, type BillLanguage } from "../services/qr-bill.js";
import { extractPaymentSource, asBoolean, toSingleValue } from "../utils/http.js";
import { RequestValidationError, parsePaymentInput, type ValidationLanguage } from "../validators/payment.js";

function resolveFormat(queryFormat: unknown, acceptHeader: string | undefined): OutputFormat {
  const single = toSingleValue(queryFormat);

  if (typeof single === "string" && ["json", "pdf", "svg"].includes(single)) {
    return single as OutputFormat;
  }

  if (acceptHeader?.includes("application/pdf")) {
    return "pdf";
  }

  if (acceptHeader?.includes("image/svg+xml")) {
    return "svg";
  }

  return "json";
}

function buildApiErrorPayload(error: unknown) {
  if (error instanceof RequestValidationError) {
    return {
      error: "validation_error",
      issues: error.issues,
      success: false
    };
  }

  return {
    error: "internal_error",
    message: "Unable to generate Swiss QR Bill.",
    success: false
  };
}

function resolveBillLanguage(queryLanguage: unknown, acceptLanguageHeader: string | undefined): BillLanguage {
  const single = toSingleValue(queryLanguage);

  if (single === "de") {
    return "DE";
  }

  if (single === "en") {
    return "EN";
  }

  if (acceptLanguageHeader?.toLowerCase().includes("de")) {
    return "DE";
  }

  return "EN";
}

function toValidationLanguage(language: BillLanguage): ValidationLanguage {
  return language === "DE" ? "de" : "en";
}

const apiRoutes: FastifyPluginCallback = (app, _options, done) => {
  const handle = async (
    source: Record<string, unknown>,
    options: {
      accept?: string | undefined;
      acceptLanguage?: string | undefined;
      download?: boolean | undefined;
      format?: unknown;
      reply: FastifyReply;
    }
  ) => {
    const format = resolveFormat(options.format, options.accept);
    const language = resolveBillLanguage(source.lang, options.acceptLanguage);
    const input = parsePaymentInput(extractPaymentSource(source), toValidationLanguage(language));
    const metadata = buildMetadata(input, language);

    if (format === "json") {
      return options.reply.send({
        downloadUrl: metadata.links.svgUrl,
        downloads: {
          pdf: metadata.links.pdfUrl,
          svg: metadata.links.svgUrl
        },
        format: "json",
        generatedAt: metadata.generatedAt,
        input: metadata.input,
        previewUrl: metadata.links.previewUrl,
        success: true
      });
    }

    if (format === "svg") {
      const svg = renderSvg(input, language);
      options.reply.type("image/svg+xml; charset=utf-8");

      if (options.download) {
        options.reply.header("Content-Disposition", 'attachment; filename="swiss-qr-bill.svg"');
      }

      return options.reply.send(svg);
    }

    const pdf = await renderPdf(input, language);
    options.reply.type("application/pdf");

    if (options.download) {
      options.reply.header("Content-Disposition", 'attachment; filename="swiss-qr-bill.pdf"');
    }

    return options.reply.send(pdf);
  };

  app.get("/api/qr", async (request, reply) => {
    try {
      return await handle(request.query as Record<string, unknown>, {
        accept: request.headers.accept,
        acceptLanguage: request.headers["accept-language"],
        download: asBoolean((request.query as Record<string, unknown>).download),
        format: (request.query as Record<string, unknown>).format,
        reply
      });
    } catch (error) {
      request.log.error({ err: error }, "GET /api/qr failed");
      const statusCode = error instanceof RequestValidationError ? 400 : 500;
      return reply.status(statusCode).send(buildApiErrorPayload(error));
    }
  });

  app.post("/api/qr", async (request, reply) => {
    const body = (request.body as Record<string, unknown> | undefined) ?? {};
    const query = request.query as Record<string, unknown>;

    try {
      return await handle(body, {
        accept: request.headers.accept,
        acceptLanguage: request.headers["accept-language"],
        download: asBoolean(query.download),
        format: query.format,
        reply
      });
    } catch (error) {
      request.log.error({ err: error }, "POST /api/qr failed");
      const statusCode = error instanceof RequestValidationError ? 400 : 500;
      return reply.status(statusCode).send(buildApiErrorPayload(error));
    }
  });
  done();
};

export default apiRoutes;
