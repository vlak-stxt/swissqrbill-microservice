import type { FastifyPluginCallback } from "fastify";

import { buildMetadata, renderSvg } from "../services/qr-bill.js";
import type { PaymentInput } from "../types/payment.js";
import { extractPaymentSource, hasAnyPaymentField, toSingleValue } from "../utils/http.js";
import { renderHomePage } from "../views/page.js";
import { getValidationIssues, parsePaymentInput } from "../validators/payment.js";

function toFormValues(source: Record<string, unknown>): Partial<Record<keyof PaymentInput, string>> {
  const values: Partial<Record<keyof PaymentInput, string>> = {};

  for (const [key, value] of Object.entries(source)) {
    const single = toSingleValue(value);

    if (typeof single === "number") {
      values[key as keyof PaymentInput] = String(single);
    }

    if (typeof single === "string") {
      values[key as keyof PaymentInput] = single;
    }
  }

  return values;
}

const uiRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const source = extractPaymentSource(query);

    if (!hasAnyPaymentField(source)) {
      reply.type("text/html; charset=utf-8");
      return renderHomePage({
        formValues: {}
      });
    }

    try {
      const input = parsePaymentInput(source);
      const metadata = buildMetadata(input);
      const metadataNote =
        input.bic !== undefined || input.address !== undefined || input.personalNote !== undefined
          ? "BIC, additional address, and personal note are preserved in metadata/summary and may not be encoded into the QR payload."
          : undefined;

      reply.type("text/html; charset=utf-8");
      return renderHomePage({
        formValues: toFormValues(source),
        links: metadata.links,
        metadataNote,
        summary: metadata.summary,
        svgMarkup: renderSvg(input)
      });
    } catch (error) {
      request.log.info({ err: error }, "UI validation failed");
      reply.type("text/html; charset=utf-8");
      return renderHomePage({
        errors: getValidationIssues(error),
        formValues: toFormValues(source)
      });
    }
  });

  done();
};

export default uiRoutes;
