import { describe, expect, it } from "vitest";

import { buildLinks, buildMetadata, buildSummary, renderPdf, renderSvg } from "../src/services/qr-bill.js";
import { validPaymentInput } from "./fixtures/payment.js";

describe("qr bill service", () => {
  it("renders SVG output", () => {
    const svg = renderSvg(validPaymentInput);

    expect(svg).toContain("<svg");
    expect(svg).toContain("Payment part");
    expect(svg).toContain("Example Tools AG");
  });

  it("renders German SVG output when requested", () => {
    const svg = renderSvg(validPaymentInput, "DE");

    expect(svg).toContain("<svg");
    expect(svg).toContain("Zahlteil");
  });

  it("renders PDF output", async () => {
    const pdf = await renderPdf(validPaymentInput);

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });

  it("PDF ends with %%EOF marker", async () => {
    const pdf = await renderPdf(validPaymentInput);
    const tail = pdf.subarray(-10).toString();
    expect(tail).toContain("%%EOF");
  });

  it("PDF contains expected payee name", async () => {
    const pdf = await renderPdf(validPaymentInput);
    // PDFs store strings in plain text for simple content
    expect(pdf.toString("latin1")).toContain("Example Tools AG");
  });

  it("builds links with correct path prefixes", () => {
    const links = buildLinks(validPaymentInput, "EN");

    expect(links.apiJsonUrl).toMatch(/^\/api\/qr\?/);
    expect(links.apiJsonUrl).toContain("format=json");
    expect(links.embedSvgUrl).toContain("format=svg");
    expect(links.pdfUrl).toContain("format=pdf");
    expect(links.pdfUrl).toContain("download=1");
    expect(links.svgUrl).toContain("download=1");
    expect(links.previewUrl).toMatch(/^\//);
  });

  it("builds links with correct language param", () => {
    const linksEn = buildLinks(validPaymentInput, "EN");
    const linksDe = buildLinks(validPaymentInput, "DE");

    expect(linksEn.apiJsonUrl).toContain("lang=en");
    expect(linksDe.apiJsonUrl).toContain("lang=de");
  });

  it("builds summary with required fields", () => {
    const summary = buildSummary(validPaymentInput, "EN");
    const labels = summary.map((r) => r.label);

    expect(labels).toContain("Payee");
    expect(labels).toContain("IBAN");
    expect(labels).toContain("Currency");
    expect(labels).toContain("Amount");
  });

  it("builds summary with German labels when requested", () => {
    const summary = buildSummary(validPaymentInput, "DE");
    const labels = summary.map((r) => r.label);

    expect(labels).toContain("Begünstigter");
    expect(labels).toContain("Währung");
  });

  it("omits optional fields from summary when not present", () => {
    const input = { ...validPaymentInput, amount: undefined, message: undefined, reference: undefined };
    const summary = buildSummary(input, "EN");
    const labels = summary.map((r) => r.label);

    expect(labels).not.toContain("Amount");
    expect(labels).not.toContain("Message");
    expect(labels).not.toContain("Reference");
  });

  it("buildMetadata returns generatedAt as ISO string", () => {
    const metadata = buildMetadata(validPaymentInput, "EN");

    expect(() => new Date(metadata.generatedAt)).not.toThrow();
    expect(new Date(metadata.generatedAt).toISOString()).toBe(metadata.generatedAt);
  });

  it("buildMetadata includes input and links", () => {
    const metadata = buildMetadata(validPaymentInput, "EN");

    expect(metadata.input).toBe(validPaymentInput);
    expect(metadata.links).toBeDefined();
    expect(metadata.summary.length).toBeGreaterThan(0);
  });
});
