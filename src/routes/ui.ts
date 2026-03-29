import type { FastifyPluginCallback } from "fastify";

import { buildMetadata, renderSvg, type BillLanguage } from "../services/qr-bill.js";
import type { PaymentInput } from "../types/payment.js";
import { extractPaymentSource, hasAnyPaymentField, toSingleValue } from "../utils/http.js";
import { renderHomePage, type UiLanguage } from "../views/page.js";
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

function resolveLanguage(query: Record<string, unknown>): UiLanguage {
  const language = toSingleValue(query.lang);
  return language === "de" ? "de" : "en";
}

function toBillLanguage(language: UiLanguage): BillLanguage {
  return language === "de" ? "DE" : "EN";
}

function buildLanguageLinks(query: Record<string, unknown>): Record<UiLanguage, string> {
  const build = (language: UiLanguage) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      const single = toSingleValue(value);
      if (typeof single === "string" && single.length > 0) {
        params.set(key, single);
      }
      if (typeof single === "number") {
        params.set(key, String(single));
      }
    }

    params.set("lang", language);
    return `/?${params.toString()}`;
  };

  return {
    de: build("de"),
    en: build("en")
  };
}

function buildResetLink(language: UiLanguage): string {
  return `/?lang=${language}`;
}

const uiRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const source = extractPaymentSource(query);
    const language = resolveLanguage(query);
    const resetLink = buildResetLink(language);
    const switchLinks = buildLanguageLinks(query);
    const assetVersion = process.env.ASSET_VERSION ?? "20260329-ui-3";

    if (!hasAnyPaymentField(source)) {
      reply.type("text/html; charset=utf-8");
      return renderHomePage({
        assetVersion,
        formValues: {},
        language,
        resetLink,
        switchLinks
      });
    }

    try {
      const input = parsePaymentInput(source, language);
      const billLanguage = toBillLanguage(language);
      const metadata = buildMetadata(input, billLanguage);
      const metadataNote =
        input.address !== undefined || input.personalNote !== undefined
          ? language === "de"
            ? "Zusätzliche Adresse und persönliche Notiz bleiben in Metadata und Zusammenfassung erhalten und werden nicht zwingend im QR-Payload codiert."
            : "Additional address and personal note are preserved in metadata/summary and may not be encoded into the QR payload."
          : undefined;

      reply.type("text/html; charset=utf-8");
      return renderHomePage({
        assetVersion,
        formValues: toFormValues(source),
        language,
        links: metadata.links,
        metadataNote,
        resetLink,
        switchLinks,
        summary: metadata.summary,
        svgMarkup: renderSvg(input, billLanguage)
      });
    } catch (error) {
      request.log.info({ err: error }, "UI validation failed");
      reply.type("text/html; charset=utf-8");
      return renderHomePage({
        assetVersion,
        errors: getValidationIssues(error, language),
        formValues: toFormValues(source),
        language,
        resetLink,
        switchLinks
      });
    }
  });

  done();
};

export default uiRoutes;
