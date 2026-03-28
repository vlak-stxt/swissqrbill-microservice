import type { PaymentInput } from "../../src/types/payment.js";

export const validPaymentInput: PaymentInput = {
  amount: 514.56,
  bic: "POFICHBEXXX",
  city: "Sitterdorf",
  country: "CH",
  currency: "CHF",
  iban: "CH8109000000853815289",
  message: "Order 236949",
  name: "Gebruder Pneu Edelmann GmbH",
  number: "1",
  personalNote: "Summer tyres",
  postcode: "8589",
  street: "St. Gallerstrasse"
};

export const validPaymentQuery =
  "/api/qr?name=Gebruder%20Pneu%20Edelmann%20GmbH&street=St.%20Gallerstrasse&number=1&postcode=8589&city=Sitterdorf&iban=CH8109000000853815289&bic=POFICHBEXXX&amount=514.56&message=Order%20236949&personalNote=Summer%20tyres";
