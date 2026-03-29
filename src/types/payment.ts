export type OutputFormat = "json" | "pdf" | "svg";

export interface PaymentInput {
  name: string;
  street: string;
  number?: string;
  postcode: string;
  city: string;
  debtorName?: string;
  debtorStreet?: string;
  debtorNumber?: string;
  debtorPostcode?: string;
  debtorCity?: string;
  debtorCountry?: string;
  iban: string;
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
