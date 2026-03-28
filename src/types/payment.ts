export type OutputFormat = "json" | "pdf" | "svg";

export interface PaymentInput {
  name: string;
  street: string;
  number?: string;
  postcode: string;
  city: string;
  iban: string;
  bic?: string;
  amount?: number;
  message?: string;
  address?: string;
  personalNote?: string;
  currency: "CHF" | "EUR";
  country: string;
  reference?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
}
