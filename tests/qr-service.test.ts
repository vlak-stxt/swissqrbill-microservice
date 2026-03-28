import { describe, expect, it } from "vitest";

import { renderPdf, renderSvg } from "../src/services/qr-bill.js";
import { validPaymentInput } from "./fixtures/payment.js";

describe("qr bill service", () => {
  it("renders SVG output", () => {
    const svg = renderSvg(validPaymentInput);

    expect(svg).toContain("<svg");
    expect(svg).toContain("Payment part");
    expect(svg).toContain("Gebruder Pneu Edelmann GmbH");
  });

  it("renders PDF output", async () => {
    const pdf = await renderPdf(validPaymentInput);

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });
});
