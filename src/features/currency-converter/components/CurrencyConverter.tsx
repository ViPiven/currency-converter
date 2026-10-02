"use client";

import { Alert, Card, Center, Skeleton, Stack } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import type { Currency } from "../api/contracts";
import { currenciesQueryOptions } from "../api/queries";
import { useCurrencyConverter, type NonEmptyArray } from "../hooks/useCurrencyConverter";
import { AmountInput } from "./AmountInput";
import { ConvertedAmount } from "./ConvertedAmount";
import { ConversionSummary } from "./ConversionSummary";
import { ConverterRow } from "./ConverterRow";
import { CurrencySelect } from "./CurrencySelect";
import { ErrorAlert } from "./ErrorAlert";
import { SwapButton } from "./SwapButton";

export function CurrencyConverter() {
  const currenciesQuery = useQuery(currenciesQueryOptions);

  if (currenciesQuery.isPending) {
    return <ConverterSkeleton />;
  }
  if (currenciesQuery.isError) {
    return (
      <ErrorAlert
        title="Couldn't load currencies"
        error={currenciesQuery.error}
        onRetry={() => void currenciesQuery.refetch()}
      />
    );
  }
  if (!isNonEmpty(currenciesQuery.data)) {
    return (
      <Alert color="yellow" title="No currencies available">
        The currency service returned an empty list. Please try again later.
      </Alert>
    );
  }
  return <ConverterForm currencies={currenciesQuery.data} />;
}

function ConverterForm({ currencies }: { currencies: NonEmptyArray<Currency> }) {
  const { from, to, amountInput, amountError, setAmount, changeFrom, changeTo, swap, conversion } =
    useCurrencyConverter(currencies);

  return (
    <Card withBorder radius="lg" padding="xl" shadow="sm">
      <Stack gap="lg">
        <ConversionSummary
          status={conversion.status}
          result={conversion.result}
          isRefreshing={conversion.isRefreshing}
          from={from}
          to={to}
        />

        <ConverterRow
          amount={
            <AmountInput
              label="Amount"
              value={amountInput}
              onChange={setAmount}
              precision={from.precision}
              leftSection={from.symbol || undefined}
              error={amountError}
            />
          }
          currency={
            <CurrencySelect
              label="From"
              size="md"
              currencies={currencies}
              value={from.code}
              onChange={changeFrom}
            />
          }
        />

        <Center>
          <SwapButton onClick={swap} />
        </Center>

        <ConverterRow
          amount={
            <ConvertedAmount
              label="Converted amount"
              value={conversion.result?.value ?? null}
              precision={to.precision}
              isLoading={conversion.status === "loading"}
              isRefreshing={conversion.isRefreshing}
              leftSection={to.symbol || undefined}
            />
          }
          currency={
            <CurrencySelect
              label="To"
              size="md"
              currencies={currencies}
              value={to.code}
              onChange={changeTo}
            />
          }
        />

        {conversion.error && (
          <ErrorAlert
            title="Conversion failed"
            error={conversion.error}
            onRetry={conversion.retry}
          />
        )}
      </Stack>
    </Card>
  );
}

function ConverterSkeleton() {
  return (
    <Card
      withBorder
      radius="lg"
      padding="xl"
      shadow="sm"
      aria-busy="true"
      aria-label="Loading currencies"
    >
      <Stack gap="lg">
        <Skeleton height={20} width="40%" />
        <Skeleton height={36} width="60%" />
        <Skeleton height={42} />
        <Skeleton height={42} />
      </Stack>
    </Card>
  );
}

function isNonEmpty<T>(items: T[]): items is NonEmptyArray<T> {
  return items.length > 0;
}
