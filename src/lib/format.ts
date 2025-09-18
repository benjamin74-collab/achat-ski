export function money(cents: number, currency = "EUR") {
  return (cents / 100).toFixed(2) + " " + currency;
}

export function totalCents(priceCents: number, shippingCents?: number | null) {
  return priceCents + (shippingCents ?? 0);
}
