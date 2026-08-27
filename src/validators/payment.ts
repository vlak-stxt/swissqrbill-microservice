import { z, type ZodIssue } from "zod";
import {
  getReferenceType,
  isIBANValid,
  isQRIBAN,
  isQRReferenceValid,
  isSCORReferenceValid
} from "swissqrbill/utils";

import type { PaymentInput, ValidationIssue } from "../types/payment.js";
import { toSingleValue } from "../utils/http.js";

export type ValidationLanguage = "de" | "en";

function isPrintableCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0);
  return codePoint !== undefined && (codePoint >= 32 || codePoint === 10) && codePoint !== 127;
}

function sanitizeString(value: unknown): string | undefined {
  const single = toSingleValue(value);

  if (single === undefined || single === null) {
    return undefined;
  }

  if (typeof single === "number") {
    return String(single);
  }

  if (typeof single !== "string") {
    return undefined;
  }

  const cleaned = [...single].filter(isPrintableCharacter).join("").trim().replace(/\s+/g, " ");
  return cleaned.length > 0 ? cleaned : undefined;
}

function sanitizeUppercaseString(value: unknown): string | undefined {
  const cleaned = sanitizeString(value);
  return cleaned?.toUpperCase();
}

function sanitizeIban(value: unknown): string | undefined {
  const cleaned = sanitizeUppercaseString(value);
  return cleaned?.replaceAll(" ", "");
}

function sanitizeReference(value: unknown): string | undefined {
  const cleaned = sanitizeUppercaseString(value);
  return cleaned?.replaceAll(" ", "");
}

function sanitizeAmount(value: unknown): number | undefined {
  const single = toSingleValue(value);

  if (single === undefined || single === null || single === "") {
    return undefined;
  }

  if (typeof single === "number") {
    return Number.isFinite(single) ? single : Number.NaN;
  }

  if (typeof single !== "string") {
    return Number.NaN;
  }

  const normalized = single.trim().replace(",", ".");
  if (normalized.length === 0) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

const optionalString = (max: number) =>
  z.preprocess((value) => sanitizeString(value), z.string().max(max).optional());

const requiredString = (max: number) =>
  z.preprocess((value) => sanitizeString(value) ?? "", z.string().min(1, "Required field.").max(max));

const requiredIban = z.preprocess(
  (value) => sanitizeIban(value) ?? "",
  z.string().superRefine((value, ctx) => {
    if (value.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required field."
      });
      return;
    }

    if (value.length !== 21) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IBAN must be 21 characters after removing spaces."
      });
      return;
    }

    if (!/^(CH|LI)/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only CH and LI IBANs are supported."
      });
      return;
    }

    if (!isIBANValid(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IBAN checksum is invalid."
      });
    }
  })
);

const paymentSchema = z
  .object({
    name: requiredString(70),
    street: requiredString(70),
    number: optionalString(16),
    postcode: z.preprocess((value) => sanitizeString(value) ?? "", z.string().min(1, "Required field.").max(16)),
    city: requiredString(35),
    debtorName: optionalString(70),
    debtorStreet: optionalString(70),
    debtorNumber: optionalString(16),
    debtorPostcode: optionalString(16),
    debtorCity: optionalString(35),
    debtorCountry: z.preprocess((value) => sanitizeUppercaseString(value), z.string().length(2).optional()),
    iban: requiredIban,
    amount: z.preprocess(
      (value) => sanitizeAmount(value),
      z.number().finite().nonnegative("Amount cannot be negative.").optional()
    ),
    message: optionalString(140),
    address: optionalString(70),
    personalNote: optionalString(140),
    currency: z.preprocess(
      (value) => sanitizeUppercaseString(value),
      z.enum(["CHF", "EUR"]).optional().default("CHF")
    ),
    country: z.preprocess(
      (value) => sanitizeUppercaseString(value),
      z.string().length(2, "Country must use a 2-letter ISO code.").optional().default("CH")
    ),
    reference: z.preprocess((value) => sanitizeReference(value), z.string().max(27).optional())
  })
  .superRefine((value, ctx) => {
    const hasDebtor =
      value.debtorName !== undefined ||
      value.debtorStreet !== undefined ||
      value.debtorNumber !== undefined ||
      value.debtorPostcode !== undefined ||
      value.debtorCity !== undefined;

    if (hasDebtor) {
      if (value.debtorName === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required field.",
          path: ["debtorName"]
        });
      }

      if (value.debtorStreet === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required field.",
          path: ["debtorStreet"]
        });
      }

      if (value.debtorPostcode === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required field.",
          path: ["debtorPostcode"]
        });
      }

      if (value.debtorCity === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required field.",
          path: ["debtorCity"]
        });
      }
    }

    if (value.amount !== undefined && value.amount.toFixed(2).length > 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount is too large for Swiss QR Bill output.",
        path: ["amount"]
      });
    }

    if (value.reference !== undefined) {
      const referenceType = getReferenceType(value.reference);

      if (referenceType === "QRR" && !isQRReferenceValid(value.reference)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "QR reference checksum is invalid.",
          path: ["reference"]
        });
      }

      if (referenceType === "SCOR" && !isSCORReferenceValid(value.reference)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SCOR reference checksum is invalid.",
          path: ["reference"]
        });
      }
    }

    if (isQRIBAN(value.iban) && value.reference === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reference is required when a QR-IBAN is used.",
        path: ["reference"]
      });
    }

    if (isQRIBAN(value.iban) && value.reference !== undefined && getReferenceType(value.reference) !== "QRR") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "QR-IBAN requires a QR reference.",
        path: ["reference"]
      });
    }

    if (!isQRIBAN(value.iban) && value.reference !== undefined && getReferenceType(value.reference) === "QRR") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "QR reference requires a QR-IBAN.",
        path: ["reference"]
      });
    }
  });

