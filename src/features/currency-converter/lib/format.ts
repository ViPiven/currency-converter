const LOCALE = "en-US";

// Values that would round to 0.00 (e.g. 0.0004 EUR) fall back to significant digits.
export function formatAmount(
  value: number,
  precision = 2,
  { trimZeros = false }: { trimZeros?: boolean } = {},
) {
  const isTiny = value !== 0 && Math.abs(value) < 10 ** -precision;
  return new Intl.NumberFormat(
    LOCALE,
    isTiny
      ? { maximumSignificantDigits: 4 }
      : {
          minimumFractionDigits: trimZeros ? 0 : precision,
          maximumFractionDigits: precision,
        },
  ).format(value);
}

// 1 JPY = 0.006213 EUR - rates need more digits than amounts.
export function formatRate(rate: number) {
  return new Intl.NumberFormat(
    LOCALE,
    rate >= 1 ? { maximumFractionDigits: 4 } : { maximumSignificantDigits: 4 },
  ).format(rate);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
