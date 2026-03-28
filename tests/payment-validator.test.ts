import { describe, expect, it } from "vitest";

import { parsePaymentInput, RequestValidationError } from "../src/validators/payment.js";

describe("payment validator", () => {
  it("accepts a valid CH IBAN payload", () => {
    const parsed = parsePaymentInput({
      city: "Sitterdorf",
      iban: "CH8109000000853815289",
      name: "Gebruder Pneu Edelmann GmbH",
      postcode: "8589",
      street: "St. Gallerstrasse"
    });

    expect(parsed.currency).toBe("CHF");
    expect(parsed.iban).toBe("CH8109000000853815289");
  });

  it("rejects an empty payee name", () => {
    expect(() =>
      parsePaymentInput({
        city: "Sitterdorf",
        iban: "CH8109000000853815289",
        name: "",
        postcode: "8589",
        street: "St. Gallerstrasse"
      })
    ).toThrow(RequestValidationError);
  });

  it("rejects an invalid IBAN", () => {
    expect(() =>
      parsePaymentInput({
        city: "Sitterdorf",
        iban: "CH0000000000000000000",
        name: "Gebruder Pneu Edelmann GmbH",
        postcode: "8589",
        street: "St. Gallerstrasse"
      })
    ).toThrow(RequestValidationError);
  });
});
