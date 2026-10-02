import { Box, Flex } from "@mantine/core";
import type { ReactNode } from "react";

interface ConverterRowProps {
  amount: ReactNode;
  currency: ReactNode;
}

export function ConverterRow({ amount, currency }: ConverterRowProps) {
  return (
    <Flex
      gap="sm"
      direction={{ base: "column", xs: "row" }}
      align={{ base: "stretch", xs: "flex-start" }}
    >
      <Box flex={1} miw={0}>
        {amount}
      </Box>
      <Box w={{ base: "100%", xs: 240 }}>{currency}</Box>
    </Flex>
  );
}
