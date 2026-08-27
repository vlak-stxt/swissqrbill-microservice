import type { PaymentInput } from "../../src/types/payment.js";

export const validPaymentInput: PaymentInput = {
  amount: 1994.75,
  city: "Musterstadt",
  country: "CH",
  currency: "CHF",
  debtorCity: "Musterstadt",
  debtorCountry: "CH",
  debtorName: "Peter Muster",
  debtorNumber: "1",
  debtorPostcode: "1234",
  debtorStreet: "Musterstrasse",
  iban: "CH4431999123000889012",
  message: "Order from 15.06.2020",
  name: "SwissQRBill",
  number: "7",
  personalNote: "Demo payload",
  postcode: "1234",
  reference: "21 00000 00003 13947 14300 09017",
  street: "Musterstrasse"
};

export const validPaymentQuery =
  "/api/qr?name=SwissQRBill&street=Musterstrasse&number=7&postcode=1234&city=Musterstadt&debtorName=Peter%20Muster&debtorStreet=Musterstrasse&debtorNumber=1&debtorPostcode=1234&debtorCity=Musterstadt&debtorCountry=CH&iban=CH4431999123000889012&amount=1994.75&reference=21%2000000%2000003%2013947%2014300%2009017&message=Order%20from%2015.06.2020&personalNote=Demo%20payload";
