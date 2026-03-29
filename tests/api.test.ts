import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { validPaymentInput, validPaymentQuery } from "./fixtures/payment.js";

describe("/api/qr", () => {
  const app = buildApp({
    logLevel: "silent",
    rateLimitMax: 100,
    rateLimitWindow: "1 minute"
  });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns JSON metadata for GET requests", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${validPaymentQuery}&format=json`
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.json()).toMatchObject({
      format: "json",
      success: true
    });
  });

  it("returns SVG for GET requests", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${validPaymentQuery}&format=svg`
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("image/svg+xml");
    expect(response.body).toContain("<svg");
  });

  it("returns PDF for POST requests", async () => {
    const response = await app.inject({
      method: "POST",
      payload: validPaymentInput,
      url: "/api/qr?format=pdf"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.rawPayload.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("returns validation errors for bad input", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/qr?street=Main&postcode=8000&city=Zurich&iban=CH0000000000000000000"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "validation_error",
      success: false
    });
  });

  it("serves public assets with cache headers instead of no-store", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/public/app.js"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toContain("max-age");
    expect(response.headers["cache-control"]).not.toContain("no-store");
  });

  it("adds Content-Disposition header when download=1", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${validPaymentQuery}&format=svg&download=1`
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-disposition"]).toContain("attachment");
  });

  it("returns German links (lang=de) in JSON response when lang=de", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${validPaymentQuery}&format=json&lang=de`
    });

    expect(response.statusCode).toBe(200);
    const body: { downloads?: { pdf?: string; svg?: string } } = response.json();
    expect(body.downloads?.pdf).toContain("lang=de");
    expect(body.downloads?.svg).toContain("lang=de");
  });

  it("returns German validation error via Accept-Language: de header", async () => {
    const response = await app.inject({
      headers: { "accept-language": "de" },
      method: "GET",
      url: "/api/qr?street=Main&postcode=8000&city=Zurich&iban=CH0000000000000000000"
    });

    expect(response.statusCode).toBe(400);
    const body: { issues?: Array<{ message: string }> } = response.json();
    const messages = body.issues?.map((i) => i.message) ?? [];
    expect(messages.some((m) => m.includes("ungültig") || m.includes("Pflichtfeld"))).toBe(true);
  });

  it("returns 414 when URL exceeds 4096 chars", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/qr?${"x".repeat(4100)}`
    });

    expect(response.statusCode).toBe(414);
  });

  it("returns JSON for unknown format", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${validPaymentQuery}&format=unknown`
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
  });

  it("ignores unknown query fields", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${validPaymentQuery}&format=json&unknownField=value`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ success: true });
  });

  it("returns validation_error issues array in response body", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/qr?name=&street=Main&postcode=8000&city=Zurich&iban=CH0000000000000000000"
    });

    const body: { issues?: unknown[] } = response.json();
    expect(response.statusCode).toBe(400);
    expect(Array.isArray(body.issues)).toBe(true);
    expect((body.issues ?? []).length).toBeGreaterThan(0);
  });
});
