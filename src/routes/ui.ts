import type { FastifyPluginCallback, FastifyRequest } from "fastify";

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

function normalizeBaseUrl(value: string): string {
  let normalized = value;

  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function resolveForwardedValue(value: unknown): string | undefined {
  const single = toSingleValue(value);

  if (typeof single !== "string") {
    return undefined;
  }

  const candidate = single
    .split(",")[0]
    ?.trim();

  return candidate && candidate.length > 0 ? candidate : undefined;
}

function resolvePublicBaseUrl(request: FastifyRequest): string | undefined {
  const configured = process.env.PUBLIC_BASE_URL?.trim();

  if (configured) {
    return normalizeBaseUrl(configured);
  }

  const protocol = resolveForwardedValue(request.headers["x-forwarded-proto"]) ?? request.protocol;
  const host = resolveForwardedValue(request.headers["x-forwarded-host"] ?? request.headers.host);

  if (!host) {
    return undefined;
  }

  return normalizeBaseUrl(`${protocol}://${host}`);
}

const uiRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/", async (request, reply) => {
    const query = request.query as Record<string, unknown>;
    const source = extractPaymentSource(query);
    const language = resolveLanguage(query);
    const publicBaseUrl = resolvePublicBaseUrl(request);
    const resetLink = buildResetLink(language);
    const switchLinks = buildLanguageLinks(query);
    const assetVersion = process.env.ASSET_VERSION ?? "20260329-payable-by-1";

    if (!hasAnyPaymentField(source)) {
      reply.type("text/html; charset=utf-8");
      return renderHomePage({
        assetVersion,
        formValues: {},
        language,
        publicBaseUrl,
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
        publicBaseUrl,
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
        publicBaseUrl,
        resetLink,
        switchLinks
      });
    }
  });

  done();
};

export default uiRoutes;
