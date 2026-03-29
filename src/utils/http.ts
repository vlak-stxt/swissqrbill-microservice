import type { PaymentInput } from "../types/payment.js";

const ROUTE_ONLY_FIELDS = new Set(["debtorEnabled", "download", "format", "lang"]);

export function toSingleValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function extractPaymentSource(input: Record<string, unknown>): Record<string, unknown> {
  const source: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!ROUTE_ONLY_FIELDS.has(key)) {
      source[key] = toSingleValue(value);
    }
  }

  return source;
}

export function hasAnyPaymentField(input: Record<string, unknown>): boolean {
  return Object.values(extractPaymentSource(input)).some((value) => {
    const single = toSingleValue(value);

    if (typeof single === "number") {
      return true;
    }

    return typeof single === "string" && single.trim().length > 0;
  });
}

export function buildPaymentQuery(input: PaymentInput): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      continue;
    }

    params.set(key, String(value));
  }

  return params;
}

export function asBoolean(value: unknown): boolean {
  const single = toSingleValue(value);

  if (typeof single === "boolean") {
    return single;
  }

  if (typeof single !== "string") {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(single.toLowerCase());
}