function normalizeDebtorFields(input: PaymentInput): PaymentInput {
  const hasDebtorCoreFields =
    input.debtorName !== undefined ||
    input.debtorStreet !== undefined ||
    input.debtorNumber !== undefined ||
    input.debtorPostcode !== undefined ||
    input.debtorCity !== undefined;

  if (hasDebtorCoreFields) {
    return input;
  }

  return {
    ...input,
    debtorCountry: undefined
  };
}

export class RequestValidationError extends Error {
  readonly issues: ValidationIssue[];
  readonly statusCode = 400;

  constructor(issues: ValidationIssue[]) {
    super("Validation failed.");
    this.name = "RequestValidationError";
    this.issues = issues;
  }
}

const fieldLabels: Record<ValidationLanguage, Record<string, string>> = {
  de: {
    address: "Zusätzliche Adresse",
    amount: "Betrag",
    city: "Ort",
    country: "Land",
    currency: "Währung",
    debtorCity: "Ort",
    debtorCountry: "Land",
    debtorName: "Name",
    debtorNumber: "Nr.",
    debtorPostcode: "PLZ",
    debtorStreet: "Strasse",
    iban: "IBAN",
    input: "Eingabe",
    message: "Mitteilung",
    name: "Name des Zahlungsempfängers",
    number: "Nummer",
    personalNote: "Persönliche Notiz",
    postcode: "PLZ",
    reference: "Referenz",
    street: "Strasse"
  },
  en: {
    address: "Additional address",
    amount: "Amount",
    city: "City",
    country: "Country",
    currency: "Currency",
    debtorCity: "City",
    debtorCountry: "Country",
    debtorName: "Name",
    debtorNumber: "No.",
    debtorPostcode: "Postcode",
    debtorStreet: "Street",
    iban: "IBAN",
    input: "Input",
    message: "Message",
    name: "Payee name",
    number: "Number",
    personalNote: "Personal note",
    postcode: "Postcode",
    reference: "Reference",
    street: "Street"
  }
};

const messageTranslations: Record<ValidationLanguage, Record<string, string>> = {
  de: {
    "Amount cannot be negative.": "Betrag darf nicht negativ sein.",
    "Amount is too large for Swiss QR Bill output.": "Betrag ist zu gross für die Swiss-QR-Rechnung.",
    "IBAN checksum is invalid.": "IBAN-Prüfsumme ist ungültig.",
    "IBAN must be 21 characters after removing spaces.": "IBAN muss nach dem Entfernen von Leerzeichen 21 Zeichen lang sein.",
    "Only CH and LI IBANs are supported.": "Es werden nur CH- und LI-IBANs unterstützt.",
    "QR reference checksum is invalid.": "Prüfsumme der QR-Referenz ist ungültig.",
    "QR reference requires a QR-IBAN.": "Eine QR-Referenz erfordert eine QR-IBAN.",
    "QR-IBAN requires a QR reference.": "Eine QR-IBAN erfordert eine QR-Referenz.",
    "Reference is required when a QR-IBAN is used.": "Bei einer QR-IBAN ist eine Referenz erforderlich.",
    "Required field.": "Pflichtfeld.",
    "SCOR reference checksum is invalid.": "Prüfsumme der SCOR-Referenz ist ungültig.",
    "Unable to process request.": "Anfrage konnte nicht verarbeitet werden."
  },
  en: {
    "Amount cannot be negative.": "Amount cannot be negative.",
    "Amount is too large for Swiss QR Bill output.": "Amount is too large for Swiss QR Bill output.",
    "IBAN checksum is invalid.": "IBAN checksum is invalid.",
    "IBAN must be 21 characters after removing spaces.": "IBAN must be 21 characters after removing spaces.",
    "Only CH and LI IBANs are supported.": "Only CH and LI IBANs are supported.",
    "QR reference checksum is invalid.": "QR reference checksum is invalid.",
    "QR reference requires a QR-IBAN.": "QR reference requires a QR-IBAN.",
    "QR-IBAN requires a QR reference.": "QR-IBAN requires a QR reference.",
    "Reference is required when a QR-IBAN is used.": "Reference is required when a QR-IBAN is used.",
    "Required field.": "Required field.",
    "SCOR reference checksum is invalid.": "SCOR reference checksum is invalid.",
    "Unable to process request.": "Unable to process request."
  }
};

function localizeField(field: string, language: ValidationLanguage): string {
  return fieldLabels[language][field] ?? field;
}

function localizeMessage(message: string, language: ValidationLanguage): string {
  return messageTranslations[language][message] ?? message;
}

function toValidationIssue(issue: ZodIssue, language: ValidationLanguage): ValidationIssue {
  const fieldKey = issue.path.join(".") || "input";
  return {
    field: localizeField(fieldKey, language),
    message: localizeMessage(issue.message, language)
  };
}

export function parsePaymentInput(input: Record<string, unknown>, language: ValidationLanguage = "en"): PaymentInput {
  const result = paymentSchema.safeParse(input);

  if (!result.success) {
    throw new RequestValidationError(result.error.issues.map((issue) => toValidationIssue(issue, language)));
  }

  return normalizeDebtorFields(result.data);
}

export function getValidationIssues(error: unknown, language: ValidationLanguage = "en"): ValidationIssue[] {
  if (error instanceof RequestValidationError) {
    return error.issues;
  }

  return [
    {
      field: localizeField("input", language),
      message: localizeMessage("Unable to process request.", language)
    }
  ];
}
