import { useQuery } from "@tanstack/react-query";
import type { Conversion, ConvertParams } from "../api/contracts";
import { conversionQueryOptions } from "../api/queries";

interface UseConversionInput {
  from: string | null;
  to: string | null;
  amount: number | null;
}

export interface ConversionResult {
  amount: number;
  value: number;
  rate: number;
  updatedAt: Date | null; // null for same-currency "conversions"
}

export type ConversionStatus = "idle" | "loading" | "success" | "error";

interface ConversionState {
  status: ConversionStatus;
  result: ConversionResult | null;
  isRefreshing: boolean; // `result` is for the previous amount, a new one is loading
  error: Error | null;
  retry: () => void;
}

export function useConversion({ from, to, amount }: UseConversionInput): ConversionState {
  const isComplete = from !== null && to !== null && amount !== null && amount > 0;
  const isSameCurrency = isComplete && from === to;
  const params: ConvertParams | null = isComplete && !isSameCurrency ? { from, to, amount } : null;

  const query = useQuery({
    ...conversionQueryOptions(params),
    // While a new amount is fetched keep showing the previous result, but never
    // one that belongs to a different currency pair (or to no request at all).
    placeholderData: (previous?: Conversion) =>
      params && previous?.from === params.from && previous.to === params.to ? previous : undefined,
  });

  const state: ConversionState = {
    status: "idle",
    result: null,
    isRefreshing: false,
    error: null,
    retry: () => void query.refetch(),
  };

  if (!isComplete) return state;
  if (isSameCurrency) {
    return {
      ...state,
      status: "success",
      result: { amount, value: amount, rate: 1, updatedAt: null },
    };
  }
  if (query.isError) return { ...state, status: "error", error: query.error };
  if (query.isPending) return { ...state, status: "loading" };

  const { data } = query;
  return {
    ...state,
    status: "success",
    result: {
      amount: data.amount,
      value: data.value,
      rate: data.value / data.amount,
      updatedAt: new Date(data.timestamp * 1000),
    },
    isRefreshing: query.isPlaceholderData,
  };
}
