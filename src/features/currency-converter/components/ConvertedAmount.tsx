import { Loader, TextInput, type TextInputProps } from "@mantine/core";
import { formatAmount } from "../lib/format";

interface ConvertedAmountProps extends Omit<TextInputProps, "value" | "readOnly"> {
  value: number | null;
  precision: number;
  isLoading: boolean;
  isRefreshing: boolean;
}

export function ConvertedAmount({
  value,
  precision,
  isLoading,
  isRefreshing,
  ...props
}: ConvertedAmountProps) {
  return (
    <TextInput
      size="md"
      readOnly
      value={value === null ? "" : formatAmount(value, precision)}
      placeholder="-"
      rightSection={isLoading || isRefreshing ? <Loader size="xs" /> : null}
      styles={{ input: { opacity: isRefreshing ? 0.6 : 1 } }}
      {...props}
    />
  );
}
