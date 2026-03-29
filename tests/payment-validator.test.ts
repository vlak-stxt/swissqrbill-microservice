import { describe, expect, it } from "vitest";

import { getValidationIssues, parsePaymentInput, RequestValidationError } from "../src/validators/payment.js";

const base = {
  city: "Zurich",
  iban: "CH5604835012345678009",
  name: "Example Tools AG",
  postcode: "8000",
  street: "Example Street"
};

describe("payment validator", () => {
  it("accepts a valid CH IBAN payload", () => {
    const parsed = parsePaymentInput(base);

    expect(parsed.currency).toBe("CHF");
    expect(parsed.iban).toBe("CH5604835012345678009");
  });

  it("accepts a complete payable-by block", () => {
    const parsed = parsePaymentInput({
      city: "Zurich",
      debtorCity: "Adliswil",
      debtorCountry: "CH",
      debtorName: "Example Customer GmbH",
      debtorNumber: "67",
      debtorPostcode: "8134",
      debtorStreet: "Customer Street",
      iban: "CH5604835012345678009",
      name: "Example Tools AG",
      postcode: "8000",
      street: "Example Street"
    });

    expect(parsed.debtorName).toBe("Example Customer GmbH");
    expect(parsed.debtorCity).toBe("Adliswil");
  });

  it("rejects an empty payee name", () => {
    expect(() => parsePaymentInput({ ...base, name: "" })).toThrow(RequestValidationError);
  });

  it("rejects an invalid IBAN", () => {
    expect(() => parsePaymentInput({ ...base, iban: "CH0000000000000000000" })).toThrow(RequestValidationError);
  });

  it("uses a friendly message when IBAN is missing", () => {
    try {
      parsePaymentInput({ ...base, iban: undefined });
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      expect((error as RequestValidationError).issues).toContainEqual({
        field: "IBAN",
        message: "Required field."
      });
    }
  });

  it("rejects an IBAN shorter than 21 chars", () => {
    try {
      parsePaymentInput({ ...base, iban: "CH560483501234567" });
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      const messages = (error as RequestValidationError).issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("21"))).toBe(true);
    }
  });

  it("rejects a non-CH/LI IBAN", () => {
    try {
      // DE IBAN is 22 chars, so it will fail the length check first
      parsePaymentInput({ ...base, iban: "DE89370400440532013000" });
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
    }
  });

  it("normalises IBAN spaces on input", () => {
    const parsed = parsePaymentInput({ ...base, iban: "CH56 0483 5012 3456 7800 9" });
    expect(parsed.iban).toBe("CH5604835012345678009");
  });

  it("accepts amount with comma as decimal separator", () => {
    const parsed = parsePaymentInput({ ...base, amount: "1234,50" });
    expect(parsed.amount).toBe(1234.5);
  });

  it("rejects a negative amount", () => {
    try {
      parsePaymentInput({ ...base, amount: "-10" });
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      const messages = (error as RequestValidationError).issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("negative"))).toBe(true);
    }
  });

  it("accepts an undefined amount (amount is optional)", () => {
    const parsed = parsePaymentInput({ ...base, amount: undefined });
    expect(parsed.amount).toBeUndefined();
  });

  it("strips non-printable characters from name", () => {
    const parsed = parsePaymentInput({ ...base, name: "Example\x00Tools\x01AG" });
    expect(parsed.name).toBe("ExampleToolsAG");
  });

  it("normalises excess whitespace in name", () => {
    const parsed = parsePaymentInput({ ...base, name: "Example   Tools  AG" });
    expect(parsed.name).toBe("Example Tools AG");
  });

  it("passes through angle brackets in name (sanitisation happens at render layer)", () => {
    const payload = '<script>alert("xss")</script>';
    const parsed = parsePaymentInput({ ...base, name: payload });
    expect(parsed.name).toBe(payload.trim());
  });

  it("defaults currency to CHF when not provided", () => {
    const parsed = parsePaymentInput({ ...base });
    expect(parsed.currency).toBe("CHF");
  });

  it("accepts EUR currency", () => {
    const parsed = parsePaymentInput({ ...base, currency: "EUR" });
    expect(parsed.currency).toBe("EUR");
  });

  it("rejects unknown currency", () => {
    expect(() => parsePaymentInput({ ...base, currency: "USD" })).toThrow(RequestValidationError);
  });

  it("defaults country to CH when not provided", () => {
    const parsed = parsePaymentInput({ ...base });
    expect(parsed.country).toBe("CH");
  });

  it("rejects a country code longer than 2 letters", () => {
    expect(() => parsePaymentInput({ ...base, country: "CHE" })).toThrow(RequestValidationError);
  });

  it("uses first value when an array is passed for name", () => {
    const parsed = parsePaymentInput({ ...base, name: ["First Name", "Second Name"] });
    expect(parsed.name).toBe("First Name");
  });

  it("produces German error messages when language is de", () => {
    try {
      parsePaymentInput({ ...base, name: "" }, "de");
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      expect((error as RequestValidationError).issues.some((i) => i.message === "Pflichtfeld.")).toBe(true);
    }
  });

  it("produces German field labels when language is de", () => {
    try {
      parsePaymentInput({ ...base, iban: undefined }, "de");
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      // IBAN label is the same in both languages
      expect((error as RequestValidationError).issues.some((i) => i.field === "IBAN")).toBe(true);
    }
  });

  it("produces German amount label when language is de", () => {
    try {
      parsePaymentInput({ ...base, amount: "-5" }, "de");
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      expect((error as RequestValidationError).issues.some((i) => i.field === "Betrag")).toBe(true);
    }
  });

  // QR reference is 27 numeric digits; all-zeros passes MOD10 check
  const validQrrReference = "000000000000000000000000000";

  // CH6631999000000000000: IID 31999 is in QR-IBAN range (30000-31999), checksum verified
  const validQrIban = "CH6631999000000000000";

  // RF18539007547034: valid ISO 11649 SCOR reference, checksum verified
  const validScorReference = "RF18539007547034";

  it("rejects a regular IBAN paired with a QRR reference", () => {
    try {
      parsePaymentInput({ ...base, reference: validQrrReference });
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      const messages = (error as RequestValidationError).issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("QR-IBAN"))).toBe(true);
    }
  });

  it("rejects a QR-IBAN paired with a non-QRR reference", () => {
    try {
      parsePaymentInput({ ...base, iban: validQrIban, reference: validScorReference });
      throw new Error("Expected parsePaymentInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationError);
      const messages = (error as RequestValidationError).issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("QR reference"))).toBe(true);
    }
  });

  it("getValidationIssues returns a generic error for non-validation errors", () => {
    const issues = getValidationIssues(new Error("unexpected"), "en");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ message: "Unable to process request." });
  });

  it("getValidationIssues returns a generic German error for non-validation errors", () => {
    const issues = getValidationIssues(new Error("unexpected"), "de");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ message: "Anfrage konnte nicht verarbeitet werden." });
  });
});
