import { z } from "zod";

// Shapes of our own /api/* endpoints, shared by the route handlers and the client.

const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{2,10}$/, "Invalid currency code");

export const currencySchema = z.object({
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
  precision: z.number().int().nonnegative(),
});
export type Currency = z.infer<typeof currencySchema>;

export const currenciesResponseSchema = z.array(currencySchema);

export const MAX_AMOUNT = 1_000_000_000_000;

export const convertParamsSchema = z.object({
  from: currencyCodeSchema,
  to: currencyCodeSchema,
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(MAX_AMOUNT, "Amount is too large"),
});
export type ConvertParams = z.infer<typeof convertParamsSchema>;

export const conversionSchema = z.object({
  from: z.string(),
  to: z.string(),
  amount: z.number(),
  value: z.number(),
  timestamp: z.number(), // unix seconds
});
export type Conversion = z.infer<typeof conversionSchema>;

export const apiErrorSchema = z.object({
  error: z.object({ message: z.string() }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
