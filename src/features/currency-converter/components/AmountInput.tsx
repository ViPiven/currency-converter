import { NumberInput, type NumberInputProps } from "@mantine/core";
import { MAX_AMOUNT } from "../api/contracts";

interface AmountInputProps extends Omit<NumberInputProps, "onChange"> {
  onChange: (value: number | string) => void;
  precision?: number;
}

export function AmountInput({ precision = 2, onChange, ...props }: AmountInputProps) {
  return (
    <NumberInput
      onChange={onChange}
      inputMode="decimal"
      thousandSeparator=","
      allowNegative={false}
      decimalScale={precision}
      max={MAX_AMOUNT}
      clampBehavior="strict"
      hideControls
      size="md"
      {...props}
    />
  );
}
