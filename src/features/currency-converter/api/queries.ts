import { queryOptions, skipToken } from "@tanstack/react-query";
import { fetchConversion, fetchCurrencies, shouldRetry } from "./client";
import type { ConvertParams } from "./contracts";

export const currencyKeys = {
  all: ["currencies"] as const,
  conversion: (params: ConvertParams | null) => ["conversion", params] as const,
};

export const currenciesQueryOptions = queryOptions({
  queryKey: currencyKeys.all,
  queryFn: ({ signal }) => fetchCurrencies(signal),
  staleTime: 24 * 60 * 60 * 1000,
  retry: shouldRetry,
});

export function conversionQueryOptions(params: ConvertParams | null) {
  return queryOptions({
    queryKey: currencyKeys.conversion(params),
    queryFn: params ? ({ signal }) => fetchConversion(params, signal) : skipToken,
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}
