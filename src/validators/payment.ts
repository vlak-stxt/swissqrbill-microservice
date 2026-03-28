import { z } from "zod";
import {
  getReferenceType,
  isIBANValid,
  isQRIBAN,
  isQRReferenceValid,
  isSCORReferenceValid
} from "swissqrbill/utils";

import type { PaymentInput, ValidationIssue } from "../types/payment.js";
import { toSingleValue } from "../utils/http.js";

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
  z.preprocess((value) => sanitizeString(value), z.string().min(1).max(max));

const paymentSchema = z
  .object({
    name: requiredString(70),
    street: requiredString(70),
    number: optionalString(16),
    postcode: z.preprocess(
      (value) => sanitizeString(value),
      z
        .string()
        .min(1)
        .max(16)
        .regex(/^[A-Za-z0-9 -]+$/, "Postcode may only contain letters, digits, spaces, and hyphens.")
    ),
    city: requiredString(35),
    iban: z.preprocess(
      (value) => sanitizeIban(value),
      z
        .string()
        .length(21, "IBAN must be 21 characters after removing spaces.")
        .refine((value) => /^(CH|LI)/.test(value), "Only CH and LI IBANs are supported.")
        .refine((value) => isIBANValid(value), "IBAN checksum is invalid.")
    ),
    bic: z.preprocess(
      (value) => sanitizeUppercaseString(value),
      z
        .string()
        .regex(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/, "BIC must be 8 or 11 alphanumeric characters.")
        .optional()
    ),
    amount: z.preprocess(
      (value) => sanitizeAmount(value),
      z.number().finite().nonnegative("Amount cannot be negative.").optional()
    ),
    message: optionalString(140),
    address: optionalString(70),
    personalNote: optionalString(140),
    currency: z.preprocess(
      (value) => sanitizeUppercaseString(value) ?? "CHF",
      z.enum(["CHF", "EUR"])
    ),
    country: z.preprocess(
      (value) => sanitizeUppercaseString(value) ?? "CH",
      z.string().length(2, "Country must use a 2-letter ISO code.")
    ),
    reference: z.preprocess((value) => sanitizeReference(value), z.string().max(27).optional())
  })
  .superRefine((value, ctx) => {
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

export class RequestValidationError extends Error {
  readonly issues: ValidationIssue[];
  readonly statusCode = 400;

  constructor(issues: ValidationIssue[]) {
    super("Validation failed.");
    this.name = "RequestValidationError";
    this.issues = issues;
  }
}

export function parsePaymentInput(input: Record<string, unknown>): PaymentInput {
  const result = paymentSchema.safeParse(input);

  if (!result.success) {
    throw new RequestValidationError(
      result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "input",
        message: issue.message
      }))
    );
  }

  return result.data;
}

export function getValidationIssues(error: unknown): ValidationIssue[] {
  if (error instanceof RequestValidationError) {
    return error.issues;
  }

  return [
    {
      field: "input",
      message: "Unable to process request."
    }
  ];
}
