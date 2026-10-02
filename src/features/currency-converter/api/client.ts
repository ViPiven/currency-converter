import type { z } from "zod";
import {
  apiErrorSchema,
  conversionSchema,
  currenciesResponseSchema,
  type ConvertParams,
} from "./contracts";

type ApiErrorKind = "http" | "network" | "invalid-response";

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

// Only transient failures are worth retrying: bad input, rate limits or a bad
// key won't fix themselves and retrying would just burn the API quota.
export function shouldRetry(failureCount: number, error: Error) {
  if (failureCount >= 2 || !(error instanceof ApiError)) return false;
  return error.kind === "network" || error.status === 503;
}

async function getJson<T>(url: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  } catch (error) {
    // Cancelled by TanStack Query, not a real failure.
    if (signal?.aborted) throw error;
    throw new ApiError(
      "network",
      "Couldn't reach the server. Check your connection and try again.",
      undefined,
      { cause: error },
    );
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiError(
      "http",
      parsed.success ? parsed.data.error.message : `Request failed with status ${res.status}.`,
      res.status,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "invalid-response",
      "Received an unexpected response. Please try again later.",
      res.status,
      { cause: parsed.error },
    );
  }
  return parsed.data;
}

export function fetchCurrencies(signal?: AbortSignal) {
  return getJson("/api/currencies", currenciesResponseSchema, signal);
}

export function fetchConversion({ from, to, amount }: ConvertParams, signal?: AbortSignal) {
  const query = new URLSearchParams({ from, to, amount: String(amount) });
  return getJson(`/api/convert?${query}`, conversionSchema, signal);
}
