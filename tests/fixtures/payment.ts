import type { PaymentInput } from "../../src/types/payment.js";

export const validPaymentInput: PaymentInput = {
  amount: 149.95,
  city: "Zurich",
  country: "CH",
  currency: "CHF",
  iban: "CH5604835012345678009",
  message: "Invoice 10024",
  name: "Example Tools AG",
  number: "12A",
  personalNote: "Demo payload",
  postcode: "8000",
  street: "Example Street"
};

export const validPaymentQuery =
  "/api/qr?name=Example%20Tools%20AG&street=Example%20Street&number=12A&postcode=8000&city=Zurich&iban=CH5604835012345678009&amount=149.95&message=Invoice%2010024&personalNote=Demo%20payload";
