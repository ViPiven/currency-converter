// NumberInput gives a string while the field is empty or incomplete ("1.").
export type AmountInputValue = number | string;

export function toPositiveNumber(value: AmountInputValue) {
  const number = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function roundToPrecision(value: AmountInputValue, precision: number) {
  if (typeof value !== "number") return value;
  return Number(value.toFixed(precision));
}
