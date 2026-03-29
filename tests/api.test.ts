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
});
