import { Select, type SelectProps } from "@mantine/core";
import { useMemo } from "react";
import type { Currency } from "../api/contracts";

interface CurrencySelectProps extends Omit<
  SelectProps,
  "data" | "value" | "onChange" | "searchable" | "allowDeselect"
> {
  currencies: Currency[];
  value: string | null;
  onChange: (code: string) => void;
}

export function CurrencySelect({ currencies, value, onChange, ...props }: CurrencySelectProps) {
  const options = useMemo(
    () => currencies.map(({ code, name }) => ({ value: code, label: `${code} - ${name}` })),
    [currencies],
  );

  return (
    <Select
      data={options}
      value={value}
      onChange={(code) => code && onChange(code)}
      searchable
      allowDeselect={false}
      nothingFoundMessage="No currency found"
      maxDropdownHeight={280}
      comboboxProps={{ width: 280, position: "bottom-end" }}
      {...props}
    />
  );
}
