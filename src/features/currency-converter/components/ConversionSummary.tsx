import { Box, Skeleton, Stack, Text, Title } from "@mantine/core";
import type { Currency } from "../api/contracts";
import type { ConversionResult, ConversionStatus } from "../hooks/useConversion";
import { formatAmount, formatDateTime, formatRate } from "../lib/format";

interface ConversionSummaryProps {
  status: ConversionStatus;
  result: ConversionResult | null;
  isRefreshing: boolean;
  from: Currency;
  to: Currency;
}

export function ConversionSummary(props: ConversionSummaryProps) {
  // Keep the live region mounted across states; min height stops the form from jumping.
  return (
    <Box mih={88} aria-live="polite" aria-busy={props.status === "loading" || props.isRefreshing}>
      <SummaryContent {...props} />
    </Box>
  );
}

function SummaryContent({ status, result, isRefreshing, from, to }: ConversionSummaryProps) {
  if (status === "idle") {
    return (
      <Text c="dimmed" size="sm">
        Enter an amount greater than 0 to convert {from.name} to {to.name}.
      </Text>
    );
  }

  if (status === "error") {
    return (
      <Text c="dimmed" size="sm">
        Couldn&apos;t convert {from.name} to {to.name} right now.
      </Text>
    );
  }

  if (status === "loading" || !result) {
    return (
      <Stack gap={8}>
        <Skeleton height={20} width="40%" />
        <Skeleton height={36} width="60%" />
      </Stack>
    );
  }

  return (
    <Stack gap={4} opacity={isRefreshing ? 0.6 : 1}>
      <Text c="dimmed">
        {formatAmount(result.amount, from.precision, { trimZeros: true })} {from.name} equals
      </Text>
      <Title order={2} fw={500} data-testid="conversion-result">
        {formatAmount(result.value, to.precision)} {to.name}
      </Title>
      <Text c="dimmed" size="xs">
        1 {from.code} = {formatRate(result.rate)} {to.code}
        {result.updatedAt && ` · Rate as of ${formatDateTime(result.updatedAt)}`}
      </Text>
    </Stack>
  );
}
