import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { validPaymentQuery } from "./fixtures/payment.js";

const originalPublicBaseUrl = process.env.PUBLIC_BASE_URL;

afterEach(() => {
  if (originalPublicBaseUrl === undefined) {
    delete process.env.PUBLIC_BASE_URL;
    return;
  }

  process.env.PUBLIC_BASE_URL = originalPublicBaseUrl;
});

describe("UI form", () => {
  it("renders empty form when no payment fields are provided", async () => {
    const app = buildApp({ logLevel: "silent", rateLimitMax: 100, rateLimitWindow: "1 minute" });
    await app.ready();

    try {
      const response = await app.inject({ method: "GET", url: "/" });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/html");
      expect(response.body).not.toContain("class=\"results\"");
    } finally {
      await app.close();
    }
  });

  it("renders validation errors when invalid payment data is submitted", async () => {
    const app = buildApp({ logLevel: "silent", rateLimitMax: 100, rateLimitWindow: "1 minute" });
    await app.ready();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/?name=&street=Main&postcode=8000&city=Zurich&iban=CH0000000000000000000"
      });
      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/html");
      expect(response.body).toContain("Required field.");
    } finally {
      await app.close();
    }
  });
});

describe("UI embed URLs", () => {
  it("builds the embed snippet from the forwarded request host by default", async () => {
    delete process.env.PUBLIC_BASE_URL;

    const app = buildApp({
      logLevel: "silent",
      rateLimitMax: 100,
      rateLimitWindow: "1 minute"
    });

    await app.ready();

    try {
      const response = await app.inject({
        headers: {
          "x-forwarded-host": "billing.example.com",
          "x-forwarded-proto": "https"
        },
        method: "GET",
        url: `/?${validPaymentQuery.slice("/api/qr?".length)}&lang=en`
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("https://billing.example.com/api/qr?");
      expect(response.body).not.toContain("https://qr.ua-in.ch/");
    } finally {
      await app.close();
    }
  });

  it("prefers PUBLIC_BASE_URL when configured", async () => {
    process.env.PUBLIC_BASE_URL = "https://public.example.com/";

    const app = buildApp({
      logLevel: "silent",
      rateLimitMax: 100,
      rateLimitWindow: "1 minute"
    });

    await app.ready();

    try {
      const response = await app.inject({
        headers: {
          host: "internal-service:3000"
        },
        method: "GET",
        url: `/?${validPaymentQuery.slice("/api/qr?".length)}&lang=en`
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("https://public.example.com/api/qr?");
      expect(response.body).not.toContain("https://public.example.com//api/qr?");
    } finally {
      await app.close();
    }
  });
});
