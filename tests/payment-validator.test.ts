import { describe, expect, it } from "vitest";

import { parsePaymentInput, RequestValidationError } from "../src/validators/payment.js";

describe("payment validator", () => {
  it("accepts a valid CH IBAN payload", () => {
    const parsed = parsePaymentInput({
      city: "Zurich",
      iban: "CH5604835012345678009",
      name: "Example Tools AG",
      postcode: "8000",
      street: "Example Street"
    });

    expect(parsed.currency).toBe("CHF");
    expect(parsed.iban).toBe("CH5604835012345678009");
  });

  it("rejects an empty payee name", () => {
    expect(() =>
      parsePaymentInput({
        city: "Zurich",
        iban: "CH5604835012345678009",
        name: "",
        postcode: "8000",
        street: "Example Street"
      })
    ).toThrow(RequestValidationError);
  });

  it("rejects an invalid IBAN", () => {
    expect(() =>
      parsePaymentInput({
        city: "Zurich",
        iban: "CH0000000000000000000",
        name: "Example Tools AG",
        postcode: "8000",
        street: "Example Street"
      })
    ).toThrow(RequestValidationError);
  });

  it("uses a friendly message when IBAN is missing", () => {
    try {
      parsePaymentInput({
        city: "Zurich",
        name: "Example Tools AG",
        postcode: "8000",
        street: "Example Street"
      });
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      expect((error as RequestValidationError).issues).toContainEqual({
        field: "IBAN",
        message: "Required field."
      });
    }
  });
});
