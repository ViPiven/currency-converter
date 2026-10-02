import { useDebouncedValue, useLocalStorage } from "@mantine/hooks";
import { useMemo, useState } from "react";
import type { Currency } from "../api/contracts";
import { roundToPrecision, toPositiveNumber, type AmountInputValue } from "../lib/amount";
import { useConversion, type ConversionResult, type ConversionStatus } from "./useConversion";

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "EUR";
const DEFAULT_AMOUNT = 1;
const INPUT_DEBOUNCE_MS = 400;

export type NonEmptyArray<T> = [T, ...T[]];

export function useCurrencyConverter(currencies: NonEmptyArray<Currency>) {
  const currencyByCode = useMemo(() => new Map(currencies.map((c) => [c.code, c])), [currencies]);

  // Rendered only in the browser (after currencies load), so read storage right
  // away - in an effect the default pair would flash and fire a wasted request.
  const [storedFrom, setFrom] = useLocalStorage({
    key: "converter:from",
    defaultValue: DEFAULT_FROM,
    getInitialValueInEffect: false,
  });
  const [storedTo, setTo] = useLocalStorage({
    key: "converter:to",
    defaultValue: DEFAULT_TO,
    getInitialValueInEffect: false,
  });
  const from = currencyByCode.get(storedFrom) ?? currencies[0];
  const to = currencyByCode.get(storedTo) ?? currencies[1] ?? currencies[0];

  const [amountInput, setAmountInput] = useState<AmountInputValue>(DEFAULT_AMOUNT);
  const [debouncedInput, , { flush: flushAmount }] = useDebouncedValue(
    amountInput,
    INPUT_DEBOUNCE_MS,
  );
  const amount = toPositiveNumber(amountInput);
  // A pending value may still have more decimals than a newly picked currency allows.
  const debouncedAmount = toPositiveNumber(roundToPrecision(debouncedInput, from.precision));

  const conversion = useConversion({ from: from.code, to: to.code, amount: debouncedAmount });

  const hasAmount = amount !== null;
  const isTyping = hasAmount && amount !== debouncedAmount;
  const status: ConversionStatus = !hasAmount
    ? "idle"
    : conversion.status === "idle"
      ? "loading" // amount typed into an empty field, request not sent yet
      : conversion.status;
  const result: ConversionResult | null = status === "success" ? conversion.result : null;

  // Only complain once the user pauses, not mid-typing "0.05".
  const amountError =
    !hasAmount && amountInput !== "" && amountInput === debouncedInput
      ? "Enter an amount greater than 0"
      : null;

  // Flush so a currency change doesn't fire one request with the stale amount and another later.
  const setFromCurrency = (currency: Currency) => {
    flushAmount();
    setFrom(currency.code);
    // 1.55 USD -> 2 JPY: what the input shows is what gets converted.
    setAmountInput((value) => roundToPrecision(value, currency.precision));
  };

  const swap = () => {
    setFromCurrency(to);
    setTo(from.code);
  };

  // Picking the other side's currency swaps them, like Google does.
  const changeFrom = (code: string) => {
    const currency = currencyByCode.get(code);
    if (!currency) return;
    if (code === to.code) swap();
    else setFromCurrency(currency);
  };

  const changeTo = (code: string) => {
    if (code === from.code) return swap();
    flushAmount();
    setTo(code);
  };

  return {
    from,
    to,
    amountInput,
    amountError,
    setAmount: setAmountInput,
    changeFrom,
    changeTo,
    swap,
    conversion: {
      status,
      result,
      isRefreshing: result !== null && (isTyping || conversion.isRefreshing),
      error: status === "error" ? conversion.error : null,
      retry: conversion.retry,
    },
  };
}
